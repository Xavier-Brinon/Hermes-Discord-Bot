#!/usr/bin/env node

// hermes-discord-bot-clean.js
// Entrypoint: the Discord client + event handlers, wiring the extracted modules.
// Reusable logic lives in config.js, cache.js, hermes-cli.js, text.js, recap.js, and
// prompts.js; this file keeps only Discord-client-coupled concerns. See issue 950dc54.

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const {
  HERMES_BIN,
  ALLOWED_GUILD_ID,
  ADMIN_USER_ID,
  messagesFR,
  HISTORY_PATTERN,
  LINK_PATTERN,
  SUMMARY_REACTION,
  DISCORD_MSG_LIMIT,
  TIMEOUT_RECAP,
} = require('./config');
const { buildRecapPrompt, extractThemes } = require('./prompts');
const {
  extractLinks,
  extractLinkMeta,
  mentionsUser,
  isReplyTo,
  formatHermesResponse,
  safeReply,
  buildThreadTitle,
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

// Same bounded-FIFO idea for the 📝-reaction path: once a message has been summarised,
// remember its id so a second member reacting 📝 doesn't summarise it again (issue c8dafc0).
const REACTED_MESSAGES = new Set();
const MAX_REACTED_MESSAGES = 1000;
function rememberReaction(id) {
  REACTED_MESSAGES.add(id);
  if (REACTED_MESSAGES.size > MAX_REACTED_MESSAGES) {
    REACTED_MESSAGES.delete(REACTED_MESSAGES.values().next().value);
  }
}

// A summary runs async, so a second member can react 📝 before it finishes. Track the ids
// whose summary is CURRENTLY running so a concurrent reaction is a no-op — WITHOUT marking the
// message permanently done. Done (REACTED_MESSAGES) is set only on success, so a failed summary
// can still be retried by re-reacting (issue 5a8db57). Transient — no FIFO bound needed.
const SUMMARISING_MESSAGES = new Set();

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
    // Receive messageReactionAdd for the 📝-reaction summary trigger (issue c8dafc0).
    GatewayIntentBits.GuildMessageReactions,
  ],
  // discord.js v14 uses the Partials enum (the v13 string 'CHANNEL' was inert). Channel is
  // needed for DM events; Message + Reaction let messageReactionAdd fire on messages the bot
  // did not cache — e.g. an old message reacted to after a restart (issue c8dafc0).
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// Get the token from environment
const token = getDecryptedToken();

// Helper: clear the bot's own reactions on a message and add the terminal outcome marker
// (`resultEmoji`: ✅ real result, ⚠️ honest abstention, ❌ hard error). Sweeping every r.me
// reaction — not just `cache.get('👀')` — reliably removes 👀 even on a message fetched after a
// restart, AND clears any stale ✅/⚠️/❌ from a prior attempt so a successful retry never stacks
// a new marker on the old one (issue ffed210). Removing another user's 📝 is a separate,
// permission-gated concern handled by the caller.
async function finalizeReaction(message, resultEmoji) {
  try {
    // A message fetched after a restart can arrive with an empty reactions cache; hydrate it
    // so r.me is populated before we filter. In the common path the bot just reacted 👀, so
    // the cache is non-empty and no extra fetch happens.
    if (message.reactions.cache.size === 0) {
      try {
        await message.fetch();
      } catch {}
    }
    const botReactions = message.reactions.cache.filter((r) => r.me);
    for (const [, reaction] of botReactions) {
      try {
        await reaction.users.remove(client.user.id);
      } catch {}
    }
    await message.react(resultEmoji);
  } catch {
    // Reaction cleanup is best-effort.
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
          await finalizeReaction(message, '❌');
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
          await finalizeReaction(message, '❌');
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
        await finalizeReaction(message, '✅');
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

      // Name the thread after the question so multiple threads in a channel stay distinct.
      await sendLongResponse(message, formattedResponse, buildThreadTitle(content));
      await finalizeReaction(message, '✅');
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

      await finalizeReaction(message, '❌');

      if (error.message.includes('Hermes')) {
        await safeReply(message, messagesFR.hermesError);
      } else {
        await safeReply(message, messagesFR.error);
      }
    }
    return;
  }

  // Summaries are no longer automatic on link-post — they are opt-in via the 📝 reaction
  // (see the messageReactionAdd handler below). Auto-summary was removed in issue c8dafc0.
});

