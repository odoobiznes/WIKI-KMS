#!/bin/bash
# KMS Tools - Kompletní test všech nástrojů
# Debug script pro testování všech integrací

set -e

echo "================================================================================"
echo "KMS TOOLS - KOMPLETNÍ TEST"
echo "================================================================================"
echo ""

# Barvy pro output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Testovací object_id
TEST_OBJECT_ID=1

# Log file
LOG_FILE="/tmp/kms-tools-test-$(date +%Y%m%d-%H%M%S).log"
echo "Logy budou uloženy do: $LOG_FILE"
echo ""

# Funkce pro test
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="${4:-}"

    echo "[$name]"
    echo "  Endpoint: $endpoint"
    echo "  Metoda: $method"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "http://127.0.0.1:8000$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "http://127.0.0.1:8000$endpoint")
    fi

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    # Uložit do logu
    echo "=== $name ===" >> "$LOG_FILE"
    echo "Endpoint: $endpoint" >> "$LOG_FILE"
    echo "HTTP Code: $http_code" >> "$LOG_FILE"
    echo "Response: $body" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    if [ "$http_code" = "200" ]; then
        echo -e "  Status: ${GREEN}✓ OK (HTTP $http_code)${NC}"
        echo "  Response:"
        echo "$body" | python3 -m json.tool 2>/dev/null | head -10 || echo "$body" | head -10
    else
        echo -e "  Status: ${RED}✗ CHYBA (HTTP $http_code)${NC}"
        echo "  Response:"
        echo "$body"
    fi
    echo ""
}

# Test služeb systemd
echo "================================================================================"
echo "1. SYSTEMD SLUŽBY"
echo "================================================================================"
echo ""

services=("kms-api" "kms-tools-ttyd" "kms-tools-filebrowser" "kms-tools-code-server")

for service in "${services[@]}"; do
    echo "[$service]"
    if systemctl is-active --quiet "$service"; then
        echo -e "  Status: ${GREEN}✓ RUNNING${NC}"
    else
        echo -e "  Status: ${RED}✗ STOPPED${NC}"
        echo "  Pokus o start..."
        sudo systemctl start "$service" 2>&1
    fi
    echo ""
done

# Test API endpointů
echo "================================================================================"
echo "2. API ENDPOINTS"
echo "================================================================================"
echo ""

# Root endpoint
test_endpoint "API Root" "/" "GET"

# Status endpoint
test_endpoint "Tools Status" "/api/tools/status" "GET"

# Terminal
test_endpoint "Terminal Open" "/api/tools/terminal/open" "POST" "{\"object_id\": $TEST_OBJECT_ID}"

# File Browser
test_endpoint "File Browser Open" "/api/tools/files/open" "POST" "{\"object_id\": $TEST_OBJECT_ID}"

# VS Code
test_endpoint "VS Code Open" "/api/tools/vscode/open" "POST" "{\"object_id\": $TEST_OBJECT_ID}"

# Claude Models
test_endpoint "Claude Models" "/api/tools/claude/models" "GET"

# System health
test_endpoint "System Health" "/api/system/health" "GET"

# Installed editors
echo "================================================================================"
echo "3. NAINSTALOVANÉ EDITORY"
echo "================================================================================"
echo ""

check_editor() {
    local name="$1"
    local cmd="$2"

    echo "[$name]"
    if command -v "$cmd" &> /dev/null; then
        version=$("$cmd" --version 2>&1 | head -1)
        echo -e "  Status: ${GREEN}✓ NAINSTALOVÁN${NC}"
        echo "  Verze: $version"
        echo "  Cesta: $(which "$cmd")"
    else
        echo -e "  Status: ${RED}✗ NENALEZEN${NC}"
    fi
    echo ""
}

check_editor "Windsurf" "windsurf"
check_editor "Cursor" "cursor"
check_editor "VS Code" "code"
check_editor "Zed" "zed"

# Network connectivity
echo "================================================================================"
echo "4. SÍŤOVÉ PŘIPOJENÍ"
echo "================================================================================"
echo ""

echo "[Localhost API]"
if curl -s -f http://127.0.0.1:8000/ > /dev/null; then
    echo -e "  Status: ${GREEN}✓ DOSTUPNÉ${NC}"
else
    echo -e "  Status: ${RED}✗ NEDOSTUPNÉ${NC}"
fi
echo ""

echo "[Reverse proxy]"
if curl -s -f -k https://kms.it-enterprise.solutions/ > /dev/null; then
    echo -e "  Status: ${GREEN}✓ DOSTUPNÉ${NC}"
else
    echo -e "  Status: ${YELLOW}⚠ NEDOSTUPNÉ (může být normální pokud nejsi na správné síti)${NC}"
fi
echo ""

# Database
echo "================================================================================"
echo "5. DATABÁZE"
echo "================================================================================"
echo ""

echo "[PostgreSQL]"
if systemctl is-active --quiet postgresql; then
    echo -e "  Status: ${GREEN}✓ RUNNING${NC}"

    # Test DB connection
    if sudo -u postgres psql -c '\l' > /dev/null 2>&1; then
        echo -e "  Connection: ${GREEN}✓ OK${NC}"
    else
        echo -e "  Connection: ${RED}✗ CHYBA${NC}"
    fi
else
    echo -e "  Status: ${RED}✗ STOPPED${NC}"
fi
echo ""

# Live log monitoring
echo "================================================================================"
echo "6. LIVE LOG MONITORING"
echo "================================================================================"
echo ""
echo "Pro sledování live logů spusť:"
echo ""
echo -e "  ${YELLOW}/opt/kms-tools/bin/view-logs.sh${NC}"
echo ""
echo "nebo manuálně:"
echo ""
echo "  sudo journalctl -u kms-api.service -f"
echo ""

# Summary
echo "================================================================================"
echo "SHRNUTÍ"
echo "================================================================================"
echo ""
echo "Detailní logy uloženy v: $LOG_FILE"
echo ""
echo "Pokud něco nefunguje:"
echo "  1. Zkontroluj logy: sudo journalctl -u kms-api.service -f"
echo "  2. Restart služby: sudo systemctl restart kms-api.service"
echo "  3. Přečti DEBUG-GUIDE.md v /opt/kms-tools/"
echo ""
echo "================================================================================"
