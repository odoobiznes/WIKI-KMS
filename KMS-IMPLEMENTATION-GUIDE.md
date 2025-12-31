# KMS - Implementation Guide (Návod na Dokončení)

**Datum:** 30.12.2025
**Autor:** Claude AI + DevOps Team
**Status:** 🔧 Pracovní návod

---

## 🎯 Přehled

Tento dokument obsahuje **krok za krokem instrukce** pro dokončení implementace KMS projektu.

**Časový odhad:**
- Fáze 1 (Critical Bugfixes): 30 minut
- Fáze 2 (Frontend Polish): 1-2 hodiny
- Fáze 3 (Desktop Editors): 30 minut (volitelné)
- Fáze 4 (Production Ready): 1 hodina

**Celkem:** ~3 hodiny pro plně funkční systém

---

## FÁZE 1: Oprava Kritických Bugů ⚠️ [30 minut]

### Krok 1: Oprav Path Typo v tools.py

**Problém:** `/opt/DevOPS/Internal/Proects` neexistuje (typo)

**Řešení:**

```bash
# 1. Zjisti kde SKUTEČNĚ jsou projekty
find /opt -type d -name "odoo-integration-api" 2>/dev/null

# Možné lokace:
# - /opt/DevOPS/Internal/Projects/  (s 'j')
# - /opt/kms/categories/odoo/objects/
# - /home/devops/projects/

# 2. Pokud nic nenajdeš, vytvoř testovací strukturu
sudo mkdir -p /opt/DevOPS/Internal/Projects/test-project
sudo chown -R devops:devops /opt/DevOPS/Internal/

# 3. Edituj tools.py
vim /opt/kms-tools/api/routers/tools.py

# Najdi řádek 165 (nebo použij search)
# /base_path = Path

# Změň z:
base_path = Path("/opt/DevOPS/Internal/Proects")

# Na (vyber správnou variantu):
# VARIANTA A: Pokud jsou projekty v /opt/kms/
base_path = Path("/opt/kms")

# VARIANTA B: Pokud opravíš typo
base_path = Path("/opt/DevOPS/Internal/Projects")

# VARIANTA C: Pokud chceš flexible path z DB
# (advanced - upravíš i get_full_path funkci)

# 4. Ulož soubor (:wq v vim)

# 5. Restart API
sudo systemctl restart kms-api.service

# 6. Sleduj logy pro případné chyby
sudo journalctl -u kms-api.service -f -n 20

# CTRL+C pro zastavení sledování

# 7. Ověř že funguje
curl -X POST http://localhost:8000/api/tools/terminal/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}' | jq

# Očekávaný výstup:
# {
#   "url": "https://kms.it-enterprise.solutions/tools/terminal/",
#   "tool_name": "Web Terminal",
#   "project_name": "...",
#   "project_path": "/opt/..."
# }

# Pokud dostaneš 404:
# - Zkontroluj zda cesta skutečně existuje
# - Koukni do logů: sudo journalctl -u kms-api.service -n 50
```

**✅ Hotovo když:** API vrací 200 OK a `project_path` v response existuje

---

### Krok 2: Fix Prázdný Sidebar (Kategorie)

**Problém:** Sidebar je prázdný, kategorie se nenačítají

**Diagnóza:**

```bash
# 1. Zkontroluj API endpoint
curl http://localhost:8000/api/categories | jq

# Pokud vrátí [] (prázdný array):
# → Databáze je prázdná

# Pokud vrátí error nebo 500:
# → Backend problém (koukni na logy)

# Pokud vrátí data:
# → Frontend problém (koukni v browseru F12)
```

**Řešení A: Databáze je Prázdná**

