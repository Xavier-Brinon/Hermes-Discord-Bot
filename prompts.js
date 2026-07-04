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

// Shared one-shot summary format for the two summary paths: buildLinkPrompt (auto
// bare-link summaries) and buildAskPrompt with summarize=true (an @mentioned link).
// Adaptive labels — "Thèse centrale"/"Arguments clés" for argumentative content
// (documentaries, essays, op-eds); "Idée principale"/"Points clés" for neutral
// informational content (news) — so a neutral article isn't forced to invent a thesis.
// evals/assertions.js hasLinkStructure() keys off the "Thèse centrale"/"Idée principale"
// + "Questions" markers this emits — keep them in sync.
function buildSummaryFormat() {
  return `Structure ta réponse en français, en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping), ainsi :
Voici un résumé du [documentaire / article / vidéo] « [titre] » de [auteur si connu] :
**Thèse centrale** (ou **Idée principale** si le contenu n'est pas argumentatif) : une ou deux phrases.
**Arguments clés** (ou **Points clés** si non argumentatif) : une liste — chaque point commence par **un titre en gras**, suivi de deux ou trois phrases.
**Questions** : trois questions ouvertes qui prolongent la réflexion.
Sois concis.`;
}

// Q&A prompt (hermes-discord-bot-clean.js askHermes). When summarize=true (the user
// @mentioned the bot with a link), the shared summary format is appended so an
// @mentioned link is summarised in the same shape as an auto bare-link summary.
// summarize=false is byte-identical to the former literal — plain Q&A is unchanged.
function buildAskPrompt(question, extraContext, summarize = false) {
  const format = summarize ? `\n\n${buildSummaryFormat()}` : '';
  if (extraContext) {
    return `Contexte : ${extraContext}\n\nRéponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}${format}`;
  }
  return `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}${format}`;
}

// Q&A prompt variant for when extraContext is too large to pass as a single CLI
// argv (Linux MAX_ARG_STRLEN, ~128 KB) — the recap path is the trigger. Instead of
// inlining the context, the bot writes it to a file and we reference it with Hermes's
// own `@file:` context-reference; Hermes strips the token and appends the file under
// "--- Attached Context ---". Same instruction/question framing as buildAskPrompt; the
// `@file:` token must be preceded by whitespace and the ref must resolve under Hermes's
// cwd. See issue 1f154fc.
function buildAskPromptWithContextFile(question, contextFileRef) {
  return `Réponds en français uniquement. Écris en paragraphes continus (pas de sauts de ligne artificiels, Discord gère le wrapping). Question : ${question}\n\nLe contexte de la conversation est fourni en pièce jointe. @file:${contextFileRef}`;
}

// Emitted by Hermes (per buildLinkPrompt's anchor clause) when the content it retrieved does
// not match the link's known title/author, or it could not read the real content — so the bot
// posts an honest abstention instead of a fabricated summary. summarizeLink detects this token.
// See issue 1b94451.
const LINK_UNREADABLE_SENTINEL = 'CONTENU_INACCESSIBLE';

// Link-summary prompt (summarizeLink). Uses the shared buildSummaryFormat() so bare
// article-link auto-summaries and @mentioned-link summaries render identically. When `meta`
// (from the Discord embed: { title, author, provider }) is present, it becomes a ground-truth
// anchor — Hermes must confirm what it fetched matches that title/author before summarising,
// else emit LINK_UNREADABLE_SENTINEL. This stops it hallucinating a different video/page when
// the link (e.g. a YouTube URL) isn't readable via -t web. meta=null is byte-identical to the
// former prompt. See issue 1b94451.
function buildLinkPrompt(url, context, meta = null) {
  const anchor =
    meta && meta.title
      ? `\nCe lien est identifié (via ses métadonnées Discord) comme : « ${meta.title} »` +
        `${meta.author ? ` — auteur/chaîne « ${meta.author} »` : ''}` +
        `${meta.provider ? ` (${meta.provider})` : ''}.\n` +
        `VÉRIFICATION OBLIGATOIRE avant de résumer : le contenu que tu récupères doit ` +
        `correspondre à CE titre et à CET auteur. Si ce n'est pas le cas, ou si tu ne peux ` +
        `pas accéder au contenu réel (page non lisible, vidéo sans transcription accessible, ` +
        `etc.), n'invente rien : réponds UNIQUEMENT par ${LINK_UNREADABLE_SENTINEL} et rien ` +
        `d'autre. Ne résume jamais un contenu différent de celui indiqué ci-dessus.`
      : '';
  return `Résume en français le contenu de ce lien : ${url}.
Contexte : ${context || 'aucun'}.${anchor}
${buildSummaryFormat()}`;
}

