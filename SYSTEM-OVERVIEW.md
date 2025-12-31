# DevOPS Server - Kompletní Přehled Systémů

**Server:** devsoft.it-enterprise.solutions
**Datum:** 2025-12-30
**Verze:** 1.0.0

---

## 🏗️ Architektura Systémů

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVOPS SERVER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   WikiSys    │  │     KMS      │  │   Resource   │              │
│  │    Local     │  │    Tools     │  │    Block     │              │
│  │              │  │              │  │              │              │
│  │ • Docs       │  │ • API        │  │ • Ports      │              │
│  │ • Procedures │  │ • Frontend   │  │ • Dirs       │              │
│  │ • Secrets    │  │ • Tools      │  │ • DBs        │              │
│  │ • Backup     │  │   - Terminal │  │ • Services   │              │
│  │ • Security   │  │   - Files    │  │ • Domains    │              │
│  │              │  │   - VS Code  │  │              │              │
│  └──────────────┘  │   - Claude   │  └──────────────┘              │
│                    └──────────────┘                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     PROJEKTY                                  │   │
│  │                                                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Odoo 19  │  │   BUS    │  │    IT    │  │  DevOPS  │    │   │
│  │  │          │  │ Tickets  │  │Enterprise│  │          │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     INFRASTRUKTURA                           │   │
│  │                                                               │   │
│  │  PostgreSQL 16 & 18  │  Redis  │  Nginx  │  Systemd         │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Systémy

### 1. WikiSys Local
**Umístění:** `~/.wikisys-local/`
**Účel:** Dokumentace, procedury, secrets management, backup

```
~/.wikisys-local/
├── docs/
│   ├── procedures/
│   │   ├── backup-strategy.md
│   │   ├── secrets-workflow.md
│   │   ├── resource-management.md    # NEW
│   │   └── ...
│   ├── servers/
│   └── tasks/
└── scripts/
    ├── secrets-manager.sh
    ├── borg-runner.sh
    └── notify.sh
```

### 2. KMS (Knowledge Management System)
**Umístění:** `/opt/kms-tools/` (tools) + `/opt/kms/` (data)
**URL:** https://kms.it-enterprise.solutions/
**Účel:** Správa znalostí, projektů, dokumentů

**Komponenty:**
- **API** (FastAPI) - Port 8000
- **Frontend** (HTML/JS) - Nginx proxy
- **Web Terminal** (ttyd) - Port 7681
- **File Browser** - Port 8082
- **VS Code** (code-server) - Port 8443
- **Claude AI** - API integrace

### 3. Resource Block System
**Umístění:** `/opt/kms-tools/` (integrováno s KMS)
**API:** https://kms.it-enterprise.solutions/api/resources/
**CLI:** `/opt/kms-tools/bin/resource-manager.py`
**Účel:** Centrální registr serverových zdrojů

**Sledované zdroje:**
- Porty (TCP/UDP)
- Adresáře
- PostgreSQL databáze
- Systemd služby
- Domény a SSL
- Nginx konfigurace

### 4. Backup Systems
**Umístění:** `/opt/BackUps/`
**Nástroj:** Borg Backup
**Účel:** Zálohy dat a konfigurací

---

## 🔌 Aktivní Porty

| Port | Služba | Projekt | Binding |
|------|--------|---------|---------|
| 22770 | SSH | System | 0.0.0.0 |
| 80 | Nginx HTTP | System | 0.0.0.0 |
| 443 | Nginx HTTPS | System | 0.0.0.0 |
| 5432 | PostgreSQL 16 | System | 127.0.0.1 |
| 5433 | PostgreSQL 18 | System | 127.0.0.1 |
| 6379 | Redis | System | 0.0.0.0 |
| 7681 | KMS Terminal | KMS Tools | 127.0.0.1 |
| 8000 | KMS API | KMS Tools | 127.0.0.1 |
| 8069 | Odoo Web | Odoo 19 | 0.0.0.0 |
| 8072 | Odoo Longpoll | Odoo 19 | 0.0.0.0 |
| 8082 | FileBrowser | KMS Tools | 127.0.0.1 |
| 8443 | VS Code Web | KMS Tools | 127.0.0.1 |
| 11211 | Memcached | System | 127.0.0.1 |
| 44770 | Bus Tickets | BUS Tickets | * |

---

## 🗄️ Databáze

| Databáze | Cluster | Účel |
|----------|---------|------|
| kms_db | 16-main | KMS systém |
| odoo19 | 18-main | Odoo ERP |

---

## 🌐 Domény

| Doména | SSL | Projekt |
|--------|-----|---------|
| kms.it-enterprise.solutions | ✓ | KMS Tools |
| sell.bus-ticket.info | ✓ | BUS Tickets |

---

## 🔧 Užitečné Příkazy

### KMS
```bash
# Status KMS služeb
systemctl status kms-api.service
systemctl status kms-tools-ttyd.service
systemctl status kms-tools-filebrowser.service
systemctl status kms-tools-code-server.service

# Logy
sudo journalctl -u kms-api.service -f

# Restart
sudo systemctl restart kms-api.service
```

### Resource Management
```bash
cd /opt/kms-tools && source venv/bin/activate

# Přehled zdrojů
python bin/resource-manager.py summary

# Porty
python bin/resource-manager.py ports list --check-system
python bin/resource-manager.py ports available --range 8100-8200
python bin/resource-manager.py ports check 8150

# Projekty
python bin/resource-manager.py projects list

# Konflikty
python bin/resource-manager.py conflicts
```

### WikiSys
```bash
# Secrets
~/.wikisys-local/scripts/secrets-manager.sh list
~/.wikisys-local/scripts/secrets-manager.sh decrypt <secret-name>

# Backup status
~/.wikisys-local/scripts/borg-status.sh
```

---

## 📁 Klíčové Adresáře

```
/opt/
├── kms-tools/          # KMS aplikace
├── kms/                # KMS data (categories, objects)
├── Odoo/               # Odoo instalace
├── BUS-Tickets/        # Bus ticket systém
├── IT-Enterprise/      # IT Enterprise projekty
├── DevOPS/             # DevOPS nástroje
└── BackUps/            # Zálohy

/home/devops/
└── .wikisys-local/     # WikiSys lokální konfigurace

/etc/nginx/
└── sites-available/    # Nginx konfigurace
```

---

## 🔒 Bezpečnost

- **SSH:** Custom port 22770
- **SSL:** Let's Encrypt certifikáty
- **Secrets:** WikiSys secrets-manager.sh
- **Firewall:** UFW
- **Backup:** Borg s šifrováním

---

## 📞 Kontakty

- **Email:** devops@it-enterprise.solutions
- **Server:** devsoft.it-enterprise.solutions

---

*IT Enterprise Solutions - DevOPS Infrastructure*
