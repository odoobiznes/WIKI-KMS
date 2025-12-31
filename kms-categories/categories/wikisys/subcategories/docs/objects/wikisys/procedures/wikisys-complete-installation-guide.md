# WikiSys - Kompletní Instalační Průvodce
**Datum vytvoření:** 2025-12-29
**Server:** ssaass.it-enterprise.solutions (devops user)
**Autor:** Claude Onboarding Process

---

## 📋 PŘEHLED

Tento dokument obsahuje **kompletní postup** instalace WikiSys a všech souvisejících systémů na nový server, včetně všech problémů které jsme narazili a jejich řešení.

---

## 🔧 FÁZE 1: Připojení k WikiSys Storage Box

### Krok 1.1: Ověření SSH klíče

```bash
# Zkontroluj jestli SSH klíč existuje
ls -la ~/.ssh/id_ed25519*

# Pokud NEEXISTUJE, vygeneruj ho:
ssh-keygen -t ed25519 -C "$(whoami)@$(hostname)" -f ~/.ssh/id_ed25519 -N ""
```

**Výstup:**
- `~/.ssh/id_ed25519` - privátní klíč
- `~/.ssh/id_ed25519.pub` - veřejný klíč

### Krok 1.2: Přidání SSH klíče na Storage Box

**DŮLEŽITÉ:** Storage Box vyžaduje SSH klíč v `.ssh/authorized_keys` (NE v root authorized_keys)!

```bash
# 1. Zobraz veřejný klíč
cat ~/.ssh/id_ed25519.pub

# 2. První připojení pomocí HESLA (dočasné)
# Heslo: 37BMüWä)2T:)}ßZ
# Host: u458763-sub3@u458763.your-storagebox.de
# Port: 23

# 3. Stáhni aktuální authorized_keys
SSHPASS='37BMüWä)2T:)}ßZ' sshpass -e scp -P 23 -o StrictHostKeyChecking=no \
    u458763-sub3@u458763.your-storagebox.de:authorized_keys /tmp/authorized_keys

# 4. Přidej svůj klíč
cat ~/.ssh/id_ed25519.pub >> /tmp/authorized_keys

# 5. Nahraj zpět
SSHPASS='37BMüWä)2T:)}ßZ' sshpass -e scp -P 23 -o StrictHostKeyChecking=no \
    /tmp/authorized_keys u458763-sub3@u458763.your-storagebox.de:authorized_keys

# 6. KRITICKÉ: Zkopíruj do .ssh/ adresáře!
SSHPASS='37BMüWä)2T:)}ßZ' sshpass -e ssh -p 23 -o StrictHostKeyChecking=no \
    u458763-sub3@u458763.your-storagebox.de \
    "cp authorized_keys .ssh/authorized_keys && chmod 600 .ssh/authorized_keys"
```

**Proč .ssh/authorized_keys?**
- Storage Box má speciální nastavení
- Klíče v root authorized_keys NEfungují
- Musí být v `.ssh/authorized_keys` s právy 600

### Krok 1.3: Test SSH přístupu s klíčem

```bash
# Test připojení
ssh -p 23 -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no \
    u458763-sub3@u458763.your-storagebox.de "pwd"

# Mělo by vrátit: /home
```

**Pokud funguje → můžeš pokračovat!**

---

## 📚 FÁZE 2: Instalace WikiSys Lokálně

### Krok 2.1: Stažení wikisys-sync.sh

```bash
# Vytvoř adresář
mkdir -p ~/.wikisys-local/scripts

# Stáhni synchronizační skript
scp -P 23 -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/common/scripts/wikisys-sync.sh \
    ~/.wikisys-local/scripts/

# Nastav práva
chmod +x ~/.wikisys-local/scripts/wikisys-sync.sh
```

### Krok 2.2: První Synchronizace

```bash
# Spusť synchronizaci
bash ~/.wikisys-local/scripts/wikisys-sync.sh
```

**Co se stane:**
1. Stáhne VERSION soubor z WikiSys
2. Stáhne CHANGELOG.md
3. Stáhne celý docs/ adresář
4. Stáhne všechny skripty
5. Zobrazí poslední změny

**Výstup:**
```
ℹ Kontrola WikiSys verze...
⚠ WikiSys aktualizace dostupná!
  Lokální verze: 0 (1970-01-01 01:00:00)
  Remote verze:  1766955386 (2025-12-28 21:56:26)
ℹ Stahuji aktualizace...
ℹ Stahuji docs...
ℹ Stahuji scripts...
✓ Aktualizace dokončena!
```

### Krok 2.3: Ověření Instalace

