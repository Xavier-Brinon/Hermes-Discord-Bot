// config.js
// Single source of truth for the bot's constants, paths, and French message strings.
// Paths are env-overridable so the bot runs outside the VPS (local/CI) without editing
// code (issue df0d693); the defaults reproduce the previous hardcoded /data values, so
// production behaviour is unchanged when the env vars are unset. (issue 950dc54)

'use strict';

const path = require('path');

// Hermes CLI binary + workspace (env-overridable; defaults = the VPS layout).
const HERMES_BIN = process.env.HERMES_BIN || '/data/.local/bin/hermes';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/data/workspace';

// yt-dlp binary used to pull YouTube captions (issue 7801304). Same env-overridable shape as
// HERMES_BIN. The default points inside WORKSPACE_DIR because this repo ships no Dockerfile —
// the container image is managed elsewhere — so the standalone `yt-dlp_linux` build lives on
// the persisted volume and survives a container recreate without an image rebuild. An absent
// or broken binary is not an error: fetchTranscript resolves null and the summary degrades to
// the embed-anchored behaviour that predates this feature.
const YTDLP_BIN = process.env.YTDLP_BIN || path.join(WORKSPACE_DIR, 'bin', 'yt-dlp_linux');

// On-disk caches live under the workspace dir.
const CACHE_FILE = path.join(WORKSPACE_DIR, '.link_cache.json');
const SESSION_CACHE_FILE = path.join(WORKSPACE_DIR, '.session_cache.json');

// Hermes CLI timeouts (ms). Web-search calls (-t web) search and fetch, so they get
// more headroom than plain Q&A.
const TIMEOUT_NORMAL = 90000; // 90s — plain @mention/DM questions
const TIMEOUT_WEB = 150000; // 150s — questions using -t web (search + fetch)
const TIMEOUT_RECAP = 120000; // 120s — channel recap summarisation

// Cap Hermes's tool-calling iterations for a link summary. Hermes defaults to 90, so under
// TIMEOUT_WEB a pathological page can spend the whole budget looping and still yield only a
// best-effort answer. A normal summary needs a handful of turns, so this bounds the worst case
// with headroom to spare. Exhausting the cap is treated as an abstention rather than a partial
// summary — see summarizeLink and issue 54ed189.
const MAX_TURNS_LINK = 10;

// YouTube caption fetch (issue 7801304). The fetch is one bounded yt-dlp call made BEFORE the
// Hermes call, so its timeout is additive to TIMEOUT_WEB — kept short because a caption pull is
// a few small HTTPS requests, and a slow one is far likelier to be a block than a big download.
const TIMEOUT_TRANSCRIPT = 45000; // 45s
// Subtitle language preference, highest first: a French track when one exists, else the English
// one. Deliberately does NOT request YouTube's `fr-en` machine translation, for two reasons found
// while verifying this feature. Quality: `fr-en` is a machine translation OF a machine
// transcription, so feeding it to a summariser that then writes French stacks three lossy steps,
// where the original track stacks one. Cost: yt-dlp downloads EVERY matching track, so each extra
// language is another request to the endpoint that answers with HTTP 429 when it decides it has
// seen enough of you — and that endpoint is the whole feature's weak point.
const SUBTITLE_LANGS = 'fr,en';
// Ceiling on transcript characters spliced into the link prompt. The prompt travels as a single
// CLI argv, so this must stay far under MAX_ARGV_PROMPT_BYTES (96 KB); it also bounds what a
// three-hour video can cost in tokens. A longer transcript is truncated, not rejected — the
// opening stretch of a video is normally enough to summarise what it is about.
const TRANSCRIPT_MAX_CHARS = 12000;

// A single CLI argv string is capped by the kernel (Linux MAX_ARG_STRLEN ≈ 128 KB);
// above this ceiling the bot offloads context to a file via Hermes @file: (issue 1f154fc).
const MAX_ARGV_PROMPT_BYTES = 96 * 1024;

// Discord message limit is 2000 chars; we use 1900 to leave margin for formatting.
const DISCORD_MSG_LIMIT = 1900;

// Link detection. (text.js derives a global variant + extractLinks from this.)
const LINK_PATTERN = /https?:\/\/\S+/i;

// History/summary request detection (French + English).
const HISTORY_PATTERN =
  /\b(résume|récap|récapitul|activité|semaine|derniers?\s*messages|derniers?\s*jours?|quoi\s+de\s+neuf|que\s+s['e]est\s+passé|historique|archive|summarize|recap|summary|activity|past\s+week|recent\s+messages|what\s+happened|catch\s+me\s+up|last\s+week|last\s+few\s+days)\b/i;

// Emoji a member reacts with to request a link summary — summaries are opt-in via this
// reaction, not automatic on link-post (issue c8dafc0).
const SUMMARY_REACTION = '📝';

// Server restriction + admin (from env; the entrypoint enforces the required guild).
const ALLOWED_GUILD_ID = process.env.ALLOWED_GUILD_ID;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// All Discord-facing bot text is French (see CLAUDE.md). {botName} is substituted at use.
const messagesFR = {
  greeting:
    '👋 Bonjour ! Je suis {botName}, votre assistant IA Hermes.\n' +
    "💡 Pour m'utiliser, mentionnez-moi avec votre question en français.\n" +
    "Exemple : @{botName} quel temps fait-il aujourd'hui ?",

  processing: '👀', // emoji reaction instead of text reply

  error: "Désolé, j'ai rencontré une erreur en traitant votre demande.",

  hermesError:
    "Désolé, je n'ai pas pu obtenir de réponse de l'IA Hermes.\n" +
    'Veuillez réessayer plus tard ou reformuler votre question.',

  helpTitle: '📚 **Aide - Assistant IA Hermes (Français)**',
  helpContent:
    'Voici ce que je peux faire pour vous :\n' +
    '• Répondre à vos questions en français\n' +
    '• Vous aider avec des tâches variées\n' +
    '• Fournir des informations et des conseils\n\n' +
    "**Exemples d'utilisation :**\n" +
    '• @{botName} Quel temps fait-il à Paris ?\n' +
    "• @{botName} Peux-tu me donner la définition de 'algorithmique' ?\n" +
    "• @{botName} Quelles sont les actualités technologiques aujourd'hui ?",

  fallbackResponse:
    "🤔 Je n'ai pas trouvé d'information précise sur '{command}'.\n" +
    'Pouvez-vous reformuler ou poser une autre question ?',

  // Posted when the summariser could not read the real content behind a link (page not
  // readable, or a video with no accessible transcript) — an honest abstention instead of a
  // fabricated summary. See issue 1b94451.
  linkUnreadable:
    "🔗 Je n'ai pas pu accéder au contenu réel de ce lien (page non lisible ou vidéo sans " +
    'transcription accessible). Je préfère ne pas inventer de résumé.',
};

module.exports = {
  HERMES_BIN,
  YTDLP_BIN,
  WORKSPACE_DIR,
  CACHE_FILE,
  SESSION_CACHE_FILE,
  TIMEOUT_NORMAL,
  TIMEOUT_WEB,
  TIMEOUT_RECAP,
  TIMEOUT_TRANSCRIPT,
  SUBTITLE_LANGS,
  TRANSCRIPT_MAX_CHARS,
  MAX_TURNS_LINK,
  MAX_ARGV_PROMPT_BYTES,
  DISCORD_MSG_LIMIT,
  LINK_PATTERN,
  HISTORY_PATTERN,
  SUMMARY_REACTION,
  ALLOWED_GUILD_ID,
  ADMIN_USER_ID,
  messagesFR,
};
