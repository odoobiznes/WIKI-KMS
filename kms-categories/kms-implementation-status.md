# KMS - Status Implementace & Další Kroky

**Datum:** 2025-12-29
**Server:** devsoft (ssaass.it-enterprise.solutions)
**Status:** Fáze 1 & 2 DOKONČENY ✅

---

## ✅ CO JE HOTOVÉ

### 1. Architektura (DONE ✓)
- ✅ Kompletní návrh dual-storage systému
- ✅ File-based struktura navržena
- ✅ PostgreSQL schema navrženo
- ✅ Synchronizační mechanismus navržen
- ✅ Web interface architektura
- ✅ Bezpečnostní model
- ✅ Backup strategie

**Dokumentace:** `/opt/kms-tools/docs/kms-architecture.md`

### 2. File-based Struktura (DONE ✓)
- ✅ `/opt/kms/` vytvořeno a nakonfigurováno
- ✅ 8 produktových kategorií: odoo, pohoda, busticket, x-man, sysadmin, servers, devops, platforms
- ✅ 5 systémových kategorií: sablona, plany, task, projekty, instrukce
- ✅ Hierarchie: Kategorie → Podkategorie → Objekty
- ✅ Default složky: plany/, instrukce/, code/, docs/
- ✅ Metadata (.meta.yaml) pro všechny úrovně
- ✅ Globální šablony vytvořeny
- ✅ Příklady: Odoo (mobil/bus-ticket), BusTicket (backend/api-server)

**Stats:**
```
Celkem kategorií: 13 (8 product + 5 system)
Příklad objektů:  4
Celkem složek:    98
Celkem souborů:   47
Velikost:         580K
```

**Struktura:**
```
/opt/kms/
├── categories/
│   ├── odoo/
│   │   ├── subcategories/
│   │   │   ├── mobil/
│   │   │   │   └── objects/
│   │   │   │       └── bus-ticket/
│   │   │   │           ├── plany/
│   │   │   │           ├── instrukce/
│   │   │   │           ├── code/
│   │   │   │           └── docs/
│   │   │   ├── odoo18/
│   │   │   └── pwa/
│   │   └── objects/
│   │       └── odoo-integration-api/
│   ├── (další kategorie...)
│   └── sablona/
│       └── master_templates/
├── _global_templates/
├── VERSION
├── CHANGELOG.md
└── README.md
```

---

## 🚧 CO ZBÝVÁ UDĚLAT

### Fáze 3: PostgreSQL (2-3 hodiny)
- [ ] Instalovat PostgreSQL 17
- [ ] Vytvořit databázi `kms_db`
- [ ] Spustit SQL schema (categories, objects, documents, atd.)
- [ ] Vytvořit DB uživatele a permissions
- [ ] Test basic queries

### Fáze 4: Synchronizace (4-6 hodin)
- [ ] Python sync daemon (`kms-sync.py`)
- [ ] File watcher (inotify)
- [ ] DB triggers
- [ ] Initial import (file → DB)
- [ ] Bidirectional sync logic
- [ ] Conflict resolution
- [ ] Systemd service

### Fáze 5: CLI Tools (2-3 hodiny)
- [ ] `kms-cli.py` - Správa KMS z příkazové řádky
- [ ] Příkazy: create-category, create-object, apply-template
- [ ] Search příkazy
- [ ] Backup/restore příkazy

### Fáze 6: Web Interface (8-12 hodin)
#### Backend (FastAPI)
- [ ] FastAPI aplikace (`kms-api`)
- [ ] CRUD endpoints (categories, objects, documents)
- [ ] Fulltextové vyhledávání
- [ ] Authentication (JWT)
- [ ] Authorization (RBAC)
- [ ] File upload/download
- [ ] Markdown rendering

#### Frontend (React)
- [ ] React aplikace
- [ ] Tree view pro hierarchii
- [ ] Markdown editor
- [ ] Code editor (Monaco)
- [ ] Search UI
- [ ] Version diff viewer
- [ ] Drag & drop

