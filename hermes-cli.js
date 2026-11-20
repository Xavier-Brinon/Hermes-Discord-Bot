// hermes-cli.js
// The Hermes CLI wrapper: shells out with execFile (no shell — no injection) and parses
// the -Q programmatic output via prompts.parseHermesOutput. Extracted from the entrypoint
// (issue 950dc54). askHermes now takes an options object instead of positional booleans.

'use strict';

const { execFile } = require('child_process');
const path = require('path');
const { childEnv } = require('./child-env');
const {
  HERMES_BIN,
  HERMES_PROFILE,
  HERMES_CWD,
  TIMEOUT_WEB,
  MAX_TURNS_LINK,
  MAX_ARGV_PROMPT_BYTES,
  messagesFR,
} = require('./config');
const {
  buildAskPrompt,
  buildAskPromptWithContextFile,
  buildLinkPrompt,
  parseHermesOutput,
  neutraliseContextRefs,
  LINK_UNREADABLE_SENTINEL,
  MAX_ITERATIONS_NOTICE,
} = require('./prompts');
const { unwrapText } = require('./text');
const { isYouTube, fetchTranscript } = require('./youtube');

// Monotonic suffix so concurrent recaps never collide on a temp filename.
let contextFileSeq = 0;

// Hermes's cwd, created when missing (issue d84e945). It lives outside the repo so Hermes
// loads no AGENTS.md; see config.js. A failed mkdir throws, which fails the call: falling back
// to the bot's own cwd would silently put the repo's docs back into every prompt.
function hermesCwd() {
  require('fs').mkdirSync(HERMES_CWD, { recursive: true, mode: 0o700 });
  return HERMES_CWD;
}

