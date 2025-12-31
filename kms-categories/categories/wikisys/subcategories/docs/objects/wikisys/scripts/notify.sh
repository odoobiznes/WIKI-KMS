#!/bin/bash
# WikiSys Notification Script
# Verze: 1.0
# Autor: Claude (WikiSys Onboarding)

set -e

# Konfigurace
SECRETS_MANAGER="$HOME/.wikisys-local/scripts/secrets-manager.sh"
CONFIG_FILE="$HOME/.wikisys-local/docs/common/notification-config.yaml"

# Barvy
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Funkce: Telegram notifikace
send_telegram() {
    local message="$1"

    # Načti secrets (pokud existují)
    if ! BOT_TOKEN=$("$SECRETS_MANAGER" decrypt api-tokens/telegram-bot-token 2>/dev/null); then
        log_error "Telegram bot token není dostupný v secrets"
        return 1
    fi

    if ! CHAT_ID=$("$SECRETS_MANAGER" decrypt api-tokens/telegram-chat-id 2>/dev/null); then
        log_error "Telegram chat ID není dostupný v secrets"
        return 1
    fi

    # Pošli zprávu
    if curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${CHAT_ID}" \
        -d "text=${message}" \
        -d "parse_mode=HTML" > /dev/null 2>&1; then
        log_success "Telegram notifikace odeslána"
        return 0
    else
        log_error "Telegram notifikace selhala"
        return 1
    fi
}

# Funkce: Email notifikace
send_email() {
    local subject="$1"
    local body="$2"

    # Jednoduchá email notifikace pomocí mail příkazu
    if command -v mail &> /dev/null; then
        echo "$body" | mail -s "$subject" root 2>/dev/null || true
        log_success "Email notifikace odeslána"
    else
        log_error "mail příkaz není dostupný"
        return 1
    fi
}

# Funkce: Slack notifikace
send_slack() {
    local channel="$1"
    local message="$2"

    if ! WEBHOOK_URL=$("$SECRETS_MANAGER" decrypt api-tokens/slack-webhook 2>/dev/null); then
        log_error "Slack webhook není dostupný v secrets"
        return 1
    fi

    if curl -s -X POST "$WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"channel\": \"${channel}\", \"text\": \"${message}\"}" > /dev/null 2>&1; then
        log_success "Slack notifikace odeslána"
        return 0
    else
        log_error "Slack notifikace selhala"
        return 1
    fi
}

# Funkce: Test všech notifikačních kanálů
test_notifications() {
    local hostname=$(hostname)
    local date=$(date)

    echo "═══════════════════════════════════════"
    echo " Test Notifikací - $hostname"
    echo "═══════════════════════════════════════"
    echo ""

    log_info "Testuji Telegram..."
    if send_telegram "✅ Test notifikace z serveru $hostname ($date)"; then
        echo "  ✓ Telegram: OK"
    else
        echo "  ✗ Telegram: CHYBA"
    fi
    echo ""

    log_info "Testuji Email..."
    if send_email "WikiSys Test - $hostname" "Test email notifikace z $hostname ($date)"; then
        echo "  ✓ Email: OK"
    else
        echo "  ✗ Email: CHYBA (může být OK pokud mail není nakonfigurován)"
    fi
    echo ""

    echo "═══════════════════════════════════════"
}

# Hlavní funkce
main() {
    local command="${1:-help}"
    shift || true

    case "$command" in
        telegram)
            send_telegram "$@"
            ;;
        email)
            send_email "$@"
            ;;
        slack)
            send_slack "$@"
            ;;
        all)
            local message="$1"
            send_telegram "$message" || true
            send_email "WikiSys Alert - $(hostname)" "$message" || true
            ;;
        test)
            test_notifications
            ;;
        help|--help|-h)
            echo "WikiSys Notify - Systém notifikací"
            echo ""
            echo "POUŽITÍ:"
            echo "  $0 telegram <zpráva>"
            echo "  $0 email <subject> <body>"
            echo "  $0 slack <channel> <zpráva>"
            echo "  $0 all <zpráva>           # Všechny kanály"
            echo "  $0 test                   # Test všech kanálů"
            echo ""
            echo "PŘÍKLADY:"
            echo "  $0 telegram \"✅ Backup dokončen\""
            echo "  $0 email \"Backup Status\" \"Backup byl úspěšný\""
            echo "  $0 all \"🚨 KRITICKÁ CHYBA!\""
            echo "  $0 test"
            echo ""
            ;;
        *)
            log_error "Neznámý příkaz: $command"
            echo "Použij: $0 help"
            exit 1
            ;;
    esac
}

main "$@"
