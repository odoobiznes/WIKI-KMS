# KMS - Testing Guide (Testovací Postupy)

**Datum:** 30.12.2025
**Účel:** Kompletní test suite pro ověření funkčnosti KMS systému

---

## 🎯 Přehled Testů

Tento dokument obsahuje všechny testy pro ověření že KMS funguje správně.

**Test Coverage:**
1. Backend API (Unit + Integration)
2. Frontend UI (Manual + Automated)
3. Services (Systemd)
4. Database (PostgreSQL)
5. Tools Integration
6. End-to-End (E2E)

---

## TEST SUITE #1: Backend API [Automatizované]

### Quick Test Script

```bash
#!/bin/bash
# /opt/kms-tools/bin/test-api.sh

echo "======================================"
echo "   KMS API Test Suite"
echo "======================================"
echo ""

BASE_URL="http://localhost:8000"
PASS=0
FAIL=0

# Helper function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"

    echo -n "Testing $name... "

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "${BASE_URL}${endpoint}")
    fi

    status=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    if [ "$status" -eq "$expected_status" ]; then
        echo "✓ PASS (HTTP $status)"
        ((PASS++))
    else
        echo "✗ FAIL (expected $expected_status, got $status)"
        echo "   Response: $body"
        ((FAIL++))
    fi
}

# Root Endpoints
echo "=== Root Endpoints ==="
test_endpoint "Root" "GET" "/"
test_endpoint "API Info" "GET" "/api"
echo ""

# System Endpoints
echo "=== System Endpoints ==="
test_endpoint "Health Check" "GET" "/api/system/health"
test_endpoint "Stats" "GET" "/api/system/stats"
test_endpoint "Changelog" "GET" "/api/system/changelog"
test_endpoint "Sync Status" "GET" "/api/system/sync-status"
echo ""

# Categories
echo "=== Categories ==="
test_endpoint "List Categories" "GET" "/api/categories"
test_endpoint "Get Category 1" "GET" "/api/categories/1"
test_endpoint "Create Category" "POST" "/api/categories" \
    '{"slug":"test-cat","name":"Test Category","type":"system"}' 201
echo ""

# Objects
echo "=== Objects ==="
test_endpoint "List Objects" "GET" "/api/objects"
test_endpoint "Get Object 1" "GET" "/api/objects/1"
echo ""

# Documents
echo "=== Documents ==="
test_endpoint "List Documents" "GET" "/api/documents"
echo ""

# Search
echo "=== Search ==="
test_endpoint "Search All" "GET" "/api/search?q=test"
test_endpoint "Search Objects" "GET" "/api/search/objects?q=test"
echo ""

# Tools
echo "=== Tools ==="
test_endpoint "Tools Status" "GET" "/api/tools/status"
test_endpoint "Terminal Open" "POST" "/api/tools/terminal/open" \
    '{"object_id":1}'
test_endpoint "Files Open" "POST" "/api/tools/files/open" \
    '{"object_id":1}'
test_endpoint "VSCode Open" "POST" "/api/tools/vscode/open" \
    '{"object_id":1}'
test_endpoint "Claude Models" "GET" "/api/tools/claude/models"
echo ""

# Summary
echo "======================================"
echo "   Test Summary"
echo "======================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
```

**Spusť test:**

```bash
chmod +x /opt/kms-tools/bin/test-api.sh
/opt/kms-tools/bin/test-api.sh
```

**Očekávaný Output:**

```
======================================
   KMS API Test Suite
======================================

=== Root Endpoints ===
Testing Root... ✓ PASS (HTTP 200)
Testing API Info... ✓ PASS (HTTP 200)

=== System Endpoints ===
Testing Health Check... ✓ PASS (HTTP 200)
Testing Stats... ✓ PASS (HTTP 200)
Testing Changelog... ✓ PASS (HTTP 200)
Testing Sync Status... ✓ PASS (HTTP 200)

=== Categories ===
Testing List Categories... ✓ PASS (HTTP 200)
Testing Get Category 1... ✓ PASS (HTTP 200)
Testing Create Category... ✓ PASS (HTTP 201)

=== Objects ===
Testing List Objects... ✓ PASS (HTTP 200)
Testing Get Object 1... ✓ PASS (HTTP 200)

=== Documents ===
Testing List Documents... ✓ PASS (HTTP 200)

=== Search ===
Testing Search All... ✓ PASS (HTTP 200)
Testing Search Objects... ✓ PASS (HTTP 200)

=== Tools ===
Testing Tools Status... ✓ PASS (HTTP 200)
Testing Terminal Open... ✓ PASS (HTTP 200)
Testing Files Open... ✓ PASS (HTTP 200)
Testing VSCode Open... ✓ PASS (HTTP 200)
Testing Claude Models... ✓ PASS (HTTP 200)

======================================
   Test Summary
======================================
Passed: 18
Failed: 0

✓ All tests passed!
```