// Summarise the link(s) in a message and reply with the structured summary. Moved verbatim
// from the former auto-detect block (issue c8dafc0) so the 📝-reaction handler and any future
// caller share one flow: 👀 while working, a pending placeholder, up to 3 links, thread-split
// if long, ✅/❌ at the end, and an admin DM (never a channel reply) on failure. `message` is
// a full (fetched) Message; `links` is the non-empty result of extractLinks — the caller has
// already decided there is something to summarise.
async function summariseLinks(message, links) {
  const context = message.content.replace(LINK_PATTERN, '').trim();

  let pendingMsg;
  try {
    await message.react('👀');
    pendingMsg = await message.reply(
      "🔄 Je récupère le contenu de l'article et je te fournis un résumé structuré…"
    );

    // Summarize each link (up to 3). Anchor each on its Discord embed (title/author) so
    // Hermes verifies it read the right content before summarising (issue 1b94451).
    const linksToProcess = links.slice(0, 3);
    const summaries = [];
    let firstError;
    for (const link of linksToProcess) {
      try {
        const summary = await summarizeLink(link, context, extractLinkMeta(message, link));
        summaries.push(summary);
      } catch (err) {
        // Isolate each link: one unreadable link must not discard the summaries that
        // succeeded (issue 5a8db57). Keep the first error for the admin DM if all fail.
        console.error(`Résumé de lien échoué (${link}):`, err.message);
        if (!firstError) firstError = err;
      }
    }

    // Every link failed → nothing to post; fall through to the failure/cleanup path.
    if (summaries.length === 0) throw firstError;

    const response = summaries.join('\n---\n');

    // If response is too long, delete pending msg and use thread splitter. Name the thread
    // after the first link's embed title (falls back to the generic title with no embed).
    if (response.length > DISCORD_MSG_LIMIT) {
      await pendingMsg.delete();
      const threadTitle = buildThreadTitle(extractLinkMeta(message, linksToProcess[0])?.title);
      await sendLongResponse(message, response, threadTitle);
    } else {
      await pendingMsg.edit(response);
    }

    // Cache the last link for follow-up questions in this channel
    setCachedLink(message.channel.id, linksToProcess[0]);

    // Honest abstention vs real summary: summarizeLink returns messagesFR.linkUnreadable verbatim
    // when Hermes couldn't read the content (hermes-cli.js). If EVERY posted summary is that
    // abstention, mark ⚠️ ("won't invent") rather than ✅; one real summary earns ✅ (issue
    // ffed210). Either way it's a terminal, non-retryable outcome, so return true.
    const abstained = summaries.every((s) => s === messagesFR.linkUnreadable);
    await finalizeReaction(message, abstained ? '⚠️' : '✅');
    return true;
  } catch (error) {
    console.error('Link summary error:', error);

    // Hard failure: delete the pending placeholder, then mark ❌ (finalizeReaction also clears
    // the 👀). A real timeout / dead link / all-links-fail now leaves a visible failure marker
    // instead of a bare unmarked message (issue ffed210). Still no channel reply — DM admin only.
    if (pendingMsg) {
      try {
        await pendingMsg.delete();
      } catch {}
    }
    await finalizeReaction(message, '❌');

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
      `Erreur: ${error.cliStderr || error.message}`,
    ]
      .filter(Boolean)
      .join('\n');
    notifyAdmin('Résumé de lien échoué', details);
    return false;
  }
}

// --- 📝 reaction → summarise the message's link(s) (issues c8dafc0, 71e2200) ---
// Opt-in summary: a member reacts 📝 to a message that has a link and the bot summarises it —
// ANY link (article, YouTube, Spotify, …), because a deliberate reaction is itself the "worth
// summarising" decision (no host denylist). Only a message with no link at all is skipped. The
// whole handler is wrapped so a transient fetch failure logs instead of escaping as an
// unhandled rejection (issue 1ff433a).
client.on('messageReactionAdd', async (reaction, user) => {
  try {
    if (user.bot) return; // ignore the bot's own ✅/❌/👀 reactions

    // Match the emoji FIRST — emoji.name is present even on a partial reaction, so an
    // unrelated 👍/❤️ costs nothing (no REST fetch for every reaction in the server).
    if (reaction.emoji.name !== SUMMARY_REACTION) return;

    // The reaction (and its message) can be partial when the message pre-dates the bot's
    // cache — e.g. an old message reacted to after a restart. Hydrate before reading it.
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;

    // Guild restriction — the feature is server-only; a 📝 in a DM has no guild.
    if (!message.guild || message.guild.id !== ALLOWED_GUILD_ID) return;

    // Dedup: a message is marked done (REACTED_MESSAGES) only after a SUCCESSFUL summary, so a
    // failed 📝 can be retried by re-reacting; SUMMARISING_MESSAGES separately collapses two
    // near-simultaneous reactions into one summary while it runs (issue 5a8db57). The check and
    // the add below are separated only by synchronous code, so check-and-set is atomic.
    if (REACTED_MESSAGES.has(message.id) || SUMMARISING_MESSAGES.has(message.id)) return;

    const links = extractLinks(message.content);
    if (links.length === 0) return; // no link → stay silent

    SUMMARISING_MESSAGES.add(message.id);
    try {
      if (await summariseLinks(message, links)) {
        // Real summary OR honest abstention — a terminal, non-retryable outcome. Mark done.
        rememberReaction(message.id);
      } else {
        // Hard error: 5a8db57 deliberately leaves the message un-remembered (retryable), but the
        // user's 📝 is still on it, so no fresh messageReactionAdd can fire — the retry is
        // unreachable. Remove the triggering 📝 so re-clicking it re-arms the summary. Removing
        // another member's reaction needs Manage Messages; best-effort, so a missing perm just
        // leaves the 📝 (manual un-react + re-react still works) instead of crashing (issue ffed210).
        try {
          await reaction.users.remove(user.id);
        } catch {}
      }
    } finally {
      SUMMARISING_MESSAGES.delete(message.id);
    }
  } catch (error) {
    console.error('Reaction handler error:', error.message);
  }
});

// Start the bot
console.log('🚀 Démarrage du bot Discord Hermes...');
console.log('Token (10 premiers caractères):', token.substring(0, 10) + '...');

client.login(token).catch((err) => {
  console.error('❌ Erreur lors du démarrage du bot Discord:', err);
  process.exit(1);
});
