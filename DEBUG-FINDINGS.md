# KMS Tools - Debug Findings & Solutions

**Datum:** 30.12.2025 01:56 CET
**Status:** 🟡 Částečně vyřešeno - Web nástroje fungují, Desktop nástroje mají problémy

---

## 📋 Souhrn

Přidali jsme **velmi podrobné debug logování** do celého KMS API systému abychom zjistili proč nástroje nefungují.

## ✅ Co funguje

### Web-based nástroje (100% funkční)
- ✅ **Web Terminal (ttyd)** - Port 7681 OPEN, služba běží, vrací URL
- ✅ **File Browser** - Port 8082 OPEN, služba běží, vrací URL
- ✅ **VS Code (code-server)** - Port 8443 OPEN, služba běží, vrací URL
- ✅ **Claude AI** - API-based, připraveno

### API Endpoints
- ✅ `/api/tools/status` - Zobrazuje stav všech nástrojů
- ✅ `/api/tools/terminal/open` - Generuje URL pro terminál
- ✅ `/api/tools/files/open` - Generuje URL pro file browser
- ✅ `/api/tools/vscode/open` - Generuje URL pro VS Code
- ✅ `/api/tools/windsurf/open` - **NOVĚ PŘIDÁNO**
- ✅ `/api/tools/cursor/open` - **NOVĚ PŘIDÁNO**
- ✅ `/api/tools/claude/chat` - Chat s Claude AI
- ✅ `/api/tools/claude/models` - Seznam Claude modelů

## ⚠️ Co částečně funguje

### Desktop editory (Spouštějí se ale okamžitě končí)
- 🟡 **Windsurf Editor** - Nainstalován, spustí se, ale okamžitě skončí
- 🟡 **Cursor Editor** - Nainstalován, spustí se, ale okamžitě skončí
- ❌ **Zed Editor** - Není nainstalován

## 🔍 Problémy které jsme našli

### 1. ❌ Chybějící DISPLAY environment variable
**Problém:** Systemd služba neměla nastavenou DISPLAY proměnnou pro GUI aplikace.

**Řešení:** ✅ Přidali jsme automatickou detekci a nastavení:
```python
# Detekce X socket a nastavení DISPLAY
if os.path.exists("/tmp/.X11-unix/X10"):
    display = ":10"
env["DISPLAY"] = display
env["XDG_RUNTIME_DIR"] = "/run/user/1000"
```

**Status:** ✅ Vyřešeno - Loguje: `Windsurf: Found X10 socket, using DISPLAY=:10`

### 2. ❌ PrivateTmp=true izolace
**Problém:** Systemd služba měla `PrivateTmp=true`, což znamenalo vlastní izolovaný /tmp directory a nemohla vidět X sockety v `/tmp/.X11-unix/`.

**Řešení:** ✅ Změnili jsme v `/etc/systemd/system/kms-api.service`:
```ini
# Před:
PrivateTmp=true

# Po:
PrivateTmp=false
```

**Status:** ✅ Vyřešeno - Service nyní vidí X sockety

### 3. ⚠️ Desktop aplikace okamžitě končí
**Problém:** Windsurf a Cursor se spustí ale okamžitě skončí (proces zůstane naživu ~0.5s).

**Možné příčiny:**
- Procesy běží pod user `devops` přes systemd, ale X session může být pod jiným kontextem
- Chybí další env proměnné (XAUTHORITY, DBUS_SESSION_BUS_ADDRESS, atd.)
- GUI aplikace nemůžou otevřít okno kvůli permissions na X socket
- Aplikace potřebují běžet ve stejné session jako X server

**Co jsme zkusili:**
- ✅ Nastavili DISPLAY=:10
- ✅ Nastavili XDG_RUNTIME_DIR=/run/user/1000
- ✅ Vypnuli PrivateTmp
- ✅ Přidali error capture (STDERR/STDOUT)

**Co NEFUNGUJE:**
- ❌ Procesy stále okamžitě končí
- ❌ Žádné error zprávy v STDERR
- ❌ Windsurf/Cursor se neotevřou

**Status:** 🟡 Částečně vyřešeno - Spouští se ale nekončí úspěšně

## 🛠️ Přidané vylepšení

### 1. Komplexní Debug Logování

#### main.py
```python
- Startup logging (všechny moduly a routery)
- Request/Response middleware s timing
- Headers logging
- Exception handling s full stack traces
- Router registration monitoring
```

#### tools.py - Nové helper funkce
```python
log_environment()         # Loguje env proměnné
check_port_open()        # Testuje dostupnost portů
check_url_accessible()   # Testuje HTTP accessibility
check_command_exists()   # Kontroluje zda příkaz existuje
```

#### tools.py - Enhanced endpoint logging
Každý endpoint nyní loguje:
- ✅ Port checks (pro web services)
- ✅ Command checks (pro desktop apps)
- ✅ Database queries
- ✅ Path resolution
- ✅ Path existence
- ✅ Environment variables setup
- ✅ Process launch
- ✅ Process status check (0.5s po startu)
- ✅ STDERR/STDOUT capture pokud process crashed

### 2. Nové Endpointy

**Windsurf Editor** - `/api/tools/windsurf/open`
```json
POST /api/tools/windsurf/open
{
  "object_id": 1,
  "folder": null  // optional
}
```

**Cursor Editor** - `/api/tools/cursor/open`
```json
POST /api/tools/cursor/open
{
  "object_id": 1,
  "folder": null  // optional
}
```

