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
const PROCESSED_MESSAGES = new Set();

// Allowed guild ID (server restriction) — REQUIRED
const ALLOWED_GUILD_ID = process.env.ALLOWED_GUILD_ID;
if (!ALLOWED_GUILD_ID) {
  console.error('❌ ALLOWED_GUILD_ID is required. Set it in .env to restrict the bot to one server.');
  process.exit(1);
}
console.log(`🔒 Restreint au serveur ID: ${ALLOWED_GUILD_ID}`);

// Send a DM to the admin when a CLI error occurs
async function notifyAdmin(errorType, details) {
  try {
    const admin = await client.users.fetch(ADMIN_USER_ID);
    if (admin) {
      await admin.send(`⚠️ **Erreur Hermes CLI** — ${errorType}\n\`\`\`\n${details}\n\`\`\``);
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

// Load persisted cache on startup
try {
  const fs = require('fs');
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    lastLinkPerChannel = new Map(Object.entries(data));
    console.log(`📦 Loaded link cache: ${lastLinkPerChannel.size} entries`);
  }
} catch (e) {
  console.error('Failed to load link cache:', e.message);
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

// French messages
const messagesFR = {
  greeting: "👋 Bonjour ! Je suis {botName}, votre assistant IA Hermes.\n" +
            "💡 Pour m'utiliser, mentionnez-moi avec votre question en français.\n" +
            "Exemple : @{botName} quel temps fait-il aujourd'hui ?",
  
  processing: "👀",  // emoji reaction instead of text reply
  
  error: "❌ Désolé, j'ai rencontré une erreur en traitant votre demande.",
  
  hermesError: "❌ Désolé, je n'ai pas pu obtenir de réponse de l'IA Hermes.\n" +
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
function askHermes(question, extraContext, useWebTools) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    // Always instruct Hermes to respond in French
    let prompt = `Réponds en français uniquement. Question : ${question}`;
    if (extraContext) {
      prompt = `Contexte : ${extraContext}\n\nRéponds en français uniquement. Question : ${question}`;
    }
    
    const args = ['chat', '-q', prompt];
    if (useWebTools) {
      args.splice(1, 0, '-t', 'web');  // insert -t web before -q
    }
    
    console.log(`📤 Sending question to Hermes CLI: ${question}${useWebTools ? ' (web tools)' : ''}`);
    
    execFile(HERMES_BIN, args, {
      timeout: 60000,
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
          response += (response ? ' ' : '') + trimmed;
        }
      }
      response = response.trim();
      resolve(response || messagesFR.fallbackResponse.replace('{command}', question));
    });
  });
}

// Function to summarize a link via Hermes with web tools
function summarizeLink(url, context) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const prompt = `Résume en français le contenu de ce lien : ${url}.
Contexte : ${context || 'aucun'}.
Structure : 📌 **Résumé** (5-7 lignes max) puis ❓ **Questions** (3 questions). Sois concis, évite les sauts de ligne inutiles.`;
    
    console.log(`📤 Summarizing link: ${url}`);
    
    execFile(HERMES_BIN, ['chat', '-q', prompt, '-t', 'web'], {
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
          response += (response ? ' ' : '') + trimmed;
        }
      }
      response = response.trim();
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

// Function to format Hermes response
function formatHermesResponse(response) {
  if (!response) return messagesFR.fallbackResponse;
  
  if (response.length > HERMES_CONFIG.maxResponseLength) {
    return response.substring(0, HERMES_CONFIG.maxResponseLength - 3) + "...";
  }
  
  return response;
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
      
      const hermesResponse = await askHermes(content, extraContext, useWeb);
      const formattedResponse = formatHermesResponse(hermesResponse);
      
      await message.reply(formattedResponse);
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
    PROCESSED_MESSAGES.add(message.id);
    const context = message.content.replace(LINK_PATTERN, '').trim();
    
    let pendingMsg;
    try {
      await message.react('👀');
      pendingMsg = await message.reply("🔄 Je récupère le contenu de l'article et je te fournis un résumé structuré…");
      
      // Summarize each link (up to 3)
      const linksToProcess = links.slice(0, 3);
      const summaries = [];
      for (const link of linksToProcess) {
        const summary = await summarizeLink(link, context);
        summaries.push(summary);
      }
      
      const response = summaries.join('\n---\n');
      await pendingMsg.edit(response);
      
      // Cache the last link for follow-up questions in this channel
      lastLinkPerChannel.set(message.channel.id, linksToProcess[0]);
      saveCache();
      
      await finalizeReaction(message, true);
      
    } catch (error) {
      console.error('Link summary error:', error);
      
      // Build rich notification for admin
      const channelName = message.channel.type === 'DM' ? 'DM' : `#${message.channel.name}`;
      const guildName = message.guild ? message.guild.name : 'DM';
      const details = [
        `URL: ${links[0]}`,
        `Auteur: ${message.author.tag}`,
        `Salon: ${channelName} (${guildName})`,
        `Lien message: ${message.url}`,
        error.cliStdout ? `Sortie LLM: ${error.cliStdout.trim()}` : null,
        `Temps: ${error.elapsed || '?'}s`,
        `Erreur: ${error.cliStderr || error.message}`
      ].filter(Boolean).join('\n');
      notifyAdmin('Résumé de lien échoué', details);
      
      await finalizeReaction(message, false);
      
      if (pendingMsg) {
        await pendingMsg.edit("❌ Désolé, je n'ai pas pu résumer ce lien.");
      } else {
        message.reply("❌ Désolé, je n'ai pas pu résumer ce lien.");
      }
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