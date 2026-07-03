#!/usr/bin/env node

// hermes-discord-bot-clean.js
// Entrypoint: the Discord client + event handlers, wiring the extracted modules.
// Reusable logic lives in config.js, cache.js, hermes-cli.js, text.js, recap.js, and
// prompts.js; this file keeps only Discord-client-coupled concerns. See issue 950dc54.

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const {
  HERMES_BIN,
  ALLOWED_GUILD_ID,
  ADMIN_USER_ID,
  messagesFR,
  HISTORY_PATTERN,
  LINK_PATTERN,
  DISCORD_MSG_LIMIT,
  TIMEOUT_RECAP,
} = require('./config');
const { buildRecapPrompt, extractThemes } = require('./prompts');
const {
  isNonArticleUrl,
  mentionsUser,
  isReplyTo,
  formatHermesResponse,
  safeReply,
  sendLongResponse,
} = require('./text');
const { parseTimeframe, fetchChannelHistory, scanChannelForLinks } = require('./recap');
const {
  getSessionKey,
  getCachedLink,
  setCachedLink,
  getSessionId,
  setSessionId,
} = require('./cache');
const { askHermes, summarizeLink } = require('./hermes-cli');

// Bound the dedup set so a long-lived process can't leak memory. Discord only fires
// duplicate messageCreate events back-to-back, so a rolling window of recent ids is
// enough. A Set keeps insertion order, so the first value is the oldest — evict it once
// we exceed the cap (FIFO).
const PROCESSED_MESSAGES = new Set();
const MAX_PROCESSED_MESSAGES = 1000;
function rememberMessage(id) {
  PROCESSED_MESSAGES.add(id);
  if (PROCESSED_MESSAGES.size > MAX_PROCESSED_MESSAGES) {
    PROCESSED_MESSAGES.delete(PROCESSED_MESSAGES.values().next().value);
  }
}

// Server restriction is required — refuse to start without it.
if (!ALLOWED_GUILD_ID) {
  console.error(
    '❌ ALLOWED_GUILD_ID is required. Set it in .env to restrict the bot to one server.'
  );
  process.exit(1);
}
console.log(`🔒 Restreint au serveur ID: ${ALLOWED_GUILD_ID}`);

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
    console.error(
      'DISCORD_BOT_TOKEN not found in environment. Did you launch with npx dotenvx run?'
    );
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
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'],
});

// Get the token from environment
const token = getDecryptedToken();

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

// Bot events
client.on('clientReady', () => {
  console.log(`✅ Bot Discord Hermes connecté en tant que ${client.user.tag}!`);
  console.log(`📢 Prêt à répondre aux mentions @${client.user.username}`);
  console.log(`🇫🇷 Réponses exclusivement en français`);
  console.log(`🔌 Connecté à Hermes CLI: ${HERMES_BIN}`);

  // Log all guilds the bot is in (for server restriction setup)
  console.log(`🏠 Serveurs connectés (${client.guilds.cache.size}):`);
  client.guilds.cache.forEach((guild) => {
    console.log(`   - ${guild.name} (ID: ${guild.id})`);
  });
});

// --- Global error handlers (issue 1ff433a) ---
// discord.js surfaces transient gateway/websocket errors here; log them so they aren't
// silent. discord.js reconnects on its own, so we never exit on these.
client.on('error', (err) => console.error('Discord client error:', err.message));
client.on('shardError', (err) => console.error('Discord shard error:', err.message));

