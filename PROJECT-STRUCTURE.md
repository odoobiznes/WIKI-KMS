# KMS Tools - Struktura Projektu

**Hlavní adresář:** `/opt/kms-tools/`

---

## 📂 Kompletní Struktura

```
/opt/kms-tools/                    # HLAVNÍ PROJEKT (75 MB celkem)
│
├── 📄 CHANGELOG-DEBUG.md          # Co jsme přidali (debug logging)
├── 📄 DEBUG-FINDINGS.md           # Zjištění a řešení problémů
├── 📄 DEBUG-GUIDE.md              # Návod na debug logging
├── 📄 PROJECT-STRUCTURE.md        # Tento soubor
│
├── 🔧 api/                        # BACKEND API (FastAPI) - 232 KB
│   ├── main.py                    # Hlavní FastAPI aplikace (4.6 KB)
│   ├── database.py                # Databázové připojení (PostgreSQL)
│   ├── models.py                  # Pydantic modely (6.4 KB)
│   ├── requirements.txt           # Python dependencies
│   │
│   └── routers/                   # API Endpointy
│       ├── categories.py          # /api/categories/* (5.7 KB)
│       ├── objects.py             # /api/objects/* (6.3 KB)
│       ├── documents.py           # /api/documents/* (5.0 KB)
│       ├── search.py              # /api/search/* (3.3 KB)
│       ├── system.py              # /api/system/* (3.9 KB)
│       ├── tools.py               # /api/tools/* (28 KB) ← HLAVNÍ SOUBOR
│       └── tools_claude.py        # Claude AI integrace (4.1 KB)
│
├── 🌐 frontend/                   # FRONTEND WEB (88 KB)
│   ├── public/                    # Statické soubory
│   └── src/                       # React/Vue source kód (prázdné)
│
├── 🛠️ bin/                        # UTILITY SKRIPTY (80 KB)
│   ├── kms-cli.py                 # CLI nástroj pro správu (23 KB)
│   ├── kms-import.py              # Import dat do databáze (14 KB)
│   ├── kms-sync-daemon.py         # Sync daemon (20 KB)
│   ├── test-all-tools.sh          # Test všech nástrojů (6.3 KB)
│   ├── test-db.sh                 # Test databáze
│   └── view-logs.sh               # Interaktivní log viewer (2.9 KB)
│
├── 💾 data/                       # DATA (88 KB)
│   └── code-server/               # VS Code konfigurace
│
├── 📚 docs/                       # DOKUMENTACE (4 KB)
│
├── 📜 lib/                        # KNIHOVNY (4 KB)
│
├── 🗄️ sql/                        # SQL SKRIPTY (4 KB)
│   └── schema.sql                 # Databázové schéma
│
├── ⚙️ systemd/                    # SYSTEMD SERVICES (4 KB)
│   ├── kms-api.service
│   ├── kms-sync-daemon.service
│   └── další služby...
│
└── 🐍 venv/                       # PYTHON VIRTUAL ENV (75 MB)
    ├── bin/                       # Python executables
    ├── lib/                       # Nainstalované balíčky
    └── include/                   # Header soubory
```

---

## 🎯 Hlavní Soubory Kódu

### Backend API (Python/FastAPI)

**Hlavní aplikace:**
- `/opt/kms-tools/api/main.py` - FastAPI app, middleware, routery

**Databáze:**
- `/opt/kms-tools/api/database.py` - PostgreSQL connection pool
- `/opt/kms-tools/api/models.py` - Pydantic data modely

**API Routery:**
- `/opt/kms-tools/api/routers/tools.py` ← **NEJVĚTŠÍ SOUBOR (28 KB)**
  - Terminal, File Browser, VS Code endpointy
  - Windsurf, Cursor endpointy
  - Claude AI chat
  - Status všech nástrojů
  - Kompletní debug logging

- `/opt/kms-tools/api/routers/objects.py` - Správa objektů/projektů
- `/opt/kms-tools/api/routers/categories.py` - Kategorie
- `/opt/kms-tools/api/routers/documents.py` - Dokumenty
- `/opt/kms-tools/api/routers/search.py` - Vyhledávání
- `/opt/kms-tools/api/routers/system.py` - Systémové info

