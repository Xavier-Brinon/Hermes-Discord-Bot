#!/usr/bin/env node

// hermes-discord-bot-clean.js
// Clean Discord bot implementation with Hermes integration

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { execFile } = require('child_process');
const path = require('path');

// Hermes CLI path
const HERMES_BIN = '/data/.local/bin/hermes';

// Link detection
const LINK_PATTERN = /https?:\/\/\S+/i;
// URLs that are NOT articles — skip silently
const NON_ARTICLE_PATTERN = /(youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|tiktok\.com|reddit\.com|facebook\.com|discord\.com|imgur\.com|giphy\.com|tenor\.com|\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi|mp3|wav|ogg)(\?|$))/i;
const PROCESSED_MESSAGES = new Set();

// History/summary request detection (French + English)
const HISTORY_PATTERN = /\b(résume|récap|récapitul|activité|semaine|derniers?\s*messages|derniers?\s*jours?|quoi\s+de\s+neuf|que\s+s['e]est\s+passé|historique|archive|summarize|recap|summary|activity|past\s+week|recent\s+messages|what\s+happened|catch\s+me\s+up|last\s+week|last\s+few\s+days)\b/i;

// Allowed guild ID (server restriction) — REQUIRED
const ALLOWED_GUILD_ID = process.env.ALLOWED_GUILD_ID;
if (!ALLOWED_GUILD_ID) {
  console.error('❌ ALLOWED_GUILD_ID is required. Set it in .env to restrict the bot to one server.');
  process.exit(1);
}
console.log(`🔒 Restreint au serveur ID: ${ALLOWED_GUILD_ID}`);

// Admin user ID for error notifications
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
if (!ADMIN_USER_ID) {
  console.warn('⚠️ ADMIN_USER_ID not set — admin error notifications disabled');
} else {
  console.log(`👤 Admin notifications enabled for user ID: ${ADMIN_USER_ID}`);
}

// Send a DM to the admin when a CLI error occurs
async function notifyAdmin(errorType, details) {
  try {
    const admin = await client.users.fetch(ADMIN_USER_ID);
    if (admin) {
      // Discord DM limit is 2000 chars — cap details at 1900 to leave room for header
      let truncated = details;
      if (truncated.length > 1900) {
        truncated = truncated.substring(0, 1897) + '...';
      }
      await admin.send(`⚠️ **Erreur Hermes CLI** — ${errorType}\n\`\`\`\n${truncated}\n\`\`\``);
    }
  } catch (e) {
    console.error('Failed to notify admin:', e.message);
  }
}

// Function to get token (already decrypted by dotenvx at launch)
function getDecryptedToken() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN not found in environment. Did you launch with npx dotenvx run?');
    process.exit(1);
  }
  return token;
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL']
});

// Get the token from environment
const token = getDecryptedToken();

// Hermes configuration
const HERMES_CONFIG = {
  timeout: 90000,   // 90s for normal questions
  maxResponseLength: 2000
};

// Per-channel cache: last summarized link URL (persisted to disk)
const CACHE_FILE = '/data/workspace/.link_cache.json';
let lastLinkPerChannel = new Map();

// Per-channel/thread session tracking for conversation continuity
const SESSION_CACHE_FILE = '/data/workspace/.session_cache.json';
let lastSessionPerChannel = new Map();  // key: channelId or channelId:threadId

// Load persisted caches on startup
try {
  const fs = require('fs');
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    lastLinkPerChannel = new Map(Object.entries(data));
    console.log(`📦 Loaded link cache: ${lastLinkPerChannel.size} entries`);
  }
  if (fs.existsSync(SESSION_CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(SESSION_CACHE_FILE, 'utf-8'));
    lastSessionPerChannel = new Map(Object.entries(data));
    console.log(`📦 Loaded session cache: ${lastSessionPerChannel.size} entries`);
  }
} catch (e) {
  console.error('Failed to load caches:', e.message);
}

function saveCache() {
  try {
    const fs = require('fs');
    const obj = Object.fromEntries(lastLinkPerChannel);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save link cache:', e.message);
  }
}

