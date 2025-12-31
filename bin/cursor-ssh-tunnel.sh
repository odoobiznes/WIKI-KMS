#!/bin/bash
# Cursor SSH Tunnel Helper
# Umožňuje připojení k Cursor přes SSH Remote Development

set -e

SERVER="kms.it-enterprise.solutions"
USER="devops"
SSH_PORT=22
LOCAL_PORT=2222

echo "🔧 Cursor SSH Tunnel Setup"
echo "=========================="
echo ""
echo "Tento script vytvoří SSH tunnel pro připojení k Cursor přes Remote SSH."
echo ""

# Zkontroluj jestli je SSH klient nainstalován
if ! command -v ssh &> /dev/null; then
    echo "❌ SSH klient není nainstalován!"
    exit 1
fi

# Zkontroluj jestli je Cursor nainstalován lokálně
if ! command -v cursor &> /dev/null; then
    echo "⚠️  Cursor není nainstalován lokálně."
    echo "   Pro použití Remote SSH potřebuješ Cursor na svém počítači."
    echo "   Stáhni z: https://cursor.sh"
    echo ""
    read -p "Chceš pokračovat s nastavením SSH konfigurace? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vytvoř SSH config entry
SSH_CONFIG="$HOME/.ssh/config"
SSH_CONFIG_ENTRY="Host kms-cursor
    HostName $SERVER
    User $USER
    Port $SSH_PORT
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3"

echo "📝 Přidávám SSH konfiguraci..."
echo ""

# Zkontroluj jestli už entry existuje
if grep -q "Host kms-cursor" "$SSH_CONFIG" 2>/dev/null; then
    echo "⚠️  SSH konfigurace pro 'kms-cursor' již existuje."
    read -p "Chceš ji přepsat? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Odstraň starý entry
        sed -i '/^Host kms-cursor$/,/^$/d' "$SSH_CONFIG"
        echo "$SSH_CONFIG_ENTRY" >> "$SSH_CONFIG"
        echo "✅ SSH konfigurace aktualizována."
    else
        echo "ℹ️  Použijeme existující konfiguraci."
    fi
else
    # Přidej nový entry
    echo "" >> "$SSH_CONFIG"
    echo "# KMS Cursor Remote SSH" >> "$SSH_CONFIG"
    echo "$SSH_CONFIG_ENTRY" >> "$SSH_CONFIG"
    echo "✅ SSH konfigurace přidána."
fi

echo ""
echo "📋 Návod pro použití:"
echo "===================="
echo ""
echo "1. V lokálním Cursor editoru:"
echo "   - Otevři Command Palette (Ctrl+Shift+P / Cmd+Shift+P)"
echo "   - Zadej: 'Remote-SSH: Connect to Host'"
echo "   - Vyber: 'kms-cursor'"
echo ""
echo "2. Po připojení:"
echo "   - Otevři složku: /opt/kms/categories/..."
echo "   - Nebo použij File → Open Folder"
echo ""
echo "3. Pro test připojení:"
echo "   ssh kms-cursor"
echo ""
echo "✅ Hotovo! SSH tunnel je připraven."
echo ""
echo "💡 Tip: Pro automatické připojení použij SSH keys:"
echo "   ssh-copy-id $USER@$SERVER"
