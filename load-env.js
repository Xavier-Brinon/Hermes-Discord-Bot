// load-env.js
// Decrypt .env inside the bot process (issue e39e496). The bot used to start under
// `dotenvx run -- pm2 start`, which handed PM2 the decrypted values: `pm2 save` wrote
// DISCORD_BOT_TOKEN in plaintext to dump.pm2, and /proc/<pid>/environ (the launch snapshot)
// showed it to anything running as the same user. Decrypting here keeps secrets out of both.
//
// dotenvx reads the private key from .env.keys next to `envPath` (not from the cwd), and never
// overrides a variable that is already set. `strict` makes a missing key or a failed decryption
// throw, so the bot stops at startup instead of logging in with an `encrypted:` string.

'use strict';

const path = require('path');
const dotenvx = require('@dotenvx/dotenvx');

function loadEnv(envPath = path.join(__dirname, '.env'), processEnv = process.env) {
  dotenvx.config({ path: envPath, strict: true, processEnv });
}

module.exports = { loadEnv };
