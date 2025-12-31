#!/bin/bash
#
# KMS Backup Script
# Backs up PostgreSQL database and data directory
#
# Usage: ./backup-kms.sh
#

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")") && pwd"
KMS_ROOT="/opt/kms-tools"
BACKUP_DIR="/opt/BackUps/kms-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="kms_db"
DB_USER="kms_user"

# Borg repository (Hetzner Storage Box)
BORG_REPO="ssh://u458763-sub3@u458763.your-storagebox.de:23/./kms-borg-repo"
export BORG_RELOCATED_REPO_ACCESS_IS_OK=yes

# Log file
LOG_FILE="/opt/kms-tools/logs/backup.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "=== KMS Backup Started ==="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 1. Backup PostgreSQL database
log "1. Backing up PostgreSQL database: $DB_NAME"
PG_BACKUP_FILE="$BACKUP_DIR/kms_db_${TIMESTAMP}.sql.gz"

if sudo -u postgres pg_dump "$DB_NAME" | gzip > "$PG_BACKUP_FILE"; then
    log "✓ Database backup created: $PG_BACKUP_FILE"
    DB_SIZE=$(du -h "$PG_BACKUP_FILE" | cut -f1)
    log "  Size: $DB_SIZE"
else
    error_exit "Database backup failed"
fi

# 2. Backup data directory
log "2. Backing up data directory: $KMS_ROOT/data"
if [ -d "$KMS_ROOT/data" ]; then
    DATA_BACKUP_FILE="$BACKUP_DIR/kms_data_${TIMESTAMP}.tar.gz"
    if tar -czf "$DATA_BACKUP_FILE" -C "$KMS_ROOT" data 2>/dev/null; then
        log "✓ Data directory backup created: $DATA_BACKUP_FILE"
        DATA_SIZE=$(du -h "$DATA_BACKUP_FILE" | cut -f1)
        log "  Size: $DATA_SIZE"
    else
        log "⚠ Data directory backup failed (may be empty or inaccessible)"
    fi
else
    log "⚠ Data directory does not exist, skipping"
fi

# 3. Backup configuration files
log "3. Backing up configuration files"
CONFIG_BACKUP_FILE="$BACKUP_DIR/kms_config_${TIMESTAMP}.tar.gz"
tar -czf "$CONFIG_BACKUP_FILE" \
    -C /opt/kms-tools \
    .env \
    sql/schema.sql \
    sql/init-db.sh \
    2>/dev/null || log "⚠ Some config files may be missing"

log "✓ Configuration backup created: $CONFIG_BACKUP_FILE"

# 4. Upload to Borg repository (if configured)
if command -v borg &> /dev/null && [ -n "$BORG_REPO" ]; then
    log "4. Uploading to Borg repository: $BORG_REPO"

    # Initialize borg repo if it doesn't exist
    if ! borg info "$BORG_REPO" &>/dev/null; then
        log "Initializing new Borg repository..."
        borg init --encryption=repokey "$BORG_REPO" 2>&1 | tee -a "$LOG_FILE" || log "⚠ Borg init failed (repo may already exist)"
    fi

    # Create borg backup
    BORG_ARCHIVE="kms-${TIMESTAMP}"
    log "Creating Borg archive: $BORG_ARCHIVE"

    borg create \
        --stats \
        --compression lz4 \
        "$BORG_REPO::$BORG_ARCHIVE" \
        "$PG_BACKUP_FILE" \
        "$CONFIG_BACKUP_FILE" \
        $([ -f "$DATA_BACKUP_FILE" ] && echo "$DATA_BACKUP_FILE") \
        2>&1 | tee -a "$LOG_FILE" || log "⚠ Borg upload failed"

    log "✓ Borg backup completed"

    # Prune old backups (keep last 30 days, last 12 months)
    log "Pruning old backups..."
    borg prune \
        --keep-daily=30 \
        --keep-monthly=12 \
        "$BORG_REPO" 2>&1 | tee -a "$LOG_FILE" || log "⚠ Borg prune failed"

else
    log "4. Borg not configured or not available, skipping remote backup"
fi

# 5. Cleanup old local backups (keep last 7 days)
log "5. Cleaning up old local backups (keeping last 7 days)"
find "$BACKUP_DIR" -name "kms_*.gz" -mtime +7 -delete 2>/dev/null || true
REMAINING=$(find "$BACKUP_DIR" -name "kms_*.gz" 2>/dev/null | wc -l)
log "✓ Local backups remaining: $REMAINING"

# 6. Backup summary
log "=== Backup Summary ==="
log "Database backup: $PG_BACKUP_FILE ($DB_SIZE)"
[ -f "$DATA_BACKUP_FILE" ] && log "Data backup: $DATA_BACKUP_FILE ($DATA_SIZE)"
log "Config backup: $CONFIG_BACKUP_FILE"
log "Backup directory: $BACKUP_DIR"
log "Total local backups: $REMAINING"

log "=== KMS Backup Completed Successfully ==="
exit 0