### Frontend (Web Interface)

**React/Vue aplikace:**
- `/opt/kms-tools/frontend/src/` - Source kód (prázdné - TODO)
- `/opt/kms-tools/frontend/public/` - Statické soubory

### Utility Skripty

**Python CLI:**
- `/opt/kms-tools/bin/kms-cli.py` - CLI nástroj
- `/opt/kms-tools/bin/kms-import.py` - Import dat
- `/opt/kms-tools/bin/kms-sync-daemon.py` - Synchronizační daemon

**Bash skripty:**
- `/opt/kms-tools/bin/test-all-tools.sh` - Testování nástrojů
- `/opt/kms-tools/bin/view-logs.sh` - Log viewer

---

## 🗄️ Databáze

**Typ:** PostgreSQL
**Uživatel:** kms_user
**Databáze:** kms_db

**Schéma:**
```
/opt/kms-tools/sql/schema.sql
```

**Tabulky:**
- `categories` - Kategorie projektů (odoo, wordpress, atd.)
- `objects` - Projekty/objekty
- `documents` - Dokumenty přiřazené k objektům
- `sync_log` - Log synchronizace

---

## 🔌 Systemd Services

**Lokace:** `/etc/systemd/system/`

**Služby:**
```bash
kms-api.service              # FastAPI backend (port 8000)
kms-sync-daemon.service      # Sync daemon
kms-tools-ttyd.service       # Web terminal (port 7681)
kms-tools-filebrowser.service # File browser (port 8082)
kms-tools-code-server.service # VS Code (port 8443)
```

**Konfigurace služeb také v:**
```
/opt/kms-tools/systemd/
```

---

## 🌐 Webový Frontend

**Hlavní vstupní bod:**
```
https://kms.it-enterprise.solutions/
```

**API Endpoints:**
```
https://kms.it-enterprise.solutions/api/
https://kms.it-enterprise.solutions/api/docs  (Swagger UI)
```

**Nástroje:**
```
https://kms.it-enterprise.solutions/tools/terminal/
https://kms.it-enterprise.solutions/tools/files/
https://kms.it-enterprise.solutions/tools/vscode/
```

---

## 📊 API Endpointy (kompletní seznam)

### Kategorie
```
GET    /api/categories          # Seznam všech kategorií
GET    /api/categories/{id}     # Detail kategorie
POST   /api/categories          # Nová kategorie
PUT    /api/categories/{id}     # Update kategorie
DELETE /api/categories/{id}     # Smazat kategorii
```

### Objekty (Projekty)
```
GET    /api/objects             # Seznam všech objektů
GET    /api/objects/{id}        # Detail objektu
GET    /api/objects/category/{slug}  # Objekty podle kategorie
POST   /api/objects             # Nový objekt
PUT    /api/objects/{id}        # Update objektu
DELETE /api/objects/{id}        # Smazat objekt
```

### Dokumenty
```
GET    /api/documents           # Seznam dokumentů
GET    /api/documents/object/{id}    # Dokumenty objektu
POST   /api/documents           # Nový dokument
PUT    /api/documents/{id}      # Update dokumentu
DELETE /api/documents/{id}      # Smazat dokument
```

### Vyhledávání
```
GET    /api/search?q={query}   # Fulltextové vyhledávání
GET    /api/search/objects?q={query}  # Hledat objekty
GET    /api/search/documents?q={query}  # Hledat dokumenty
```

### Systém
```
GET    /api/system/health       # Zdraví systému
GET    /api/system/stats        # Statistiky
GET    /api/system/changelog    # Changelog
GET    /api/system/sync-status  # Status synchronizace
```

