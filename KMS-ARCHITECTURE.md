# KMS - Architektura Projektu

**Datum:** 30.12.2025
**Verze:** 2.0.0
**Status:** 🟡 90% Hotovo, potřebuje bugfixy

---

## 🎯 Účel Systému

**Knowledge Management System (KMS)** je integrovaný systém pro správu projektové dokumentace s těmito hlavními cíli:

1. **Centralizovaná správa** - Všechny projekty a dokumentace na jednom místě
2. **Automatická synchronizace** - Bidirectional sync mezi filesystemem a databází
3. **Integrované nástroje** - Přímý přístup k editorům, terminálům a AI asistentům
4. **Web interface** - Přehledné UI pro browsing a správu
5. **AI asistence** - Claude AI s plným kontextem projektů

---

## 📊 Plánovaná Funkcionalita

### ✅ Implementované Funkce

#### Frontend (Web UI)
- ✅ Browse kategorií a objektů (projektů)
- ✅ Sidebar navigace s kategoriemi
- ✅ Main content area pro detail objektů
- ✅ Statistiky a health check dashboard
- ✅ Quick access k nástrojům (Terminal, Files, VS Code)
- ✅ Bootstrap responsive layout
- ✅ Toast notifications

#### Backend API (FastAPI)
- ✅ REST API pro všechny entity
  - `/api/categories` - CRUD kategorie
  - `/api/objects` - CRUD objekty/projekty
  - `/api/documents` - CRUD dokumenty
  - `/api/search` - Fulltextové vyhledávání
  - `/api/system` - Health, stats, changelog, sync status
  - `/api/tools` - Integrace s nástroji
- ✅ CORS middleware
- ✅ Request/Response logging s timing
- ✅ Exception handling
- ✅ Swagger UI dokumentace (`/api/docs`)

#### Nástroje (Tools Integration)
- ✅ **Web Terminal** (ttyd) - Shell přístup k projektům
- ✅ **File Browser** - Upload/download/preview souborů
- ✅ **VS Code** (code-server) - Plnohodnotný editor v browseru
- ✅ **Claude AI** - Chat s kontextem projektů
- 🟡 **Windsurf Editor** - Desktop AI editor (implementováno, má bug)
- 🟡 **Cursor Editor** - Desktop AI editor (implementováno, má bug)

#### Synchronizace
- ✅ Watchdog monitoring `/opt/kms/`
- ✅ SHA256 checksum validation
- ✅ Bidirectional sync (Filesystem ↔ Database)
- ✅ Metadata parsing z `.meta.yaml` souborů
- ✅ Change tracking v `change_log` tabulce
- ✅ Sync status tracking

### 🔴 Chybějící Funkce

#### Frontend
- 🔴 CRUD UI operace (vytváření/editace kategorií a objektů)
- 🔴 File upload UI
- 🔴 Document preview v browseru
- 🔴 Search UI komponenta (API existuje)
- 🔴 User authentication/login UI

#### Backend
- 🔴 User authentication & authorization
- 🔴 Role-based access control (RBAC)
- 🔴 File upload handling v API
- 🔴 Document conversion/preview API
- 🔴 Batch operations

#### Infrastructure
- 🔴 Production-ready error handling
- 🔴 Rate limiting
- 🔴 API versioning
- 🔴 Monitoring & alerting
- 🔴 Backup automation

---

