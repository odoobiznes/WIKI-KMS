# WikiSys Quick Reference - Postupy a Návody

**Verze:** 1.0
**Datum:** 2025-12-28

---

## 🚀 QUICK START

### První Kroky s WikiSys

```bash
# 1. Synchronizuj WikiSys (POVINNÉ při startu Claude!)
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# 2. Zobraz aktuální verzi
cat ~/.wikisys-local/VERSION

# 3. Přečti pravidla
cat ~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md

# 4. Zobraz changelog
bash ~/.wikisys-local/scripts/wikisys-sync.sh changelog
```

---

## 📚 BĚŽNÉ POSTUPY

### Synchronizace WikiSys

```bash
# Standardní sync
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# Zobrazit info
bash ~/.wikisys-local/scripts/wikisys-sync.sh info

# Vynucená synchronizace (smaže lokální cache)
bash ~/.wikisys-local/scripts/wikisys-sync.sh force
```

### Vyhledávání ve WikiSys

```bash
# Lokálně (rychlé)
grep -r "klíčové slovo" ~/.wikisys-local/docs/

# Na WikiSys serveru (aktuální)
ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de \
    "grep -r 'klíčové slovo' wikisys/docs/"

# Najít existující řešení
ls ~/.wikisys-local/docs/solutions/ | grep "keyword"
```

### Uložení Nového Řešení

```bash
# 1. Vytvoř dokument podle šablony
cat > /tmp/2025-12-28-moje-reseni.md << 'EOF'
# Název Problému

**Datum:** 2025-12-28
**Server:** lenovo-adm
**Kategorie:** infrastructure

## Problém
Popis problému

## Řešení
1. Krok 1
2. Krok 2

## Výsledek
Co bylo dosaženo

## Příkazy
```bash
použité příkazy
```
EOF

# 2. Nahraj do WikiSys
scp -P 23 -i ~/.ssh/id_ed25519 /tmp/2025-12-28-moje-reseni.md \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/solutions/

# 3. Synchronizuj na všechny servery
bash ~/.wikisys-local/scripts/wikisys-sync.sh
```

---

## 🔐 SECRETS MANAGEMENT (Fáze 2)

### Inicializace

```bash
# Vytvoř age klíč
bash ~/.wikisys-local/scripts/secrets-manager.sh init

# ⚠️ ZÁLOHUJ age klíč!
cp ~/.wikisys-age-key.txt /bezpečné/místo/wikisys-age-key-backup.txt
```

### Šifrování a Nahrání Secretu

```bash
# 1. Zašifruj soubor
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt \
    /path/to/secret.key \
    ssh-keys/server1.key

# 2. Nahraj do WikiSys
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
    ~/.wikisys-secrets/ssh-keys/server1.key.age \
    ssh-keys
```

### Dešifrování Secretu

```bash
# Dešifruj do proměnné (pouze RAM!)
SECRET=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt \
    "api-tokens/hetzner-api")

# Použij
curl -H "Authorization: Bearer $SECRET" https://api.example.com/

# Secret automaticky zapomenut
```

### SSH Klíč do ssh-agent

```bash
# Dešifruj a přidej do ssh-agent
bash ~/.wikisys-local/scripts/secrets-manager.sh get-ssh-key server1.key

# Ověř
ssh-add -l
```

---

## 💾 BACKUP OPERACE (Fáze 3)

### Spuštění Backupu

```bash
# Manuální backup
bash ~/.wikisys-local/scripts/borg-runner.sh production-db

# S vlastním levelem
BACKUP_LEVEL="4,30,2" bash ~/.wikisys-local/scripts/borg-runner.sh \
    custom-backup /path/to/data
```

### Kontrola Statusu

```bash
# Status všech backupů
bash ~/.wikisys-local/scripts/borg-status.sh

# List backups v repository
borg list ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups
```

### Recovery

```bash
# List dostupných backupů
borg list ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups

# Restore poslední verze
borg extract ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups::lenovo-adm-latest

# Restore specifického souboru
borg extract ssh://.../::backup-name path/to/file.txt
```

---

## 📬 NOTIFIKACE

### Manuální Notifikace

```bash
# Telegram
bash ~/.wikisys-local/scripts/notify.sh telegram "✅ Test zpráva"

# Email
bash ~/.wikisys-local/scripts/notify.sh email "Subject" "Body"

# Slack
bash ~/.wikisys-local/scripts/notify.sh slack "#backups" "Message"

# Všechny kanály
bash ~/.wikisys-local/scripts/notify.sh all "🚨 CRITICAL!"
```

### Test Notifikací

```bash
# Test všech kanálů
bash ~/.wikisys-local/scripts/notify.sh test
```

### Denní/Týdenní Reporty

```bash
# Denní report
bash ~/.wikisys-local/scripts/daily-report.sh

# Týdenní report
bash ~/.wikisys-local/scripts/weekly-report.sh
```

---

## 🔧 AKTUALIZACE SYSTÉMU

### Změna Pravidel WikiSys

```bash
# 1. Stáhni aktuální pravidla
scp -P 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/CLAUDE-SYSTEM-RULES.md \
    /tmp/

# 2. Uprav lokálně
vim /tmp/CLAUDE-SYSTEM-RULES.md

# 3. Aktualizuj CHANGELOG
cat >> /tmp/CHANGELOG.md << EOF

## $(date +"%Y-%m-%d %H:%M") - Popis Změny

**Verze:** $(date +%s)

**Změny:**
- Co jsi změnil

**Změnil:** Claude na serveru $(hostname)
EOF

# 4. Vytvoř nový VERSION
date +%s > /tmp/VERSION

# 5. Nahraj všechny soubory
scp -P 23 -i ~/.ssh/id_ed25519 \
    /tmp/CLAUDE-SYSTEM-RULES.md \
    /tmp/CHANGELOG.md \
    /tmp/VERSION \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/

# 6. Ostatní Claude instance automaticky stáhnou při příštím startu
```