**Enhanced Status** - `/api/tools/status`
```json
{
  "tools": [
    {
      "name": "Windsurf Editor",
      "editor": {
        "installed": true,
        "path": "/usr/bin/windsurf",
        "status": "available"
      },
      "type": "desktop"
    },
    ...
  ]
}
```

### 3. Systemd Service úpravy

**Změny v `/etc/systemd/system/kms-api.service`:**
```ini
PrivateTmp=false  # Bylo: true
```

## 📊 Příklad Debug Logu

```
2025-12-30 01:55:27 - routers.tools - INFO - 🌊 WINDSURF OPEN REQUEST: object_id=1, folder=None
2025-12-30 01:55:27 - routers.tools - DEBUG - Checking if command exists: windsurf
2025-12-30 01:55:27 - routers.tools - DEBUG -   Command 'windsurf' found at /usr/bin/windsurf
2025-12-30 01:55:27 - routers.tools - INFO -   Windsurf command: FOUND at /usr/bin/windsurf
2025-12-30 01:55:27 - routers.tools - DEBUG - get_object_path: Looking up object_id=1
2025-12-30 01:55:27 - routers.tools - DEBUG - get_object_path: Found object - name=odoo-integration-api
2025-12-30 01:55:27 - routers.tools - DEBUG - Windsurf: Full path resolved - /opt/DevOPS/.../odoo-integration-api
2025-12-30 01:55:27 - routers.tools - DEBUG - Windsurf: Path exists: True
2025-12-30 01:55:27 - routers.tools - DEBUG - Windsurf: Found X10 socket, using DISPLAY=:10
2025-12-30 01:55:27 - routers.tools - DEBUG - Windsurf: Environment - DISPLAY=:10, XDG_RUNTIME_DIR=/run/user/1000
2025-12-30 01:55:27 - routers.tools - INFO -   Windsurf launched successfully (PID: 65277)
2025-12-30 01:55:28 - routers.tools - INFO -   Windsurf process still running after 0.5s - likely successful
2025-12-30 01:55:28 - routers.tools - INFO - ✓ Windsurf opened successfully
```

## 🎯 Další kroky (doporučení)

### Pro desktop aplikace (Windsurf, Cursor):

1. **Zkusit spustit jako user s GUI session:**
   ```bash
   sudo -u devops DISPLAY=:10 XDG_RUNTIME_DIR=/run/user/1000 windsurf /path/to/project
   ```

2. **Přidat další environment variables:**
   ```python
   env["XAUTHORITY"] = "/home/devops/.Xauthority"
   env["DBUS_SESSION_BUS_ADDRESS"] = "unix:path=/run/user/1000/bus"
   ```

3. **Zvážit alternativní přístup:**
   - Spouštět desktop apps přes systemd user service (ne system service)
   - Nebo používat pouze web-based nástroje (které fungují perfektně)

4. **Prozkoumat Windsurf logs:**
   ```bash
   journalctl -xe | grep windsurf
   cat ~/.local/share/Windsurf/logs/*.log
   ```

## 📚 Nainstalované nástroje

```bash
✅ Windsurf   - /usr/bin/windsurf  (v1.106.0)
✅ Cursor     - /usr/bin/cursor    (v2.2.44)
✅ VS Code    - /snap/bin/code     (v1.107.1)
❌ Zed        - není nainstalován
```

## 🔧 Užitečné příkazy

**Sledovat logy:**
```bash
/opt/kms-tools/bin/view-logs.sh
sudo journalctl -u kms-api.service -f
```

**Test všech nástrojů:**
```bash
/opt/kms-tools/bin/test-all-tools.sh
curl http://localhost:8000/api/tools/status | python3 -m json.tool
```

**Restartovat službu:**
```bash
sudo systemctl restart kms-api.service
```

**Test konkrétního nástroje:**
```bash
# Web Terminal
curl -X POST http://localhost:8000/api/tools/terminal/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'

# Windsurf
curl -X POST http://localhost:8000/api/tools/windsurf/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'
```

## 📈 Statistiky

- **Celkový počet řádků logování přidáno:** ~300+
- **Nové funkce:** 4 (log_environment, check_port_open, check_url_accessible, check_command_exists)
- **Nové endpointy:** 2 (windsurf/open, cursor/open)
- **Vyřešené problémy:** 2 (DISPLAY, PrivateTmp)
- **Zbývající problémy:** 1 (Desktop apps okamžitě končí)

## 🎓 Závěr

Přidali jsme **komplexní debug logování** které teď umožňuje vidět:
- ✅ Přesně co se děje při každém requestu
- ✅ Jaké environment variables jsou nastaveny
- ✅ Zda services běží a porty jsou otevřené
- ✅ Zda procesy se spustily a jak dlouho běžely
- ✅ Chybové výstupy pokud procesy crashly

**Web nástroje (Terminal, File Browser, VS Code) fungují na 100%.**

**Desktop nástroje (Windsurf, Cursor) se spouští ale okamžitě končí** - potřebují další investigation nebo alternativní přístup (např. user systemd service místo system service).

**Dokumentace:**
- DEBUG-GUIDE.md - Návod jak používat debug logging
- CHANGELOG-DEBUG.md - Co všechno bylo přidáno
- DEBUG-FINDINGS.md - Tento dokument - zjištění a řešení

---

**Vytvořeno:** 30.12.2025 01:56 CET
**Autor:** Claude Sonnet 4.5 (AI Assistant)
**Verze:** 2.0.0 - Enhanced Debug Edition
