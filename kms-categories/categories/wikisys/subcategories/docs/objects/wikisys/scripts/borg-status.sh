#!/bin/bash
# WikiSys Borg Backup Status Monitor
# Verze: 1.0
# Datum: 2025-12-28

set -euo pipefail

# ============================================================================
# KONFIGURACE
# ============================================================================

STATE_DIR="$HOME/.wikisys-backups/state"
LOG_DIR="$HOME/.wikisys-backups/logs"

# Barvy
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# FUNKCE
# ============================================================================

# Převést timestamp na datum
timestamp_to_date() {
    date -d "@$1" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "neznámé"
}

# Převést sekundy na lidsky čitelný formát
seconds_to_human() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(( (seconds % 3600) / 60 ))
    local secs=$((seconds % 60))

    if [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

# Čas od posledního backupu
time_since() {
    local timestamp=$1
    local now=$(date +%s)
    local diff=$((now - timestamp))

    if [ $diff -lt 3600 ]; then
        echo "$((diff / 60))m ago"
    elif [ $diff -lt 86400 ]; then
        echo "$((diff / 3600))h ago"
    else
        echo "$((diff / 86400))d ago"
    fi
}

# Status badge
get_status_badge() {
    local status="$1"
    local timestamp=$2
    local now=$(date +%s)
    local age=$((now - timestamp))

    case "$status" in
        "success")
            if [ $age -lt 86400 ]; then  # < 24h
                echo -e "${GREEN}✅ OK${NC}"
            elif [ $age -lt 172800 ]; then  # < 48h
                echo -e "${YELLOW}⚠️  OLD${NC}"
            else
                echo -e "${RED}❌ STALE${NC}"
            fi
            ;;
        "failed")
            echo -e "${RED}❌ FAIL${NC}"
            ;;
        *)
            echo -e "${YELLOW}⚠️  UNKNOWN${NC}"
            ;;
    esac
}

# Zobrazit stav jednoho backupu
show_backup_status() {
    local state_file="$1"
    local backup_name=$(basename "$state_file" .state)

    if [ ! -f "$state_file" ]; then
        echo -e "${YELLOW}⚠${NC} $backup_name: No state file"
        return
    fi

    # Parsování JSON (jednoduché)
    local status=$(grep '"status"' "$state_file" | sed 's/.*: "\(.*\)".*/\1/')
    local timestamp=$(grep '"timestamp"' "$state_file" | sed 's/.*: \(.*\),/\1/')
    local size=$(grep '"size"' "$state_file" | sed 's/.*: "\(.*\)".*/\1/')
    local duration=$(grep '"duration"' "$state_file" | sed 's/.*: \(.*\),/\1/')
    local archive_name=$(grep '"archive_name"' "$state_file" | sed 's/.*: "\(.*\)".*/\1/')

    local badge=$(get_status_badge "$status" "$timestamp")
    local time_ago=$(time_since "$timestamp")
    local duration_human=$(seconds_to_human "$duration")

    printf "%-25s %s  Last: %-15s Size: %-12s  Duration: %s\n" \
        "$backup_name" \
        "$badge" \
        "$time_ago" \
        "$size" \
        "$duration_human"
}