---

## TEST SUITE #2: Frontend UI [Manuální]

### Pre-flight Checklist

```bash
# 1. Otevři browser
firefox https://kms.it-enterprise.solutions/

# 2. Otevři Developer Tools
# F12 nebo Right Click → Inspect

# 3. Připrav Console a Network tabs
```

### Test Case 1: Page Load

**Kroky:**
1. Načti stránku (F5)
2. Sleduj Network tab

**Expected:**
- ✅ Status 200 OK pro všechny resources
- ✅ /api/categories vrací data
- ✅ /api/system/stats vrací data
- ✅ Console bez errors
- ✅ Sidebar zobrazí kategorie do 2 sekund

**Actual:**
- [ ] Pass / [ ] Fail

**Poznámky:**
```
_________________________________
```

---

### Test Case 2: Sidebar Navigation

**Kroky:**
1. Klikni na kategorii v sidebaru
2. Sleduj co se stane

**Expected:**
- ✅ Kategorie se označí jako aktivní
- ✅ Main content area zobrazí objekty této kategorie
- ✅ URL se změní (např. `#category/odoo`)
- ✅ Console log: "Category selected: odoo"

**Actual:**
- [ ] Pass / [ ] Fail

**Poznámky:**
```
_________________________________
```

---

### Test Case 3: Object Detail

**Kroky:**
1. Klikni na kategorii
2. Klikni na objekt v seznamu

**Expected:**
- ✅ Detail objektu se zobrazí
- ✅ Vidíš název, popis, metadata
- ✅ Tlačítka nástrojů (Terminal, Files, VS Code)
- ✅ URL změna

**Actual:**
- [ ] Pass / [ ] Fail

---

### Test Case 4: Tools Integration

**Kroky:**
1. Otevři detail objektu
2. Klikni "Open Terminal"

**Expected:**
- ✅ API call POST /api/tools/terminal/open
- ✅ Response 200 OK s URL
- ✅ Nové okno/tab s terminálem se otevře
- ✅ Terminal běží v projektu

**Actual:**
- [ ] Pass / [ ] Fail

**Opakuj pro:**
- [ ] Open Files
- [ ] Open VS Code
- [ ] Open Claude AI

---

### Test Case 5: Error Handling

**Kroky:**
1. Vypni API: `sudo systemctl stop kms-api.service`
2. Refresh stránku

**Expected:**
- ✅ Error toast: "Failed to load categories"
- ✅ Console error je loggnutý
- ✅ UI nezpadne (graceful degradation)
- ✅ Retry button (pokud implementováno)

**Actual:**
- [ ] Pass / [ ] Fail

**Cleanup:**
```bash
sudo systemctl start kms-api.service
```

---

### Test Case 6: Responsive Design

**Kroky:**
1. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Zkus různé rozlišení:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected:**
- ✅ Sidebar se skryje/zobrazí podle šířky
- ✅ Tlačítka jsou klikatelná
- ✅ Text je čitelný
- ✅ Žádný horizontal scroll

**Actual:**
- [ ] Pass / [ ] Fail

---

## TEST SUITE #3: Services [Automatizované]

```bash
#!/bin/bash
# /opt/kms-tools/bin/test-services.sh

echo "=== Services Test Suite ==="
echo ""

SERVICES=(
    "kms-api:8000"
    "kms-sync-daemon:"
    "kms-tools-ttyd:7681"
    "kms-tools-filebrowser:8082"
    "kms-tools-code-server:8443"
)

PASS=0
FAIL=0

for svc_port in "${SERVICES[@]}"; do
    IFS=':' read -r svc port <<< "$svc_port"

    echo -n "Testing ${svc}... "

    # Check systemd status
    if ! systemctl is-active --quiet ${svc}.service; then
        echo "✗ FAIL (service not running)"
        ((FAIL++))
        continue
    fi

    # Check port if specified
    if [ -n "$port" ]; then
        if nc -z localhost $port 2>/dev/null; then
            echo "✓ PASS (running, port $port open)"
            ((PASS++))
        else
            echo "✗ FAIL (running but port $port not open)"
            ((FAIL++))
        fi
    else
        echo "✓ PASS (running)"
        ((PASS++))
    fi
done

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / Failed: $FAIL"

[ $FAIL -eq 0 ] && exit 0 || exit 1
```

**Spusť:**

