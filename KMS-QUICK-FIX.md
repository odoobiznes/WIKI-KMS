# KMS - Quick Fix Guide (Rychlé Opravy)

**Datum:** 30.12.2025
**Účel:** Rychlé řešení častých problémů

---

## 🚨 KRITICKÉ PROBLÉMY - Fix ASAP

### PROBLÉM #1: API vrací 404 na `/api/tools/terminal/open`

**Symptom:**
```bash
curl -X POST http://localhost:8000/api/tools/terminal/open \
  -H "Content-Type: application/json" \
  -d '{"object_id": 1}'

# Response:
{"detail":"Path does not exist: /opt/DevOPS/Internal/Proects/..."}
```

**Příčina:** Typo v path - "Proects" místo "Projects"

**Fix (30 sekund):**

```bash
# 1. Najdi správnou cestu
find /opt -name "*integration*" -type d 2>/dev/null | head -5

# 2. Edituj tools.py
vim /opt/kms-tools/api/routers/tools.py +165

# Na řádku 165 změň:
# Z: base_path = Path("/opt/DevOPS/Internal/Proects")
# Na: base_path = Path("/opt/kms")  # nebo správnou cestu

# 3. Restart
sudo systemctl restart kms-api.service

# 4. Test
curl -X POST http://localhost:8000/api/tools/terminal/open \
  -H "Content-Type: application/json" -d '{"object_id": 1}' | jq
```

**✅ Fixed když:** Dostaneš 200 OK s URL v response

---

### PROBLÉM #2: Sidebar prázdný (kategorie se nenačítají)

**Symptom:**
- Frontend sidebar je prázdný
- Console error nebo API vrací `[]`

**Diagnóza:**

```bash
# Test API
curl http://localhost:8000/api/categories | jq

# Pokud vrátí []:
# → Databáze je prázdná
```

**Fix Option A: Databáze je prázdná (2 minuty)**

```bash
# Vlož test data
sudo -u postgres psql -d kms_db << 'EOF'
INSERT INTO categories (slug, name, type, description, is_active, sort_order)
VALUES
  ('odoo', 'Odoo', 'product', 'Odoo projekty', true, 1),
  ('pohoda', 'Pohoda', 'product', 'Pohoda projekty', true, 2),
  ('sysadmin', 'SysAdmin', 'system', 'System docs', true, 3),
  ('devops', 'DevOps', 'system', 'DevOps docs', true, 4)
ON CONFLICT (slug) DO NOTHING;

SELECT slug, name FROM categories ORDER BY sort_order;
EOF

# Test znovu
curl http://localhost:8000/api/categories | jq
```

**Fix Option B: CORS problém (1 minuta)**

```bash
# Zkontroluj browser console (F12)
# Pokud vidíš "CORS policy blocked"

# Edituj main.py
vim /opt/kms-tools/api/main.py

# Najdi CORSMiddleware a zkontroluj:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Nebo ["https://kms.it-enterprise.solutions"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Restart
sudo systemctl restart kms-api.service
```

**✅ Fixed když:** Sidebar zobrazuje kategorie

---

### PROBLÉM #3: Desktop editory (Windsurf/Cursor) crashují

**Symptom:**
```bash
ps aux | grep windsurf
# Žádný proces
```

**Quick Fix: Schovej z UI (30 sekund)**

```javascript
// Edituj components.js nebo app.js
vim /opt/kms-tools/frontend/public/components.js

// Najdi a zakomentuj Windsurf/Cursor buttons:
/* Desktop editors - currently not working
<button onclick="openWindsurf()">Windsurf</button>
<button onclick="openCursor()">Cursor</button>
*/
```

**Advanced Fix: Oprav env variables (5 minut)**

```python
# Edituj tools.py
vim /opt/kms-tools/api/routers/tools.py

# V open_windsurf() a open_cursor() funkcích, přidej:
env["XAUTHORITY"] = "/home/devops/.Xauthority"
env["DBUS_SESSION_BUS_ADDRESS"] = "unix:path=/run/user/1000/bus"

# Restart
sudo systemctl restart kms-api.service

# Test
curl -X POST http://localhost:8000/api/tools/windsurf/open \
  -H "Content-Type: application/json" -d '{"object_id": 1}'

sleep 2
ps aux | grep windsurf
```

