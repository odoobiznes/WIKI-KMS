# KMS Tools - Debug Guide

## Přidané debug logování

### Co bylo přidáno

1. **Hlavní API (main.py)**
   - Detailní startup logování
   - Request/Response middleware s časováním
   - Logování všech headers
   - Exception handling s full stack traces
   - Router registration monitoring

2. **Tools Router (routers/tools.py)**
   - Logování každého otevření nástroje
   - Database query logging
   - Path resolution debugging
   - Service status checks
   - Error tracking s kontextem

### Typy logů

- **INFO**: Normální operace (úspěšné requesty, spuštění služeb)
- **DEBUG**: Detailní informace (DB queries, path resolution)
- **WARNING**: Potenciální problémy (nenalezené objekty)
- **ERROR**: Chyby s full stack trace

### Sledování logů

#### Rychlý přístup
```bash
# Spustit interaktivní log viewer
/opt/kms-tools/bin/view-logs.sh
```

#### Manuální příkazy

**Live monitoring všech API requests:**
```bash
sudo journalctl -u kms-api.service -f
```

**Pouze chyby:**
```bash
sudo journalctl -u kms-api.service -p err -f
```

**Posledních 100 řádků:**
```bash
sudo journalctl -u kms-api.service -n 100 --no-pager
```

**Filtrování podle nástroje:**
```bash
# Terminal
sudo journalctl -u kms-api.service | grep -i "TERMINAL"

# VS Code
sudo journalctl -u kms-api.service | grep -i "VS CODE"

# File Browser
sudo journalctl -u kms-api.service | grep -i "FILE BROWSER"

# Claude AI
sudo journalctl -u kms-api.service | grep -i "CLAUDE"
```

**Sledování konkrétního objektu:**
```bash
sudo journalctl -u kms-api.service | grep "object_id=1"
```

**Všechny KMS služby najednou:**
```bash
sudo journalctl -u 'kms-*' -f
```

### Debug formát

Všechny logy obsahují:
- **Timestamp**: Přesný čas události
- **Logger name**: Který modul vytvořil log (main, routers.tools, atd.)
- **Level**: INFO/DEBUG/WARNING/ERROR
- **File:Line**: Přesná lokace v kódu
- **Message**: Detailní popis

**Příklad:**
```
2025-12-30 01:37:27,773 - routers.tools - INFO - [tools.py:123] - 🖥️  TERMINAL OPEN REQUEST: object_id=1, folder=None
```

### Emoji indikátory

Pro rychlou orientaci:
- 🖥️ = Terminal request
- 📁 = File Browser request
- 💻 = VS Code request
- 🤖 = Claude AI request
- 📊 = Status check
- ✓ = Úspěch
- ✗ = Chyba
- → = Příchozí request
- ← = Odchozí response

### Diagnostika problémů

#### Nástroj nefunguje

1. **Zkontroluj status služby:**
```bash
curl http://localhost:8000/api/tools/status | python3 -m json.tool
```

2. **Sleduj logy během pokusu o otevření:**
```bash
sudo journalctl -u kms-api.service -f
```

3. **Otestuj endpoint:**
```bash
# Terminal
curl -X POST http://localhost:8000/api/tools/terminal/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'

# File Browser
curl -X POST http://localhost:8000/api/tools/files/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'

# VS Code
curl -X POST http://localhost:8000/api/tools/vscode/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'
```

4. **Zkontroluj systemd služby:**
```bash
systemctl status kms-tools-ttyd
systemctl status kms-tools-filebrowser
systemctl status kms-tools-code-server
```

#### Chyby v DB queries

Hledej:
```bash
sudo journalctl -u kms-api.service | grep "get_object_path"
```

#### Path resolution problémy

```bash
sudo journalctl -u kms-api.service | grep "get_full_path"
```

#### Network/HTTP problémy

```bash
sudo journalctl -u kms-api.service | grep "REQUEST:\|RESPONSE:"
```

### Restart služby po změnách

```bash
# Restart API
sudo systemctl restart kms-api.service

# Ověř, že funguje
systemctl status kms-api.service

# Sleduj startup
sudo journalctl -u kms-api.service -f
```

### Běžné problémy a řešení

#### 1. Object not found (404)
**Log:**
```
get_object_path: Object X not found in database
```
**Řešení:** Zkontroluj, zda objekt existuje v databázi

#### 2. Path does not exist (404)
**Log:**
```
get_full_path: Path does not exist: /opt/DevOPS/Internal/Proects/...
```
**Řešení:** Zkontroluj, zda fyzická složka existuje

#### 3. Service not running
**Log:**
```
Service kms-tools-XXX: stopped
```
**Řešení:**
```bash
sudo systemctl start kms-tools-XXX
sudo systemctl enable kms-tools-XXX
```

#### 4. Database connection error
**Log:**
```
Database error: connection failed
```
**Řešení:**
```bash
systemctl status postgresql
sudo systemctl start postgresql
```

### Výkonnostní monitoring

**Request timing:**
Každý request obsahuje `X-Process-Time` header a log:
```
← RESPONSE: POST /api/tools/terminal/open - Status: 200 - Time: 0.395s
```

**Pomalé requesty (>1s):**
```bash
sudo journalctl -u kms-api.service | grep "Time: [1-9]\\."
```

### Dodatečné nástroje

**Real-time filtering:**
```bash
# Sleduj pouze úspěšné operace
sudo journalctl -u kms-api.service -f | grep "✓"

# Sleduj pouze chyby
sudo journalctl -u kms-api.service -f | grep "✗"

# Sleduj konkrétní user/IP
sudo journalctl -u kms-api.service -f | grep "127.0.0.1"
```

**Export logů:**
```bash
# Exportovat poslední hodinu do souboru
sudo journalctl -u kms-api.service --since "1 hour ago" > /tmp/kms-logs.txt

# Exportovat dnes
sudo journalctl -u kms-api.service --since today > /tmp/kms-logs-today.txt
```

## Kontakt

Pro další pomoc nebo dotazy:
- GitHub Issues: [Váš repozitář]
- Email: [Váš email]