```bash
# 1. Zkontroluj databázi
sudo -u postgres psql -d kms_db << 'EOF'
SELECT COUNT(*) as count FROM categories;
SELECT COUNT(*) as count FROM objects;
\q
EOF

# Pokud jsou obě tabulky prázdné:

# 2. Spusť import z filesystemu
/opt/kms-tools/bin/kms-import.py --help

# Pokud script existuje a funguje:
/opt/kms-tools/bin/kms-import.py --source /opt/kms --verbose

# NEBO manuálně vlož test data:

sudo -u postgres psql -d kms_db << 'EOF'
-- Vložení kategorií
INSERT INTO categories (slug, name, type, description, is_active, sort_order)
VALUES
  ('odoo', 'Odoo', 'product', 'Odoo ERP projekty', true, 1),
  ('pohoda', 'Pohoda', 'product', 'Pohoda projekty', true, 2),
  ('sysadmin', 'System Administration', 'system', 'Sysadmin dokumentace', true, 3),
  ('devops', 'DevOps', 'system', 'DevOps automation', true, 4),
  ('plany', 'Plány', 'template', 'Plánování', true, 10),
  ('task', 'Tasks', 'template', 'Úkoly', true, 11)
ON CONFLICT (slug) DO NOTHING;

-- Vložení test objektu
INSERT INTO objects (category_id, slug, name, description, status, file_path)
SELECT
  c.id,
  'test-project',
  'Test Project',
  'Test projektový objekt',
  'active',
  'categories/odoo/objects/test-project'
FROM categories c
WHERE c.slug = 'odoo'
ON CONFLICT DO NOTHING;

-- Ověř
SELECT c.name, COUNT(o.id) as objects_count
FROM categories c
LEFT JOIN objects o ON o.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.sort_order;
EOF

# 3. Test API znovu
curl http://localhost:8000/api/categories | jq

# Měl bys vidět kategorie!
```

**Řešení B: Frontend Problém**

```bash
# 1. Otevři browser
firefox https://kms.it-enterprise.solutions/ &

# 2. Otevři Developer Tools (F12)

# 3. V Console zkontroluj:
# - JavaScript errors?
# - API call failures?

# 4. V Network tab:
# - Najdi request na /api/categories
# - Status code? (200, 404, 500?)
# - Response data? (prázdný array nebo error?)

# 5. Podle výsledků:

# POKUD 404:
# → API endpoint není správně routován
# Zkontroluj /opt/kms-tools/api/main.py:
vim /opt/kms-tools/api/main.py
# Hledej: app.include_router(categories.router, prefix="/api")

# POKUD CORS ERROR:
# → Zkontroluj CORS middleware v main.py
# Mělo by být: allow_origins=["*"] nebo ["https://kms.it-enterprise.solutions"]

# POKUD Frontend nezobrazuje i když API vrací data:
# → Problém v app.js
vim /opt/kms-tools/frontend/public/app.js
# Zkontroluj funkci loadCategories()
# Přidej console.log pro debug:
console.log('Categories loaded:', categories);
```

**✅ Hotovo když:** Sidebar zobrazuje seznam kategorií

---

### Krok 3: Vytvoř SQL Schéma Backup

**Problém:** `/opt/kms-tools/sql/` je prázdný, chybí verzované schéma

**Řešení:**

