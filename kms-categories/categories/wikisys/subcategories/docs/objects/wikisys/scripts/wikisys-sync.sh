#!/bin/bash
# WikiSys Synchronizační Skript pro Multi-Claude Systém
# Verze: 1.0
# Datum: 2025-12-28

set -e  # Exit on error

# ============================================================================
# KONFIGURACE
# ============================================================================

WIKISYS_SSH="u458763-sub3@u458763.your-storagebox.de"
WIKISYS_PORT="23"
WIKISYS_KEY="$HOME/.ssh/id_ed25519"
LOCAL_CACHE="$HOME/.wikisys-local"
WIKISYS_PATH="wikisys"

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNKCE
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Funkce: Získat remote verzi
get_remote_version() {
    ssh -p "$WIKISYS_PORT" -i "$WIKISYS_KEY" "$WIKISYS_SSH" \
        "cat $WIKISYS_PATH/VERSION" 2>/dev/null || echo "0"
}

# Funkce: Získat lokální verzi
get_local_version() {
    cat "$LOCAL_CACHE/VERSION" 2>/dev/null || echo "0"
}

# Funkce: Převést timestamp na datum
timestamp_to_date() {
    date -d "@$1" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "neznámé"
}

# Funkce: Stáhnout soubor z WikiSys
download_file() {
    local remote_path="$1"
    local local_path="$2"

    mkdir -p "$(dirname "$local_path")"

    scp -P "$WIKISYS_PORT" -i "$WIKISYS_KEY" -q \
        "$WIKISYS_SSH:$remote_path" "$local_path" 2>/dev/null
}

# Funkce: Stáhnout celý adresář
download_directory() {
    local remote_path="$1"
    local local_path="$2"

    mkdir -p "$local_path"

    scp -P "$WIKISYS_PORT" -i "$WIKISYS_KEY" -q -r \
        "$WIKISYS_SSH:$remote_path" "$(dirname "$local_path")/" 2>/dev/null
}

# Funkce: Zobrazit poslední změny z CHANGELOG
show_recent_changes() {
    if [ -f "$LOCAL_CACHE/CHANGELOG.md" ]; then
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "📋 POSLEDNÍ ZMĚNY VE WIKISYS:"
        echo "═══════════════════════════════════════════════════════════"

        # Zobraz první 30 řádků CHANGELOG (po hlavičce)
        grep -A 30 "^## 20" "$LOCAL_CACHE/CHANGELOG.md" | head -35 || \
            head -30 "$LOCAL_CACHE/CHANGELOG.md"

        echo "═══════════════════════════════════════════════════════════"
        echo ""
    fi
}

