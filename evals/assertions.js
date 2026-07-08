'use strict';

// Assertions for prompt-eval outputs. The recap assertions reuse the bot's own
// extractThemes() so "passes" == "the bot would have rendered themes".

const { extractThemes } = require('../prompts');

// Cheap French heuristic, dependency-free: accented chars or common stopwords.
function isFrench(text) {
  if (!text) return false;
  if (/[àâäéèêëïîôöùûüç]/i.test(text)) return true;
  return /\b(le|la|les|des|une?|du|et|sur|pour|avec|dans|aux?)\b/i.test(text);
}

function countQuestions(text) {
  return (text.match(/\?/g) || []).length;
}

// Link-summary structure (see prompts.js buildSummaryFormat): an adaptive thesis
// header ("Thèse centrale" or "Idée principale") plus a "Questions" section.
function hasLinkStructure(text) {
  if (!text) return false;
  const hasThesis = /Thèse centrale|Idée principale/.test(text);
  const hasQuestions = /Questions/.test(text);
  return hasThesis && hasQuestions;
}

// Recap compliance against the prompt's contract. Conservative: runs extractThemes
// on the raw model output (no unwrapText), so the rate is a lower bound vs the
// live bot, which applies unwrapText first. Full parity would need the runner to
// apply unwrapText (text.js) before scoring, as the live bot does.
function recapCompliance(output) {
  const themes = extractThemes(output);
  const lines = output
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    themes,
    themeCount: themes.length,
    parseable: themes.length >= 1, // the bot would render at least one theme
    countInRange: themes.length >= 3 && themes.length <= 5, // prompt says "3 à 5 max"
    noPreambleOrConclusion: lines.length > 0 && lines.every((l) => /^THEME:/i.test(l)), // "Juste les thèmes"
    french: isFrench(themes.join(' ')),
  };
}

module.exports = { recapCompliance, isFrench, countQuestions, hasLinkStructure };