```bash
# 1. Exportuj současné databázové schéma
sudo -u postgres pg_dump -d kms_db --schema-only --no-owner --no-privileges > /tmp/kms-schema.sql

# 2. Přesuň do projektu
sudo cp /tmp/kms-schema.sql /opt/kms-tools/sql/schema.sql
sudo chown devops:devops /opt/kms-tools/sql/schema.sql

# 3. Zkontroluj obsah
head -50 /opt/kms-tools/sql/schema.sql

# 4. Vytvoř init script pro novou instalaci
cat > /opt/kms-tools/sql/init-db.sh << 'EOFSCRIPT'
#!/bin/bash
# KMS Database Initialization Script
# Usage: ./init-db.sh <db_password>

set -e  # Exit on error

DB_NAME="kms_db"
DB_USER="kms_user"
DB_PASS="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$DB_PASS" ]; then
    echo "Usage: $0 <db_password>"
    echo "Example: $0 'MySecurePassword123'"
    exit 1
fi

echo "=== KMS Database Initialization ==="
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# 1. Create database and user
echo "1. Creating database and user..."
sudo -u postgres psql << SQL
-- Drop if exists (pro reinstalaci)
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};

-- Create fresh
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to DB and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
SQL

echo "✓ Database and user created"

# 2. Import schema
echo ""
echo "2. Importing schema..."
sudo -u postgres psql -d ${DB_NAME} -f ${SCRIPT_DIR}/schema.sql

echo "✓ Schema imported"

# 3. Verify
echo ""
echo "3. Verifying installation..."
sudo -u postgres psql -d ${DB_NAME} << SQL
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
SQL

echo ""
echo "=== Initialization Complete! ==="
echo ""
echo "Database: ${DB_NAME}"
echo "User: ${DB_USER}"
echo "Connection string: postgresql://${DB_USER}:PASSWORD@localhost/${DB_NAME}"
echo ""
echo "Next steps:"
echo "1. Update /opt/kms-tools/api/database.py with password"
echo "2. Restart kms-api.service"
echo "3. Import data: /opt/kms-tools/bin/kms-import.py"
EOFSCRIPT

chmod +x /opt/kms-tools/sql/init-db.sh

# 5. Test (v dry-run módu - pouze zobraz co by se stalo)
cat /opt/kms-tools/sql/init-db.sh
```

**✅ Hotovo když:** `/opt/kms-tools/sql/` obsahuje `schema.sql` a `init-db.sh`

---

## FÁZE 2: Frontend Vylepšení [1-2 hodiny]

### Krok 4: Přidej Error Handling do Frontend

**Cíl:** Lepší error handling + user feedback

```bash
# 1. Backup současného api.js
cp /opt/kms-tools/frontend/public/api.js /opt/kms-tools/frontend/public/api.js.backup

# 2. Edituj api.js
vim /opt/kms-tools/frontend/public/api.js
```

**Přidej do api.js:**

```javascript
// Na začátek souboru, přidej error handler
class APIError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.response = response;
    }
}

// V každé API funkci, upgrade error handling:
// PŘED (příklad z getCategories):
async getCategories() {
    const response = await fetch(`${this.baseURL}/categories`);
    return response.json();
}

// PO (s error handling):
async getCategories() {
    try {
        const response = await fetch(`${this.baseURL}/categories`);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new APIError(
                error.detail || `HTTP ${response.status}`,
                response.status,
                error
            );
        }

        const data = await response.json();
        console.log('✓ Categories loaded:', data.length);
        return data;

    } catch (error) {
        console.error('✗ Failed to load categories:', error);

        // Show user-friendly toast
        if (window.showToast) {
            if (error instanceof APIError) {
                window.showToast(`Failed to load categories: ${error.message}`, 'error');
            } else {
                window.showToast('Network error - check connection', 'error');
            }
        }

        // Return empty array jako fallback
        return [];
    }
}

// Opakuj pro všechny API metody:
// - getObjects()
// - getObjectById()
// - getStats()
// - getHealth()
// - getToolsStatus()
// atd.
```

**3. Přidej retry logiku (volitelné):**

```javascript
// Helper funkce pro retry
async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new APIError(`HTTP ${response.status}`, response.status);
            }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Retry ${i + 1}/${retries} for ${url}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

**4. Test:**

```bash
# Restart není potřeba (statické soubory)
# Jen refresh browser

firefox https://kms.it-enterprise.solutions/

# F12 → Console
# Měl bys vidět:
# ✓ Categories loaded: 6
# ✓ Stats loaded: {...}
# ✓ Health check: OK

# Pokud vidíš errors, debug podle typu:
# - Network error → Zkontroluj API je běží
# - CORS error → Zkontroluj CORS middleware
# - 404 → Zkontroluj routing
```

**✅ Hotovo když:** Console ukazuje ✓ messages a toast notifikace fungují

---

### Krok 5: Přidej Loading States

**Cíl:** Lepší UX při načítání dat

```javascript
// V app.js, upgrade init funkce:

// PŘED:
async init() {
    await this.loadCategories();
    await this.loadStats();
}

