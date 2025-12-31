#!/bin/bash
# KMS Backup Manager
# Manages daily backups for KMS system: database, files, and configurations

set -euo pipefail

# Configuration
BACKUP_ROOT="/opt/BackUps/kms"
DB_NAME="kms_db"
DB_USER="kms_user"
KMS_DATA_DIR="/opt/kms"
KMS_TOOLS_DIR="/opt/kms-tools"
RETENTION_DAYS=30
LOG_FILE="/var/log/kms-backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
DAILY_DIR="${BACKUP_ROOT}/daily/${DATE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1" | tee -a "$LOG_FILE"
}

# Get database password from WikiSys secrets
get_db_password() {
    local result
    result=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt passwords/kms-db-password 2>/dev/null | tail -1)
    echo "$result"
}

# Create backup directories
create_backup_dirs() {
    log_info "Creating backup directories..."
    mkdir -p "${DAILY_DIR}"/{database,files,configs,logs}
    log_success "Backup directories created: ${DAILY_DIR}"
}

# Backup PostgreSQL database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    local backup_file="${DAILY_DIR}/database/${DB_NAME}_${DATE}.sql.gz"
    
    local db_password
    db_password=$(get_db_password)
    
    if PGPASSWORD="$db_password" pg_dump -h localhost -U "$DB_USER" "$DB_NAME" | gzip > "$backup_file"; then
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log_success "Database backup created: ${backup_file} (${size})"
    else
        log_error "Database backup failed!"
        return 1
    fi
}

# Backup KMS data files
backup_files() {
    log_info "Backing up KMS data files..."
    local backup_file="${DAILY_DIR}/files/kms_data_${DATE}.tar.gz"
    
    if tar -czf "$backup_file" -C /opt kms --exclude="*.pyc" --exclude="__pycache__" --exclude=".git"; then
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log_success "Data files backup created: ${backup_file} (${size})"
    else
        log_error "Data files backup failed!"
        return 1
    fi
}

# Backup KMS tools and configurations
backup_configs() {
    log_info "Backing up configurations..."
    local backup_file="${DAILY_DIR}/configs/kms_configs_${DATE}.tar.gz"
    
    # List of config files to backup
    local configs=(
        "/etc/nginx/sites-available/kms"
        "/etc/nginx/sites-available/kms-tools-proxy.conf"
        "/etc/systemd/system/kms-api.service"
        "/etc/systemd/system/kms-sync-daemon.service"
        "/etc/systemd/system/kms-tools-ttyd.service"
        "/etc/systemd/system/kms-tools-filebrowser.service"
        "/etc/systemd/system/kms-tools-code-server.service"
    )
    
    # Create temp directory for configs
    local tmp_dir
    tmp_dir=$(mktemp -d)
    
    for cfg in "${configs[@]}"; do
        if [[ -f "$cfg" ]]; then
            cp "$cfg" "$tmp_dir/"
        fi
    done
    
    # Also backup KMS tools essential files
    cp -r "${KMS_TOOLS_DIR}/api" "$tmp_dir/api-backup" 2>/dev/null || true
    cp -r "${KMS_TOOLS_DIR}/frontend" "$tmp_dir/frontend-backup" 2>/dev/null || true
    
    if tar -czf "$backup_file" -C "$tmp_dir" .; then
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log_success "Configs backup created: ${backup_file} (${size})"
    else
        log_error "Configs backup failed!"
        rm -rf "$tmp_dir"
        return 1
    fi
    
    rm -rf "$tmp_dir"
}