```bash
chmod +x /opt/kms-tools/bin/test-services.sh
/opt/kms-tools/bin/test-services.sh
```

**Expected Output:**

```
=== Services Test Suite ===

Testing kms-api... ✓ PASS (running, port 8000 open)
Testing kms-sync-daemon... ✓ PASS (running)
Testing kms-tools-ttyd... ✓ PASS (running, port 7681 open)
Testing kms-tools-filebrowser... ✓ PASS (running, port 8082 open)
Testing kms-tools-code-server... ✓ PASS (running, port 8443 open)

=== Summary ===
Passed: 5 / Failed: 0
```

---

## TEST SUITE #4: Database [SQL Testy]

```bash
#!/bin/bash
# Test PostgreSQL databáze

echo "=== Database Test Suite ==="
echo ""

sudo -u postgres psql -d kms_db << 'EOF'
-- Test 1: Tabulky existují
\echo '=== Test 1: Tables Exist ==='
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Test 2: Počty záznamů
\echo ''
\echo '=== Test 2: Record Counts ==='
SELECT 'categories' as table, COUNT(*) as count FROM categories
UNION ALL
SELECT 'objects' as table, COUNT(*) as count FROM objects
UNION ALL
SELECT 'documents' as table, COUNT(*) as count FROM documents
UNION ALL
SELECT 'change_log' as table, COUNT(*) as count FROM change_log
UNION ALL
SELECT 'sync_status' as table, COUNT(*) as count FROM sync_status;

-- Test 3: Foreign Keys
\echo ''
\echo '=== Test 3: Data Integrity ==='
SELECT
    COUNT(*) as orphaned_objects
FROM objects o
LEFT JOIN categories c ON o.category_id = c.id
WHERE c.id IS NULL;

-- Test 4: Poslední aktivita
\echo ''
\echo '=== Test 4: Recent Activity ==='
SELECT
    'categories' as table,
    MAX(updated_at) as last_update
FROM categories
UNION ALL
SELECT
    'objects' as table,
    MAX(updated_at) as last_update
FROM objects;

-- Test 5: View funguje
\echo ''
\echo '=== Test 5: Views ==='
SELECT COUNT(*) as objects_in_view FROM v_objects_full;

\echo ''
\echo '✓ Database tests complete'
EOF
```

**Expected Output:**

```
=== Database Test Suite ===

=== Test 1: Tables Exist ===
 schemaname |  tablename
------------+-------------
 public     | categories
 public     | change_log
 public     | documents
 public     | objects
 public     | subcategories
 public     | sync_status
(6 rows)

=== Test 2: Record Counts ===
    table     | count
--------------+-------
 categories   |    14
 objects      |     5
 documents    |    20
 change_log   |   100
 sync_status  |    25
(5 rows)

=== Test 3: Data Integrity ===
 orphaned_objects
------------------
                0
(1 row)

=== Test 4: Recent Activity ===
   table    |        last_update
------------+----------------------------
 categories | 2025-12-30 01:00:00.123456
 objects    | 2025-12-30 01:30:00.654321
(2 rows)

=== Test 5: Views ===
 objects_in_view
-----------------
               5
(1 row)

✓ Database tests complete
```

---

## TEST SUITE #5: Tools Integration [E2E]

### Manual E2E Test

**Test 1: Web Terminal**

```bash
# 1. V browseru klikni "Open Terminal" na nějaký objekt
# 2. Mělo by se otevřít nové okno: https://kms.it-enterprise.solutions/tools/terminal/

# 3. V terminálu zkus:
pwd
# Expected: /opt/... (project path)

ls -la
# Expected: Soubory projektu

whoami
# Expected: devops

# ✓ PASS pokud vidíš shell prompt a můžeš psát příkazy
```

**Test 2: File Browser**

```bash
# 1. Klikni "Open Files"
# 2. Mělo by se otevřít: https://kms.it-enterprise.solutions/tools/files/

# 3. Zkontroluj:
# - Vidíš seznam souborů projektu
# - Můžeš kliknout na soubor → Preview
# - Můžeš upload nový soubor (tlačítko Upload)
# - Můžeš create složku (tlačítko New)

# ✓ PASS pokud můžeš browsovat a uploadovat
```

**Test 3: VS Code**

```bash
# 1. Klikni "Open VS Code"
# 2. Mělo by se otevřít: https://kms.it-enterprise.solutions/tools/vscode/

# 3. Zkontroluj:
# - Vidíš VS Code UI
# - Explorer sidebar ukazuje project files
# - Můžeš otevřít soubor → Editovat
# - Můžeš create nový soubor
# - Můžeš use terminal v VS Code (Ctrl+`)

