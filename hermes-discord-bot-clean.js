#!/usr/bin/env node

// hermes-discord-bot-clean.js
// Clean Discord bot implementation with Hermes integration

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { execFile } = require('child_process');
const path = require('path');
const { buildAskPrompt, buildAskPromptWithContextFile, buildLinkPrompt, buildRecapPrompt, extractThemes, parseHermesOutput } = require('./prompts');
const { isNonArticleUrl, unwrapText, splitAtBoundaries } = require('./text');
const { parseTimeframe } = require('./recap');

// Hermes CLI path
const HERMES_BIN = '/data/.local/bin/hermes';

// Link detection (NON_ARTICLE_PATTERN / isNonArticleUrl now live in text.js)
const LINK_PATTERN = /https?:\/\/\S+/i;
const PROCESSED_MESSAGES = new Set();
// Bound the dedup set so a long-lived process can't leak memory. Discord only
// fires duplicate messageCreate events back-to-back, so a rolling window of
// recent ids is enough. A Set keeps insertion order, so the first value is the
// oldest — evict it once we exceed the cap (FIFO).
const MAX_PROCESSED_MESSAGES = 1000;
function rememberMessage(id) {
  PROCESSED_MESSAGES.add(id);
  if (PROCESSED_MESSAGES.size > MAX_PROCESSED_MESSAGES) {
    PROCESSED_MESSAGES.delete(PROCESSED_MESSAGES.values().next().value);
  }
}

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

// Hermes CLI timeouts (ms). Web-search calls (-t web) are inherently slower than
// plain Q&A — they search and fetch — so they get more headroom. The message-length
// limit lives in DISCORD_MSG_LIMIT (single source of truth), not here.
const TIMEOUT_NORMAL = 90000;   // 90s — plain @mention/DM questions
const TIMEOUT_WEB    = 150000;  // 150s — questions using -t web (search + fetch)
const TIMEOUT_RECAP  = 120000;  // 120s — channel recap summarisation

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

// A single CLI argv string is capped by the kernel (Linux MAX_ARG_STRLEN ≈ 128 KB).
// A busy channel recap assembles ~100 K chars of history (≈138 KB in UTF-8) into the
// -q prompt, which can overflow that cap and fail with E2BIG. When the assembled prompt
// crosses this conservative ceiling we offload the bulky context to a temp file and let
// Hermes inline it via its `@file:` context-reference instead of passing it on argv.
// The small @mention/DM path never crosses the threshold, so it is unchanged. (issue 1f154fc)
const MAX_ARGV_PROMPT_BYTES = 96 * 1024;

// Monotonic suffix so concurrent recaps never collide on a temp filename.
let contextFileSeq = 0;

// Write context to a temp .txt under process.cwd() — which is also Hermes's cwd
// (execFile sets no cwd), so the file is inside Hermes's `@file:` allowed_root. Returns
// { path, basename }, or null on failure (caller then falls back to the inline argv).
function writeContextFile(context) {
  try {
    const fs = require('fs');
    const basename = `.hermes-recap-ctx-${process.pid}-${Date.now()}-${contextFileSeq++}.txt`;
    const fullPath = path.join(process.cwd(), basename);
    fs.writeFileSync(fullPath, context, 'utf-8');
    return { path: fullPath, basename };
  } catch (e) {
    console.error('Failed to write context file:', e.message);
    return null;
  }
}

function cleanupContextFile(fullPath) {
  try {
    require('fs').unlinkSync(fullPath);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('Failed to remove context file:', e.message);
  }
}

// Function to communicate with Hermes via CLI
// Returns {response, sessionId} — sessionId can be used to resume conversation
function askHermes(question, extraContext, useWebTools, customTimeout, sessionId) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Always instruct Hermes to respond in French, no hard line breaks (see prompts.js)
    let prompt = buildAskPrompt(question, extraContext);

    // If the assembled prompt is too large for a single argv (E2BIG risk), offload the
    // bulky context to a temp file Hermes inlines via @file:. See issue 1f154fc.
    let contextFile = null;
    if (extraContext && Buffer.byteLength(prompt, 'utf-8') > MAX_ARGV_PROMPT_BYTES) {
      contextFile = writeContextFile(extraContext);
      if (contextFile) {
        prompt = buildAskPromptWithContextFile(question, contextFile.basename);
        console.log(`📎 Large context (${Buffer.byteLength(extraContext, 'utf-8')} B) offloaded to @file:${contextFile.basename}`);
      }
    }

    const args = ['-p', 'discord-bot', 'chat', '-q', prompt];
    if (sessionId) {
      args.splice(2, 0, '--resume', sessionId);  // insert --resume <id> after -p discord-bot
    }
    if (useWebTools) {
      args.splice(sessionId ? 4 : 2, 0, '-t', 'web');  // insert -t web after chat
    }
    // -Q: programmatic output (final response only — no banner/spinner/tool previews);
    // --source tool: tag so bot sessions stay out of the user's `hermes sessions` list.
    args.push('-Q', '--source', 'tool');
    
    console.log(`📤 Sending question to Hermes CLI: ${question}${useWebTools ? ' (web tools)' : ''}${sessionId ? ' (resume)' : ''}`);
    
    execFile(HERMES_BIN, args, {
      timeout: customTimeout || (useWebTools ? TIMEOUT_WEB : TIMEOUT_NORMAL),
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      if (contextFile) cleanupContextFile(contextFile.path);
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
      // Parse Hermes -Q output: clean response on stdout, session id on stderr.
      const { response, sessionId: newSessionId } = parseHermesOutput(stdout, stderr);
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
    const prompt = buildLinkPrompt(url, context);
    
    console.log(`📤 Summarizing link: ${url}`);
    
    execFile(HERMES_BIN, ['-p', 'discord-bot', 'chat', '-q', prompt, '-t', 'web', '-Q', '--source', 'tool'], {
      timeout: TIMEOUT_WEB,
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
      // Parse Hermes -Q output, then unwrap terminal line-breaks (as formatHermesResponse does).
      let { response } = parseHermesOutput(stdout, stderr);
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

// Function to format Hermes response (unwrap only, no truncation — caller handles splitting)
function formatHermesResponse(response) {
  if (!response) return messagesFR.fallbackResponse;
  return unwrapText(response);
}

// Discord message limit is 2000 chars; we use 1900 to leave margin for formatting.
// (splitAtBoundaries now lives in text.js and is imported above.)
const DISCORD_MSG_LIMIT = 1900;

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
client.on('clientReady', () => {
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
    rememberMessage(message.id);
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

        // Determine the timeframe — pure date-math lives in recap.js (parseTimeframe).
        // Month requests set absolute sinceTs/untilTs; relative/numeric set daysBack.
        const { daysBack, sinceTs, untilTs } = parseTimeframe(content, new Date());

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

        const recapPrompt = buildRecapPrompt();

        // Ask Hermes for the recap (no web tools needed)
        const { response: recapResponse } = await askHermes(recapPrompt, context, false, TIMEOUT_RECAP);
        const rawResponse = formatHermesResponse(recapResponse);

        // Parse themes: extract THEME: lines (see prompts.js — prompt/parser contract)
        const themes = extractThemes(rawResponse);

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
      
      const { response: hermesResponse, sessionId: newSessionId } = await askHermes(content, extraContext, useWeb, null, previousSessionId);
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
    const articleLinks = links.filter(l => !isNonArticleUrl(l));
    if (articleLinks.length === 0) return; // nothing to summarize, silently skip

    rememberMessage(message.id);
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