```bash
# Zkontroluj verzi
cat ~/.wikisys-local/VERSION

# Zobraz pravidla
cat ~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md

# List dostupných skriptů
ls -lh ~/.wikisys-local/scripts/
```

---

## 🔐 FÁZE 3: Secrets Management (age encryption)

### Krok 3.1: Instalace age

```bash
# Zjisti OS verzi
cat /etc/os-release | grep -E "^(NAME|VERSION)="

# Ubuntu/Debian
sudo apt update && sudo apt install -y age

# Ověř instalaci
age --version
# Mělo by vrátit: 1.1.1 (nebo vyšší)
```

### Krok 3.2: Vygenerování age klíče

```bash
# Zkontroluj jestli klíč už neexistuje
ls -la ~/.wikisys-age-key.txt

# Pokud NEEXISTUJE, použij secrets-manager.sh k vytvoření
bash ~/.wikisys-local/scripts/secrets-manager.sh init
```

**Co se stane:**
1. Vygeneruje nový age klíč pár
2. Uloží private key do `~/.wikisys-age-key.txt` (práva 600)
3. Zobrazí public key

**Výstup:**
```
✓ Vygenerován nový age klíč
  Public key: age1vfsck8sxcylxsfrwkaa98exgkzgdhcs4wpd97xjappks9vpkrecq3dyvyl
  Private key: ~/.wikisys-age-key.txt

⚠️ KRITICKÉ: Zálohuj tento klíč na bezpečné místo!
```

### Krok 3.3: ZÁLOHOVÁNÍ age klíče

**⚠️ VELMI DŮLEŽITÉ!**

```bash
# Zkopíruj klíč na bezpečné místo (USB, hardware klíč, atd.)
cp ~/.wikisys-age-key.txt /bezpečné/místo/wikisys-age-key-backup-$(hostname).txt

# Nebo vypiš pro manuální backup
cat ~/.wikisys-age-key.txt
# Ulož tento obsah bezpečně offline!
```

**BEZ tohoto klíče NELZE dešifrovat secrets!**

### Krok 3.4: Test Šifrování/Dešifrování

```bash
# Test šifrování
echo "test secret data" > /tmp/test-secret.txt
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt-file \
    /tmp/test-secret.txt test-secret

# Test dešifrování
bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt test-secret
# Mělo by vrátit: test secret data

# Cleanup
rm /tmp/test-secret.txt
rm ~/.wikisys-secrets/test-secret.age
```

---

## 💾 FÁZE 4: Borg Backup System

### Krok 4.1: Instalace Borg

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y borgbackup

# Ověř verzi
borg --version
# Doporučeno: 1.2.0 nebo vyšší
```

### Krok 4.2: Inicializace Borg Repository

**Na Storage Boxu už existuje repository: `borg-backups`**

```bash
# Zkontroluj existující repository
ssh -p 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de "ls -la borg-backups"

# Pokud neexistuje, vytvoř ho:
borg init --encryption=repokey-blake2 \
    ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups
```

**⚠️ ULOŽIT REPOKEY!** Borg vygeneruje repokey - ulož ho bezpečně!

### Krok 4.3: Konfigurace backup-levels.yaml

```bash
# Zkontroluj existující konfiguraci
cat ~/.wikisys-local/docs/common/backup-levels.yaml
```

**Pokud neexistuje nebo chybí tento server, přidej:**

```yaml
# Backup Levels - Definice úrovní zálohování
# Formát: "denní,měsíční,roční"

servers:
  ssaass:  # hostname
    level: "7,4,1"  # 7 denních, 4 měsíčních, 1 roční
    paths:
      - /home/devops/
      - /etc/
      - /opt/
    exclude:
      - /home/devops/.cache/
      - /home/devops/.local/share/Trash/
```

### Krok 4.4: Test Borg Backup

```bash
# První backup (manuální)
bash ~/.wikisys-local/scripts/borg-runner.sh ssaass-test /home/devops/Documents/

# Zkontroluj status
bash ~/.wikisys-local/scripts/borg-status.sh

# List backupů
borg list ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups
```

### Krok 4.5: Automatizace pomocí cron

```bash
# Přidej do crontab
crontab -e

# Přidej řádek (denní backup ve 2:00)
0 2 * * * bash ~/.wikisys-local/scripts/borg-runner.sh ssaass /home/devops/ >> /var/log/borg-backup.log 2>&1
```

---

## 📬 FÁZE 5: Notifikační Systém

### Krok 5.1: Instalace závislostí

```bash
# Pro email notifikace
sudo apt install -y mailutils