## 🏗️ Systémová Architektura

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    KLIENT (Web Browser)                         │
│         https://kms.it-enterprise.solutions/                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NGINX Reverse Proxy                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Location Routing:                                          │ │
│  │  /              → Static HTML/JS/CSS                       │ │
│  │  /api           → FastAPI (localhost:8000)                 │ │
│  │  /tools/terminal → ttyd (localhost:7681)                   │ │
│  │  /tools/files   → File Browser (localhost:8082)            │ │
│  │  /tools/vscode  → VS Code (localhost:8443)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┬─────────────────┐
          ▼                ▼                ▼                 ▼
    ┌───────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
    │ FastAPI   │   │ ttyd       │   │ File       │   │ VS Code    │
    │ Backend   │   │ Terminal   │   │ Browser    │   │ Server     │
    │ Port 8000 │   │ Port 7681  │   │ Port 8082  │   │ Port 8443  │
    └─────┬─────┘   └────────────┘   └────────────┘   └────────────┘
          │
          │
    ┌─────▼──────────────────────────────────────────────────────┐
    │              FastAPI Application                           │
    │  ┌──────────────────────────────────────────────────────┐ │
    │  │                  API Routers                         │ │
    │  │                                                      │ │
    │  │  ┌──────────┐  ┌─────────┐  ┌──────────┐          │ │
    │  │  │Categories│  │ Objects │  │Documents │          │ │
    │  │  └──────────┘  └─────────┘  └──────────┘          │ │
    │  │                                                      │ │
    │  │  ┌──────────┐  ┌─────────┐  ┌──────────┐          │ │
    │  │  │ Search   │  │ System  │  │  Tools   │          │ │
    │  │  └──────────┘  └─────────┘  └──────────┘          │ │
    │  │                                                      │ │
    │  └──────────────────────────────────────────────────────┘ │
    │                                                            │
    │  Middleware Stack:                                        │
    │  ├─ CORS Middleware                                       │
    │  ├─ Request Logging                                       │
    │  ├─ Exception Handlers                                    │
    │  └─ Process Time Tracking                                 │
    └────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────────┐
         │      PostgreSQL Database              │
         │         (kms_db)                      │
         │                                       │
         │  Tables:                              │
         │  ├─ categories                        │
         │  ├─ subcategories                     │
         │  ├─ objects                           │
         │  ├─ documents                         │
         │  ├─ change_log                        │
         │  └─ sync_status                       │
         │                                       │
         │  Views:                               │
         │  └─ v_objects_full                    │
         └───────────────┬───────────────────────┘
                         │
                         │ Bidirectional Sync
                         ▼
         ┌───────────────────────────────────────┐
         │    Filesystem Storage                 │
         │      /opt/kms/                        │
         │                                       │
         │  Structure:                           │
         │  ├─ categories/                       │
         │  │   ├─ odoo/                         │
         │  │   ├─ pohoda/                       │
         │  │   ├─ sysadmin/                     │
         │  │   └─ ... (14 kategorií)            │
         │  ├─ _global_templates/                │
         │  ├─ VERSION                           │
         │  └─ README.md                         │
         └───────────────────────────────────────┘
                         ▲
                         │
                         │ Watchdog Events
                         │
         ┌───────────────┴───────────────────────┐
         │   kms-sync-daemon.py                  │
         │   ────────────────────                │
         │   1. Monitor filesystem changes       │
         │   2. Read .meta.yaml files            │
         │   3. Calculate SHA256 checksums       │
         │   4. Validate data                    │
         │   5. Sync to/from database            │
         │   6. Log changes                      │
         └───────────────────────────────────────┘
```

---

## 🔄 Synchronizační Flow

### Filesystem → Database (FS to DB)

```
┌─────────────────────────────────────────────────────────────┐
│  Event: File created/modified/deleted in /opt/kms/         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Watchdog Handler             │
         │  (FileSystemEventHandler)     │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  1. Read File                 │
         │     - Get file path           │
         │     - Read content            │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  2. Parse Metadata            │
         │     - Read .meta.yaml         │
         │     - Extract fields          │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  3. Calculate Checksum        │
         │     - SHA256 hash             │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  4. Check Sync Status         │
         │     - Query sync_status       │
         │     - Compare checksums       │
         └───────────────┬───────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         Unchanged?          Changed?
                │                 │
                ▼                 ▼
            Skip          ┌───────────────────────┐
                          │  5. Update Database   │
                          │     - INSERT/UPDATE   │
                          │     - categories      │
                          │     - objects         │
                          │     - documents       │
                          └───────┬───────────────┘
                                  │
                                  ▼
                          ┌───────────────────────┐
                          │  6. Log Change        │
                          │     - change_log      │
                          │     - sync_status     │
                          └───────────────────────┘
```

### Database → Filesystem (DB to FS)

```
┌─────────────────────────────────────────────────────────────┐
│  Event: Database record created/modified/deleted            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Trigger: change_log entry    │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  1. Check Sync Status         │
         │     - Get file_path           │
         │     - Get checksum            │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  2. Generate File Content     │
         │     - Format data             │
         │     - Create .meta.yaml       │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  3. Write to Filesystem       │
         │     - Create directories      │
         │     - Write files             │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  4. Update Sync Status        │
         │     - New checksum            │
         │     - Timestamp               │
         └───────────────────────────────┘