# ✓ PASS pokud VS Code funguje normálně
```

**Test 4: Claude AI**

```bash
# 1. Klikni "Chat with Claude"
# 2. Napiš test otázku: "What files are in this project?"

# 3. Zkontroluj:
# - API call POST /api/tools/claude/chat
# - Response 200 OK
# - Claude response se zobrazí
# - Má context o projektu (zmiňuje skutečné soubory)

# ✓ PASS pokud Claude odpoví relevantně
```

---

## TEST SUITE #6: Performance [Load Test]

### Simple Load Test

```bash
#!/bin/bash
# /opt/kms-tools/bin/test-load.sh

echo "=== Load Test ==="
echo "Sending 100 requests to /api/system/health"
echo ""

START=$(date +%s)

for i in {1..100}; do
    echo -n "."
    curl -s http://localhost:8000/api/system/health > /dev/null
done

END=$(date +%s)
DURATION=$((END - START))

echo ""
echo ""
echo "Completed 100 requests in ${DURATION}s"
echo "Average: $((100 / DURATION)) req/s"
echo ""

# Test response time
echo "=== Response Time Test ==="
TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/api/categories)
echo "Categories endpoint: ${TIME}s"
```

**Expected:**
```
=== Load Test ===
Sending 100 requests to /api/system/health

....................................................................................................

Completed 100 requests in 5s
Average: 20 req/s

=== Response Time Test ===
Categories endpoint: 0.045s
```

---

## REGRESSION TEST CHECKLIST

Po každé změně projdi tento checklist:

### Backend Changes
- [ ] `test-api.sh` prošel
- [ ] Logy bez errors: `sudo journalctl -u kms-api.service -n 50`
- [ ] Swagger UI funguje: http://localhost:8000/api/docs

### Frontend Changes
- [ ] Console bez JavaScript errors (F12)
- [ ] Network tab všechny 200 OK
- [ ] UI elementy se zobrazují správně
- [ ] Responsive design funguje

### Database Changes
- [ ] Database test suite prošla
- [ ] Migrations aplikovány (pokud existují)
- [ ] Foreign keys integrity OK

### Configuration Changes
- [ ] Services restart OK
- [ ] Health check passes
- [ ] Nginx config valid: `sudo nginx -t`

---

## AUTOMATED TESTING (Future)

### Python Unit Tests (TODO)

```python
# /opt/kms-tools/tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "KMS API" in response.json()["name"]

def test_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_categories_list():
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# ... více testů
```

**Spusť:**
```bash
cd /opt/kms-tools
pytest tests/
```

### Frontend E2E Tests (TODO)

```javascript
// /opt/kms-tools/tests/e2e/test-ui.spec.js
// Playwright nebo Cypress

describe('KMS Frontend', () => {
    it('loads homepage', async () => {
        await page.goto('https://kms.it-enterprise.solutions/');
        await expect(page).toHaveTitle(/KMS/);
    });

    it('displays categories', async () => {
        const categories = await page.locator('.category-item');
        await expect(categories).toHaveCount.greaterThan(0);
    });

    it('opens terminal tool', async () => {
        await page.click('.btn-terminal');
        // ...
    });
});
```

---

## 📊 Test Coverage Goals

| Komponenta | Současný Coverage | Target |
|------------|-------------------|--------|
| Backend API | Manual | 80% Unit Tests |
| Frontend | Manual | 60% E2E Tests |
| Database | SQL Scripts | Automated Integrity |
| Services | Systemd Check | Monitoring |
| E2E | Manual | Automated CI/CD |

---

## 🔍 Debugging Failed Tests

### Backend Test Failed

```bash
# 1. Zkontroluj API běží
curl http://localhost:8000/api/system/health

# 2. Koukni na logy
sudo journalctl -u kms-api.service -n 100

# 3. Test DB connection
sudo -u postgres psql -d kms_db -c "SELECT 1"

# 4. Debug konkrétní endpoint
curl -v http://localhost:8000/api/categories
```

### Frontend Test Failed

```bash
# 1. F12 → Console → Hledej errors
# 2. F12 → Network → Zkontroluj failed requests
# 3. Zkontroluj API response:
curl http://localhost:8000/api/categories | jq
# 4. Clear cache a refresh (Ctrl+Shift+R)
```

### Service Test Failed

```bash
# 1. Zkontroluj status
systemctl status kms-api.service

# 2. Pokud failed, restart
sudo systemctl restart kms-api.service

# 3. Sleduj start logs
sudo journalctl -u kms-api.service -f

# 4. Zkontroluj port
sudo ss -tlnp | grep 8000
```

---

**Poslední update:** 30.12.2025 02:25 CET
**Status:** Ready for testing!