function saveSessionCache() {
  try {
    const fs = require('fs');
    const obj = Object.fromEntries(lastSessionPerChannel);
    fs.writeFileSync(SESSION_CACHE_FILE, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save session cache:', e.message);
  }
}

// Get the session key for a message (channel ID, or channel:thread if in a thread)
function getSessionKey(message) {
  if (message.channel.isThread()) {
    return `${message.channel.parentId}:${message.channel.id}`;
  }
  return message.channel.id;
}

// Extract session_id from Hermes stdout
function extractSessionId(stdout) {
  const match = stdout.match(/session_id:\s*(\S+)/);
  return match ? match[1] : null;
}

// French messages
const messagesFR = {
  greeting: "👋 Bonjour ! Je suis {botName}, votre assistant IA Hermes.\n" +
            "💡 Pour m'utiliser, mentionnez-moi avec votre question en français.\n" +
            "Exemple : @{botName} quel temps fait-il aujourd'hui ?",
  
  processing: "👀",  // emoji reaction instead of text reply
  
  error: "Désolé, j'ai rencontré une erreur en traitant votre demande.",
  
  hermesError: "Désolé, je n'ai pas pu obtenir de réponse de l'IA Hermes.\n" +
                "Veuillez réessayer plus tard ou reformuler votre question.",
  
  helpTitle: "📚 **Aide - Assistant IA Hermes (Français)**",
  helpContent: "Voici ce que je peux faire pour vous :\n" +
            "• Répondre à vos questions en français\n" +
            "• Vous aider avec des tâches variées\n" +
            "• Fournir des informations et des conseils\n\n" +
            "**Exemples d'utilisation :**\n" +
            "• @{botName} Quel temps fait-il à Paris ?\n" +
            "• @{botName} Peux-tu me donner la définition de 'algorithmique' ?\n" +
            "• @{botName} Quelles sont les actualités technologiques aujourd'hui ?",
  
  fallbackResponse: "🤔 Je n'ai pas trouvé d'information précise sur '{command}'.\n" +
                   "Pouvez-vous reformuler ou poser une autre question ?"
};

// Function to communicate with Hermes via CLI
// Returns {response, sessionId} — sessionId can be used to resume conversation
function askHermes(question, extraContext, useWebTools, customTimeout, quiet, sessionId) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    // Always instruct Hermes to respond in French, no hard line breaks
    let prompt = `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}`;
    if (extraContext) {
      prompt = `Contexte : ${extraContext}\n\nRéponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}`;
    }
    
    const args = ['-p', 'discord-bot', 'chat', '-q', prompt];
    if (sessionId) {
      args.splice(2, 0, '--resume', sessionId);  // insert --resume <id> after -p discord-bot
    }
    if (useWebTools) {
      args.splice(sessionId ? 4 : 2, 0, '-t', 'web');  // insert -t web after chat
    }
    if (quiet) {
      args.push('-Q');  // suppress tool calls, banner, spinner
    }
    
    console.log(`📤 Sending question to Hermes CLI: ${question}${useWebTools ? ' (web tools)' : ''}${quiet ? ' (quiet)' : ''}${sessionId ? ' (resume)' : ''}`);
    
    execFile(HERMES_BIN, args, {
      timeout: customTimeout || 60000,
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (error) {
        console.error(`❌ Hermes CLI error (${elapsed}s):`, stderr || error.message);
        console.error('   stdout was:', stdout || '(empty)');
        const err = new Error(error.killed ? "Le service Hermes a mis trop de temps à répondre." : "Impossible de communiquer avec Hermes.");
        err.cliStdout = stdout || '';
        err.cliStderr = stderr || error.message;
        err.elapsed = elapsed;
        return reject(err);
      }
      
      console.log(`📥 Response received from Hermes (${elapsed}s)`);
      // Log full Hermes output to PM2 for debugging
      console.log('--- HERMES OUTPUT ---');
      console.log(stdout);
      console.log('--- END HERMES OUTPUT ---');
      // Extract final answer: find the text between ⚕ Hermes banner and closing ──
      // With -Q (quiet mode), there's no banner — use full stdout
      const lines = stdout.split('\n');
      let response = '';
      let inAnswer = false;
      for (const line of lines) {
        const trimmed = line.trim();
        // Start capturing after the ⚕ Hermes banner
        if (trimmed.includes('⚕ Hermes')) {
          inAnswer = true;
          continue;
        }
        // Stop at the closing ── or session summary
        if (inAnswer && (trimmed.startsWith('──') || trimmed.startsWith('Resume') || trimmed.startsWith('Session:') || trimmed.startsWith('Duration:') || trimmed.startsWith('Messages:'))) {
          break;
        }
        if (inAnswer && trimmed && !trimmed.startsWith('┌') && !trimmed.startsWith('│') && !trimmed.startsWith('└')) {
          response += (response ? '\n' : '') + trimmed;
        }
      }
      // If no banner found (quiet mode), use stdout directly, stripping Query: echo
      if (!inAnswer) {
        response = stdout.replace(/^Query:.*?\n\n?/s, '').trim();
      }
      response = response.trim();
      const newSessionId = extractSessionId(stdout);
      resolve({
        response: response || messagesFR.fallbackResponse.replace('{command}', question),
        sessionId: newSessionId
      });
    });
  });
}