```

---

## 📂 Filesystem Struktura

### /opt/kms/ - Data Storage (11.7 KB)

```
/opt/kms/
├── categories/                    # Hlavní kategorie (14 ks)
│   ├── odoo/                     # Produktové kategorie
│   │   ├── objects/
│   │   │   └── odoo-integration-api/
│   │   │       ├── plany/
│   │   │       ├── instrukce/
│   │   │       ├── code/
│   │   │       └── docs/
│   │   └── .meta.yaml
│   │
│   ├── pohoda/
│   ├── busticket/
│   ├── x-man/
│   │
│   ├── sysadmin/                 # Systémové kategorie
│   ├── servers/
│   ├── devops/
│   ├── platforms/
│   │
│   ├── sablona/                  # Template kategorie
│   ├── plany/
│   ├── task/
│   ├── projekty/
│   └── instrukce/
│
├── _global_templates/            # Globální šablony
│   ├── object-template/
│   └── category-template/
│
├── VERSION                       # Timestamp verze (1767032223)
├── CHANGELOG.md                  # Historie změn
└── README.md                     # Dokumentace
```

### /opt/kms-tools/ - Application (75 MB včetně venv)

```
/opt/kms-tools/
│
├── api/                          # FastAPI Backend (232 KB)
│   ├── main.py                   # Hlavní aplikace (4.6 KB)
│   ├── database.py               # PostgreSQL connection pool
│   ├── models.py                 # Pydantic data modely (6.4 KB)
│   ├── requirements.txt          # Python dependencies
│   │
│   └── routers/                  # API Routery (7 modulů)
│       ├── __init__.py
│       ├── categories.py         # /api/categories/* (5.7 KB)
│       ├── objects.py            # /api/objects/* (6.3 KB)
│       ├── documents.py          # /api/documents/* (5.0 KB)
│       ├── search.py             # /api/search/* (3.3 KB)
│       ├── system.py             # /api/system/* (3.9 KB)
│       ├── tools.py              # /api/tools/* (28 KB) ⚠️ HLAVNÍ
│       └── tools_claude.py       # Claude AI helper (4.1 KB)
│
├── frontend/                     # Web Interface (88 KB)
│   └── public/
│       ├── index.html            # Hlavní HTML vstupní bod
│       ├── api.js                # API client (4.5 KB)
│       ├── app.js                # Hlavní app logika (14.2 KB)
│       ├── components.js         # React-like komponenty (16.4 KB)
│       ├── styles.css            # CSS styling (15.5 KB)
│       ├── test-tools.html       # Debug: Test tools page
│       └── debug.html            # Debug: API tester
│
├── bin/                          # Utility Scripts (80 KB)
│   ├── kms-cli.py                # CLI management tool (737 řádků)
│   ├── kms-import.py             # Data import (436 řádků)
│   ├── kms-sync-daemon.py        # Sync daemon (588 řádků) ⚠️ KRITICKÝ
│   ├── test-all-tools.sh         # Test všech nástrojů (211 řádků)
│   ├── test-db.sh                # Database test
│   └── view-logs.sh              # Interaktivní log viewer (85 řádků)
│
├── sql/                          # SQL Schémata ⚠️ PRÁZDNÉ!
│   └── (vytvořit schema.sql a init-db.sh)
│
├── systemd/                      # Systemd konfigurace ⚠️ PRÁZDNÉ!
│   └── (zkopírovat z /etc/systemd/system/)
│
├── data/                         # Application Data
│   └── code-server/              # VS Code konfigurace
│
├── docs/                         # Dokumentace
│
├── lib/                          # Knihovny
│
├── venv/                         # Python Virtual Env (75 MB)
│   ├── bin/
│   ├── lib/
│   └── include/
│
└── Documentation Files (NEW)
    ├── KMS-ARCHITECTURE.md       # Tento dokument
    ├── KMS-IMPLEMENTATION-GUIDE.md
    ├── KMS-TESTING.md
    ├── KMS-QUICK-FIX.md
    ├── PROJECT-STRUCTURE.md
    ├── DEBUG-FINDINGS.md
    ├── DEBUG-GUIDE.md
    └── CHANGELOG-DEBUG.md
```

---

## 🗄️ Databázové Schéma

### PostgreSQL (kms_db)

#### Tabulky

**1. categories**
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),  -- 'product', 'system', 'template'
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. subcategories**
```sql
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**3. objects** (projekty)
```sql
CREATE TABLE objects (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),  -- 'active', 'archived', 'draft'
    author VARCHAR(255),
    file_path TEXT,  -- Relativní cesta v /opt/kms/
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, slug)
);
```