// Recap theme-extraction prompt. Verbatim. Steer the recap by editing this string
// (or pass an alternate to the eval runner) — but keep the THEME: contract that
// extractThemes() below depends on.
function buildRecapPrompt() {
  return (
    `Voici tous les messages récents de ce canal. ` +
    `Identifie les thèmes principaux (3 à 5 max) et liste-les simplement. ` +
    `⚠️ FORMAT OBLIGATOIRE — réponds EXACTEMENT comme ceci, une ligne par thème :\n\n` +
    `THEME: Nom du thème 1\nTHEME: Nom du thème 2\nTHEME: Nom du thème 3\n\n` +
    `⚠️ N'inclus PAS d'introduction, de résumé, ni de conclusion. Juste les thèmes.`
  );
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

// Parser for Hermes quiet-mode (-Q) output. With -Q the agent prints ONLY the
// final response on stdout — no `⚕ Hermes` banner, no `Query:` echo, no session
// summary — and the session id on stderr as `session_id: <id>`. Startup
// diagnostics (e.g. a security-scanner warning) can still leak onto the first
// stdout lines, so we drop leading blank lines and leaked `⚠ ` CLI warnings
// before the response. Returns { response, sessionId }. Replaces the old
// banner-scraping loops + extractSessionId(stdout). See issue 9864045.
function parseHermesOutput(stdout, stderr) {
  // Drop Hermes tool-progress narration that leaks past -Q: the fetch/read trace
  // lines `📄 Reading <url>` and `📖 Reading <file> L<range>`. Filtered line-wise
  // (not leading-only) so a trace line survives even if a second fetch interleaves
  // after the answer starts. The emoji + English "Reading " prefix is specific
  // enough that a real French answer — even one mentioning "reading" or opening
  // with an emoji — is untouched. See issue c0003a51.
  const READING_TRACE = /^\s*(?:📄|📖) Reading /u;
  const lines = String(stdout || '')
    .split('\n')
    .filter((line) => !READING_TRACE.test(line));
  let i = 0;
  // Skip leading blanks and leaked CLI diagnostics: a bare `⚠` (U+26A0) NOT
  // followed by the emoji variation selector — so a real `⚠️` answer survives.
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '' || (t.charCodeAt(0) === 0x26a0 && t.charCodeAt(1) !== 0xfe0f)) {
      i++;
      continue;
    }
    break;
  }
  let response = lines.slice(i).join('\n').trim();
  // Hermes 0.17.0's agent-clarification can leak a status prefix on
  // non-interactive (-q) calls, e.g. "(clarify timed out after 120s — agent will
  // decide)". Strip a leading occurrence — its own line or inline (issue 0922f81).
  response = response.replace(/^\(clarify\b[^)]*\bdecide\)\s*/i, '');
  // -Q emits `session_id:` on stderr; search stderr first, fall back to stdout.
  const idMatch = `${stderr || ''}\n${stdout || ''}`.match(/session_id:\s*(\S+)/);
  return { response, sessionId: idMatch ? idMatch[1] : null };
}

module.exports = {
  LINK_UNREADABLE_SENTINEL,
  buildAskPrompt,
  buildAskPromptWithContextFile,
  buildLinkPrompt,
  buildSummaryFormat,
  buildRecapPrompt,
  extractThemes,
  parseHermesOutput,
};