// Function to summarize a link via Hermes with web tools
function summarizeLink(url, context) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const prompt = `Résume en français le contenu de ce lien : ${url}.
Contexte : ${context || 'aucun'}.
Structure : 📌 **Résumé** (5-7 lignes max) puis ❓ **Questions** (3 questions). Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Sois concis.`;
    
    console.log(`📤 Summarizing link: ${url}`);
    
    execFile(HERMES_BIN, ['-p', 'discord-bot', 'chat', '-q', prompt, '-t', 'web'], {
      timeout: 60000,
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (error) {
        console.error(`❌ Hermes CLI error (link, ${elapsed}s):`, stderr || error.message);
        const err = new Error(error.killed ? "Le résumé a pris trop de temps." : "Impossible de résumer ce lien.");
        err.cliStdout = stdout || '';
        err.cliStderr = stderr || error.message;
        err.elapsed = elapsed;
        return reject(err);
      }
      
      console.log(`📥 Link summary received (${elapsed}s)`);
      // Log full Hermes output to PM2 for debugging
      console.log('--- HERMES OUTPUT ---');
      console.log(stdout);
      console.log('--- END HERMES OUTPUT ---');
      // Extract final answer: find the text between ⚕ Hermes banner and closing ──
      const lines = stdout.split('\n');
      let response = '';
      let inAnswer = false;
      for (const line of lines) {
        const trimmed = line.trim();
        // Start capturing after the ⚕ Hermes banner
        if (trimmed.includes('⚕ Hermes')) {
          inAnswer = true;
          continue;
        }
        // Stop at the closing ── or session summary
        if (inAnswer && (trimmed.startsWith('──') || trimmed.startsWith('Resume') || trimmed.startsWith('Session:') || trimmed.startsWith('Duration:') || trimmed.startsWith('Messages:'))) {
          break;
        }
        if (inAnswer && trimmed && !trimmed.startsWith('┌') && !trimmed.startsWith('│') && !trimmed.startsWith('└')) {
          response += (response ? '\n' : '') + trimmed;
        }
      }
      response = response.trim();
      // Apply unwrapText to merge mid-sentence line breaks (same as formatHermesResponse)
      response = unwrapText(response);
      resolve(response || `📎 Lien détecté : ${url}\n(Désolé, je n'ai pas pu générer un résumé.)`);
    });
  });
}

// Helper: replace 👀 with success/error reaction
async function finalizeReaction(message, success) {
  try {
    // Remove our 👀 reaction
    const eyesReaction = message.reactions.cache.get('👀');
    if (eyesReaction) {
      await eyesReaction.users.remove(client.user.id);
    }
    // Add result reaction
    await message.react(success ? '✅' : '❌');
  } catch (e) {
    // Reaction cleanup is best-effort
  }
}