# Backup logs
backup_logs() {
    log_info "Backing up logs..."
    local backup_file="${DAILY_DIR}/logs/kms_logs_${DATE}.tar.gz"
    
    local logs=(
        "/var/log/kms-sync-daemon.log"
        "/var/log/kms-backup.log"
        "/tmp/kms-api-debug.log"
    )
    
    local tmp_dir
    tmp_dir=$(mktemp -d)
    
    for logfile in "${logs[@]}"; do
        if [[ -f "$logfile" ]]; then
            cp "$logfile" "$tmp_dir/"
        fi
    done
    
    if tar -czf "$backup_file" -C "$tmp_dir" . 2>/dev/null; then
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log_success "Logs backup created: ${backup_file} (${size})"
    else
        log_info "No logs to backup"
    fi
    
    rm -rf "$tmp_dir"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    local count
    count=$(find "${BACKUP_ROOT}/daily" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} | wc -l)
    
    if [[ $count -gt 0 ]]; then
        find "${BACKUP_ROOT}/daily" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \;
        log_success "Removed ${count} old backup(s)"
    else
        log_info "No old backups to remove"
    fi
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    local manifest="${DAILY_DIR}/manifest.json"
    
    cat > "$manifest" << EOF
{
    "backup_date": "${DATE}",
    "backup_type": "daily",
    "system": "KMS",
    "components": {
        "database": "$(ls -la ${DAILY_DIR}/database/*.sql.gz 2>/dev/null | awk '{print $9}' || echo 'none')",
        "files": "$(ls -la ${DAILY_DIR}/files/*.tar.gz 2>/dev/null | awk '{print $9}' || echo 'none')",
        "configs": "$(ls -la ${DAILY_DIR}/configs/*.tar.gz 2>/dev/null | awk '{print $9}' || echo 'none')",
        "logs": "$(ls -la ${DAILY_DIR}/logs/*.tar.gz 2>/dev/null | awk '{print $9}' || echo 'none')"
    },
    "sizes": {
        "database": "$(du -sh ${DAILY_DIR}/database 2>/dev/null | cut -f1 || echo '0')",
        "files": "$(du -sh ${DAILY_DIR}/files 2>/dev/null | cut -f1 || echo '0')",
        "configs": "$(du -sh ${DAILY_DIR}/configs 2>/dev/null | cut -f1 || echo '0')",
        "logs": "$(du -sh ${DAILY_DIR}/logs 2>/dev/null | cut -f1 || echo '0')"
    },
    "total_size": "$(du -sh ${DAILY_DIR} 2>/dev/null | cut -f1 || echo '0')",
    "retention_days": ${RETENTION_DAYS}
}
EOF
    
    log_success "Manifest created: ${manifest}"
}

# Main backup function
run_backup() {
    log "=========================================="
    log "KMS Daily Backup Starting"
    log "=========================================="
    
    create_backup_dirs
    backup_database
    backup_files
    backup_configs
    backup_logs
    create_manifest
    cleanup_old_backups
    
    local total_size
    total_size=$(du -sh "${DAILY_DIR}" | cut -f1)
    
    log "=========================================="
    log_success "Backup completed successfully!"
    log "Total backup size: ${total_size}"
    log "Backup location: ${DAILY_DIR}"
    log "=========================================="
}

# List available backups
list_backups() {
    echo -e "${BLUE}Available KMS Backups:${NC}"
    echo "======================================"
    
    if [[ -d "${BACKUP_ROOT}/daily" ]]; then
        ls -la "${BACKUP_ROOT}/daily" 2>/dev/null | tail -n +2
        echo ""
        echo "Total backups: $(ls -1 "${BACKUP_ROOT}/daily" 2>/dev/null | wc -l)"
        echo "Total size: $(du -sh "${BACKUP_ROOT}" 2>/dev/null | cut -f1)"
    else
        echo "No backups found"
    fi
}

