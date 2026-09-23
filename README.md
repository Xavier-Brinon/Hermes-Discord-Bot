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
- **Restarts**: PM2 auto-restarts the bot on crash. A climbing `↺` count in
  `./manage_hermes.sh status` means a crash loop — watch the logs right after a
  redeployment.
- **One-way street**: the VPS _pulls_ the code (`git pull`); we never push to
  `/data/workspace`. The canonical source stays Radicle + `origin`.

### Rollback

```bash
cd /data/workspace
git log --oneline -5          # find the previous commit
git reset --hard <sha>        # go back to the stable commit
./manage_hermes.sh restart
```

## After a reboot

The bot runs in a **managed Docker sandbox**. A container restart or recreate
kills every process — PM2 included — and re-runs the platform entrypoint
(`tini -- /app/u4s-hermes-agent`), which starts a Hermes gateway
(`hermes gateway run`, with `HERMES_HOME=/data`) but not the bot.

The bot rides on that gateway: a **gateway hook** in `/data/hooks/` runs
`./manage_hermes.sh start` on the gateway's `gateway:startup` event (issue
1ce88f5). Install it once — it lives on the persistent `/data` volume and points
at the repo copy, so `git pull` keeps it current:

```bash
cd /data/workspace
./manage_hermes.sh install-hook
```

Each automatic start is logged to `/data/workspace/.autostart.log`. If the bot is
still down after a restart, start it by hand — `start` is idempotent, so it is
always safe to run:

```bash
cd /data/workspace
./manage_hermes.sh start
```

Everything the bot needs (code, `node_modules`, `.env`, `.env.keys`) lives on the
persistent `/data` volume, so `start` works immediately on a fresh container.

> **Two Hermes homes.** The platform gateway and the bot both use
> `HERMES_HOME=/data` — the gateway from the platform's environment, the bot from
> its own encrypted `.env` (profile at `/data/profiles/discord-bot`). Your
> interactive shell sets no `HERMES_HOME`, so the `hermes` CLI there uses
> `~/.hermes` = `/data/.hermes`. Gateway hooks therefore go in `/data/hooks`, not
> `/data/.hermes/hooks`; to inspect the gateway's config from the shell, prefix
> `HERMES_HOME=/data`. The hook strips every inherited `HERMES_*` variable before
> starting the bot: dotenvx does not override variables that are already set, so
> this lets `.env` decide, and keeps the platform's web-UI password out of the bot.

## Automatic recovery

- **Bot crash, container alive:** PM2 restarts the process automatically — no
  action needed. This is the common case.
- **Container restart or recreate:** automatic via the gateway hook (above), once
  `install-hook` has been run.

There is deliberately **no bash watchdog**. The former `hermes_watchdog.sh`
duplicated PM2's own crash-restart, ran unsupervised (nothing restarted it if it
died), and could not survive a container recreate — so it was retired.
`manage_hermes.sh` keeps PM2's saved process list current via `pm2 save` on every
start/restart.

## Security

- The Discord token is **encrypted** in `.env` via dotenvx
- The bot is launched with `npx dotenvx run`, which decrypts the variables at runtime
- **Never** commit `.env.keys` or expose the token in cleartext
- To add/change an encrypted variable: `npx dotenvx set NAME "value"`

## Troubleshooting

| Problem                            | Check                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Bot does not respond               | `./manage_hermes.sh status`                                              |
| Token error                        | `npx dotenvx run -f .env -- node test-token.js` (never prints the token) |
| Bot down after a container restart | `tail .autostart.log`, then `./manage_hermes.sh start`                   |
| PM2 corrupted                      | `npx pm2 kill && ./manage_hermes.sh start`                               |

## Maintenance

- **Logs**: `./manage_hermes.sh logs`
- **Update dependencies**: `npm update`
- **Responsiveness test**: Mention @Le Mistral Bot in Discord
