# KMS Tools - Struktura Projektu

**Datum**: 2025-12-31
**Autor**: Odoo Biznes <odoo@biznes.cz>

## Hlavní adresář projektu

```
/opt/kms-tools/
```

## Kompletní struktura adresářů

```
/opt/kms-tools/
├── api/                           # FastAPI Backend
│   ├── main.py                    # Hlavní FastAPI aplikace
│   ├── auth.py                    # JWT autentizace
│   ├── database.py                # PostgreSQL připojení
│   ├── config.py                  # Konfigurace
│   └── routers/                   # API routery
│       ├── resources_mgmt.py      # 🆕 Resource Management System (572 lines)
│       ├── logins.py              # 🆕 Credentials Management
│       ├── auth.py                # Autentizační endpoints
│       ├── categories.py          # Kategorie management
│       ├── objects.py             # Objekty/projekty
│       ├── documents.py           # Dokumenty
│       ├── search.py              # Globální vyhledávání
│       ├── tools.py               # Nástroje (terminal, Claude, atd.)
│       └── metrics.py             # Metriky a monitoring
│
├── frontend/public/               # Web UI
│   ├── index.html                 # Hlavní HTML
│   ├── styles.css                 # CSS (5230 lines - includes RESOURCES)
│   ├── app.js                     # Hlavní aplikace
│   │
│   └── js/modules/                # Feature moduly
│       ├── module-resources.js    # 🆕 RESOURCES modul (925 lines)
│       ├── module-logins.js       # 🆕 LOGINS modul (900+ lines)
│       ├── module-develop.js      # DEVELOP modul
│       ├── module-tasks.js        # TASKS modul
│       ├── module-deploy.js       # DEPLOY modul
│       ├── module-ideas.js        # IDEAS modul
│       ├── module-analytics.js    # ANALYTICS modul
│       ├── module-clients.js      # CLIENTS modul
│       └── module-finance.js      # FINANCE modul
│
├── sql/                           # SQL migrace
│   ├── schema.sql                 # Hlavní databázové schéma
│   ├── 001_logins_credentials.sql # 🆕 LOGINS modul migrace
│   ├── 002_resource_management.sql # 🆕 Resource Management migrace (450 lines)
│   └── 003_add_current_resources.sql # Inicializace resources (22 zdrojů)
│
├── lib/                           # Sdílené knihovny
│   └── secrets.py                 # WikiSys Age encryption wrapper
│
├── bin/                           # Bash skripty
│   ├── backup-kms.sh              # Automatické zálohy
│   ├── healthcheck-cron.sh        # Health monitoring
│   └── test-all-tools.sh          # Testování nástrojů
│
├── venv/                          # Python virtual environment
│
├── README.md                      # Hlavní dokumentace
├── RESOURCES-DOCUMENTATION.md     # 🆕 Resource Management dokumentace
└── PROJECT-STRUCTURE.md           # 🆕 Tento soubor
```

## Nový modul: RESOURCES (Resource Management) 🆕

### Popis
Centralizovaný systém pro správu všech systémových zdrojů - portů, IP adres, disků, tmpfs, databází, služeb, domén a dalších. **Zabraňuje konfliktům a duplicitním alokacím.**

### Komponenty
- **Backend**: `/opt/kms-tools/api/routers/resources_mgmt.py` (572 lines)
- **Frontend**: `/opt/kms-tools/frontend/public/js/modules/module-resources.js` (925 lines)
- **Database**: `/opt/kms-tools/sql/002_resource_management.sql` (450 lines)
- **CSS**: V `/opt/kms-tools/frontend/public/styles.css` (lines 4593-5230)
- **Dokumentace**: `/opt/kms-tools/RESOURCES-DOCUMENTATION.md`

### Typy zdrojů (19 typů)
- `port` - Síťové porty
- `ip_address` - IP adresy
- `directory` - Adresáře
- `tmpfs` - tmpfs RAM mounts
- `database` - PostgreSQL databáze
- `db_user` - Databázoví uživatelé
- `systemd` - Systemd služby
- `domain` - Domény/subdomény
- `ssl_cert` - SSL certifikáty
- `nginx_conf` - Nginx konfigurace
- `socket` - Unix sockety
- `redis_db` - Redis databáze
- `cron_job` - Cron joby
- `user` - Systémoví uživatelé
- `env_var` - Environment proměnné
- `backup_path` - Záložní cesty
- `log_path` - Log cesty
- `secret` - Tajné klíče
- `other` - Ostatní

### Databázové tabulky
```sql
system_resources                -- Hlavní tabulka alokovaných zdrojů
resource_allocation_history     -- Audit trail (kdo, kdy, odkud)
resource_conflicts              -- Detekované konflikty
resource_dependencies           -- Závislosti mezi zdroji
resource_reservations           -- Rezervace zdrojů

-- Views
v_active_resources              -- Souhrn aktivních zdrojů
v_resource_conflicts            -- Detail konfliktů
```

### API Endpoints (10)
```
GET    /api/resources                    # List all resources
POST   /api/resources                    # Allocate new resource
GET    /api/resources/{id}               # Get resource details
PUT    /api/resources/{id}               # Update resource
DELETE /api/resources/{id}               # Release resource
POST   /api/resources/check-availability # Check if available
POST   /api/resources/find-available-ports # Find N available ports
GET    /api/resources/summary            # Summary by type
GET    /api/resources/conflicts          # List conflicts
GET    /api/resources/{id}/history       # Allocation history
```

