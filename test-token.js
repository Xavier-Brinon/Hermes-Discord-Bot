// test-token.js
// Script to test if a Discord token is valid, without printing it.
// Run: node test-token.js
// Reads DISCORD_BOT_TOKEN from .env, decrypted in-process (issue e39e496); a token passed as an
// argument would land in shell history and `ps`.

require('./load-env').loadEnv();

const { Client } = require('discord.js');
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN not found in .env.');
  process.exit(1);
}

const client = new Client({
  intents: [],
});

client.on('ready', () => {
  console.log(`✅ Token is valid! Logged in as ${client.user.tag}`);
  client.destroy();
  process.exit(0);
});

client.on('error', (error) => {
  console.error(`❌ Error: ${error.message}`);
  client.destroy();
  process.exit(1);
});

console.log('Testing token...');
client.login(token).catch((err) => {
  console.error(`❌ Token invalid: ${err.message}`);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Timeout: No response from Discord');
  client.destroy();
  process.exit(1);
}, 10000);