**✅ Fixed když:** Windsurf proces běží NEBO je skrytý v UI

---

## ⚡ RYCHLÉ OPRAVY

### API nefunguje

```bash
# 1. Zkontroluj běží
systemctl status kms-api.service

# Pokud failed:
sudo systemctl restart kms-api.service

# Sleduj logy
sudo journalctl -u kms-api.service -f
```

### Database connection error

```bash
# 1. Zkontroluj PostgreSQL
sudo systemctl status postgresql

# Pokud není running:
sudo systemctl start postgresql

# 2. Test connection
sudo -u postgres psql -d kms_db -c "SELECT 1"

# 3. Restart API
sudo systemctl restart kms-api.service
```

### Port už používán

```bash
# Zjisti co drží port 8000
sudo ss -tlnp | grep 8000

# Kill proces
sudo kill <PID>

# Restart service
sudo systemctl restart kms-api.service
```

### Nginx nefunguje

```bash
# 1. Test config
sudo nginx -t

# Pokud error, oprav syntax

# 2. Restart
sudo systemctl restart nginx

# 3. Sleduj logy
sudo tail -f /var/log/nginx/error.log
```

### Frontend se nenačítá

```bash
# 1. F12 → Console → Zkontroluj errors

# 2. Clear cache
# Ctrl+Shift+R (hard refresh)

# 3. Zkontroluj API je dostupné
curl http://localhost:8000/api/system/health

# 4. Zkontroluj nginx routing
sudo nginx -t
curl -I https://kms.it-enterprise.solutions/
```

---

## 🔧 COMMON FIXES

### "Permission denied" error

```bash
# Fix permissions
sudo chown -R devops:devops /opt/kms-tools/
sudo chmod -R 755 /opt/kms-tools/

# Restart
sudo systemctl restart kms-api.service
```

### Import Error (Python)

```bash
# Install missing package
/opt/kms-tools/venv/bin/pip install <package_name>

# NEBO reinstall all
/opt/kms-tools/venv/bin/pip install -r /opt/kms-tools/api/requirements.txt

# Restart
sudo systemctl restart kms-api.service
```

### JavaScript errors v Console

```bash
# 1. Clear browser cache
# Ctrl+Shift+Delete

# 2. Hard refresh
# Ctrl+Shift+R

# 3. Zkontroluj syntax v JS souborech
vim /opt/kms-tools/frontend/public/app.js
# Hledej: syntax error, missing bracket, atd.
```

### SSL Certificate error

```bash
# Renew Let's Encrypt
sudo certbot renew

# Restart nginx
sudo systemctl restart nginx
```

---

## 📋 ONE-LINER FIXES

### Restart všech služeb

```bash
for svc in kms-api kms-sync-daemon kms-tools-{ttyd,filebrowser,code-server}; do
    sudo systemctl restart $svc.service
done
```

### Clear všechny cache

```bash
# Browser cache: Ctrl+Shift+Delete
# API restart
sudo systemctl restart kms-api.service
# Nginx reload
sudo systemctl reload nginx
```

### Fix database connection

```bash
sudo systemctl restart postgresql && \
sudo systemctl restart kms-api.service && \
curl http://localhost:8000/api/system/health | jq
```

### Rebuild virtual env

```bash
cd /opt/kms-tools
rm -rf venv/
python3 -m venv venv
venv/bin/pip install -r api/requirements.txt
sudo systemctl restart kms-api.service
```

---

## 🆘 EMERGENCY RECOVERY

### Všechno je rozbitý - FULL RESET

```bash
#!/bin/bash
echo "=== KMS Emergency Recovery ==="

# 1. Stop všechny služby
echo "Stopping services..."
for svc in kms-api kms-sync-daemon kms-tools-{ttyd,filebrowser,code-server}; do
    sudo systemctl stop $svc.service
done

# 2. Restart PostgreSQL
echo "Restarting database..."
sudo systemctl restart postgresql

# 3. Clear Python cache
echo "Clearing Python cache..."
find /opt/kms-tools -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

# 4. Fix permissions
echo "Fixing permissions..."
sudo chown -R devops:devops /opt/kms-tools/
sudo chmod -R 755 /opt/kms-tools/

# 5. Start services
echo "Starting services..."
for svc in kms-api kms-sync-daemon kms-tools-{ttyd,filebrowser,code-server}; do
    sudo systemctl start $svc.service
    sleep 1
done

# 6. Wait for API
echo "Waiting for API..."
sleep 3

# 7. Health check
echo "Health check..."
curl http://localhost:8000/api/system/health | jq

echo ""
echo "=== Recovery Complete ==="
```

