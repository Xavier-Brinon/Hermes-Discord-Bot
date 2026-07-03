'use strict';

// Deterministic tests — no Hermes, no Discord. Two jobs:
//   1. byte-identity guard: the builders must equal the strings the bot used to
//      send inline, so extraction caused no behaviour change (and future edits
//      are caught here, not in production).
//   2. parser contract: extractThemes must behave exactly like the old inline loop.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildAskPrompt,
  buildAskPromptWithContextFile,
  buildLinkPrompt,
  buildSummaryFormat,
  buildRecapPrompt,
  extractThemes,
  parseHermesOutput,
} = require('../prompts');

test('buildAskPrompt — no context — byte-identical to former inline literal', () => {
  const expected = `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : Quel temps fait-il ?`;
  assert.equal(buildAskPrompt('Quel temps fait-il ?', null), expected);
});

test('buildAskPrompt — with context — prepends "Contexte :" + blank line', () => {
  const expected = `Contexte : dernier article: http://x\n\nRéponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : et alors ?`;
  assert.equal(buildAskPrompt('et alors ?', 'dernier article: http://x'), expected);
});

test('buildAskPromptWithContextFile — byte-identical literal with @file: ref', () => {
  const expected = `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : Résume le canal\n\nLe contexte de la conversation est fourni en pièce jointe. @file:.hermes-recap-ctx-1.txt`;
  assert.equal(
    buildAskPromptWithContextFile('Résume le canal', '.hermes-recap-ctx-1.txt'),
    expected
  );
});

test('buildAskPromptWithContextFile — @file: token is preceded by whitespace (so Hermes parses it)', () => {
  // context_references REFERENCE_PATTERN requires (?<![\w/]) before @ — a space qualifies.
  const out = buildAskPromptWithContextFile('Q', 'ctx.txt');
  assert.match(out, / @file:ctx\.txt$/);
});

test('buildLinkPrompt — byte-identical, context provided (uses the shared summary format)', () => {
  const expected = `Résume en français le contenu de ce lien : http://x.
Contexte : un test.
Structure ta réponse en français, en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping), ainsi :
Voici un résumé du [documentaire / article / vidéo] « [titre] » de [auteur si connu] :
**Thèse centrale** (ou **Idée principale** si le contenu n'est pas argumentatif) : une ou deux phrases.
**Arguments clés** (ou **Points clés** si non argumentatif) : une liste — chaque point commence par **un titre en gras**, suivi de deux ou trois phrases.
**Questions** : trois questions ouvertes qui prolongent la réflexion.
Sois concis.`;
  assert.equal(buildLinkPrompt('http://x', 'un test'), expected);
});

test('buildLinkPrompt — empty context falls back to "aucun"', () => {
  assert.match(buildLinkPrompt('http://x', ''), /Contexte : aucun\./);
});

test('buildLinkPrompt — embeds the shared buildSummaryFormat()', () => {
  assert.ok(buildLinkPrompt('http://x', 'ctx').includes(buildSummaryFormat()));
});

