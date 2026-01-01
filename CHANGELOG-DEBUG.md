# KMS Tools - Debug Logging Update

## Co bylo přidáno (30.12.2025)

### 🔍 Kompletní Debug Logování

#### 1. Hlavní API (main.py)
✅ **Startup logging**
- Logování inicializace všech modulů
- Sledování importu routerů
- Registrace všech endpointů s potvrzením

✅ **Request/Response Middleware**
- Logování všech příchozích requestů s headers
- Měření času zpracování (process time)
- Status codes a response timing
- Client IP tracking

✅ **Exception Handling**
- Plné stack traces pro všechny chyby
- Structured error logging
- 404 a 500 error handlers s logováním

#### 2. Tools Router (routers/tools.py)
✅ **Endpoint Logging**
- 🖥️ Terminal Open - kompletní tracking
- 📁 File Browser Open - plné logování
- 💻 VS Code Open - detailní debug
- 🤖 Claude AI Chat - request/response logging
- 📊 Tools Status - service checks

✅ **Helper Functions**
- `get_object_path()` - DB query logging
- `get_full_path()` - path resolution debug
- Service status checks s výstupy

✅ **Error Handling**
- Detekce chybějících objektů v DB
- Path validation s debug info
- Database connection errors
- Service status checks

### 📁 Nové Soubory

#### `/opt/kms-tools/bin/view-logs.sh`
Interaktivní log viewer s možnostmi:
1. Live logs KMS API
2. Všechny KMS služby
3. Pouze chyby
4. Posledních 100 řádků
5. Filtr podle nástroje
6. Live monitoring všech tools

**Použití:**
```bash
/opt/kms-tools/bin/view-logs.sh
```

#### `/opt/kms-tools/bin/test-all-tools.sh`
Kompletní test suite pro všechny nástroje:
- ✅ Systemd služby (kms-api, ttyd, filebrowser, code-server)
- ✅ API endpoints (všechny tools)
- ✅ Nainstalované editory (Windsurf, Cursor, VS Code, Zed)
- ✅ Síťové připojení (localhost + reverse proxy)
- ✅ Databáze (PostgreSQL)
- 📝 Export výsledků do logu

**Použití:**
```bash
/opt/kms-tools/bin/test-all-tools.sh
```

#### `/opt/kms-tools/DEBUG-GUIDE.md`
Kompletní guide pro debugging:
- Typy logů (INFO/DEBUG/WARNING/ERROR)
- Příkazy pro sledování
- Emoji indikátory
- Diagnostika problémů
- Běžné chyby a řešení
- Výkonnostní monitoring

### 📊 Formát Logů

**Struktura:**
```
YYYY-MM-DD HH:MM:SS,mmm - module - LEVEL - [file.py:line] - Message
```

**Příklad:**
```
2025-12-30 01:37:27,773 - routers.tools - INFO - [tools.py:123] - 🖥️ TERMINAL OPEN REQUEST: object_id=1, folder=None
```

### 🎨 Emoji Indikátory

Pro rychlou vizuální orientaci v lozích:
- 🖥️ = Terminal request
- 📁 = File Browser request
- 💻 = VS Code request
- 🤖 = Claude AI request
- 📊 = Status check
- ✓ = Úspěch (zelená)
- ✗ = Chyba (červená)
- → = Příchozí request
- ← = Odchozí response

### 🛠️ Rychlé Příkazy

**Live monitoring:**
```bash
sudo journalctl -u kms-api.service -f
```

**Pouze chyby:**
```bash
sudo journalctl -u kms-api.service -p err -f
```

**Filtr podle nástroje:**
```bash
sudo journalctl -u kms-api.service | grep "TERMINAL"
sudo journalctl -u kms-api.service | grep "VS CODE"
sudo journalctl -u kms-api.service | grep "FILE BROWSER"
sudo journalctl -u kms-api.service | grep "CLAUDE"
```