---

## 📞 STILL BROKEN? Debug Process

### Step 1: Check Services

```bash
systemctl status kms-api.service
systemctl status postgresql
systemctl status nginx

# Pokud něco není running:
sudo systemctl restart <service>
```

### Step 2: Check Logs

```bash
# API logs
sudo journalctl -u kms-api.service -n 100 --no-pager

# Nginx logs
sudo tail -50 /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -50 /var/log/postgresql/postgresql-*.log
```

### Step 3: Check Network

```bash
# Ports
sudo ss -tlnp | grep -E "8000|7681|8082|8443"

# API reachable
curl http://localhost:8000/api/system/health

# Database
sudo -u postgres psql -d kms_db -c "SELECT 1"
```

### Step 4: Check Filesystem

```bash
# Permissions
ls -la /opt/kms-tools/

# Disk space
df -h /opt

# Project path exists
ls -la /opt/kms/categories/
```

### Step 5: Test Individual Components

```bash
# Database
sudo -u postgres psql -d kms_db << 'EOF'
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM objects;
EOF

# API
curl http://localhost:8000/api/categories | jq

# Frontend
curl -I https://kms.it-enterprise.solutions/

# Tools
curl http://localhost:7681/
curl http://localhost:8082/
curl http://localhost:8443/
```

---

## 🔍 Known Issues & Workarounds

### Issue: "ModuleNotFoundError: No module named 'X'"

**Fix:**
```bash
/opt/kms-tools/venv/bin/pip install X
sudo systemctl restart kms-api.service
```

### Issue: "psycopg2.OperationalError: could not connect"

**Fix:**
```bash
# Check password v database.py
vim /opt/kms-tools/api/database.py

# Reset password
sudo -u postgres psql << 'EOF'
ALTER USER kms_user WITH PASSWORD 'new_password';
EOF

# Update v database.py a restart
sudo systemctl restart kms-api.service
```

### Issue: "Address already in use (port 8000)"

**Fix:**
```bash
# Find process
sudo lsof -i :8000

# Kill
sudo kill -9 <PID>

# Start again
sudo systemctl start kms-api.service
```

### Issue: Nginx 502 Bad Gateway

**Fix:**
```bash
# Check backend is running
curl http://localhost:8000/api/system/health

# If not, start it
sudo systemctl start kms-api.service

# Check nginx can reach it
sudo nginx -t
sudo systemctl reload nginx
```

---

## 💾 Backup Before Changes

**Always backup before major changes:**

```bash
# Quick backup
tar -czf /tmp/kms-backup-$(date +%Y%m%d).tar.gz \
    /opt/kms-tools/api/ \
    /opt/kms-tools/frontend/

# Database backup
sudo -u postgres pg_dump kms_db | gzip > /tmp/kms_db-$(date +%Y%m%d).sql.gz

# Full backup
/opt/kms-tools/bin/backup.sh
```

---

## 🎯 Quick Reference

| Problem | One-Liner Fix |
|---------|---------------|
| API down | `sudo systemctl restart kms-api.service` |
| DB down | `sudo systemctl restart postgresql` |
| Nginx down | `sudo systemctl restart nginx` |
| All services down | `for s in kms-*; do sudo systemctl restart $s; done` |
| Clear cache | `Ctrl+Shift+R` in browser |
| View logs | `sudo journalctl -u kms-api.service -f` |
| Test API | `curl http://localhost:8000/api/system/health \| jq` |
| Fix permissions | `sudo chown -R devops:devops /opt/kms-tools/` |

---

**Poslední update:** 30.12.2025 02:30 CET
**Pro pomoc:** Koukni na logy nebo kontaktuj admina