**4. documents**
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    object_id INTEGER REFERENCES objects(id),
    folder VARCHAR(255),  -- 'plany', 'instrukce', 'code', 'docs'
    filename VARCHAR(255) NOT NULL,
    filepath TEXT,  -- Full path
    content TEXT,
    content_type VARCHAR(100),
    size_bytes BIGINT,
    checksum VARCHAR(64),  -- SHA256
    version INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**5. change_log** (audit trail)
```sql
CREATE TABLE change_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),  -- 'category', 'object', 'document'
    entity_id INTEGER,
    action VARCHAR(50),  -- 'create', 'update', 'delete'
    user_name VARCHAR(255),
    old_data JSONB,
    new_data JSONB,
    diff JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**6. sync_status**
```sql
CREATE TABLE sync_status (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    file_path TEXT,
    checksum VARCHAR(64),
    sync_direction VARCHAR(10),  -- 'fs_to_db', 'db_to_fs'
    status VARCHAR(50),  -- 'pending', 'synced', 'error'
    error_message TEXT,
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Views

**v_objects_full** - Objects s full hierarchy
```sql
CREATE VIEW v_objects_full AS
SELECT
    o.*,
    c.slug as category_slug,
    c.name as category_name,
    sc.slug as subcategory_slug,
    sc.name as subcategory_name
FROM objects o
LEFT JOIN categories c ON o.category_id = c.id
LEFT JOIN subcategories sc ON o.subcategory_id = sc.id;
```

---

## 🔌 API Endpointy - Kompletní Seznam

### Categories

```
GET    /api/categories              # Seznam všech kategorií
GET    /api/categories/{id}         # Detail kategorie
GET    /api/categories/slug/{slug}  # Kategorie podle slug
POST   /api/categories              # Vytvořit kategorii
PUT    /api/categories/{id}         # Update kategorie
DELETE /api/categories/{id}         # Smazat kategorii
```

### Objects (Projekty)

```
GET    /api/objects                    # Seznam všech objektů
GET    /api/objects/{id}               # Detail objektu
GET    /api/objects/category/{slug}    # Objekty podle kategorie
GET    /api/objects/uuid/{uuid}        # Objekt podle UUID
POST   /api/objects                    # Vytvořit objekt
PUT    /api/objects/{id}               # Update objekt
DELETE /api/objects/{id}               # Smazat objekt
```

### Documents

```
GET    /api/documents                  # Seznam dokumentů
GET    /api/documents/{id}             # Detail dokumentu
GET    /api/documents/object/{id}      # Dokumenty objektu
POST   /api/documents                  # Vytvořit dokument
PUT    /api/documents/{id}             # Update dokument
DELETE /api/documents/{id}             # Smazat dokument
```

### Search

```
GET    /api/search?q={query}           # Hledání všude
GET    /api/search/objects?q={query}   # Hledání v objektech
GET    /api/search/documents?q={query} # Hledání v dokumentech
```

### System

```
GET    /api/system/health              # Health check
GET    /api/system/stats               # Statistiky (counts)
GET    /api/system/changelog           # Changelog
GET    /api/system/sync-status         # Sync daemon status
```

### Tools ⚠️ HLAVNÍ INTEGRACE

```
# Web Tools
POST   /api/tools/terminal/open        # Web Terminal (ttyd)
POST   /api/tools/files/open           # File Browser
POST   /api/tools/vscode/open          # VS Code (code-server)

# Desktop Editors
POST   /api/tools/windsurf/open        # Windsurf Editor
POST   /api/tools/cursor/open          # Cursor Editor

# AI
POST   /api/tools/claude/chat          # Claude AI Chat
GET    /api/tools/claude/models        # Claude Models List

# Status
GET    /api/tools/status               # Všechny nástroje status
```

---

## 🛠️ Systemd Services

### Běžící Služby

| Service | Port | Popis | Status |
|---------|------|-------|--------|
| **kms-api.service** | 8000 | FastAPI Backend | ✅ Running |
| **kms-sync-daemon.service** | - | Filesystem sync | ✅ Running |
| **kms-tools-ttyd.service** | 7681 | Web Terminal | ✅ Running |
| **kms-tools-filebrowser.service** | 8082 | File Browser | ✅ Running |
| **kms-tools-code-server.service** | 8443 | VS Code Server | ✅ Running |

### Service Konfigurace

**kms-api.service** (`/etc/systemd/system/kms-api.service`)
```ini
[Unit]
Description=KMS REST API
After=network.target postgresql.service

[Service]
Type=simple
User=devops
Group=devops
WorkingDirectory=/opt/kms-tools/api
Environment="ANTHROPIC_API_KEY=sk-ant-api..."
Environment="PATH=/opt/kms-tools/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/opt/kms-tools/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=on-failure
PrivateTmp=false  # ⚠️ DŮLEŽITÉ pro X socket access

[Install]
WantedBy=multi-user.target
```

---

## 🌐 Nginx Konfigurace

**Location:** `/etc/nginx/sites-available/kms-tools-proxy.conf`

```nginx
server {
    listen 443 ssl http2;
    server_name kms.it-enterprise.solutions;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/kms.it-enterprise.solutions/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kms.it-enterprise.solutions/privkey.pem;

    # Static Files
    location / {
        root /opt/kms-tools/frontend/public;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web Terminal (ttyd)
    location /tools/terminal/ {
        proxy_pass http://127.0.0.1:7681/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # File Browser
    location /tools/files/ {
        proxy_pass http://127.0.0.1:8082/;
        client_max_body_size 500M;
        proxy_request_buffering off;
    }

    # VS Code
    location /tools/vscode/ {
        proxy_pass http://127.0.0.1:8443/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔍 Klíčové Soubory Pro Vývoj

### Backend Development

| Soubor | Řádky | Účel | Priorita |
|--------|-------|------|----------|
| `/opt/kms-tools/api/main.py` | 149 | FastAPI app | ⚠️ Kritický |
| `/opt/kms-tools/api/routers/tools.py` | 726 | Tools integrace | ⚠️ Kritický |
| `/opt/kms-tools/api/database.py` | 50 | DB connection | Vysoká |
| `/opt/kms-tools/api/models.py` | 200 | Pydantic modely | Střední |

### Frontend Development

| Soubor | Velikost | Účel | Priorita |
|--------|----------|------|----------|
| `/opt/kms-tools/frontend/public/index.html` | 8.5 KB | Main layout | Vysoká |
| `/opt/kms-tools/frontend/public/app.js` | 14.2 KB | App logika | ⚠️ Kritický |
| `/opt/kms-tools/frontend/public/api.js` | 4.5 KB | API client | Vysoká |
| `/opt/kms-tools/frontend/public/components.js` | 16.4 KB | UI komponenty | Střední |

### Scripts

| Soubor | Řádky | Účel | Priorita |
|--------|-------|------|----------|
| `/opt/kms-tools/bin/kms-sync-daemon.py` | 588 | Filesystem sync | ⚠️ Kritický |
| `/opt/kms-tools/bin/kms-cli.py` | 737 | CLI tool | Vysoká |
| `/opt/kms-tools/bin/kms-import.py` | 436 | Data import | Střední |

---

## ⚠️ Známé Problémy

### Kritické

1. **Path Typo v tools.py:165**
   - Chyba: `/opt/DevOPS/Internal/Proects` (typo "Proects")
   - Důsledek: Všechny `/api/tools/*/open` vracejí 404
   - Fix: Změnit na správnou cestu

2. **Chybějící SQL Schéma**
   - `/opt/kms-tools/sql/` je prázdný
   - Chybí init script pro databázi
   - Fix: Export současného schématu

3. **Desktop Editory Crashují**
   - Windsurf/Cursor se okamžitě ukončí
   - Chybí env variables (XAUTHORITY, DBUS_SESSION_BUS_ADDRESS)
   - Fix: Přidat env vars NEBO odstranit z UI

### Menší

4. **CORS Policy**
   - `allow_origins=["*"]` není vhodné pro production
   - Fix: Omezit na konkrétní domain

5. **Debug Logging**
   - Příliš verbose v production
   - Fix: Vypnout debug level v prod

---

## 📚 Související Dokumentace

- `KMS-IMPLEMENTATION-GUIDE.md` - Krok za krokem návod na dokončení
- `KMS-TESTING.md` - Testovací postupy a očekávané výstupy
- `KMS-QUICK-FIX.md` - Rychlé opravy pro běžné problémy
- `PROJECT-STRUCTURE.md` - Detailní struktura projektu
- `DEBUG-FINDINGS.md` - Debug analýza a zjištění
- `DEBUG-GUIDE.md` - Návod na debugging

---

**Poslední update:** 30.12.2025 02:15 CET
**Verze:** 2.0.0
**Status:** 🟡 Ready for bugfixes
