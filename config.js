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

// On-disk caches live under the workspace dir.
const CACHE_FILE = path.join(WORKSPACE_DIR, '.link_cache.json');
const SESSION_CACHE_FILE = path.join(WORKSPACE_DIR, '.session_cache.json');

// Hermes CLI timeouts (ms). Web-search calls (-t web) search and fetch, so they get
// more headroom than plain Q&A.
const TIMEOUT_NORMAL = 90000; // 90s — plain @mention/DM questions
const TIMEOUT_WEB = 150000; // 150s — questions using -t web (search + fetch)
const TIMEOUT_RECAP = 120000; // 120s — channel recap summarisation

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
  WORKSPACE_DIR,
  CACHE_FILE,
  SESSION_CACHE_FILE,
  TIMEOUT_NORMAL,
  TIMEOUT_WEB,
  TIMEOUT_RECAP,
  MAX_ARGV_PROMPT_BYTES,
  DISCORD_MSG_LIMIT,
  LINK_PATTERN,
  HISTORY_PATTERN,
  SUMMARY_REACTION,
  ALLOWED_GUILD_ID,
  ADMIN_USER_ID,
  messagesFR,
};
