#!/bin/bash

# Hermes Discord Bot Management Script (dotenvx-secured)
# Usage: ./manage_hermes.sh [start|stop|restart|status|logs]

case "$1" in
    start)
        echo "Starting Hermes Discord bot (dotenvx-secured)..."
        cd /data/workspace
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
    *)
        echo "Usage: $0 [start|stop|restart|status|logs]"
        exit 1
        ;;
esac