// Unwrap terminal-formatted text: merge lines broken mid-sentence
// Hermes outputs at ~80 chars regardless of prompt instructions
function unwrapText(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const result = [];
  let buffer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line = paragraph break
      if (buffer) { result.push(buffer); buffer = ''; }
      result.push('');
      continue;
    }
    // Structural markers = new paragraph
    if (/^(📊|🔥|🔗|🤖|📌|❓|⚠️|##|THEME:|---$|[-\d]+[.)]\s)/.test(trimmed)) {
      if (buffer) { result.push(buffer); buffer = ''; }
      // THEME: and --- lines must stay standalone — don't merge summary into them
      if (/^THEME:/i.test(trimmed) || trimmed === '---') {
        result.push(trimmed);
        // buffer stays empty so summary lines start fresh
      } else {
        buffer = trimmed;
      }
      continue;
    }
    // Merge: append to current paragraph
    if (buffer) {
      buffer += ' ' + trimmed;
    } else {
      buffer = trimmed;
    }
  }
  if (buffer) result.push(buffer);

  return result.join('\n');
}

// Function to format Hermes response (unwrap only, no truncation — caller handles splitting)
function formatHermesResponse(response) {
  if (!response) return messagesFR.fallbackResponse;
  return unwrapText(response);
}

// Split a long response at logical boundaries and send via thread
// Discord message limit is 2000 chars; we use 1900 to leave margin for formatting
const DISCORD_MSG_LIMIT = 1900;

function splitAtBoundaries(text, maxLen) {
  const chunks = [];
  const paragraphs = text.split('\n');
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      // Empty line = paragraph separator — flush current if non-empty
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      continue;
    }

    const candidate = current ? current + '\n' + trimmed : trimmed;

    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      // Candidate too long — flush current, start new chunk
      if (current) {
        chunks.push(current.trim());
      }
      // If this single paragraph exceeds maxLen, hard-split it
      if (trimmed.length > maxLen) {
        let remaining = trimmed;
        while (remaining.length > maxLen) {
          // Try to split at last sentence boundary (., !, ?, :, ;) within limit
          let cutAt = maxLen;
          const lastPunct = remaining.lastIndexOf('.', maxLen);
          if (lastPunct > maxLen * 0.6) cutAt = lastPunct + 1;
          else {
            const lastSpace = remaining.lastIndexOf(' ', maxLen);
            if (lastSpace > maxLen * 0.6) cutAt = lastSpace;
          }
          chunks.push(remaining.substring(0, cutAt).trim());
          remaining = remaining.substring(cutAt).trim();
        }
        current = remaining;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function sendLongResponse(message, text) {
  if (text.length <= DISCORD_MSG_LIMIT) {
    // Fits in one message — simple reply
    await message.reply(text);
    return;
  }

  const chunks = splitAtBoundaries(text, DISCORD_MSG_LIMIT);

  // If already in a thread, post chunks directly — no sub-thread
  if (message.channel.isThread()) {
    for (const chunk of chunks) {
      await message.channel.send(chunk);
    }
    return;
  }

  // Create a thread and post chunks
  const thread = await message.startThread({
    name: '📄 Réponse détaillée',
    autoArchiveDuration: 60
  });

  for (const chunk of chunks) {
    await thread.send(chunk);
  }
}

// Scan recent channel messages for links (fallback when cache is empty)
async function scanChannelForLinks(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const links = [];
    for (const [, msg] of messages) {
      if (msg.author.bot) continue;
      const found = msg.content.match(LINK_PATTERN);
      if (found) {
        for (const link of found) {
          links.push({ url: link, author: msg.author.tag, content: msg.content.substring(0, 200) });
        }
      }
    }
    return links;
  } catch (e) {
    console.error('Failed to scan channel for links:', e.message);
    return [];
  }
}

