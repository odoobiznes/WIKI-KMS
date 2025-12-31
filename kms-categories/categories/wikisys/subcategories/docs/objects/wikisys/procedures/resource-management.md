# Resource Block System - Dokumentace

**Datum:** 2025-12-30
**Verze:** 1.0.0

---

## 📋 Přehled

Resource Block System je centrální registr všech serverových zdrojů:
- **Porty** - TCP/UDP porty používané službami
- **Adresáře** - Projektové a systémové složky
- **Databáze** - PostgreSQL databáze a uživatelé
- **Služby** - Systemd jednotky
- **Domény** - Doménová jména a SSL certifikáty
- **Nginx konfigurace** - Webserver nastavení

---

## 🚀 Rychlý Start

### CLI Nástroj

```bash
# Aktivace virtualenv
cd /opt/kms-tools
source venv/bin/activate

# Základní příkazy
python bin/resource-manager.py summary          # Celkový přehled
python bin/resource-manager.py ports list       # Seznam portů
python bin/resource-manager.py conflicts        # Kontrola konfliktů
```

### API Endpointy

```
GET  /api/resources/summary/           # Celkový přehled
GET  /api/resources/ports/             # Seznam portů
GET  /api/resources/ports/available/   # Dostupné porty
GET  /api/resources/check/{type}/{value}  # Kontrola dostupnosti
POST /api/resources/allocate/          # Alokace zdroje
```

---

## 📊 Struktura Zdrojů

### Projekty
Každý projekt má přiřazené zdroje:

| Projekt | Slug | Popis |
|---------|------|-------|
| KMS Tools | kms-tools | Knowledge Management System |
| KMS Data | kms | KMS datové úložiště |
| Odoo 19 | odoo19 | Odoo ERP systém |
| BUS Tickets | bus-tickets | Bus Ticket aplikace |
| WikiSys Local | wikisys | Wiki konfigurace |
| System Services | system | Systémové služby |

### Typy Zdrojů

| Typ | Popis | Příklady |
|-----|-------|----------|
| `port` | TCP/UDP port | 8000, 8443, 5432 |
| `directory` | Adresář | /opt/kms-tools |
| `database` | PostgreSQL DB | kms_db, odoo19 |
| `systemd` | Služba | kms-api.service |
| `domain` | Doména | kms.it-enterprise.solutions |
| `nginx_conf` | Nginx config | /etc/nginx/sites-available/kms |

---

## 🔧 Pracovní Postupy

### 1. Přidání Nového Projektu

```bash
# 1. Najít dostupný port
python bin/resource-manager.py ports available --range 8100-8199

# 2. Zkontrolovat port
python bin/resource-manager.py ports check 8150

# 3. Vytvořit projekt
python bin/resource-manager.py projects create "Můj Projekt" \
    --slug my-project \
    --path /opt/my-project

# 4. Alokovat port
python bin/resource-manager.py ports allocate 8150 "My API" \
    --project my-project \
    --description "REST API pro můj projekt"
```

### 2. Kontrola Před Nasazením

```bash
# Zkontrolovat konflikty
python bin/resource-manager.py conflicts

# Sync s aktuálním stavem
python bin/resource-manager.py sync

# Zobrazit přehled
python bin/resource-manager.py summary
```

### 3. API Použití (curl)

```bash
# Najít dostupný port
curl -s "http://localhost:8000/api/resources/ports/available/?start=8100&end=8199" | jq

# Zkontrolovat dostupnost portu
curl -s "http://localhost:8000/api/resources/check/port/8150" | jq

# Alokovat port
curl -X POST "http://localhost:8000/api/resources/allocate/" \
    -H "Content-Type: application/json" \
    -d '{
        "project_id": 1,
        "resource_type": "port",
        "name": "My API",
        "value": "8150",
        "description": "REST API"
    }'
```

---

## 📁 Umístění Souborů

```
/opt/kms-tools/
├── api/routers/resources.py    # API router
├── bin/resource-manager.py     # CLI nástroj
└── sql/resources-schema.sql    # DB schéma

~/.wikisys-local/
└── docs/procedures/
    └── resource-management.md  # Tato dokumentace
```

---

## 🗄️ Databázové Tabulky

### resource_projects
Projekty vlastnící zdroje

### resources
Hlavní tabulka zdrojů

### resource_dependencies
Závislosti mezi zdroji

### resource_history
Historie změn

### port_ranges
Předdefinované rozsahy portů

---

## 📈 Definované Port Rozsahy

| Rozsah | Účel |
|--------|------|
| 3000-3099 | Web aplikace (frontend) |
| 8100-8199 | Development APIs |
| 8500-8599 | Test prostředí |
| 9000-9099 | Interní služby |
| 22000-23000 | Custom SSH |

---

## 🔍 Časté Problémy

### Neregistrovaný port
```bash
# Zjistit co běží na portu
sudo lsof -i :8080

# Registrovat port
python bin/resource-manager.py ports allocate 8080 "Název služby" --project system
```

### Konflikt portu
```bash
# Kontrola konfliktů
python bin/resource-manager.py conflicts

# Najít alternativní port
python bin/resource-manager.py ports available --range 8100-8200
```

---

## 🔗 Integrace

### KMS Integrace
Resource Block System je integrován s KMS přes API endpoint `/api/resources/`.
Projekty mohou být propojeny s KMS objekty přes `kms_object_id`.

### WikiSys Integrace
Tato dokumentace je součástí WikiSys Local.
Pro secrets management použijte:
```bash
~/.wikisys-local/scripts/secrets-manager.sh
```

---

## 📝 Změny

### v1.0.0 (2025-12-30)
- Initial release
- Port management
- Directory tracking
- Database registry
- Service monitoring
- Domain tracking
- CLI nástroj
- API endpointy

---

*Resource Block System - IT Enterprise Solutions*