### Funkce
- ✅ Kontrola dostupnosti před alokací (prevence konfliktů)
- ✅ Automatické hledání volných portů
- ✅ Kompletní audit trail (kdo, kdy, z jaké IP alokoval)
- ✅ Detekce konfliktů přes DB triggers
- ✅ Lock mechanism pro kritické zdroje
- ✅ Multi-environment support (production, staging, development)
- ✅ Resource dependencies tracking
- ✅ Historie změn pro každý zdroj

### Aktuální stav
- **22 registrovaných zdrojů**:
  - 8 portů (80, 443, 5432, 7681-7683, 8000, 22770)
  - 5 systemd služeb
  - 3 adresáře
  - 2 domény
  - 2 nginx configy
  - 1 databáze
  - 1 db_user

### Frontend features
- Dashboard s statistikami
- Filtry (typ, status, environment, search)
- Conflict monitor
- Port discovery wizard
- Resource allocation form
- History viewer
- Color-coded status badges
- Interactive resource cards

## Workflow: Přidání nového zdroje

1. **Otevři RESOURCES modul** v KMS UI
2. **Klikni "Allocate Resource"**
3. **Vyplň formulář:**
   - Typ zdroje (např. port)
   - Název (např. "My Service Port")
   - Hodnota (např. "9000")
   - Owner service (např. "my-service")
   - Environment (production/staging/development)
4. **Klikni "Check Availability"** - systém zkontroluje duplicity
5. **Klikni "Allocate Resource"** - pokud je volný, alokuje se
6. **Zdroj je nyní chráněn** - nikdo jiný nemůže použít stejný port/resource

## Výhody centralizovaného Resource Management

### ❌ Před implementací
```bash
# Developer A
systemctl start my-service.service  # Uses port 8000
# Developer B
systemctl start other-service.service  # Also uses port 8000
# 💥 CONFLICT! Services crash
```

### ✅ Po implementaci
```bash
# Developer A
1. Check KMS Resources: port 8000 available? YES
2. Allocate in KMS: port 8000 → my-service
3. Start service on port 8000
4. Port 8000 is now PROTECTED

# Developer B
1. Check KMS Resources: port 8000 available? NO (allocated to my-service)
2. Find available: GET /api/resources/find-available-ports
3. System suggests: 8001
4. Allocate in KMS: port 8001 → other-service
5. Start service on port 8001
# ✅ NO CONFLICT!
```

## Production URL

```
https://kms.it-enterprise.solutions
```

### Přístup k RESOURCES modulu
1. Login: https://kms.it-enterprise.solutions
2. Username: `devsoft`
3. Password: `devsoft123`
4. Klikni na fialové tlačítko **RESOURCES** v navigaci
5. Dashboard se zobrazí s 22 registrovanými zdroji

## Git Repository

```
Remote: https://github.com/odoobiznes/WIKI-KMS
SSH:    git@github.com:odoobiznes/WIKI-KMS.git
Branch: main
```

## Statistiky projektu

### Lines of Code
```
Python (API):         ~5,000 lines
JavaScript (Frontend): ~15,000 lines
CSS:                  ~5,230 lines
SQL:                  ~1,500 lines
Markdown (Docs):      ~2,000 lines
Total:                ~29,000 lines (source code only)
```

### Files
```
Total files:       ~1,200
Python modules:    ~15
JS modules:        ~30
SQL migrations:    4
Documentation:     3 (README, RESOURCES-DOCS, PROJECT-STRUCTURE)
```

### Modules
```
Core modules:      8 (IDEAS, DEVELOP, DEPLOY, TASKS, ANALYTICS, CLIENTS, FINANCE, LOGINS)
New module:        1 (RESOURCES) 🆕
Total:             9 modules
```

## Databáze

```sql
-- Connection
Host:     localhost
Port:     5432
Database: kms_db
User:     kms_user

-- Tables
Core:           5 (users, categories, subcategories, objects, documents)
LOGINS:         2 (credentials, credentials_audit_log)
RESOURCES:      5 (system_resources, resource_allocation_history, 
                   resource_conflicts, resource_dependencies, 
                   resource_reservations)
Total:         12 tables + 2 views
```

## Technologie

- **Python** 3.11+
- **FastAPI** - Modern web framework
- **PostgreSQL** - Relační databáze
- **Vanilla JS** - No framework, pure ES6+
- **Nginx** - Reverse proxy + SSL
- **systemd** - Service management
- **Git** - Version control
- **Age encryption** - WikiSys integration

## Deployment

```bash
# API Service
sudo systemctl status kms-api.service
sudo systemctl restart kms-api.service

# Database
sudo -u postgres psql kms_db

# Nginx
sudo nginx -t && sudo systemctl reload nginx

# Logs
journalctl -u kms-api.service -f
tail -f /tmp/kms-api-debug.log
```

## Příští kroky: Meta-development

### Cíl: KMS spravuje sám sebe

1. **Vytvořit KMS projekt v KMS**
   - Kategorie: "Internal Projects"
   - Objekt: "KMS Development"
   - Dokumenty: Migrace, features, bugs

2. **Trackovat resources**
   - Port 8000 → kms-api
   - Port 5432 → PostgreSQL
   - Directory /opt/kms-tools → KMS
   - atd.

3. **Používat TASKS modul**
   - Vývoj nových features
   - Bug tracking
   - Code review tasks

4. **DEVELOP modul**
   - Git integration
   - Terminal pro debugging
   - Cursor pro vývoj

5. **DEPLOY modul**
   - Deployment workflow
   - Backup management
   - Version tracking

---

**Poslední aktualizace**: 2025-12-31 19:20 CET
**Verze**: 1.0.0
