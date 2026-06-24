// prompts.js
// Single source of truth for the prompts the bot sends to the Hermes CLI, plus
// the theme parser that consumes the recap output. The bot AND the evals/ harness
// both import from here so a prompt under test is byte-identical to the one that
// ships. Edit prompts here, not inline in the bot.
//
// Faithful eval note: the recap is NOT sent raw — the bot calls
//   askHermes(buildRecapPrompt(), context, ...)
// so the real payload is buildAskPrompt(buildRecapPrompt(), context). Reproduce
// that nesting when evaluating the recap.

'use strict';

// Q&A prompt (hermes-discord-bot-clean.js askHermes). Verbatim.
function buildAskPrompt(question, extraContext) {
  if (extraContext) {
    return `Contexte : ${extraContext}\n\nRéponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}`;
  }
  return `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}`;
}

// Link-summary prompt (summarizeLink). Verbatim multi-line literal.
function buildLinkPrompt(url, context) {
  return `Résume en français le contenu de ce lien : ${url}.
Contexte : ${context || 'aucun'}.
Structure : 📌 **Résumé** (5-7 lignes max) puis ❓ **Questions** (3 questions). Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Sois concis.`;
}

// Recap theme-extraction prompt. Verbatim. Steer the recap by editing this string
// (or pass an alternate to the eval runner) — but keep the THEME: contract that
// extractThemes() below depends on.
function buildRecapPrompt() {
  return `Voici tous les messages récents de ce canal. ` +
    `Identifie les thèmes principaux (3 à 5 max) et liste-les simplement. ` +
    `⚠️ FORMAT OBLIGATOIRE — réponds EXACTEMENT comme ceci, une ligne par thème :\n\n` +
    `THEME: Nom du thème 1\nTHEME: Nom du thème 2\nTHEME: Nom du thème 3\n\n` +
    `⚠️ N'inclus PAS d'introduction, de résumé, ni de conclusion. Juste les thèmes.`;
}

// Parser for the recap output. Verbatim from the bot's inline loop. The other
// half of the recap prompt/parser contract: a THEME: line with a name > 2 chars
// becomes a theme; anything else is ignored.
function extractThemes(rawResponse) {
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
  return themes;
}

module.exports = { buildAskPrompt, buildLinkPrompt, buildRecapPrompt, extractThemes };