# Pro Telegram/Slack - použij curl (už nainstalováno)
which curl
```

### Krok 5.2: Konfigurace notification-config.yaml

```bash
# Načti konfiguraci
cat ~/.wikisys-local/docs/common/notification-config.yaml
```

**Příklad konfigurace:**

```yaml
telegram:
  enabled: true
  bot_token: "ŠIFROVANÉ_V_SECRETS"  # telegram-bot-token.age
  chat_id: "ŠIFROVANÉ_V_SECRETS"    # telegram-chat-id.age

email:
  enabled: true
  from: "backup@it-enterprise.solutions"
  to: "admin@it-enterprise.solutions"
  smtp_server: "localhost"

slack:
  enabled: false
  webhook_url: "ŠIFROVANÉ_V_SECRETS"  # slack-webhook.age
```

### Krok 5.3: Uložení API tokenů do secrets

```bash
# Telegram bot token
echo "YOUR_TELEGRAM_BOT_TOKEN" | \
    bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt-text api-tokens/telegram-bot-token

# Telegram chat ID
echo "YOUR_CHAT_ID" | \
    bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt-text api-tokens/telegram-chat-id

# Nahraj do WikiSys
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
    ~/.wikisys-secrets/api-tokens/telegram-bot-token.age api-tokens
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
    ~/.wikisys-secrets/api-tokens/telegram-chat-id.age api-tokens
```

### Krok 5.4: Test Notifikací

```bash
# Stáhni notify.sh skript (pokud existuje)
scp -P 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/common/scripts/notify.sh \
    ~/.wikisys-local/scripts/ 2>/dev/null || echo "notify.sh není na WikiSys"

# Pokud neexistuje, vytvoř ho podle quick-reference.md
# Test telegram notifikace
bash ~/.wikisys-local/scripts/notify.sh telegram "✅ Test zpráva ze serveru $(hostname)"

# Test všech kanálů
bash ~/.wikisys-local/scripts/notify.sh test
```

---

## 🔄 FÁZE 6: Ansible (Správa Konfigurace)

### Krok 6.1: Instalace Ansible

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y ansible

# Ověř verzi
ansible --version
# Doporučeno: 2.14+ nebo vyšší
```

### Krok 6.2: Vytvoření Inventáře

```bash
# Vytvoř inventář adresář
mkdir -p ~/.wikisys-local/ansible/

# Vytvoř inventory file
cat > ~/.wikisys-local/ansible/inventory.yml << 'EOF'
all:
  hosts:
    ssaass:
      ansible_host: localhost
      ansible_connection: local

  children:
    wikisys_servers:
      hosts:
        ssaass:
EOF
```

### Krok 6.3: Test Ansible Připojení

```bash
# Ping test
ansible all -i ~/.wikisys-local/ansible/inventory.yml -m ping

# Mělo by vrátit:
# ssaass | SUCCESS => {
#     "changed": false,
#     "ping": "pong"
# }
```

### Krok 6.4: Vytvoření První Playbook

```bash
# Jednoduchý test playbook
cat > ~/.wikisys-local/ansible/test-playbook.yml << 'EOF'
---
- name: WikiSys Test Playbook
  hosts: all
  gather_facts: yes

  tasks:
    - name: Zobraz hostname
      debug:
        msg: "Server: {{ ansible_hostname }}, OS: {{ ansible_distribution }}"

    - name: Zkontroluj WikiSys verzi
      command: cat ~/.wikisys-local/VERSION
      register: wikisys_version
      changed_when: false

    - name: Zobraz WikiSys verzi
      debug:
        msg: "WikiSys verze: {{ wikisys_version.stdout }}"
EOF

# Spusť playbook
ansible-playbook -i ~/.wikisys-local/ansible/inventory.yml \
    ~/.wikisys-local/ansible/test-playbook.yml
```

---

## 📊 FÁZE 7: Monitoring & Reporting

### Krok 7.1: Vytvoření Daily Report Skriptu

```bash
# Stáhni daily-report.sh (pokud existuje)
scp -P 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/common/scripts/daily-report.sh \
    ~/.wikisys-local/scripts/ 2>/dev/null || echo "Vytvoříme vlastní"

# Pokud neexistuje, vytvoř základní verzi
cat > ~/.wikisys-local/scripts/daily-report.sh << 'EOF'
#!/bin/bash
# Daily System Report

HOSTNAME=$(hostname)
DATE=$(date +"%Y-%m-%d")

REPORT="📊 Denní Report - ${HOSTNAME} - ${DATE}

🖥️ Systém:
$(uptime)

💾 Disk:
$(df -h | grep -E '(Filesystem|/$)')

📦 Backup Status:
$(bash ~/.wikisys-local/scripts/borg-status.sh 2>/dev/null || echo "Borg status nedostupný")

✅ Služby:
$(systemctl --failed --no-pager)
"

echo "$REPORT"

# Pošli notifikaci
bash ~/.wikisys-local/scripts/notify.sh telegram "$REPORT"
EOF

chmod +x ~/.wikisys-local/scripts/daily-report.sh
```