### Fáze 7: Security & Deployment (3-4 hodiny)
- [ ] SSL certifikáty (Let's Encrypt)
- [ ] Nginx reverse proxy
- [ ] Cloudflare DNS setup ⬅️ (instrukce níže)
- [ ] Firewall rules (UFW)
- [ ] Borg backup pro /opt/kms
- [ ] PostgreSQL backup
- [ ] Monitoring & logging

---

## 🌐 CLOUDFLARE DNS SETUP - INSTRUKCE

### Předpoklady
- Máte doménu `it-enterprise.solutions` v Cloudflare
- Máte API token nebo přístup k Dashboard
- Server má veřejnou IP adresu

### Kroky v Cloudflare Dashboard

#### 1. Přihlášení
```
1. Jdi na https://dash.cloudflare.com
2. Přihlaš se s účtem
3. Vyber doménu: it-enterprise.solutions
```

#### 2. DNS Records - Web Interface
```
Navigace: DNS > Records > Add record

Record 1 - Hlavní web interface:
─────────────────────────────────
Type:    A
Name:    kms
IPv4:    <IP_ADRESA_SERVERU>  # např. 123.45.67.89
TTL:     Auto
Proxy:   ✅ Proxied (oranžový cloud)
```

```
Record 2 - API subdoména:
─────────────────────────────────
Type:    A
Name:    api.kms
IPv4:    <IP_ADRESA_SERVERU>
TTL:     Auto
Proxy:   ✅ Proxied (oranžový cloud)
```

**Výsledek:**
- `kms.it-enterprise.solutions` → Web UI
- `api.kms.it-enterprise.solutions` → API Backend

#### 3. SSL/TLS Nastavení
```
Navigace: SSL/TLS > Overview

SSL/TLS encryption mode: Full (strict)
                         ────────────────
                         ⚠️ DŮLEŽITÉ: Vyžaduje SSL certifikát na serveru!

Následně:
SSL/TLS > Edge Certificates:
  ✅ Always Use HTTPS: On
  ✅ Automatic HTTPS Rewrites: On
  ✅ Minimum TLS Version: 1.2
```

#### 4. Page Rules (Volitelné)
```
Navigace: Rules > Page Rules > Create Page Rule

URL: *.kms.it-enterprise.solutions/*
Settings:
  - SSL: Full (strict)
  - Cache Level: Standard
  - Security Level: Medium
```

#### 5. Firewall Rules (Doporučeno)
```
Navigace: Security > WAF

Vytvořit pravidlo:
  Field:     Country
  Operator:  not in
  Value:     CZ, SK  (povolené země)
  Action:    Block

(Přizpůsob podle potřeb)
```

### Ověření DNS
```bash
# Na serveru nebo lokálně
dig kms.it-enterprise.solutions
dig api.kms.it-enterprise.solutions

# Mělo by vrátit Cloudflare IP (ne přímo server IP - kvůli proxy)
```

### SSL Certifikát na Serveru

**Použij Let's Encrypt + Certbot:**
```bash
# Instalace certbot
sudo apt install -y certbot python3-certbot-nginx

# Získání certifikátu
sudo certbot --nginx -d kms.it-enterprise.solutions -d api.kms.it-enterprise.solutions

# Auto-renewal (certbot to nastaví automaticky)
sudo certbot renew --dry-run
```

**Nebo Cloudflare Origin Certificate:**
```
1. Cloudflare Dashboard → SSL/TLS → Origin Server
2. Create Certificate
3. Validity: 15 years
4. Download: PEM format
5. Ulož na server:
   /etc/ssl/cloudflare/origin-cert.pem
   /etc/ssl/cloudflare/origin-key.pem
```

### Nginx Konfigurace

**/etc/nginx/sites-available/kms.conf:**
```nginx
# Web Interface
server {
    listen 443 ssl http2;
    server_name kms.it-enterprise.solutions;

    # SSL
    ssl_certificate /etc/letsencrypt/live/kms.it-enterprise.solutions/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kms.it-enterprise.solutions/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to web UI (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Backend
server {
    listen 443 ssl http2;
    server_name api.kms.it-enterprise.solutions;

    # SSL (same as above)
    ssl_certificate /etc/letsencrypt/live/kms.it-enterprise.solutions/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kms.it-enterprise.solutions/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to FastAPI
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name kms.it-enterprise.solutions api.kms.it-enterprise.solutions;
    return 301 https://$server_name$request_uri;
}
```

**Aktivace:**
```bash
sudo ln -s /etc/nginx/sites-available/kms.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📋 IMPLEMENTAČNÍ PLÁN - DALŠÍ SESSION

### Quick Start - PostgreSQL
```bash
# 1. Instalace PostgreSQL 17
sudo apt install -y postgresql-17 postgresql-contrib-17

# 2. Start služby
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Vytvoř databázi
sudo -u postgres psql <<EOF
CREATE DATABASE kms_db;
CREATE USER kms_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE kms_db TO kms_user;
\q
EOF

# 4. Nahraj schema
sudo -u postgres psql kms_db < /opt/kms-tools/sql/schema.sql

# 5. Test
psql -U kms_user -d kms_db -h localhost -c "SELECT version();"
```

### Quick Start - Synchronizace
```bash
# 1. Vytvoř Python virtual environment
python3 -m venv /opt/kms-tools/venv
source /opt/kms-tools/venv/bin/activate

# 2. Instaluj dependencies
pip install psycopg2-binary pyyaml watchdog

# 3. Spusť initial import
python /opt/kms-tools/bin/kms-sync.py --init

# 4. Spusť daemon
python /opt/kms-tools/bin/kms-sync.py --daemon

# 5. Systemd service
sudo cp /opt/kms-tools/systemd/kms-sync.service /etc/systemd/system/
sudo systemctl enable kms-sync
sudo systemctl start kms-sync
```

### Quick Start - Web Interface
```bash
# Backend
cd /opt/kms-tools/web/backend
pip install fastapi uvicorn sqlalchemy psycopg2-binary
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd /opt/kms-tools/web/frontend
npm install
npm start  # Development
npm run build  # Production
```

---

## 🎯 ODHADOVANÝ ČAS DOKONČENÍ

| Fáze | Čas | Priorita |
|------|-----|----------|
| PostgreSQL setup | 2-3h | HIGH |
| Synchronizace | 4-6h | HIGH |
| CLI Tools | 2-3h | MEDIUM |
| Web Backend | 4-6h | HIGH |
| Web Frontend | 6-8h | MEDIUM |
| Security & Deploy | 3-4h | HIGH |
| Testing & Polish | 2-3h | MEDIUM |
| **TOTAL** | **23-33h** | - |

**Realistický odhad:** 3-4 pracovní dny (8h/den)

---

## 📚 REFERENCES

**Dokumentace:**
- Architektura: `/opt/kms-tools/docs/kms-architecture.md`
- KMS Root: `/opt/kms/`
- README: `/opt/kms/README.md`

**Code Repositories (budoucí):**
- Backend: `/opt/kms-tools/web/backend/`
- Frontend: `/opt/kms-tools/web/frontend/`
- Sync Daemon: `/opt/kms-tools/bin/`
- SQL Schemas: `/opt/kms-tools/sql/`

**Cloudflare:**
- Dashboard: https://dash.cloudflare.com
- DNS API: https://api.cloudflare.com/#dns-records-for-a-zone
- SSL Docs: https://developers.cloudflare.com/ssl/

**PostgreSQL:**
- Fulltext Search: https://www.postgresql.org/docs/current/textsearch.html
- Triggers: https://www.postgresql.org/docs/current/plpgsql-trigger.html

**FastAPI:**
- Docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

---

## 🔐 SECURITY CHECKLIST

Před deployment:
- [ ] PostgreSQL používá silné heslo
- [ ] API používá JWT autentizaci
- [ ] Všechny secrets zašifrovány (age)
- [ ] SSL certifikáty nakonfigurovány
- [ ] Firewall (UFW) aktivní
- [ ] Fail2ban pro SSH/Web
- [ ] Borg backupy automatizovány
- [ ] Monitoring nastaven
- [ ] Logs rotovány

---

## 💡 NEXT STEPS - AKCE

### Okamžitě (Pokračovat nyní)
```bash
# Pokračovat s PostgreSQL instalací
sudo apt install -y postgresql-17
```

### Nebo Odložit
- Dokumentace je kompletní
- Struktura je připravena
- Cloudflare instrukce jsou k dispozici
- Můžeš pokračovat kdykoliv

**Jak pokračovat později:**
```bash
# 1. Načíst dokumentaci
cat /opt/kms/README.md
cat /tmp/kms-implementation-status.md

# 2. Zkontrolovat strukturu
ls -la /opt/kms/categories/

# 3. Spustit PostgreSQL setup (viz Quick Start výše)
```

---

**Status:** Ready for Phase 3 🚀
**Datum:** 2025-12-29
**Autor:** Claude (IT Enterprise Solutions)
