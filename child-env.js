// child-env.js
// The environment every child process gets (issue 03dee16). Without an explicit `env`, execFile
// hands the child the bot's whole process.env, DISCORD_BOT_TOKEN included, and the Hermes child is
// an agent that reads untrusted web pages. So children get an allowlist instead: what a program
// needs to find its binaries, its home, its locale and the network. Hermes reads its model key
// from its own $HERMES_HOME/.env, so nothing secret has to cross over.

'use strict';

const ALLOWED = new Set([
  'PATH', // tar finds gzip, yt-dlp finds node (--js-runtimes node)
  'HOME', // Hermes falls back to ~/.hermes when HERMES_HOME is unset; yt-dlp cache
  'USER',
  'LOGNAME',
  'LANG',
  'TZ',
  'TMPDIR',
  'PYTHONUTF8', // Hermes and yt-dlp are Python: keep a host's UTF-8 override if it has one
  'PYTHONIOENCODING',
  'HERMES_HOME', // which Hermes home (and so which profiles and .env) the CLI reads
  // Network plumbing, passed only when the host sets it.
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'no_proxy',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'REQUESTS_CA_BUNDLE',
  'NODE_EXTRA_CA_CERTS',
]);

// The allowlisted subset of `env`, plus every LC_* locale variable. Unset names are left out
// rather than passed as empty strings.
function childEnv(env = process.env) {
  const out = {};
  for (const [name, value] of Object.entries(env)) {
    if (value !== undefined && (ALLOWED.has(name) || name.startsWith('LC_'))) out[name] = value;
  }
  return out;
}

module.exports = { childEnv };
