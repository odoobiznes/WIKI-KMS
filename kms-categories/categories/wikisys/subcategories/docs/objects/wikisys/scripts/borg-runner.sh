#!/bin/bash
# WikiSys Borg Backup Runner
# Verze: 1.0
# Datum: 2025-12-28
#
# Automatické spouštění Borg backupů podle backup-levels.yaml konfigurace

set -euo pipefail

# ============================================================================
# KONFIGURACE
# ============================================================================

WIKISYS_LOCAL="$HOME/.wikisys-local"
CONFIG_FILE="$WIKISYS_LOCAL/docs/common/backup-levels.yaml"
SECRETS_MANAGER="$WIKISYS_LOCAL/scripts/secrets-manager.sh"
NOTIFY_SCRIPT="$WIKISYS_LOCAL/scripts/notify.sh"
LOG_DIR="$HOME/.wikisys-backups/logs"
STATE_DIR="$HOME/.wikisys-backups/state"

# Barvy
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# HELPER FUNKCE
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_DIR/borg-runner.log"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_DIR/borg-runner.log"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_DIR/borg-runner.log"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_DIR/borg-runner.log"
}

# Notifikace
send_notification() {
    local type="$1"
    local message="$2"

    if [ -x "$NOTIFY_SCRIPT" ]; then
        bash "$NOTIFY_SCRIPT" "$type" "$message" 2>/dev/null || true
    fi
}

# Parsování YAML (jednoduché)
get_yaml_value() {
    local file="$1"
    local key="$2"
    grep "^${key}:" "$file" 2>/dev/null | sed "s/${key}://;s/^ *//" | tr -d '"' || echo ""
}

# ============================================================================
# BACKUP FUNKCE
# ============================================================================

# Získat konfiguraci backup setu
get_backup_config() {
    local backup_name="$1"
    local server="$(hostname)"

    # TODO: Implementovat YAML parsing pro komplexní konfiguraci
    # Pro teď používáme default hodnoty

    echo "standard"  # Default level
}

# Spustit backup
run_backup() {
    local backup_name="$1"
    local repo_url="$2"
    local source_paths="$3"
    local exclude_patterns="${4:-}"
    local compression="${5:-lz4}"

    local start_time=$(date +%s)
    local archive_name="${backup_name}-$(hostname)-$(date +%Y-%m-%d-%H%M%S)"

    log_info "🔄 Spouštím backup: $backup_name"
    log_info "Repository: $repo_url"
    log_info "Cesty: $source_paths"
    log_info "Komprese: $compression"

    # Notifikace: Backup started
    send_notification "telegram" "💾 Backup started: $backup_name on $(hostname)"

    # Sestavení exclude argumentů
    local exclude_args=""
    if [ -n "$exclude_patterns" ]; then
        while IFS= read -r pattern; do
            [ -n "$pattern" ] && exclude_args="$exclude_args --exclude '$pattern'"
        done <<< "$exclude_patterns"
    fi

    # Spuštění Borg create
    local borg_output=""
    local borg_exit_code=0

    borg_output=$(borg create \
        --stats \
        --progress \
        --compression "$compression" \
        --exclude-caches \
        $exclude_args \
        "${repo_url}::${archive_name}" \
        $source_paths 2>&1) || borg_exit_code=$?

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Parsování výstupu
    local archive_size=$(echo "$borg_output" | grep "This archive:" | awk '{print $3, $4}')
    local deduplicated_size=$(echo "$borg_output" | grep "Deduplicated size:" | awk '{print $3, $4}')

    if [ $borg_exit_code -eq 0 ]; then
        log_success "Backup dokončen: $backup_name"
        log_info "Velikost: $archive_size"
        log_info "Deduplikováno: $deduplicated_size"
        log_info "Čas: ${duration}s"

        # Uložit stav
        save_backup_state "$backup_name" "success" "$archive_name" "$archive_size" "$duration"

        # Notifikace: Success
        send_notification "telegram" "$(cat <<EOF
✅ Backup úspěšný

📦 Repo: $backup_name
🖥️ Server: $(hostname)
💾 Velikost: $archive_size
⏱️ Čas: ${duration}s

🕒 $(date +'%Y-%m-%d %H:%M:%S')
EOF
)"

        return 0
    else
        log_error "Backup SELHAL: $backup_name"
        log_error "Exit code: $borg_exit_code"
        log_error "Output: $borg_output"

        # Uložit stav
        save_backup_state "$backup_name" "failed" "$archive_name" "0" "$duration"

        # Notifikace: Failure
        send_notification "all" "$(cat <<EOF
❌ BACKUP SELHAL!

📦 Repo: $backup_name
🖥️ Server: $(hostname)
⚠️ Exit code: $borg_exit_code

🕒 $(date +'%Y-%m-%d %H:%M:%S')

