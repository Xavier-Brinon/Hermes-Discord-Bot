#!/bin/bash

# Hermes Discord Bot Management Script (dotenvx-secured)
# Usage: ./manage_hermes.sh [start|stop|restart|status|logs|install-hook]

case "$1" in
    start)
        cd /data/workspace
        # Idempotent: the gateway:startup hook (issue 1ce88f5) runs this on every gateway boot,
        # and the gateway can restart without the container — never launch a second copy.
        if npx pm2 pid hermes-discord-bot 2>/dev/null | grep -qE "^[1-9][0-9]*$"; then
            echo "$(date -u +%FT%TZ) Hermes Discord bot already running — nothing to do."
            exit 0
        fi
        echo "$(date -u +%FT%TZ) Starting Hermes Discord bot (dotenvx-secured)..."
        npx dotenvx run -f /data/workspace/.env -- npx pm2 start /data/workspace/hermes-discord-bot-clean.js --name "hermes-discord-bot"
        npx pm2 save
        ;;
    stop)
        echo "Stopping Hermes Discord bot..."
        npx pm2 stop hermes-discord-bot
        ;;
    restart)
        echo "Restarting Hermes Discord bot (dotenvx-secured)..."
        npx pm2 stop hermes-discord-bot 2>/dev/null || true
        npx pm2 delete hermes-discord-bot 2>/dev/null || true
        cd /data/workspace
        npx dotenvx run -f /data/workspace/.env -- npx pm2 start /data/workspace/hermes-discord-bot-clean.js --name "hermes-discord-bot"
        npx pm2 save
        ;;
    status)
        echo "Hermes Discord bot status:"
        npx pm2 list | grep "hermes-discord-bot"
        ;;
    logs)
        echo "Showing Hermes Discord bot logs:"
        npx pm2 logs hermes-discord-bot
        ;;
    install-hook)
        # Link the repo's gateway hook into the platform gateway's hooks dir (HERMES_HOME=/data,
        # so /data/hooks — NOT /data/.hermes/hooks, the interactive shell's CLI home). The
        # gateway loads hooks when it starts, so this takes effect at the next container start.
        mkdir -p /data/hooks
        ln -sfn /data/workspace/ops/hermes-hooks/start-discord-bot /data/hooks/start-discord-bot
        ls -l /data/hooks/start-discord-bot
        ;;
    *)
        echo "Usage: $0 [start|stop|restart|status|logs|install-hook]"
        exit 1
        ;;
esac