### Přidání Nového Serveru

```bash
# 1. Vytvoř dokumentaci
cat > /tmp/server-name.md << 'EOF'
# Server Name

**Hostname:** server-name.example.com
**IP:** 192.168.1.100
**Role:** Application server

## Konfigurace
...
EOF

# 2. Nahraj
scp -P 23 -i ~/.ssh/id_ed25519 /tmp/server-name.md \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/infrastructure/

# 3. Přidej do backup-levels.yaml
vim ~/.wikisys-local/config/backup-levels.yaml
# servers:
#   server-name: ...

# 4. Synchronizuj
bash ~/.wikisys-local/scripts/wikisys-sync.sh
```

---

## 🔍 MONITORING & TROUBLESHOOTING

### Kontrola Systému

```bash
# Disk usage
df -h

# Server uptime
uptime

# Failed services
systemctl --failed

# Logs
journalctl -xe
```

### Kontrola Backupů

```bash
# Poslední backup
borg list ssh://.../::  | tail -1

# Velikost repository
borg info ssh://...

# Verify integrity
borg check ssh://...
```

### Kontrola WikiSys Synchronizace

```bash
# Lokální verze
cat ~/.wikisys-local/VERSION

# Remote verze
ssh -p 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de "cat wikisys/VERSION"

# Pokud se liší → sync
bash ~/.wikisys-local/scripts/wikisys-sync.sh
```

---

## ⚙️ ANSIBLE (Fáze 4)

### Spuštění Playbooku

```bash
# Dry-run
ansible-playbook playbook.yml --check

# Skutečné spuštění
ansible-playbook playbook.yml

# Na konkrétní server
ansible-playbook playbook.yml --limit lenovo-adm

# S extra variables
ansible-playbook playbook.yml -e "version=2.0"
```

### Inventář

```bash
# List všech serverů
ansible all --list-hosts

# Ping všechny servery
ansible all -m ping
```

---

## 🚨 EMERGENCY PROCEDURES

### Backup Selhal

```bash
# 1. Zkontroluj logy
journalctl -u borg-backup -n 50

# 2. Zkontroluj disk space
df -h

# 3. Zkontroluj SSH přístup
ssh -p 23 u458763-sub3@u458763.your-storagebox.de "pwd"

# 4. Manuální pokus
bash ~/.wikisys-local/scripts/borg-runner.sh <backup-name>

# 5. Pokud pořád selhává → notifikuj
bash notify.sh all "🚨 Manual intervention needed: backup failed"
```

### Server Nedostupný

```bash
# 1. Ping
ping server-name

# 2. SSH
ssh server-name

# 3. Zkontroluj hosting provider dashboard
# 4. Notifikuj
bash notify.sh all "🚨 Server down: server-name"
```

### WikiSys Nedostupný

```bash
# 1. Zkontroluj připojení
ssh -p 23 u458763-sub3@u458763.your-storagebox.de "pwd"

# 2. Pokud nepracuje → použij lokální cache
cat ~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md

# 3. Po obnovení → sync
bash ~/.wikisys-local/scripts/wikisys-sync.sh force
```

---

## 📊 REPORTING

### Backup Report

```bash
# Seznam všech backupů
for repo in production-db user-data logs; do
    echo "=== $repo ==="
    borg list ssh://...::$repo | tail -5
done
```

### Disk Usage Report

```bash
# Všechny servery
ansible all -m shell -a "df -h | grep -E '(Filesystem|/$)'"
```

### Security Report

```bash
# Failed SSH attempts
sudo lastb | head -20

# Firewall blocks
sudo iptables -L -n -v | grep DROP
```

---

## 💡 UŽITEČNÉ ALIASY

Přidej do `~/.bashrc`:

```bash
# WikiSys
alias ws-sync='bash ~/.wikisys-local/scripts/wikisys-sync.sh'
alias ws-info='bash ~/.wikisys-local/scripts/wikisys-sync.sh info'
alias ws-rules='cat ~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md'

# Secrets
alias sec-get='bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt'
alias sec-add='bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt'

# Backup
alias backup-run='bash ~/.wikisys-local/scripts/borg-runner.sh'
alias backup-status='bash ~/.wikisys-local/scripts/borg-status.sh'

# Notifikace
alias notify='bash ~/.wikisys-local/scripts/notify.sh'
```

---

## 🔗 QUICK LINKS

**Dokumentace:**
- Pravidla: `~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md`
- Improvement Plan: `~/.wikisys-local/docs/WIKISYS-IMPROVEMENT-PLAN.md`
- Backup Strategy: `~/.wikisys-local/docs/backup-strategy.md`
- Notifications: `~/.wikisys-local/docs/notification-system.md`

**Konfigurace:**
- Backup Levels: `~/.wikisys-local/config/backup-levels.yaml`
- Notifications: `~/.wikisys-local/config/notification-config.yaml`

**Skripty:**
- WikiSys Sync: `~/.wikisys-local/scripts/wikisys-sync.sh`
- Secrets Manager: `~/.wikisys-local/scripts/secrets-manager.sh`
- Borg Runner: `~/.wikisys-local/scripts/borg-runner.sh`
- Notify: `~/.wikisys-local/scripts/notify.sh`

**Remote:**
- WikiSys SSH: `ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de`
- WebDAV: `https://u458763-sub3.your-storagebox.de/wikisys/docs/`

---

**Autor:** Claude (WikiSys Setup)
**Verze:** 1.0
**Poslední aktualizace:** 2025-12-28