// Last-resort nets: an unexpected rejection or throw is logged and reported to the admin
// instead of taking the PM2-supervised process down (a needless restart is exactly what
// this issue removes). notifyAdmin is self-guarding, so it can't re-trigger these handlers.
process.on('unhandledRejection', (reason) => {
  const detail = reason instanceof Error ? reason.stack || reason.message : String(reason);
  console.error('Unhandled rejection:', detail);
  notifyAdmin('Rejet non géré', detail);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.stack || err.message);
  notifyAdmin('Exception non interceptée', err.stack || err.message);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (PROCESSED_MESSAGES.has(message.id)) return;

  // A real @mention OR a reply to the bot's own message (conversation continuation) —
  // still NOT @everyone/@here, a role the bot holds, or a reply to someone else.
  // message.mentions.has() counted all of those (issue f482c08); we opt reply-to-bot
  // back in explicitly (issue 92b16a6).
  const isMentioned =
    mentionsUser(message.content, client.user.id) || isReplyTo(message, client.user.id);
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

    message.mentions.users.forEach((user) => {
      content = content.replace(new RegExp(`<@!?${user.id}>`, 'g'), '').trim();
    });

    content = content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();

    if (!content) {
      const helpMessage = messagesFR.greeting.replace(/{botName}/g, client.user.username);
      await safeReply(message, helpMessage);
      return;
    }

    message.channel.sendTyping();

    try {
      if (content.toLowerCase().includes('aide') || content.toLowerCase().includes('help')) {
        const helpMessage =
          messagesFR.helpTitle +
          '\n\n' +
          messagesFR.helpContent.replace(/{botName}/g, client.user.username);
        await safeReply(message, helpMessage);
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
            console.log(
              `📜 Only ${history.length} messages in ${daysBack} days, extending to 30 days...`
            );
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
        const nonBotMessages = history.filter((m) => !m.isBot);
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
        const { response: recapResponse } = await askHermes(recapPrompt, {
          extraContext: context,
          customTimeout: TIMEOUT_RECAP,
        });
        const rawResponse = formatHermesResponse(recapResponse);

        // Parse themes: extract THEME: lines (see prompts.js — prompt/parser contract)
        const themes = extractThemes(rawResponse);

        if (themes.length === 0) {
          await message.reply(
            "🤔 Je n'ai pas réussi à identifier les thèmes. Réessaie avec une période plus longue."
          );
          await finalizeReaction(message, false);
          return;
        }

        // Post themes: if already in a thread, post directly; otherwise create one
        if (message.channel.isThread()) {
          console.log(`📊 Already in thread ${message.channel.id}, posting themes directly`);
          await message.channel.send(
            `**Thèmes de #${message.channel.name}** — ${nonBotMessages.length} messages du ${firstDate} au ${lastDate}`
          );
          for (const theme of themes) {
            await message.channel.send(`**${theme}**`);
          }
        } else {
          console.log(`📊 Creating thread: Thèmes — ${firstDate} → ${lastDate}`);
          const thread = await message.startThread({
            name: `📊 Thèmes — ${firstDate} → ${lastDate}`,
            autoArchiveDuration: 60,
          });
          console.log(`📊 Thread created: ${thread.id}`);
          await thread.send(
            `**Thèmes de #${message.channel.name}** — ${nonBotMessages.length} messages du ${firstDate} au ${lastDate}`
          );
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
      let lastLink = getCachedLink(message.channel.id);
      let extraContext = null;
      let useWeb = false;

      // If no cached link but question references an article, scan channel history
      if (!lastLink && /article|lien|post|url|page/i.test(content)) {
        console.log('🔍 No cached link, scanning channel for recent links...');
        const recentLinks = await scanChannelForLinks(message.channel);
        if (recentLinks.length > 0) {
          lastLink = recentLinks[0].url;
          extraContext = `Liens récents trouvés dans ce canal :\n${recentLinks.map((l) => `- ${l.url} (posté par ${l.author})`).join('\n')}`;
          useWeb = true;
          console.log(`📎 Found ${recentLinks.length} recent link(s) in channel`);
        }
      } else if (lastLink) {
        extraContext = `Le dernier article résumé dans ce canal est : ${lastLink}`;
        useWeb = true;
      }

      // Summary intent: the user @mentioned the bot with a link in the message. Apply the
      // shared structured-summary format (buildSummaryFormat) and enable web tools so
      // Hermes fetches the page. Only a URL in the message triggers this — a plain question
      // stays normal Q&A, so the format never leaks onto "quel temps fait-il ?". Trade-off:
      // a pointed question that also carries a URL is treated as a summary (issue ec634229).
      const wantsSummary = LINK_PATTERN.test(content);
      if (wantsSummary) useWeb = true;

      // Get session key and resume previous conversation if available
      const sessionKey = getSessionKey(message);
      const previousSessionId = getSessionId(sessionKey);

      const { response: hermesResponse, sessionId: newSessionId } = await askHermes(content, {
        extraContext,
        useWebTools: useWeb,
        sessionId: previousSessionId,
        summarize: wantsSummary,
      });
      const formattedResponse = formatHermesResponse(hermesResponse);

      // Save session ID for next follow-up in this channel/thread
      if (newSessionId) {
        setSessionId(sessionKey, newSessionId);
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
        `Erreur: ${error.cliStderr || error.message}`,
      ]
        .filter(Boolean)
        .join('\n');
      notifyAdmin('Question échouée', details);

      await finalizeReaction(message, false);

      if (error.message.includes('Hermes')) {
        await safeReply(message, messagesFR.hermesError);
      } else {
        await safeReply(message, messagesFR.error);
      }
    }
    return;
  }

  // --- Auto-detect: link without @mention ---
  const links = message.content.match(LINK_PATTERN);
  if (links && links.length > 0) {
    // Filter: only article-like URLs, skip videos/images/social media silently
    const articleLinks = links.filter((l) => !isNonArticleUrl(l));
    if (articleLinks.length === 0) return; // nothing to summarize, silently skip

    rememberMessage(message.id);
    const context = message.content.replace(LINK_PATTERN, '').trim();

    let pendingMsg;
    try {
      await message.react('👀');
      pendingMsg = await message.reply(
        "🔄 Je récupère le contenu de l'article et je te fournis un résumé structuré…"
      );

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
      setCachedLink(message.channel.id, linksToProcess[0]);

      await finalizeReaction(message, true);
    } catch (error) {
      console.error('Link summary error:', error);

      // Silently fail: delete pending message, remove 👀, DM admin only
      if (pendingMsg) {
        try {
          await pendingMsg.delete();
        } catch (_) {}
      }
      try {
        const botReactions = message.reactions.cache.filter((r) => r.me);
        for (const [, reaction] of botReactions) {
          try {
            await reaction.users.remove(client.user.id);
          } catch (_) {}
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
        `Erreur: ${error.cliStderr || error.message}`,
      ]
        .filter(Boolean)
        .join('\n');
      notifyAdmin('Résumé de lien échoué', details);
    }
  }
});

// Start the bot
console.log('🚀 Démarrage du bot Discord Hermes...');
console.log('Token (10 premiers caractères):', token.substring(0, 10) + '...');

client.login(token).catch((err) => {
  console.error('❌ Erreur lors du démarrage du bot Discord:', err);
  process.exit(1);
});