⚡ Akce: Zkontroluj logy!
EOF
)"

        return 1
    fi
}

# Uložit stav backupu
save_backup_state() {
    local backup_name="$1"
    local status="$2"
    local archive_name="$3"
    local size="$4"
    local duration="$5"

    mkdir -p "$STATE_DIR"

    cat > "$STATE_DIR/${backup_name}.state" <<EOF
{
  "backup_name": "$backup_name",
  "hostname": "$(hostname)",
  "status": "$status",
  "archive_name": "$archive_name",
  "size": "$size",
  "duration": ${duration},
  "timestamp": $(date +%s),
  "date": "$(date +'%Y-%m-%d %H:%M:%S')"
}
EOF
}

# Prune (čištění starých backupů)
run_prune() {
    local repo_url="$1"
    local backup_name="$2"

    log_info "🧹 Spouštím prune: $backup_name"

    borg prune \
        --list \
        --prefix "${backup_name}-$(hostname)-" \
        --keep-daily 7 \
        --keep-weekly 4 \
        --keep-monthly 6 \
        --keep-yearly 2 \
        "${repo_url}" 2>&1 || {
        log_error "Prune selhal!"
        return 1
    }

    log_success "Prune dokončen: $backup_name"
}

# ============================================================================
# MAIN WORKFLOW
# ============================================================================

# Inicializace
init() {
    mkdir -p "$LOG_DIR" "$STATE_DIR"

    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Konfigurace nenalezena: $CONFIG_FILE"
        log_warning "Spusť nejdřív: bash ~/.wikisys-local/scripts/wikisys-sync.sh"
        exit 1
    fi
}

# Spuštění backupu podle jména
backup_by_name() {
    local backup_name="$1"

    log_info "==================================================================="
    log_info "WikiSys Borg Backup Runner"
    log_info "Backup: $backup_name"
    log_info "Server: $(hostname)"
    log_info "Datum: $(date +'%Y-%m-%d %H:%M:%S')"
    log_info "==================================================================="

    # Pro demonstraci - defaultní konfigurace
    # V produkci by se načetlo z backup-levels.yaml

    case "$backup_name" in
        "wikisys-data")
            local repo_url="ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups"
            local source_paths="$HOME/.wikisys-local $HOME/.wikisys-age-key.txt"
            local exclude_patterns="*.tmp
*.cache
*.log"
            run_backup "$backup_name" "$repo_url" "$source_paths" "$exclude_patterns" "lz4"
            run_prune "$repo_url" "$backup_name"
            ;;

        "user-documents")
            local repo_url="ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups"
            local source_paths="$HOME/Documents"
            local exclude_patterns="node_modules
.git
__pycache__
*.tmp"
            run_backup "$backup_name" "$repo_url" "$source_paths" "$exclude_patterns" "zstd,3"
            run_prune "$repo_url" "$backup_name"
            ;;

        "test-backup")
            # Test backup pro demonstraci
            local repo_url="ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups"
            local source_paths="/tmp/wikisys-test-backup"
            mkdir -p "$source_paths"
            echo "Test backup data - $(date)" > "$source_paths/test-file.txt"
            run_backup "$backup_name" "$repo_url" "$source_paths" "" "lz4"
            ;;

        *)
            log_error "Neznámý backup: $backup_name"
            log_warning "Dostupné backupy: wikisys-data, user-documents, test-backup"
            exit 1
            ;;
    esac

    log_success "==================================================================="
    log_success "Backup workflow dokončen!"
    log_success "==================================================================="
}

# Seznam dostupných backupů
list_backups() {
    echo "Dostupné backupy:"
    echo "  - wikisys-data      : WikiSys lokální cache a age klíč"
    echo "  - user-documents    : Uživatelské dokumenty"
    echo "  - test-backup       : Testovací backup"
}

# Nápověda
show_help() {
    cat << EOF
WikiSys Borg Backup Runner
═══════════════════════════════════════════════════════

POUŽITÍ:
  $0 <backup-name>
  $0 list
  $0 help

PŘÍKLADY:

  # Spustit backup WikiSys dat
  $0 wikisys-data

  # Spustit backup dokumentů
  $0 user-documents

  # Test backup
  $0 test-backup

  # Seznam dostupných backupů
  $0 list

POZNÁMKY:

- Borg repository musí být inicializováno: borg init
- BORG_PASSPHRASE musí být nastaveno (nebo v secrets)
- Logy: $LOG_DIR/borg-runner.log
- Stav: $STATE_DIR/<backup-name>.state

═══════════════════════════════════════════════════════
Verze: 1.0 | Autor: Claude (WikiSys)
EOF
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    init

    case "${1:-help}" in
        list)
            list_backups
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            backup_by_name "$1"
            ;;
    esac
}

main "$@"
