// hermes-cli.js
// The Hermes CLI wrapper: shells out with execFile (no shell — no injection) and parses
// the -Q programmatic output via prompts.parseHermesOutput. Extracted from the entrypoint
// (issue 950dc54). askHermes now takes an options object instead of positional booleans.

'use strict';

const { execFile } = require('child_process');
const path = require('path');
const {
  HERMES_BIN,
  TIMEOUT_NORMAL,
  TIMEOUT_WEB,
  MAX_ARGV_PROMPT_BYTES,
  messagesFR,
} = require('./config');
const {
  buildAskPrompt,
  buildAskPromptWithContextFile,
  buildLinkPrompt,
  parseHermesOutput,
} = require('./prompts');
const { unwrapText } = require('./text');

// Monotonic suffix so concurrent recaps never collide on a temp filename.
let contextFileSeq = 0;

// Write context to a temp .txt under process.cwd() — which is also Hermes's cwd
// (execFile sets no cwd), so the file is inside Hermes's `@file:` allowed_root. Returns
// { path, basename }, or null on failure (caller then falls back to the inline argv).
function writeContextFile(context) {
  try {
    const fs = require('fs');
    const basename = `.hermes-recap-ctx-${process.pid}-${Date.now()}-${contextFileSeq++}.txt`;
    const fullPath = path.join(process.cwd(), basename);
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

// Ask Hermes a question. Returns { response, sessionId } — sessionId can resume a conversation.
// opts: { extraContext, useWebTools, customTimeout, sessionId, summarize }.
// summarize=true appends the shared structured-summary format (used when an @mention
// carries a link — see the entrypoint's wantsSummary).
function askHermes(
  question,
  {
    extraContext = null,
    useWebTools = false,
    customTimeout = null,
    sessionId = null,
    summarize = false,
  } = {}
) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

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

    const args = ['-p', 'discord-bot', 'chat', '-q', prompt];
    if (sessionId) {
      args.splice(2, 0, '--resume', sessionId); // insert --resume <id> after -p discord-bot
    }
    if (useWebTools) {
      args.splice(sessionId ? 4 : 2, 0, '-t', 'web'); // insert -t web after chat
    }
    // -Q: programmatic output (final response only); --source tool: keep bot sessions out
    // of the user's `hermes sessions` list.
    args.push('-Q', '--source', 'tool');

    console.log(
      `📤 Sending question to Hermes CLI: ${question}${useWebTools ? ' (web tools)' : ''}${sessionId ? ' (resume)' : ''}`
    );

    execFile(
      HERMES_BIN,
      args,
      {
        timeout: customTimeout || (useWebTools ? TIMEOUT_WEB : TIMEOUT_NORMAL),
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (contextFile) cleanupContextFile(contextFile.path);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (error) {
          console.error(`❌ Hermes CLI error (${elapsed}s):`, stderr || error.message);
          console.error('   stdout was:', stdout || '(empty)');
          const err = new Error(
            error.killed
              ? 'Le service Hermes a mis trop de temps à répondre.'
              : 'Impossible de communiquer avec Hermes.'
          );
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

// Summarize a link via Hermes with web tools. Returns the formatted summary string.
function summarizeLink(url, context) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const prompt = buildLinkPrompt(url, context);

    console.log(`📤 Summarizing link: ${url}`);

    execFile(
      HERMES_BIN,
      ['-p', 'discord-bot', 'chat', '-q', prompt, '-t', 'web', '-Q', '--source', 'tool'],
      {
        timeout: TIMEOUT_WEB,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (error) {
          console.error(`❌ Hermes CLI error (link, ${elapsed}s):`, stderr || error.message);
          const err = new Error(
            error.killed ? 'Le résumé a pris trop de temps.' : 'Impossible de résumer ce lien.'
          );
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
        // Parse Hermes -Q output, then unwrap terminal line-breaks.
        let { response } = parseHermesOutput(stdout, stderr);
        response = unwrapText(response);
        resolve(
          response || `📎 Lien détecté : ${url}\n(Désolé, je n'ai pas pu générer un résumé.)`
        );
      }
    );
  });
}

module.exports = { askHermes, summarizeLink };
