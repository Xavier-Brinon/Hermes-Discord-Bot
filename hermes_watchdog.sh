#!/bin/bash

# Hermes Discord Bot Watchdog (dotenvx-secured)
# This script ensures Hermes stays running even after crashes or reboots

LOG_FILE="/data/workspace/hermes_watchdog.log"
MAX_RESTARTS=5
RESTART_COUNT=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

start_hermes() {
    cd /data/workspace
    npx dotenvx run -f /data/workspace/.env -- npx pm2 start /data/workspace/hermes-discord-bot-clean.js --name "hermes-discord-bot" >> "$LOG_FILE" 2>&1
    log "Started Hermes via dotenvx + PM2"
}

check_hermes() {
    if npx pm2 list 2>/dev/null | grep -q "hermes-discord-bot.*online"; then
        return 0  # Process is running
    fi
    return 1  # Process not running
}

# Main watchdog loop
while true; do
    if check_hermes; then
        log "Hermes is running normally"
    else
        log "Hermes not running - attempting to restart"
        RESTART_COUNT=$((RESTART_COUNT + 1))
        
        if [ "$RESTART_COUNT" -gt "$MAX_RESTARTS" ]; then
            log "Max restarts reached - manual intervention required"
            exit 1
        fi
        
        start_hermes
    fi
    
    # Check every 60 seconds
    sleep 60
done