// Write context to a temp .txt in Hermes's cwd, so the file is inside Hermes's `@file:`
// allowed_root. Returns { path, basename }, or null on failure (caller then falls back to the
// inline argv).
function writeContextFile(context) {
  try {
    const fs = require('fs');
    const basename = `.hermes-recap-ctx-${process.pid}-${Date.now()}-${contextFileSeq++}.txt`;
    const fullPath = path.join(hermesCwd(), basename);
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

// One grep-able line per Hermes call (issue 6b61611). README §Health check turns these into
// per-flow percentiles; `limit` shows how close a call came to its execFile timeout.
function formatTimingLine({ flow, web, outcome, elapsedMs, limitMs }) {
  const elapsed = (elapsedMs / 1000).toFixed(1);
  const limit = Math.round(limitMs / 1000);
  return `⏱️ hermes flow=${flow} web=${web ? 'yes' : 'no'} outcome=${outcome} elapsed=${elapsed}s limit=${limit}s`;
}

// Start the clock for one call; the returned function logs its timing line for an outcome.
function startTiming(flow, web, limitMs) {
  const start = Date.now();
  return (outcome) =>
    console.log(formatTimingLine({ flow, web, outcome, elapsedMs: Date.now() - start, limitMs }));
}

// The "Erreur:" detail of an admin notification for a failed Hermes run (issue 1fa461a). A run
// killed by execFile's timeout leaves stderr with whatever Hermes printed so far, such as its
// resume banner, so the timeout and its limit come first.
function cliErrorDetail(error, stderr, timeoutMs) {
  const output = stderr || error.message;
  return error.killed ? `Délai dépassé (${timeoutMs / 1000} s)\n${output}` : output;
}

// argv for one askHermes call. The toolset is ALWAYS pinned to `web` (issue 5cd6f24): with no
// -t, Hermes picks its coding posture in a git cwd like /data/workspace — terminal and file
// tools on a prompt any guild member writes. useWebTools only labels the log lines.
// -Q: programmatic output (final response only); --source tool: keep bot sessions out of
// the user's `hermes sessions` list.
function buildAskArgs(prompt, sessionId = null) {
  const resume = sessionId ? ['--resume', sessionId] : [];
  return [
    '-p',
    HERMES_PROFILE,
    ...resume,
    'chat',
    '-q',
    prompt,
    '-t',
    'web',
    '-Q',
    '--source',
    'tool',
  ];
}

// Ask Hermes a question. Returns { response, sessionId } — sessionId can resume a conversation.
// opts: { extraContext, useWebTools, customTimeout, sessionId, summarize, flow }.
// summarize=true appends the shared structured-summary format (used when an @mention
// carries a link — see the entrypoint's wantsSummary). flow only labels the timing line.
function askHermes(
  question,
  {
    extraContext = null,
    useWebTools = false,
    customTimeout = null,
    sessionId = null,
    summarize = false,
    flow = sessionId ? 'resume' : 'ask',
  } = {}
) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = customTimeout || TIMEOUT_WEB;
    const logTiming = startTiming(flow, useWebTools, timeout);

    // Discord text must not carry Hermes context refs (issue 6fe5a3e). The bot's own @file:
    // offload below is added after this, so it still works.
    question = neutraliseContextRefs(question);
    if (extraContext) extraContext = neutraliseContextRefs(extraContext);

    // Always instruct Hermes to respond in French, no hard line breaks (see prompts.js)
    let prompt = buildAskPrompt(question, extraContext, summarize);

    // If the assembled prompt is too large for a single argv (E2BIG risk), offload the
    // bulky context to a temp file Hermes inlines via @file:. See issue 1f154fc.
    let contextFile = null;
    if (extraContext && Buffer.byteLength(prompt, 'utf-8') > MAX_ARGV_PROMPT_BYTES) {
      contextFile = writeContextFile(extraContext);
      if (contextFile) {
        prompt = buildAskPromptWithContextFile(question, contextFile.basename);
        console.log(
          `📎 Large context (${Buffer.byteLength(extraContext, 'utf-8')} B) offloaded to @file:${contextFile.basename}`
        );
      }
    }

    const args = buildAskArgs(prompt, sessionId);

    console.log(
      `📤 Sending question to Hermes CLI: ${question}${useWebTools ? ' (web tools)' : ''}${sessionId ? ' (resume)' : ''}`
    );

    execFile(
      HERMES_BIN,
      args,
      {
        timeout,
        maxBuffer: 1024 * 1024,
        env: childEnv(),
        cwd: hermesCwd(),
      },
      (error, stdout, stderr) => {
        if (contextFile) cleanupContextFile(contextFile.path);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (error) {
          logTiming(error.killed ? 'timeout' : 'error');
          console.error(`❌ Hermes CLI error (${elapsed}s):`, stderr || error.message);
          console.error('   stdout was:', stdout || '(empty)');
          const err = new Error(
            error.killed
              ? 'Le service Hermes a mis trop de temps à répondre.'
              : 'Impossible de communiquer avec Hermes.'
          );
          err.cliStdout = stdout || '';
          err.cliStderr = cliErrorDetail(error, stderr, timeout);
          err.elapsed = elapsed;
          return reject(err);
        }

        logTiming('ok');
        console.log(`📥 Response received from Hermes (${elapsed}s)`);
        // Log full Hermes output to PM2 for debugging
        console.log('--- HERMES OUTPUT ---');
        console.log(stdout);
        console.log('--- END HERMES OUTPUT ---');
        // Parse Hermes -Q output: clean response on stdout, session id on stderr.
        const { response, sessionId: newSessionId } = parseHermesOutput(stdout, stderr);
        resolve({
          response: response || messagesFR.fallbackResponse.replace('{command}', question),
          sessionId: newSessionId,
        });
      }
    );
  });
}

// Summarize a link via Hermes with web tools. Resolves to { summary, sessionId }: the formatted
// summary string (or the honest `messagesFR.linkUnreadable` when Hermes reports (via the sentinel) that it could not
// read the real content behind the link), and the Hermes session that produced it — the bot
// resumes it when a member replies to one of the summary questions (issue 576af84). `meta` ({ title, author, provider } from the Discord
// embed) anchors the summary on the link's known identity so Hermes can't fabricate a
// different video/page — see buildLinkPrompt and issue 1b94451.
async function summarizeLink(url, context, meta = null) {
  // A YouTube watch page is not readable via -t web, so pull its captions first and let them
  // ground the prompt (issue 7801304). fetchTranscript never throws — a video without captions,
  // a missing yt-dlp, a timeout, or a block from YouTube all return null, and a null transcript
  // makes buildLinkPrompt emit exactly the prompt it emitted before this feature. The fetch is
  // sequential with the Hermes call, so its timeout adds to TIMEOUT_WEB; TIMEOUT_TRANSCRIPT is
  // sized accordingly.
  const transcript = isYouTube(url) ? await fetchTranscript(url) : null;
  return runLinkSummary(url, context, meta, transcript);
}