### Nástroje ← **HLAVNÍ ČÁST**
```
# Web nástroje
POST   /api/tools/terminal/open      # Otevřít web terminal
POST   /api/tools/files/open         # Otevřít file browser
POST   /api/tools/vscode/open        # Otevřít VS Code

# Desktop editory
POST   /api/tools/windsurf/open      # Otevřít Windsurf
POST   /api/tools/cursor/open        # Otevřít Cursor

# Claude AI
POST   /api/tools/claude/chat        # Chat s Claude
GET    /api/tools/claude/models      # Seznam modelů

# Status
GET    /api/tools/status             # Status všech nástrojů
```

---

## 🔧 Konfigurace

### Environment Variables

**V systemd service:**
```
/etc/systemd/system/kms-api.service
```

**Proměnné:**
```bash
ANTHROPIC_API_KEY=sk-ant-api...
PATH=/opt/kms-tools/venv/bin:/usr/local/bin:/usr/bin:/bin
VIRTUAL_ENV=/opt/kms-tools/venv
```

### Python Dependencies

```
/opt/kms-tools/api/requirements.txt
```

**Hlavní balíčky:**
- fastapi
- uvicorn
- psycopg2-binary
- anthropic
- pydantic
- requests

---

## 📝 Logy

**API logy (systemd):**
```bash
sudo journalctl -u kms-api.service -f
```

**Debug log soubor:**
```
/tmp/kms-api-debug.log
```

**Interaktivní log viewer:**
```bash
/opt/kms-tools/bin/view-logs.sh
```

---

## 🚀 Jak spustit

### Manuální start služby
```bash
# Restart API
sudo systemctl restart kms-api.service

# Status
systemctl status kms-api.service

# Sledovat logy
sudo journalctl -u kms-api.service -f
```

### Dev mode (lokální)
```bash
cd /opt/kms-tools/api
source ../venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Testování
```bash
# Test všech nástrojů
/opt/kms-tools/bin/test-all-tools.sh

# Test API
curl http://localhost:8000/api/tools/status
```

---

## 🎓 Dokumentace

**Debug dokumentace:**
- `/opt/kms-tools/DEBUG-GUIDE.md` - Návod na debugging
- `/opt/kms-tools/DEBUG-FINDINGS.md` - Zjištění z debuggingu
- `/opt/kms-tools/CHANGELOG-DEBUG.md` - Co bylo přidáno

**API dokumentace:**
```
http://localhost:8000/api/docs      # Swagger UI
http://localhost:8000/api/redoc     # ReDoc
```

---

## 📈 Statistiky Projektu

```
Celková velikost:      ~75 MB
Backend kód:           232 KB (Python)
Frontend kód:          88 KB (prázdné)
Utility skripty:       80 KB
Virtual env:           75 MB
Debug dokumentace:     28 KB

Počet API endpointů:   ~35
Počet Python souborů:  ~15
Počet Bash skriptů:    ~5
```

---

## 🔐 Přístupy

**PostgreSQL:**
```
Host: localhost
Database: kms_db
User: kms_user
Password: [v env nebo v konfig souboru]
```

**Web Services:**
```
API:           http://localhost:8000
Terminal:      http://localhost:7681
File Browser:  http://localhost:8082
VS Code:       http://localhost:8443
```

**Reverse Proxy (Nginx):**
```
https://kms.it-enterprise.solutions/
```

---

## 🛠️ Vývoj

**Hlavní vývojové soubory:**
1. `/opt/kms-tools/api/routers/tools.py` - Nástroje & integrace
2. `/opt/kms-tools/api/main.py` - Aplikační logika
3. `/opt/kms-tools/bin/kms-cli.py` - CLI nástroje

**Přidání nového endpointu:**
1. Editovat příslušný router v `/opt/kms-tools/api/routers/`
2. Přidat do `main.py` pokud je nový router
3. Restart služby: `sudo systemctl restart kms-api.service`

**Přidání nového nástroje:**
1. Editovat `/opt/kms-tools/api/routers/tools.py`
2. Přidat endpoint funkci
3. Přidat do `/api/tools/status`
4. Restart a test

---

**Vytvořeno:** 30.12.2025 02:00 CET
**Verze:** 1.0.0
**Vlastník:** devops@it-enterprise.solutions