// PO:
async init() {
    // Show loading indicator
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div><p>Loading...</p></div>';

    try {
        // Load data in parallel
        await Promise.all([
            this.loadCategories(),
            this.loadStats(),
            this.checkHealth()
        ]);

        // Hide loading
        mainContent.innerHTML = '';

    } catch (error) {
        console.error('Init failed:', error);
        mainContent.innerHTML = `
            <div class="alert alert-danger m-5">
                <h4>Failed to Initialize</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}
```

**✅ Hotovo když:** UI zobrazuje loading state při načítání

---

### Krok 6: Debug Frontend Routing

**Problém:** Kliknutí na kategorii/objekt nedělá nic

```bash
# 1. Zkontroluj event handlers v app.js
vim /opt/kms-tools/frontend/public/app.js

# Hledej funkce:
# - selectCategory(slug)
# - selectObject(id)
# - showObjectDetail(id)

# 2. Přidej console.log pro debug:
selectCategory(slug) {
    console.log('Category selected:', slug);
    // ... zbytek kódu
}

# 3. V components.js zkontroluj onClick handlers:
vim /opt/kms-tools/frontend/public/components.js

# Např. CategoryItem by mělo mít:
onClick={() => app.selectCategory('${category.slug}')}

# NE jen:
onClick={undefined}

# 4. Test v browseru:
# Klikni na kategorii
# F12 → Console
# Měl bys vidět: "Category selected: odoo"
```

**✅ Hotovo když:** Klikání na kategorie a objekty funguje

---

## FÁZE 3: Desktop Editory (Volitelné) [30 minut]

### Krok 7A: Přidej Chybějící Environment Variables

**Pokud chceš opravit Windsurf/Cursor crashování:**

```python
# Edituj /opt/kms-tools/api/routers/tools.py
vim /opt/kms-tools/api/routers/tools.py

# V open_windsurf() funkci, po řádku kde je:
# env["DISPLAY"] = display
# env["XDG_RUNTIME_DIR"] = xdg_runtime_dir

# Přidej:
env["XAUTHORITY"] = "/home/devops/.Xauthority"
env["DBUS_SESSION_BUS_ADDRESS"] = "unix:path=/run/user/1000/bus"

# NEBO dynamicky podle user:
import pwd
username = pwd.getpwuid(1000).pw_name  # devops
env["XAUTHORITY"] = f"/home/{username}/.Xauthority"

# Opakuj pro open_cursor() funkci

# Ulož a restart:
sudo systemctl restart kms-api.service

# Test:
curl -X POST http://localhost:8000/api/tools/windsurf/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'

# Po 2 sekundách zkontroluj:
ps aux | grep windsurf
# Měl by běžet proces!
```

**NEBO:**

### Krok 7B: Odstraň Desktop Editory z UI (Jednodušší)

**Pokud nechceš řešit desktop editory:**

```javascript
// Edituj /opt/kms-tools/frontend/public/app.js nebo components.js
vim /opt/kms-tools/frontend/public/components.js

// Najdi ToolsContainer nebo podobnou komponentu
// Zakomentuj nebo smaž tlačítka pro Windsurf/Cursor:

// PŘED:
<button onclick="openWindsurf()">Windsurf</button>
<button onclick="openCursor()">Cursor</button>

// PO:
<!-- Desktop editors removed - use web tools instead -->
<!-- <button onclick="openWindsurf()">Windsurf</button> -->
<!-- <button onclick="openCursor()">Cursor</button> -->

// NEBO nech jen web tools:
<div class="tools-container">
  <button onclick="openTerminal()">🖥️ Terminal</button>
  <button onclick="openFiles()">📁 Files</button>
  <button onclick="openVSCode()">💻 VS Code</button>
  <button onclick="openClaude()">🤖 Claude AI</button>
</div>
```

**✅ Hotovo když:** Buď desktop editory fungují NEBO jsou skryté v UI

---

## FÁZE 4: Production Readiness [1 hodina]

### Krok 8: Security Hardening

**1. CORS Policy:**

```python
# /opt/kms-tools/api/main.py
vim /opt/kms-tools/api/main.py

# PŘED:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ NEBEZPEČNÉ!
    ...
)

# PO:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kms.it-enterprise.solutions",
        "http://localhost:3000"  # Pro development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**2. Debug Logging:**

```python
# /opt/kms-tools/api/main.py

# Přidej na začátek:
import os

# V logging.basicConfig:
logging.basicConfig(
    level=logging.DEBUG if os.getenv("DEBUG", "false").lower() == "true" else logging.INFO,
    ...
)

# Nastavení pro production:
# V systemd service NEMĚJ Environment="DEBUG=true"
# Nebo explicitně: Environment="DEBUG=false"
```

**3. Environment Variables:**

```bash
# Edituj systemd service
sudo vim /etc/systemd/system/kms-api.service

# Přidej:
Environment="ENVIRONMENT=production"
Environment="DEBUG=false"
Environment="LOG_LEVEL=INFO"

# Reload a restart:
sudo systemctl daemon-reload
sudo systemctl restart kms-api.service
```

**✅ Hotovo když:** CORS omezeno, debug logging vypnutý v prod

---

### Krok 9: Health Checks & Monitoring

**1. Vytvoř monitoring script:**

```bash
cat > /opt/kms-tools/bin/healthcheck.sh << 'EOFSCRIPT'
#!/bin/bash
# KMS Health Check Script
# Returns: 0 = OK, 1 = ERROR

set -e

echo "=== KMS Health Check ==="
echo ""

ERRORS=0

# 1. Check API
echo -n "API Health... "
if curl -sf http://localhost:8000/api/system/health > /dev/null; then
    echo "✓ OK"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# 2. Check Database
echo -n "Database... "
if sudo -u postgres psql -d kms_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "✓ OK"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# 3. Check Services
SERVICES=(kms-api kms-sync-daemon kms-tools-ttyd kms-tools-filebrowser kms-tools-code-server)
for svc in "${SERVICES[@]}"; do
    echo -n "Service ${svc}... "
    if systemctl is-active --quiet ${svc}.service; then
        echo "✓ Running"
    else
        echo "✗ Stopped"
        ((ERRORS++))
    fi
done

# 4. Check Disk Space
echo -n "Disk Space... "
USAGE=$(df -h /opt | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$USAGE" -lt 90 ]; then
    echo "✓ OK (${USAGE}%)"
else
    echo "⚠ WARNING (${USAGE}%)"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "=== All Checks Passed ✓ ==="
    exit 0
else
    echo "=== $ERRORS Check(s) Failed ✗ ==="
    exit 1
fi
EOFSCRIPT

chmod +x /opt/kms-tools/bin/healthcheck.sh

# Test:
/opt/kms-tools/bin/healthcheck.sh
```

**2. Přidej do crontab (monitoring každých 5 minut):**

```bash
crontab -e

# Přidej:
*/5 * * * * /opt/kms-tools/bin/healthcheck.sh >> /var/log/kms-healthcheck.log 2>&1

# Log rotation:
sudo cat > /etc/logrotate.d/kms << 'EOF'
/var/log/kms-healthcheck.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF
```

**✅ Hotovo když:** Health check script běží a loguje

---

### Krok 10: Backup Automation

```bash
cat > /opt/kms-tools/bin/backup.sh << 'EOFSCRIPT'
#!/bin/bash
# KMS Backup Script

BACKUP_DIR="/opt/backups/kms"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "=== KMS Backup Started: $DATE ==="

# 1. Database
echo "Backing up database..."
sudo -u postgres pg_dump kms_db | gzip > $BACKUP_DIR/kms_db_${DATE}.sql.gz

# 2. Filesystem Data
echo "Backing up filesystem..."
tar -czf $BACKUP_DIR/kms_data_${DATE}.tar.gz /opt/kms/

# 3. Configuration
echo "Backing up config..."
tar -czf $BACKUP_DIR/kms_config_${DATE}.tar.gz \
    /opt/kms-tools/api/ \
    /opt/kms-tools/frontend/ \
    /etc/systemd/system/kms-*.service \
    /etc/nginx/sites-available/kms-*.conf

# 4. Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "=== Backup Complete ==="
ls -lh $BACKUP_DIR/*${DATE}*
EOFSCRIPT

chmod +x /opt/kms-tools/bin/backup.sh

# Test:
/opt/kms-tools/bin/backup.sh

# Automatizuj (denní backup v 2:00):
crontab -e
# Přidej:
0 2 * * * /opt/kms-tools/bin/backup.sh >> /var/log/kms-backup.log 2>&1
```

**✅ Hotovo když:** Backup script funguje a je v cron

---

## 📋 Kontrolní Checklist

Po dokončení všech fází zkontroluj:

### Backend ✅
- [ ] API běží (port 8000)
- [ ] Všechny endpointy vracejí 200 OK
- [ ] `/api/categories` vrací data
- [ ] `/api/tools/status` ukazuje running services
- [ ] Path typo opraveno
- [ ] Database připojena a obsahuje data
- [ ] Sync daemon běží
- [ ] Logy jsou čitelné (bez chyb)

### Frontend ✅
- [ ] Sidebar zobrazuje kategorie
- [ ] Kliknutí na kategorii funguje
- [ ] Stats se načítají
- [ ] Toast notifikace fungují
- [ ] Console bez JavaScript errors
- [ ] Network tab ukazuje 200 OK responses
- [ ] Loading states fungují

### Tools ✅
- [ ] Terminal button otevře ttyd
- [ ] Files button otevře file browser
- [ ] VS Code button otevře code-server
- [ ] Claude AI funguje (nebo je disabled)
- [ ] Desktop editory fungují NEBO jsou skryté

### Production ✅
- [ ] CORS omezeno na domain
- [ ] Debug logging vypnutý
- [ ] Health check funguje
- [ ] Backup script nastaven
- [ ] Monitoring běží
- [ ] SQL schema verzováno
- [ ] Dokumentace aktuální

---

## 🆘 Troubleshooting

### Problém: API vrací 500 Internal Server Error

```bash
# Koukni na logy:
sudo journalctl -u kms-api.service -n 100 --no-pager

# Hledej:
# - Traceback (Python error)
# - Database connection error
# - Import errors

# Časté příčiny:
# 1. Database není připojená
sudo -u postgres psql -l | grep kms_db

# 2. Chybí Python package
/opt/kms-tools/venv/bin/pip list | grep <package_name>

# 3. Permission denied
ls -la /opt/kms-tools/api/
# Mělo by být: devops:devops
```

### Problém: Frontend načítá nekonečně

```bash
# F12 → Network
# Najdi failing request
# Zkontroluj Response

# Časté příčiny:
# 1. API není dostupné
curl http://localhost:8000/api/system/health

# 2. CORS blocking
# F12 → Console → Hledej "CORS"
# Fix: Zkontroluj CORS middleware

# 3. JavaScript error
# F12 → Console → Hledej red errors
```

### Problém: Nástroje se neotevírají

```bash
# 1. Zkontroluj services:
systemctl status kms-tools-ttyd.service
systemctl status kms-tools-filebrowser.service
systemctl status kms-tools-code-server.service

# 2. Zkontroluj porty:
sudo ss -tlnp | grep -E "7681|8082|8443"

# 3. Test přímý přístup:
curl http://localhost:7681/
curl http://localhost:8082/
curl http://localhost:8443/

# 4. Zkontroluj nginx:
sudo nginx -t
sudo systemctl status nginx
```

---

## 📚 Další Kroky

Po dokončení základní implementace:

1. **User Authentication**
   - Implementuj JWT tokeny
   - Přidej login page
   - Role-based access control

2. **CRUD UI**
   - Formuláře pro vytváření kategorií
   - Editace objektů
   - Upload dokumentů

3. **Advanced Features**
   - Real-time sync updates (WebSocket)
   - Document preview
   - Version history
   - Collaborative editing

4. **Performance**
   - Redis cache
   - Database indexy
   - Frontend bundling
   - CDN pro static assets

---

**Poslední update:** 30.12.2025 02:20 CET
**Hotovo:** Můžeš začít implementovat!