// The Hermes half of summarizeLink, unchanged from before the transcript feature apart from
// passing `transcript` through to the prompt. Split out only so summarizeLink can await the
// caption fetch without wrapping the whole execFile body in an async promise executor.
function runLinkSummary(url, context, meta, transcript) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    // The link prompt carries no ref of its own, so all of it is neutralised (issue 6fe5a3e).
    const prompt = neutraliseContextRefs(buildLinkPrompt(url, context, meta, transcript));
    const logTiming = startTiming('link', true, TIMEOUT_WEB);

    console.log(`📤 Summarizing link: ${url}`);

    execFile(
      HERMES_BIN,
      // --max-turns sits after the `chat` subcommand, like the -t web pin in buildAskArgs.
      [
        '-p',
        HERMES_PROFILE,
        'chat',
        '-q',
        prompt,
        '-t',
        'web',
        '-Q',
        '--source',
        'tool',
        '--max-turns',
        String(MAX_TURNS_LINK),
      ],
      {
        timeout: TIMEOUT_WEB,
        maxBuffer: 1024 * 1024,
        env: childEnv(),
        cwd: hermesCwd(),
      },
      (error, stdout, stderr) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (error) {
          logTiming(error.killed ? 'timeout' : 'error');
          console.error(`❌ Hermes CLI error (link, ${elapsed}s):`, stderr || error.message);
          const err = new Error(
            error.killed ? 'Le résumé a pris trop de temps.' : 'Impossible de résumer ce lien.'
          );
          err.cliStdout = stdout || '';
          err.cliStderr = cliErrorDetail(error, stderr, TIMEOUT_WEB);
          err.elapsed = elapsed;
          return reject(err);
        }

        console.log(`📥 Link summary received (${elapsed}s)`);
        // Log full Hermes output to PM2 for debugging
        console.log('--- HERMES OUTPUT ---');
        console.log(stdout);
        console.log('--- END HERMES OUTPUT ---');
        // A run that exhausts --max-turns exits 0 and returns a best-effort answer assembled from
        // whatever partial data it gathered — exactly the fabrication the abstain gate exists to
        // prevent. Abstain instead of posting it. Tested against raw stdout because
        // parseHermesOutput strips the notice from the response. See issue 54ed189.
        if (MAX_ITERATIONS_NOTICE.test(stdout || '')) {
          logTiming('abstain');
          console.log(`⚠️  Link summary hit the ${MAX_TURNS_LINK}-turn cap — abstaining`);
          return resolve({ summary: messagesFR.linkUnreadable, sessionId: null });
        }
        // Parse Hermes -Q output, then unwrap terminal line-breaks.
        let { response, sessionId } = parseHermesOutput(stdout, stderr);
        response = unwrapText(response);
        // Anchor abstention: Hermes emits the sentinel when the fetched content doesn't match
        // the link's known title/author (or it couldn't read it) — post an honest message
        // instead of a fabricated summary. See issue 1b94451.
        if (response && new RegExp(`\\b${LINK_UNREADABLE_SENTINEL}\\b`).test(response)) {
          logTiming('abstain');
          return resolve({ summary: messagesFR.linkUnreadable, sessionId: null });
        }
        logTiming('ok');
        resolve({
          summary:
            response || `📎 Lien détecté : ${url}\n(Désolé, je n'ai pas pu générer un résumé.)`,
          sessionId,
        });
      }
    );
  });
}

// Startup probe (issue 9afaeac): which Hermes will the bot actually run, and which version?
// The VPS has two installs, so the configured name alone doesn't answer that. A bare name is
// looked up on PATH like execFile does; symlinks are followed. Never rejects — resolves
// { path, version, error }, with path null when nothing executable is found, and version
// null when `--version` fails (the binary may still answer questions).
function probeHermes(bin = HERMES_BIN) {
  const fs = require('fs');
  const candidates = bin.includes('/')
    ? [bin]
    : (process.env.PATH || '').split(path.delimiter).map((dir) => path.join(dir, bin));
  const found = candidates.find((c) => {
    try {
      fs.accessSync(c, fs.constants.X_OK);
      return fs.statSync(c).isFile();
    } catch {
      return false;
    }
  });
  if (!found) {
    return Promise.resolve({
      path: null,
      version: null,
      error: `${bin} not found or not executable`,
    });
  }
  const resolved = fs.realpathSync(found);
  return new Promise((resolve) => {
    execFile(
      resolved,
      ['--version'],
      { timeout: 15000, env: childEnv() },
      (error, stdout, stderr) => {
        const firstLine = (stdout || '').split('\n').find((l) => l.trim());
        if (error || !firstLine) {
          return resolve({
            path: resolved,
            version: null,
            error: (stderr || error?.message || 'no output').trim(),
          });
        }
        resolve({ path: resolved, version: firstLine.trim(), error: null });
      }
    );
  });
}

module.exports = {
  askHermes,
  summarizeLink,
  probeHermes,
  formatTimingLine,
  buildAskArgs,
  cliErrorDetail,
};