// Fetch channel history for a given time range
// Accepts either { daysBack } (relative to now) or { since, until } (absolute timestamps in ms)
async function fetchChannelHistory(channel, opts = {}) {
  try {
    let since, until;
    if (opts.since && opts.until) {
      since = opts.since;
      until = opts.until;
    } else {
      const daysBack = opts.daysBack || 7;
      since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
      until = Date.now();
    }
    const sinceDate = new Date(since).toISOString();
    const untilDate = new Date(until).toISOString();
    console.log(`📜 Fetching history for #${channel.name}, range: ${sinceDate} → ${untilDate}`);
    const allMessages = [];
    let lastId = null;
    let fetched = 0;
    let stopped = false;

    while (!stopped) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const batch = await channel.messages.fetch(options);
      if (batch.size === 0) {
        console.log(`📜 No more messages returned by API (fetched ${fetched} total)`);
        break;
      }

      const firstMsg = batch.first();
      const lastMsg = batch.last();
      console.log(`📜 Batch: ${batch.size} msgs, range: ${new Date(lastMsg.createdTimestamp).toISOString()} → ${new Date(firstMsg.createdTimestamp).toISOString()}`);

      // If the NEWEST message in this batch is already older than cutoff, stop
      if (firstMsg.createdTimestamp < since) {
        console.log(`📜 Entire batch is older than cutoff, stopping`);
        break;
      }

      for (const [, msg] of batch) {
        if (msg.createdTimestamp < since) {
          // This message is too old, skip it but keep going through the batch
          continue;
        }
        if (msg.createdTimestamp > until) {
          // This message is too new (future batches will cover it), skip
          continue;
        }
        allMessages.push({
          author: msg.author.tag,
          content: msg.content.substring(0, 500),
          timestamp: msg.createdAt.toISOString(),
          hasLinks: LINK_PATTERN.test(msg.content),
          isBot: msg.author.bot
        });
      }

      lastId = batch.last().id;
      fetched += batch.size;
      console.log(`📜 Collected ${allMessages.length} in-window messages so far (${fetched} total fetched)...`);

      // Safety limit: max 5000 messages fetched
      if (fetched >= 5000) {
        console.log(`📜 Hit safety limit of 5000 messages`);
        break;
      }
    }

    console.log(`📜 Done: ${allMessages.length} messages in window`);
    return allMessages.reverse();
  } catch (e) {
    console.error('Failed to fetch channel history:', e.message);
    return [];
  }
}