### Krok 7.2: Automatizace Reports pomocí cron

```bash
# Přidej do crontab
crontab -e

# Denní report v 8:00
0 8 * * * bash ~/.wikisys-local/scripts/daily-report.sh >> /var/log/daily-report.log 2>&1

# Týdenní report v neděli 9:00
0 9 * * 0 bash ~/.wikisys-local/scripts/weekly-report.sh >> /var/log/weekly-report.log 2>&1
```

---

## ✅ FÁZE 8: Dokumentace a Finalizace

### Krok 8.1: Vytvoření Server Dokumentace

```bash
# Vytvoř dokumentaci serveru
cat > /tmp/$(hostname)-server-info.md << 'EOF'
# Server: ssaass.it-enterprise.solutions

**Datum instalace:** $(date +"%Y-%m-%d")
**OS:** Ubuntu 24.04 LTS
**Role:** DevOps/Utility Server
**Uživatel:** devops

## Nainstalované Systémy

### WikiSys
- ✅ Verze: $(cat ~/.wikisys-local/VERSION)
- ✅ Lokální cache: ~/.wikisys-local/
- ✅ SSH klíč: ~/.ssh/id_ed25519

### Secrets Management
- ✅ age 1.1.1
- ✅ age klíč: ~/.wikisys-age-key.txt
- ✅ secrets-manager.sh

### Borg Backup
- ✅ borgbackup nainstalován
- ✅ Repository: ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups
- ✅ Automatický backup: denně 2:00

### Notifikace
- ✅ Telegram bot
- ✅ Email
- ✅ Daily/Weekly reports

### Ansible
- ✅ Ansible nainstalován
- ✅ Inventář: ~/.wikisys-local/ansible/inventory.yml

## Důležité Soubory

- SSH klíč WikiSys: ~/.ssh/id_ed25519
- age klíč: ~/.wikisys-age-key.txt (⚠️ ZÁLOHOVÁNO!)
- WikiSys cache: ~/.wikisys-local/
- Konfigurace: ~/.wikisys-local/docs/common/

## Cron Jobs

- 02:00 - Denní Borg backup
- 08:00 - Denní system report
- 09:00 (neděle) - Týdenní report

## Kontakty

- WikiSys Storage Box: u458763-sub3@u458763.your-storagebox.de:23
- WebDAV: https://u458763-sub3.your-storagebox.de/wikisys/docs/

## Poznámky

- Server byl nastaven podle WikiSys onboarding procesu
- Všechny systémy jsou funkční a otestované
- Secrets jsou šifrované pomocí age
EOF

# Nahraj do WikiSys
scp -P 23 -i ~/.ssh/id_ed25519 /tmp/$(hostname)-server-info.md \
    u458763-sub3@u458763.your-storagebox.de:wikisys/docs/servers/
```

### Krok 8.2: Aktualizace CHANGELOG

```bash
# Stáhni aktuální CHANGELOG
scp -P 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de:wikisys/CHANGELOG.md \
    /tmp/CHANGELOG.md

# Přidej záznam
cat >> /tmp/CHANGELOG.md << EOF

## $(date +"%Y-%m-%d %H:%M") - Přidán Server ssaass.it-enterprise.solutions

**Verze:** $(date +%s)

**Změny:**
- ✅ Nainstalován WikiSys na server ssaass
- ✅ Nakonfigurován age encryption
- ✅ Nakonfigurován Borg backup
- ✅ Nastaven notifikační systém
- ✅ Nainstalován Ansible
- ✅ Vytvořena server dokumentace

**Server:**
- Hostname: $(hostname)
- OS: Ubuntu 24.04 LTS
- Uživatel: devops

**Změnil:** Claude na serveru $(hostname)
EOF

# Vytvoř nový VERSION
date +%s > /tmp/VERSION

# Nahraj zpět
scp -P 23 -i ~/.ssh/id_ed25519 /tmp/CHANGELOG.md /tmp/VERSION \
    u458763-sub3@u458763.your-storagebox.de:wikisys/
```

### Krok 8.3: Finální Synchronizace