# Zobrazit celkový přehled
show_overview() {
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "                         WikiSys Backup Status Monitor"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${CYAN}Server:${NC} $(hostname)"
    echo -e "${CYAN}Datum:${NC}  $(date +'%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "───────────────────────────────────────────────────────────────────────────────"
    printf "%-25s %-12s %-17s %-14s %s\n" "BACKUP NAME" "STATUS" "LAST BACKUP" "SIZE" "DURATION"
    echo "───────────────────────────────────────────────────────────────────────────────"

    if [ ! -d "$STATE_DIR" ] || [ -z "$(ls -A "$STATE_DIR" 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠${NC} Žádné backupy nalezeny"
        echo ""
        echo "Spusť první backup:"
        echo "  bash ~/.wikisys-local/scripts/borg-runner.sh test-backup"
        return
    fi

    for state_file in "$STATE_DIR"/*.state; do
        [ -f "$state_file" ] && show_backup_status "$state_file"
    done

    echo "───────────────────────────────────────────────────────────────────────────────"
    echo ""

    # Statistiky
    local total=$(ls -1 "$STATE_DIR"/*.state 2>/dev/null | wc -l)
    local success=$(grep -l '"status": "success"' "$STATE_DIR"/*.state 2>/dev/null | wc -l)
    local failed=$(grep -l '"status": "failed"' "$STATE_DIR"/*.state 2>/dev/null | wc -l)

    echo -e "${CYAN}Statistiky:${NC}"
    echo "  Celkem backupů: $total"
    echo "  Úspěšné: $success"
    echo "  Selhané: $failed"

    if [ "$failed" -gt 0 ]; then
        echo ""
        echo -e "${RED}⚠️  VAROVÁNÍ: $failed backup(ů) selhalo!${NC}"
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════════"
}

# Detailní informace o backupu
show_backup_detail() {
    local backup_name="$1"
    local state_file="$STATE_DIR/${backup_name}.state"

    if [ ! -f "$state_file" ]; then
        echo -e "${RED}✗${NC} Backup nenalezen: $backup_name"
        return 1
    fi

    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "                         Detaily Backupu: $backup_name"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo ""

    # Parsování a zobrazení
    while IFS= read -r line; do
        if [[ "$line" =~ \"([^\"]+)\":\ *\"?([^\",:}]+)\"? ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"

            case "$key" in
                "status")
                    local badge=$(get_status_badge "$value" 0)
                    echo -e "${CYAN}Status:${NC}        $badge ($value)"
                    ;;
                "timestamp")
                    echo -e "${CYAN}Timestamp:${NC}     $(timestamp_to_date "$value") ($value)"
                    ;;
                "duration")
                    echo -e "${CYAN}Trvání:${NC}        $(seconds_to_human "$value")"
                    ;;
                "archive_name"|"hostname"|"size"|"backup_name"|"date")
                    echo -e "${CYAN}${key^}:${NC} $(printf '%-12s' '') $value"
                    ;;
            esac
        fi
    done < "$state_file"

    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════════"
}

# Zobrazit poslední log
show_last_log() {
    local lines="${1:-50}"

    if [ ! -f "$LOG_DIR/borg-runner.log" ]; then
        echo -e "${YELLOW}⚠${NC} Log soubor nenalezen: $LOG_DIR/borg-runner.log"
        return
    fi

    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "                         Poslední Log (${lines} řádků)"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo ""

    tail -n "$lines" "$LOG_DIR/borg-runner.log" | while IFS= read -r line; do
        if [[ "$line" =~ ERROR ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ "$line" =~ WARNING ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ "$line" =~ SUCCESS ]]; then
            echo -e "${GREEN}$line${NC}"
        else
            echo "$line"
        fi
    done

    echo ""
}

# JSON export
export_json() {
    echo "{"
    echo '  "hostname": "'$(hostname)'",'
    echo '  "timestamp": '$(date +%s)','
    echo '  "date": "'$(date +'%Y-%m-%d %H:%M:%S')'",'
    echo '  "backups": ['

    local first=true
    for state_file in "$STATE_DIR"/*.state; do
        if [ -f "$state_file" ]; then
            [ "$first" = false ] && echo ","
            cat "$state_file" | sed 's/^/    /'
            first=false
        fi
    done

    echo ""
    echo '  ]'
    echo "}"
}

# Nápověda
show_help() {
    cat << EOF
WikiSys Borg Backup Status Monitor
═══════════════════════════════════════════════════════

POUŽITÍ:
  $0 [command] [options]

PŘÍKAZY:

  status, overview (default)
    Zobraz přehled všech backupů

  detail <backup-name>
    Detailní informace o konkrétním backupu

  log [lines]
    Zobraz poslední řádky z logu (default: 50)

  json
    Export statusu jako JSON

  help
    Zobraz tuto nápovědu

PŘÍKLADY:

  # Přehled všech backupů
  $0

  # Detaily konkrétního backupu
  $0 detail wikisys-data

  # Poslední 100 řádků logu
  $0 log 100

  # JSON export
  $0 json

═══════════════════════════════════════════════════════
Verze: 1.0 | Autor: Claude (WikiSys)
EOF
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    case "${1:-status}" in
        status|overview)
            show_overview
            ;;
        detail)
            if [ $# -lt 2 ]; then
                echo -e "${RED}✗${NC} Chybí název backupu"
                echo "Použití: $0 detail <backup-name>"
                exit 1
            fi
            show_backup_detail "$2"
            ;;
        log)
            show_last_log "${2:-50}"
            ;;
        json)
            export_json
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}✗${NC} Neznámý příkaz: $1"
            echo "Použij: $0 help"
            exit 1
            ;;
    esac
}

main "$@"