**Export logů:**
```bash
sudo journalctl -u kms-api.service --since "1 hour ago" > /tmp/kms-logs.txt
```

### ✅ Status Nástrojů

Vše funguje a běží:
- ✅ **KMS API** - běží na portu 8000 (4 workers)
- ✅ **Web Terminal (ttyd)** - běží na portu 7681
- ✅ **File Browser** - běží na portu 8082
- ✅ **VS Code (code-server)** - běží na portu 8443
- ✅ **Claude AI** - API-based, připraveno
- ✅ **PostgreSQL** - běží, připojeno

### 💻 Nainstalované Editory

- ✅ **Windsurf** - v1.106.0 (nainstalován)
- ✅ **Cursor** - v2.2.44 (nainstalován)
- ✅ **VS Code** - v1.107.1 (nainstalován)
- ❌ **Zed** - není nainstalován

### 🔧 Změny v Kódu

**main.py:**
- Přidáno: `import logging, sys`
- Nový: `logging.basicConfig()` s dual output (stdout + file)
- Nový: Startup logování
- Rozšířeno: Middleware s request/response logging
- Rozšířeno: Exception handlers s logováním

**routers/tools.py:**
- Přidáno: `import logging`
- Nový: Logger setup
- Rozšířeno: Všechny endpoint funkce s logging
- Rozšířeno: Helper funkce (get_object_path, get_full_path)
- Rozšířeno: Status endpoint s detailním logging

### 📈 Performance Metrics

Každý request obsahuje:
- **Process Time** - čas zpracování v sekundách
- **HTTP Status** - status code odpovědi
- **Client IP** - IP adresa klienta
- **Headers** - všechny request headers (debug mode)

**Příklad:**
```
← RESPONSE: POST /api/tools/terminal/open - Status: 200 - Time: 0.395s
```

### 🚀 Restart Služby

Po aktualizaci kódu:
```bash
sudo systemctl restart kms-api.service
sudo journalctl -u kms-api.service -f
```

### 📝 Testing

Všechny testy proběhly úspěšně ✅

**Test výsledky:**
```
✅ API Root - HTTP 200
✅ Tools Status - HTTP 200
✅ Terminal Open - HTTP 200
✅ File Browser Open - HTTP 200
✅ VS Code Open - HTTP 200
✅ Claude Models - HTTP 200
✅ System Health - HTTP 200
```

### 🔍 Debugging Workflow

1. **Problém nastane** → Otevři logs
   ```bash
   /opt/kms-tools/bin/view-logs.sh
   ```

2. **Hledej error** → Filtruj podle nástroje
   ```bash
   sudo journalctl -u kms-api.service | grep "✗"
   ```

3. **Analyzuj** → Přečti full context
   ```bash
   sudo journalctl -u kms-api.service -n 100
   ```

4. **Fix a restart** → Ověř fix
   ```bash
   sudo systemctl restart kms-api.service
   /opt/kms-tools/bin/test-all-tools.sh
   ```

### 📚 Dokumentace

- **DEBUG-GUIDE.md** - Kompletní debugging příručka
- **CHANGELOG-DEBUG.md** - Tento soubor
- **view-logs.sh** - Interaktivní log viewer
- **test-all-tools.sh** - Kompletní test suite

### 🎯 Další Kroky (Volitelné)

Pokud chceš přidat Windsurf a Cursor do API:
1. Vytvořit nové endpointy v `routers/tools.py`
2. Přidat do `/api/tools/status`
3. Otestovat s `test-all-tools.sh`

## Kontakt & Support

Pro další informace nebo problémy:
- Logy: `sudo journalctl -u kms-api.service -f`
- Debug guide: `/opt/kms-tools/DEBUG-GUIDE.md`
- Test tools: `/opt/kms-tools/bin/test-all-tools.sh`

---
**Update:** 30.12.2025 01:40 CET
**Verze:** 1.0.0
**Status:** ✅ Production Ready