```bash
# Synchronizuj všechny změny
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# Ověř verzi
cat ~/.wikisys-local/VERSION
```

---

## 🔍 TROUBLESHOOTING - Známé Problémy a Řešení

### Problém 1: SSH klíč nefunguje na Storage Boxu

**Příznaky:**
```
Permission denied (publickey,password)
```

**Příčina:** SSH klíč není v `.ssh/authorized_keys`

**Řešení:**
```bash
# Zkopíruj authorized_keys do .ssh/
SSHPASS='heslo' sshpass -e ssh -p 23 \
    u458763-sub3@u458763.your-storagebox.de \
    "cp authorized_keys .ssh/authorized_keys && chmod 600 .ssh/authorized_keys"
```

### Problém 2: wikisys-sync.sh hlásí "Lokální verze novější než WikiSys"

**Příznaky:**
```
VAROVÁNÍ: Lokální verze (XXX) je novější než WikiSys (YYY)
```

**Příčina:** Jiný Claude instance právě nahrává změny NEBO lokální cache je poškozený

**Řešení:**
```bash
# Počkej 2 minuty
sleep 120

# Zkus znovu
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# Pokud pořád nefunguje → force sync
bash ~/.wikisys-local/scripts/wikisys-sync.sh force
```

### Problém 3: age dešifrování selhává

**Příznaky:**
```
Error: no identity matched any of the recipients
```

**Příčina:** Špatný age klíč NEBO secret byl zašifrován jiným klíčem

**Řešení:**
```bash
# Zkontroluj age klíč
ls -la ~/.wikisys-age-key.txt

# Ověř public key
age-keygen -y ~/.wikisys-age-key.txt

# Pokud se neshoduje → použij správný klíč nebo re-encrypt secret
```

### Problém 4: Borg backup selhává

**Příznaky:**
```
Repository does not exist
```

**Řešení:**
```bash
# Zkontroluj připojení
ssh -p 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de "ls -la borg-backups"

# Pokud neexistuje → inicializuj
borg init --encryption=repokey-blake2 \
    ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups
```

### Problém 5: Notifikace nefungují

**Příznaky:**
- Telegram neposílá zprávy
- Email selhává

**Řešení:**
```bash
# Zkontroluj secrets
bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt api-tokens/telegram-bot-token

# Test manuálně
TOKEN=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt api-tokens/telegram-bot-token)
CHAT_ID=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt api-tokens/telegram-chat-id)

curl -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=Test message"
```

---

## 📚 REFERENCE

### Důležité Soubory

| Soubor | Popis |
|--------|-------|
| `~/.wikisys-local/VERSION` | Verze WikiSys |
| `~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md` | Systémová pravidla |
| `~/.wikisys-age-key.txt` | age encryption klíč (⚠️ KRITICKÝ!) |
| `~/.ssh/id_ed25519` | SSH klíč pro WikiSys |

### Důležité Příkazy

| Příkaz | Účel |
|--------|------|
| `bash ~/.wikisys-local/scripts/wikisys-sync.sh` | Synchronizuj WikiSys |
| `bash ~/.wikisys-local/scripts/secrets-manager.sh` | Správa secrets |
| `bash ~/.wikisys-local/scripts/borg-runner.sh` | Spusť backup |
| `bash ~/.wikisys-local/scripts/borg-status.sh` | Status backupů |
| `bash ~/.wikisys-local/scripts/notify.sh` | Pošli notifikaci |

### Kontakty

- **WikiSys SSH:** `ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de`
- **WebDAV:** `https://u458763-sub3.your-storagebox.de/wikisys/docs/`

---

## ✅ CHECKLIST - Instalace Kompletní

Po dokončení všech kroků zkontroluj:

- [ ] SSH klíč funguje pro WikiSys přístup
- [ ] WikiSys je synchronizován (~/  .wikisys-local/)
- [ ] age encryption nainstalován a klíč vygenerován
- [ ] age klíč ZÁLOHOVÁN na bezpečné místo
- [ ] Borg backup nainstalován a repository vytvořen
- [ ] Test backup úspěšný
- [ ] Notifikace nakonfigurovány a otestovány
- [ ] Ansible nainstalován a inventory vytvořen
- [ ] Cron jobs nakonfigurovány (backup, reports)
- [ ] Server dokumentace vytvořena a nahrána do WikiSys
- [ ] CHANGELOG aktualizován
- [ ] Finální synchronizace provedena

---

**Konec Průvodce**
**Verze:** 1.0
**Datum:** 2025-12-29
**Autor:** Claude (IT Enterprise Solutions)
