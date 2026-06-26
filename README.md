# Hermes Discord Bot — Le Mistral Bot

French-language Discord bot powered by Hermes Agent. Answers @mentions in French in the configured channel.

## Current status

- **Bot name**: Le Mistral Bot#9470
- **Status**: ✅ Online (PM2)
- **Framework**: Node.js + discord.js v14
- **Security**: Token encrypted via dotenvx

## Project structure

```
/data/workspace/
├── hermes-discord-bot-clean.js   # Main bot code
├── manage_hermes.sh              # Canonical management script (start/stop/restart/status/logs)
├── hermes_watchdog.sh            # Automatic supervision (checks PM2 every 60s)
├── start_after_reboot.sh         # Post-reboot startup
├── test-token.js                 # Discord token test utility
├── package.json                  # npm configuration
├── .env                          # Encrypted variables (dotenvx)
├── .env.keys                     # Decryption keys (⚠️ do not commit)
└── node_modules/                 # Dependencies
```

## Managing the bot

All operations go through `manage_hermes.sh`:

```bash
./manage_hermes.sh start      # Start the bot
./manage_hermes.sh stop       # Stop the bot
./manage_hermes.sh restart    # Restart the bot
./manage_hermes.sh status     # Show status
./manage_hermes.sh logs       # Show logs
```

npm equivalents:

```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:status
npm run pm2:logs
```

## Redeployment (updating the code)

⚠️ `restart` **does not update the code** — it relaunches PM2 on the file already
present on disk. A fix merged into `main` only becomes active on the VPS after
this redeployment. (Merged fix ≠ fix in production.)

The code reaches the VPS via `git pull` from the GitHub mirror (`origin`).
Full procedure, to run **on the VPS**:

```bash
cd /data/workspace

# 1. Fetch the new code
git pull origin main

# 2. (Only if package.json / package-lock.json changed) reinstall
npm install

# 3. Relaunch PM2 so it re-reads the file
./manage_hermes.sh restart

# 4. Verify the deployment
./manage_hermes.sh status     # should show "online"
git log -1 --oneline          # should show the expected commit
./manage_hermes.sh logs       # watch startup (Ctrl-C to exit)
```

Finally, a **responsiveness test**: mention @Le Mistral Bot in Discord and
confirm a reply in French.

### Watch points

- **Secrets**: always go through `manage_hermes.sh` (which wraps
  `npx dotenvx run`). `.env.keys` must be present on the VPS, otherwise
  decryption fails at startup.
- **Watchdog**: after a crash loop, the watchdog gives up after 5 consecutive
  restarts. Watch the logs right after a redeployment.
- **One-way street**: the VPS *pulls* the code (`git pull`); we never push to
  `/data/workspace`. The canonical source stays Radicle + `origin`.

### Rollback

```bash
cd /data/workspace
git log --oneline -5          # find the previous commit
git reset --hard <sha>        # go back to the stable commit
./manage_hermes.sh restart
```

## After a reboot

```bash
/data/workspace/start_after_reboot.sh
```

This script launches the watchdog (automatic supervision) then starts the bot.

## Automatic recovery

The watchdog (`hermes_watchdog.sh`):
- Checks the bot's state via `pm2 list` every 60 seconds
- Restarts automatically on a crash
- Gives up after 5 consecutive restarts (manual intervention required)
- Logs to `/data/workspace/hermes_watchdog.log`

## Security

- The Discord token is **encrypted** in `.env` via dotenvx
- The bot is launched with `npx dotenvx run`, which decrypts the variables at runtime
- **Never** commit `.env.keys` or expose the token in cleartext
- To add/change an encrypted variable: `npx dotenvx set NAME "value"`

## Troubleshooting

| Problem | Check |
|---|---|
| Bot does not respond | `./manage_hermes.sh status` |
| Token error | `npx dotenvx get DISCORD_BOT_TOKEN` |
| Watchdog silent | `tail -f /data/workspace/hermes_watchdog.log` |
| PM2 corrupted | `npx pm2 kill && ./manage_hermes.sh start` |

## Maintenance

- **Logs**: `./manage_hermes.sh logs` or `tail -f /data/workspace/hermes_watchdog.log`
- **Update dependencies**: `npm update`
- **Responsiveness test**: Mention @Le Mistral Bot in Discord