# Restore from backup
restore_backup() {
    local backup_date="$1"
    local component="${2:-all}"
    local backup_dir="${BACKUP_ROOT}/daily/${backup_date}"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup not found: ${backup_dir}"
        echo "Available backups:"
        list_backups
        return 1
    fi
    
    log "=========================================="
    log "KMS Restore Starting"
    log "Backup: ${backup_date}"
    log "Component: ${component}"
    log "=========================================="
    
    case "$component" in
        "database")
            log_info "Restoring database..."
            local db_file
            db_file=$(ls "${backup_dir}/database/"*.sql.gz 2>/dev/null | head -1)
            if [[ -f "$db_file" ]]; then
                local db_password
                db_password=$(get_db_password)
                gunzip -c "$db_file" | PGPASSWORD="$db_password" psql -h localhost -U "$DB_USER" "$DB_NAME"
                log_success "Database restored"
            else
                log_error "Database backup not found"
            fi
            ;;
        "files")
            log_info "Restoring files..."
            local files_file
            files_file=$(ls "${backup_dir}/files/"*.tar.gz 2>/dev/null | head -1)
            if [[ -f "$files_file" ]]; then
                tar -xzf "$files_file" -C /opt
                log_success "Files restored"
            else
                log_error "Files backup not found"
            fi
            ;;
        "configs")
            log_info "Restoring configs..."
            local configs_file
            configs_file=$(ls "${backup_dir}/configs/"*.tar.gz 2>/dev/null | head -1)
            if [[ -f "$configs_file" ]]; then
                log_info "Configs backup found. Manual restoration recommended."
                log_info "Extract with: tar -xzf ${configs_file} -C /tmp/restore"
            else
                log_error "Configs backup not found"
            fi
            ;;
        "all")
            log_info "Full restore - restoring all components..."
            restore_backup "$backup_date" "database"
            restore_backup "$backup_date" "files"
            restore_backup "$backup_date" "configs"
            ;;
        *)
            log_error "Unknown component: ${component}"
            echo "Available components: database, files, configs, all"
            return 1
            ;;
    esac
    
    log "=========================================="
    log_success "Restore completed"
    log "=========================================="
}

# Show usage
usage() {
    cat << EOF
KMS Backup Manager

Usage: $0 [command] [options]

Commands:
    backup              Run a full backup (default)
    list                List available backups
    restore <date>      Restore from backup
    restore <date> <component>  Restore specific component
                        Components: database, files, configs, all
    status              Show backup status
    help                Show this help message

Examples:
    $0 backup           # Run daily backup
    $0 list             # List all backups
    $0 restore 20251231_120000 database  # Restore database only
    $0 restore 20251231_120000 all       # Full restore

Configuration:
    Backup root: ${BACKUP_ROOT}
    Retention: ${RETENTION_DAYS} days
    Log file: ${LOG_FILE}
EOF
}

# Show backup status
show_status() {
    echo -e "${BLUE}KMS Backup Status${NC}"
    echo "======================================"
    echo "Backup root: ${BACKUP_ROOT}"
    echo "Retention: ${RETENTION_DAYS} days"
    echo ""
    
    if [[ -d "${BACKUP_ROOT}/daily" ]]; then
        local latest
        latest=$(ls -1 "${BACKUP_ROOT}/daily" 2>/dev/null | sort -r | head -1)
        
        if [[ -n "$latest" ]]; then
            echo "Latest backup: ${latest}"
            echo "Latest size: $(du -sh "${BACKUP_ROOT}/daily/${latest}" 2>/dev/null | cut -f1)"
            echo ""
            
            if [[ -f "${BACKUP_ROOT}/daily/${latest}/manifest.json" ]]; then
                echo "Manifest:"
                cat "${BACKUP_ROOT}/daily/${latest}/manifest.json"
            fi
        fi
        
        echo ""
        echo "Total backups: $(ls -1 "${BACKUP_ROOT}/daily" 2>/dev/null | wc -l)"
        echo "Total size: $(du -sh "${BACKUP_ROOT}" 2>/dev/null | cut -f1)"
    else
        echo "No backups found"
    fi
}

# Main
case "${1:-backup}" in
    backup)
        run_backup
        ;;
    list)
        list_backups
        ;;
    restore)
        if [[ -z "${2:-}" ]]; then
            log_error "Backup date required"
            usage
            exit 1
        fi
        restore_backup "${2}" "${3:-all}"
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: ${1}"
        usage
        exit 1
        ;;
esac

