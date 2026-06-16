#!/bin/bash

# Hermes Discord Bot — Post-Reboot Startup
# Run this after system reboot to bring the bot back online.

LOG_FILE="/data/workspace/hermes_startup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Post-reboot startup sequence ==="

# Start the watchdog in the background
nohup /data/workspace/hermes_watchdog.sh > /dev/null 2>&1 &
log "Watchdog started"

# Start the bot via the canonical management script
/data/workspace/manage_hermes.sh start
log "Bot started via manage_hermes.sh"

log "=== Startup sequence complete ==="
