#!/bin/bash
#
# KMS Health Check Automation Script
# Runs health checks and logs results
#

set -e

# Configuration
HEALTH_CHECK_SCRIPT="/opt/kms-tools/bin/healthcheck.sh"
LOG_FILE="/opt/kms-tools/logs/healthcheck.log"
ALERT_LOG="/opt/kms-tools/logs/healthcheck-alerts.log"
MAX_LOG_SIZE=$((10 * 1024 * 1024))

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to log alerts
alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $1" | tee -a "$ALERT_LOG"
}

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Rotate log if too large
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
        log "Log rotated (size exceeded $MAX_LOG_SIZE bytes)"
    fi
fi

# Check if health check script exists
if [ ! -f "$HEALTH_CHECK_SCRIPT" ]; then
    alert "Health check script not found: $HEALTH_CHECK_SCRIPT"
    exit 1
fi

# Run health check and capture output
log "Running health check..."
OUTPUT=$("$HEALTH_CHECK_SCRIPT" 2>&1) || STATUS=$?

# Check for issues in output
if echo "$OUTPUT" | grep -q "❌"; then
    alert "Health check found critical issues:"
    echo "$OUTPUT" | grep "❌" | tee -a "$ALERT_LOG"
elif echo "$OUTPUT" | grep -q "⚠️"; then
    log "Health check warnings detected:"
    echo "$OUTPUT" | grep "⚠️" | tee -a "$LOG_FILE"
else
    log "Health check passed - all systems operational"
fi

# Log full output
echo "$OUTPUT" >> "$LOG_FILE"

log "Health check completed"
exit ${STATUS:-0}