// Bot events
client.on('ready', () => {
  console.log(`✅ Bot Discord Hermes connecté en tant que ${client.user.tag}!`);
  console.log(`📢 Prêt à répondre aux mentions @${client.user.username}`);
  console.log(`🇫🇷 Réponses exclusivement en français`);
  console.log(`🔌 Connecté à Hermes CLI: ${HERMES_BIN}`);
  
  // Log all guilds the bot is in (for server restriction setup)
  console.log(`🏠 Serveurs connectés (${client.guilds.cache.size}):`);
  client.guilds.cache.forEach(guild => {
    console.log(`   - ${guild.name} (ID: ${guild.id})`);
  });
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (PROCESSED_MESSAGES.has(message.id)) return;
  
  const isMentioned = message.mentions.has(client.user.id);
  const isDirectMessage = message.channel.type === 'DM';
  
  // --- Server restriction ---
  // Only respond on the allowed guild, or in DMs (for admin)
  if (!isDirectMessage && ALLOWED_GUILD_ID && message.guild.id !== ALLOWED_GUILD_ID) {
    return; // silently ignore messages from other servers
  }
  
  // --- @mention or DM: normal question handling ---
  if (isMentioned || isDirectMessage) {
    PROCESSED_MESSAGES.add(message.id);
    let content = message.content;
    
    message.mentions.users.forEach(user => {
      content = content.replace(new RegExp(`<@!?${user.id}>`, 'g'), '').trim();
    });
    
    content = content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
    
    if (!content) {
      const helpMessage = messagesFR.greeting.replace(/{botName}/g, client.user.username);
      message.reply(helpMessage);
      return;
    }
    
    message.channel.sendTyping();
    
    try {
      if (content.toLowerCase().includes('aide') || content.toLowerCase().includes('help')) {
        const helpMessage = messagesFR.helpTitle + "\n\n" +
                          messagesFR.helpContent.replace(/{botName}/g, client.user.username);
        message.reply(helpMessage);
        return;
      }

      // --- Channel history / recap request ---
      if (HISTORY_PATTERN.test(content) && !isDirectMessage) {
        console.log('📜 History/recap request detected, fetching channel history...');
        await message.react('👀');

        // Determine the timeframe
        let daysBack = 7; // default: 1 week
        let sinceTs = null, untilTs = null; // absolute timestamps for month-based requests
        const now = new Date();

        // French + English month names
        const monthNames = {
          'janvier':0,'février':0,'fevrier':0,'mars':2,'avril':3,'mai':4,'juin':5,
          'juillet':6,'aout':7,'août':7,'septembre':8,'octobre':9,'novembre':10,
          'décembre':11,'decembre':11,
          'january':0,'february':1,'march':2,'april':3,'may':4,'june':5,
          'july':6,'august':7,'september':8,'october':9,'november':10,'december':11
        };

        // "mois de mai", "mois d'avril", "month of may" → only that month
        const monthMatch = content.match(/mois\s+(d['e]|de\s+)?(\w+)/i);
        if (monthMatch && monthNames[monthMatch[2].toLowerCase()] !== undefined) {
          const m = monthNames[monthMatch[2].toLowerCase()];
          let year = now.getFullYear();
          if (m > now.getMonth()) year--; // future month → last year
          sinceTs = new Date(year, m, 1).getTime();
          untilTs = new Date(year, m + 1, 0, 23, 59, 59, 999).getTime(); // last day of month
        }
        // "mois dernier", "last month" → only last month
        else if (/mois\s+dernier|last\s+month/i.test(content)) {
          const lastM = now.getMonth() - 1;
          const year = lastM < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const m = lastM < 0 ? 11 : lastM;
          sinceTs = new Date(year, m, 1).getTime();
          untilTs = new Date(year, m + 1, 0, 23, 59, 59, 999).getTime();
        }
        // "semaine dernière", "last week"
        else if (/semaine\s+dernière|dernière\s+semaine|last\s+week/i.test(content)) {
          daysBack = 7;
        }
        // "hier", "yesterday"
        else if (/\bhier\b|yesterday/i.test(content)) {
          daysBack = 1;
        }
        // "aujourd'hui", "today"
        else if (/\baujourd['e]hui\b|today/i.test(content)) {
          daysBack = 1;
        }
        // Numeric: "3 jours", "2 semaines", "5 days", "3 weeks"
        else {
          const dayMatch = content.match(/(\d+)\s*(jours?|days?|semaines?|weeks?)/i);
          if (dayMatch) {
            const num = parseInt(dayMatch[1]);
            const unit = dayMatch[2].toLowerCase();
            daysBack = unit.startsWith('semaine') || unit.startsWith('week') ? num * 7 : num;
          }
        }

        // Fetch messages for the requested timeframe
        let history;
        if (sinceTs && untilTs) {
          history = await fetchChannelHistory(message.channel, { since: sinceTs, until: untilTs });
        } else {
          history = await fetchChannelHistory(message.channel, { daysBack });
          // If too few messages, extend up to 30 days (only for relative timeframes)
          if (history.length < 10 && daysBack < 30) {
            console.log(`📜 Only ${history.length} messages in ${daysBack} days, extending to 30 days...`);
            history = await fetchChannelHistory(message.channel, { daysBack: 30 });
          }
        }
        if (history.length > 200) {
          history = history.slice(-200);
        }
        if (history.length === 0) {
          await message.reply("📭 Je n'ai trouvé aucun message récent dans ce canal.");
          await finalizeReaction(message, false);
          return;
        }

        // Send ALL non-bot messages as context (full content, no analytics)
        const nonBotMessages = history.filter(m => !m.isBot);
        // Use the requested timeframe boundaries for the header
        const firstDate = sinceTs
          ? new Date(sinceTs).toISOString().split('T')[0]
          : new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const lastDate = untilTs
          ? new Date(untilTs).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        let context = `Messages du canal #${message.channel.name} (${firstDate} → ${lastDate}, ${nonBotMessages.length} messages non-bot) :\n\n`;
        for (const m of nonBotMessages) {
          context += `[${m.timestamp.split('T')[0]} | ${m.author}] ${m.content}\n`;
        }

        const recapPrompt = `Voici tous les messages récents de ce canal. ` +
          `Identifie les thèmes principaux (3 à 5 max) et liste-les simplement. ` +
          `⚠️ FORMAT OBLIGATOIRE — réponds EXACTEMENT comme ceci, une ligne par thème :\n\n` +
          `THEME: Nom du thème 1\nTHEME: Nom du thème 2\nTHEME: Nom du thème 3\n\n` +
          `⚠️ N'inclus PAS d'introduction, de résumé, ni de conclusion. Juste les thèmes.`;

        // Ask Hermes (quiet mode — no web tools needed for recap)
        const { response: recapResponse } = await askHermes(recapPrompt, context, false, 120000, true);
        const rawResponse = formatHermesResponse(recapResponse);

        // Parse themes: extract THEME: lines
        const themes = [];
        for (const line of rawResponse.split('\n')) {
          const t = line.trim();
          if (t.toUpperCase().startsWith('THEME:')) {
            const name = t.replace(/^THEME:\s*/i, '').trim();
            if (name && name.length > 2) {
              themes.push(name);
            }
          }
        }

        if (themes.length === 0) {
          await message.reply("🤔 Je n'ai pas réussi à identifier les thèmes. Réessaie avec une période plus longue.");
          await finalizeReaction(message, false);
          return;
        }

        // Post themes: if already in a thread, post directly; otherwise create one
        if (message.channel.isThread()) {
          console.log(`📊 Already in thread ${message.channel.id}, posting themes directly`);
          await message.channel.send(`**Thèmes de #${message.channel.name}** — ${nonBotMessages.length} messages du ${firstDate} au ${lastDate}`);
          for (const theme of themes) {
            await message.channel.send(`**${theme}**`);
          }
        } else {
          console.log(`📊 Creating thread: Thèmes — ${firstDate} → ${lastDate}`);
          const thread = await message.startThread({
            name: `📊 Thèmes — ${firstDate} → ${lastDate}`,
            autoArchiveDuration: 60
          });
          console.log(`📊 Thread created: ${thread.id}`);
          await thread.send(`**Thèmes de #${message.channel.name}** — ${nonBotMessages.length} messages du ${firstDate} au ${lastDate}`);
          for (const theme of themes) {
            await thread.send(`**${theme}**`);
          }
        }
        await finalizeReaction(message, true);
        return;
      }

      // Add 👀 reaction to signal processing
      await message.react('👀');
      
      // Inject last summarized link as context for follow-up questions
      let lastLink = lastLinkPerChannel.get(message.channel.id);
      let extraContext = null;
      let useWeb = false;
      
      // If no cached link but question references an article, scan channel history
      if (!lastLink && /article|lien|post|url|page/i.test(content)) {
        console.log('🔍 No cached link, scanning channel for recent links...');
        const recentLinks = await scanChannelForLinks(message.channel);
        if (recentLinks.length > 0) {
          lastLink = recentLinks[0].url;
          extraContext = `Liens récents trouvés dans ce canal :\n${recentLinks.map(l => `- ${l.url} (posté par ${l.author})`).join('\n')}`;
          useWeb = true;
          console.log(`📎 Found ${recentLinks.length} recent link(s) in channel`);
        }
      } else if (lastLink) {
        extraContext = `Le dernier article résumé dans ce canal est : ${lastLink}`;
        useWeb = true;
      }
      
      // Get session key and resume previous conversation if available
      const sessionKey = getSessionKey(message);
      const previousSessionId = lastSessionPerChannel.get(sessionKey);
      
      const { response: hermesResponse, sessionId: newSessionId } = await askHermes(content, extraContext, useWeb, null, false, previousSessionId);
      const formattedResponse = formatHermesResponse(hermesResponse);
      
      // Save session ID for next follow-up in this channel/thread
      if (newSessionId) {
        lastSessionPerChannel.set(sessionKey, newSessionId);
        saveSessionCache();
      }
      
      await sendLongResponse(message, formattedResponse);
      await finalizeReaction(message, true);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Build rich notification for admin
      const channelName = message.channel.type === 'DM' ? 'DM' : `#${message.channel.name}`;
      const guildName = message.guild ? message.guild.name : 'DM';
      const details = [
        `Question: ${content}`,
        `Auteur: ${message.author.tag}`,
        `Salon: ${channelName} (${guildName})`,
        `Lien: ${message.url}`,
        error.cliStdout ? `Sortie LLM: ${error.cliStdout.trim()}` : null,
        `Temps: ${error.elapsed || '?'}s`,
        `Erreur: ${error.cliStderr || error.message}`
      ].filter(Boolean).join('\n');
      notifyAdmin('Question échouée', details);
      
      await finalizeReaction(message, false);
      
      if (error.message.includes("Hermes")) {
        message.reply(messagesFR.hermesError);
      } else {
        message.reply(messagesFR.error);
      }
    }
    return;
  }
  
  // --- Auto-detect: link without @mention ---
  const links = message.content.match(LINK_PATTERN);
  if (links && links.length > 0) {
    // Filter: only article-like URLs, skip videos/images/social media silently
    const articleLinks = links.filter(l => !NON_ARTICLE_PATTERN.test(l));
    if (articleLinks.length === 0) return; // nothing to summarize, silently skip

    PROCESSED_MESSAGES.add(message.id);
    const context = message.content.replace(LINK_PATTERN, '').trim();
    
    let pendingMsg;
    try {
      await message.react('👀');
      pendingMsg = await message.reply("🔄 Je récupère le contenu de l'article et je te fournis un résumé structuré…");
      
      // Summarize each article link (up to 3)
      const linksToProcess = articleLinks.slice(0, 3);
      const summaries = [];
      for (const link of linksToProcess) {
        const summary = await summarizeLink(link, context);
        summaries.push(summary);
      }
      
      const response = summaries.join('\n---\n');
      
      // If response is too long, delete pending msg and use thread splitter
      if (response.length > DISCORD_MSG_LIMIT) {
        await pendingMsg.delete();
        await sendLongResponse(message, response);
      } else {
        await pendingMsg.edit(response);
      }
      
      // Cache the last link for follow-up questions in this channel
      lastLinkPerChannel.set(message.channel.id, linksToProcess[0]);
      saveCache();
      
      await finalizeReaction(message, true);
      
    } catch (error) {
      console.error('Link summary error:', error);
      
      // Silently fail: delete pending message, remove 👀, DM admin only
      if (pendingMsg) {
        try { await pendingMsg.delete(); } catch (_) {}
      }
      try {
        const botReactions = message.reactions.cache.filter(r => r.me);
        for (const [, reaction] of botReactions) {
          try { await reaction.users.remove(client.user.id); } catch (_) {}
        }
      } catch (_) {}
      
      // Build rich notification for admin
      const channelName = message.channel.type === 'DM' ? 'DM' : `#${message.channel.name}`;
      const guildName = message.guild ? message.guild.name : 'DM';
      const details = [
        `URL: ${articleLinks[0]}`,
        `Auteur: ${message.author.tag}`,
        `Salon: ${channelName} (${guildName})`,
        `Lien message: ${message.url}`,
        error.cliStdout ? `Sortie LLM: ${error.cliStdout.trim()}` : null,
        `Temps: ${error.elapsed || '?'}s`,
        `Erreur: ${error.cliStderr || error.message}`
      ].filter(Boolean).join('\n');
      notifyAdmin('Résumé de lien échoué', details);
    }
  }
});

// Start the bot
console.log('🚀 Démarrage du bot Discord Hermes...');
console.log('Token (10 premiers caractères):', token.substring(0, 10) + '...');

client.login(token).catch(err => {
  console.error('❌ Erreur lors du démarrage du bot Discord:', err);
  process.exit(1);
});