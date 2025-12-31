#!/bin/bash
# KMS Health Check Script
# Returns: 0 = OK, 1 = ERROR
# Created: 2025-12-30

set -e

echo "=== KMS Health Check ==="
echo ""

ERRORS=0

# 1. Check API
echo -n "API Health... "
if curl -sf http://localhost:8000/api/system/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    ((ERRORS++))
fi

# 2. Check Database
echo -n "Database... "
if curl -sf http://localhost:8000/api/system/health | grep -q "connected"; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    ((ERRORS++))
fi

# 3. Check Services
echo ""
echo "Services:"

for service in kms-api kms-sync-daemon kms-tools-ttyd kms-tools-filebrowser kms-tools-code-server; do
    echo -n "  $service... "
    if systemctl is-active --quiet $service.service 2>/dev/null; then
        echo "✅ Running"
    else
        echo "❌ Not running"
        ((ERRORS++))
    fi
done

# 4. Check Ports
echo ""
echo "Ports:"

declare -A PORTS=(
    [8000]="API"
    [7681]="Terminal"
    [8082]="FileBrowser"
    [8443]="VS Code"
)

for port in "${!PORTS[@]}"; do
    echo -n "  ${PORTS[$port]} ($port)... "
    if ss -tlnp | grep -q ":$port "; then
        echo "✅ Open"
    else
        echo "❌ Closed"
        ((ERRORS++))
    fi
done

# 5. Check Disk Space
echo ""
echo -n "Disk Space /opt... "
DISK_USAGE=$(df /opt --output=pcent | tail -1 | tr -d ' %')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✅ OK (${DISK_USAGE}% used)"
else
    echo "⚠️ Warning (${DISK_USAGE}% used)"
fi

# 6. Check Categories/Objects
echo ""
echo "Data:"
echo -n "  Categories... "
CATEGORIES=$(curl -sf http://localhost:8000/api/categories/ | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "$CATEGORIES items"

echo -n "  Objects... "
OBJECTS=$(curl -sf http://localhost:8000/api/objects/ | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "$OBJECTS items"

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    exit 0
else
    echo "❌ $ERRORS check(s) failed!"
    exit 1
fi