# Funkce: Hlavní synchronizace
sync_wikisys() {
    local remote_ver
    local local_ver

    log_info "Kontrola WikiSys verze..."

    # Získat verze
    remote_ver=$(get_remote_version)
    local_ver=$(get_local_version)

    # Kontrola připojení
    if [ "$remote_ver" = "0" ]; then
        log_error "Nelze se připojit k WikiSys!"
        log_error "Zkontroluj SSH připojení: ssh -p $WIKISYS_PORT -i $WIKISYS_KEY $WIKISYS_SSH"
        return 1
    fi

    # Porovnat verze
    if [ "$remote_ver" -gt "$local_ver" ]; then
        # AKTUALIZACE DOSTUPNÁ
        echo ""
        log_warning "WikiSys aktualizace dostupná!"
        echo "  Lokální verze: $local_ver ($(timestamp_to_date "$local_ver"))"
        echo "  Remote verze:  $remote_ver ($(timestamp_to_date "$remote_ver"))"
        echo ""
        log_info "Stahuji aktualizace..."

        # Stáhnout VERSION
        download_file "$WIKISYS_PATH/VERSION" "$LOCAL_CACHE/VERSION"

        # Stáhnout CHANGELOG
        download_file "$WIKISYS_PATH/CHANGELOG.md" "$LOCAL_CACHE/CHANGELOG.md"

        # Stáhnout dokumentaci
        log_info "Stahuji docs..."
        download_directory "$WIKISYS_PATH/docs" "$LOCAL_CACHE/docs"

        # Stáhnout skripty
        log_info "Stahuji scripts..."
        mkdir -p "$LOCAL_CACHE/scripts"
        scp -P "$WIKISYS_PORT" -i "$WIKISYS_KEY" -q -r \
            "$WIKISYS_SSH:$WIKISYS_PATH/docs/common/scripts/*" \
            "$LOCAL_CACHE/scripts/" 2>/dev/null || true

        # Nastavit práva na skripty
        chmod +x "$LOCAL_CACHE/scripts/"*.sh 2>/dev/null || true

        log_success "Aktualizace dokončena!"

        # Zobrazit změny
        show_recent_changes

        log_success "WikiSys synchronizován na verzi: $remote_ver"

        return 0

    elif [ "$local_ver" -gt "$remote_ver" ]; then
        # LOKÁLNÍ VERZE NOVĚJŠÍ - KONFLIKT!
        echo ""
        log_error "VAROVÁNÍ: Lokální verze ($local_ver) je novější než WikiSys ($remote_ver)"
        log_warning "Možné příčiny:"
        echo "  1. Jiný Claude instance právě nahrává změny"
        echo "  2. Lokální cache je poškozený"
        echo "  3. WikiSys byl vrácen na starší verzi"
        echo ""
        log_warning "Doporučení: Počkej 1-2 minuty a zkus znovu"

        return 1

    else
        # SYNCHRONIZOVÁNO
        log_success "WikiSys je aktuální (verze: $local_ver - $(timestamp_to_date "$local_ver"))"

        # Zkontroluj, zda existuje lokální cache
        if [ ! -d "$LOCAL_CACHE/docs" ]; then
            log_warning "Lokální cache neexistuje, stahuji..."

            # Stáhnout vše
            download_file "$WIKISYS_PATH/VERSION" "$LOCAL_CACHE/VERSION"
            download_file "$WIKISYS_PATH/CHANGELOG.md" "$LOCAL_CACHE/CHANGELOG.md"
            download_directory "$WIKISYS_PATH/docs" "$LOCAL_CACHE/docs"

            log_success "Iniciální synchronizace dokončena"
        fi

        return 0
    fi
}

# Funkce: Zobrazit informace o WikiSys
show_info() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📚 WIKISYS INFORMACE"
    echo "═══════════════════════════════════════════════════════════"
    echo "Server:       $WIKISYS_SSH"
    echo "Port:         $WIKISYS_PORT"
    echo "Lokální:      $LOCAL_CACHE"
    echo ""

    if [ -f "$LOCAL_CACHE/VERSION" ]; then
        local ver=$(cat "$LOCAL_CACHE/VERSION")
        echo "Verze:        $ver ($(timestamp_to_date "$ver"))"
    else
        echo "Verze:        Není synchronizováno"
    fi

    echo "═══════════════════════════════════════════════════════════"
    echo ""
}

# Funkce: Vynucená synchronizace (smazat lokální cache)
force_sync() {
    log_warning "Vynucená synchronizace - mažu lokální cache..."
    rm -rf "$LOCAL_CACHE"
    sync_wikisys
}

# ============================================================================
# HLAVNÍ PROGRAM
# ============================================================================

main() {
    case "${1:-sync}" in
        sync)
            sync_wikisys
            ;;
        info)
            show_info
            ;;
        force)
            force_sync
            ;;
        changelog)
            if [ -f "$LOCAL_CACHE/CHANGELOG.md" ]; then
                cat "$LOCAL_CACHE/CHANGELOG.md"
            else
                log_error "CHANGELOG není dostupný. Spusť nejdřív: $0 sync"
            fi
            ;;
        help|--help|-h)
            echo "WikiSys Sync - Nástroj pro synchronizaci Multi-Claude systému"
            echo ""
            echo "Použití: $0 [command]"
            echo ""
            echo "Příkazy:"
            echo "  sync      Synchronizovat s WikiSys (výchozí)"
            echo "  info      Zobrazit informace o WikiSys"
            echo "  force     Vynucená synchronizace (smaže lokální cache)"
            echo "  changelog Zobrazit celý CHANGELOG"
            echo "  help      Zobrazit tuto nápovědu"
            echo ""
            ;;
        *)
            log_error "Neznámý příkaz: $1"
            echo "Použij: $0 help"
            exit 1
            ;;
    esac
}

# Spustit
main "$@"