test('buildSummaryFormat — carries the adaptive markers the evals key off', () => {
  const f = buildSummaryFormat();
  // hasLinkStructure (evals/assertions.js) matches these — keep in sync.
  assert.match(f, /\*\*Thèse centrale\*\* \(ou \*\*Idée principale\*\*/);
  assert.match(f, /\*\*Arguments clés\*\* \(ou \*\*Points clés\*\*/);
  assert.match(f, /\*\*Questions\*\*/);
});

test('buildAskPrompt — summarize=false is byte-identical to plain Q&A (no format leak)', () => {
  const expected = `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : Quel temps fait-il ?`;
  assert.equal(buildAskPrompt('Quel temps fait-il ?', null, false), expected);
  // omitting the 3rd arg must behave the same (default false)
  assert.equal(buildAskPrompt('Quel temps fait-il ?', null), expected);
});

test('buildAskPrompt — summarize=true appends the shared summary format', () => {
  const out = buildAskPrompt('Résume ceci', 'Lien: http://x', true);
  assert.ok(out.startsWith('Contexte : Lien: http://x'));
  assert.ok(out.endsWith(`\n\n${buildSummaryFormat()}`));
});

test('buildRecapPrompt — byte-identical and keeps the THEME: contract', () => {
  const expected =
    `Voici tous les messages récents de ce canal. ` +
    `Identifie les thèmes principaux (3 à 5 max) et liste-les simplement. ` +
    `⚠️ FORMAT OBLIGATOIRE — réponds EXACTEMENT comme ceci, une ligne par thème :\n\n` +
    `THEME: Nom du thème 1\nTHEME: Nom du thème 2\nTHEME: Nom du thème 3\n\n` +
    `⚠️ N'inclus PAS d'introduction, de résumé, ni de conclusion. Juste les thèmes.`;
  assert.equal(buildRecapPrompt(), expected);
});

test('extractThemes — parses THEME: lines, case-insensitive, trims', () => {
  const out = 'THEME: Déploiement VPS\ntheme:  Bug du recap \nTHEME:Radicle';
  assert.deepEqual(extractThemes(out), ['Déploiement VPS', 'Bug du recap', 'Radicle']);
});

test('extractThemes — ignores preamble/conclusion and short names (length <= 2)', () => {
  const out = 'Voici les thèmes :\nTHEME: IA\nTHEME: Sécurité réseau\nEn conclusion...';
  // "IA" has length 2 → filtered out (matches the bot: name.length > 2)
  assert.deepEqual(extractThemes(out), ['Sécurité réseau']);
});

test('extractThemes — no THEME lines yields [] (the "no themes" failure path)', () => {
  assert.deepEqual(extractThemes('- sujet 1\n- sujet 2'), []);
});

// parseHermesOutput — the -Q (quiet-mode) replacement for the old banner scraper.
// Fixtures mirror real Hermes v0.17.0 output captured 2026-06-27 (issue 9864045).

test('parseHermesOutput — clean -Q success: stdout is the response, id from stderr', () => {
  const stdout = 'Bonjour ! Voici la réponse à votre question.';
  const stderr = '\nsession_id: 20260627_105754_141970';
  assert.deepEqual(parseHermesOutput(stdout, stderr), {
    response: 'Bonjour ! Voici la réponse à votre question.',
    sessionId: '20260627_105754_141970',
  });
});

test('parseHermesOutput — drops a leaked ⚠ CLI diagnostic line (real 0.17.0 capture)', () => {
  const stdout =
    '  ⚠ tirith security scanner enabled but not available — command scanning will use pattern matching only\n' +
    'API call failed after 3 retries: HTTP 404: model "" not found';
  const stderr = '\nsession_id: 20260627_105754_141970';
  assert.deepEqual(parseHermesOutput(stdout, stderr), {
    response: 'API call failed after 3 retries: HTTP 404: model "" not found',
    sessionId: '20260627_105754_141970',
  });
});

test('parseHermesOutput — preserves a real ⚠️ emoji that leads the answer', () => {
  const stdout = '⚠️ Attention : pensez à sauvegarder.\nDeuxième ligne.';
  assert.equal(
    parseHermesOutput(stdout, '').response,
    '⚠️ Attention : pensez à sauvegarder.\nDeuxième ligne.'
  );
});

test('parseHermesOutput — session id read from stderr, not stdout', () => {
  assert.equal(parseHermesOutput('réponse sans id', 'session_id: ABC123').sessionId, 'ABC123');
});

test('parseHermesOutput — warning-only stdout yields empty response (fallback path)', () => {
  const stdout = '  ⚠ tirith security scanner enabled but not available';
  assert.deepEqual(parseHermesOutput(stdout, ''), { response: '', sessionId: null });
});

test('parseHermesOutput — no session id anywhere yields null', () => {
  assert.equal(parseHermesOutput('juste une réponse', '').sessionId, null);
});

// clarify-status leak: Hermes 0.17.0 non-interactive agent-clarification (issue 0922f81)

test('parseHermesOutput — strips a leaked clarify status prefix (inline, real capture)', () => {
  const stdout =
    '(clarify timed out after 120s — agent will decide) Voici un résumé des actualités.';
  assert.equal(parseHermesOutput(stdout, '').response, 'Voici un résumé des actualités.');
});

test('parseHermesOutput — strips a clarify status on its own line', () => {
  const stdout = '(clarify timed out after 5s — agent will decide)\nRéponse réelle.';
  assert.equal(parseHermesOutput(stdout, '').response, 'Réponse réelle.');
});

test('parseHermesOutput — leaves a non-leading parenthetical untouched', () => {
  const stdout = 'Voici la réponse (clarify quand même, agent will decide). Fin.';
  assert.equal(
    parseHermesOutput(stdout, '').response,
    'Voici la réponse (clarify quand même, agent will decide). Fin.'
  );
});
