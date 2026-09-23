// test-token.js
// Script to test if a Discord token is valid, without printing it.
// Run: npx dotenvx run -f .env -- node test-token.js
// Reads DISCORD_BOT_TOKEN from the environment; a token passed as an argument would land in
// shell history and `ps`.

const { Client } = require('discord.js');
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN not found in environment. Did you launch with npx dotenvx run?');
  process.exit(1);
}

// dotenvx injects the still-encrypted value when it has no private key, which Discord would
// report as a misleading "invalid token".
if (token.startsWith('encrypted:')) {
  console.error(
    '❌ DISCORD_BOT_TOKEN is still encrypted: .env.keys (or DOTENV_PRIVATE_KEY) is missing'
  );
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
