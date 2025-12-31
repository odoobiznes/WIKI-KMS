# WikiSys - Plán Vylepšení Multi-Server Systému

**Datum:** 2025-12-28
**Verze:** 1.0
**Status:** NÁVRH

---

## 1. ANALÝZA SOUČASNÉHO STAVU

### Existující systém:
- ✓ WikiSys na Hetzner Storage Box (centrální úložiště)
- ✓ SSH přístup přes klíč `/home/resu/.ssh/id_ed25519`
- ✓ Základní CLAUDE-SYSTEM-RULES.md
- ✓ Adresářová struktura: common, infrastructure, servers

### Problémy k řešení:
1. **Nekonzistence:** Claude na různých serverech pracuje odděleně
2. **Bezpečnost:** Chybí centrální správa hesel, klíčů, API tokenů
3. **Synchronizace:** Není systém pro sdílení změn mezi Claude instancemi
4. **Automatizace:** Chybí automatické/poloautomatické skripty pro rutinní úkoly
5. **Historie:** Není verzování změn pravidel a konfigurací

---

## 2. NÁVRH ARCHITEKTURY

### 2.1 Hierarchie Systému

```
┌─────────────────────────────────────────────────────────┐
│           WikiSys (Hetzner Storage Box)                 │
│              Centrální zdroj pravdy                     │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
   │Server 1 │    │Server 2 │   │Server N │
   │ Claude  │    │ Claude  │   │ Claude  │
   └─────────┘    └─────────┘   └─────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              Lokální cache
           .wikisys-local/
```

### 2.2 Nová Adresářová Struktura WikiSys

```
wikisys/
├── docs/
│   ├── CLAUDE-SYSTEM-RULES.md          # Hlavní pravidla
│   ├── CHANGELOG.md                     # Historie změn pravidel
│   ├── VERSION                          # Aktuální verze (timestamp)
│   │
│   ├── infrastructure/                  # Infrastruktura
│   │   ├── servers/                     # Dokumentace serverů
│   │   ├── network/                     # Síťová konfigurace
│   │   └── services/                    # Služby (Borg, Ansible, atd.)
│   │
│   ├── solutions/                       # Řešení problémů (YYYY-MM-DD-*.md)
│   ├── procedures/                      # Postupy a návody
│   │   ├── backup-procedures.md
│   │   ├── ansible-playbooks.md
│   │   └── salt-states.md
│   │
│   ├── common/
│   │   ├── scripts/                     # Sdílené skripty
│   │   │   ├── wikisys-sync.sh         # Synchronizace
│   │   │   ├── secrets-manager.sh      # Správa secrets
│   │   │   └── backup-runner.sh        # Spouštění záloh
│   │   └── templates/                   # Šablony
│   │
│   └── security/
│       ├── access-control.md            # Přístupová pravidla
│       └── secret-locations.md          # Reference na uložené secrets
│
├── secrets/                             # ŠIFROVANÉ SECRETS
│   ├── .gitignore                       # Ignorovat vše kromě README
│   ├── README.md                        # Jak přistupovat k secrets
│   ├── ssh-keys/                        # Šifrované SSH klíče
│   ├── api-tokens/                      # Šifrované API tokeny
│   └── passwords/                       # Šifrované hesla
│
└── state/                               # Stav systému
    ├── servers/                         # Stav jednotlivých serverů
    │   ├── lenovo-adm.json
    │   └── server2.json
    └── sync-log.txt                     # Log synchronizací
```

---

## 3. SYSTÉM MULTI-CLAUDE SYNCHRONIZACE

### 3.1 Princip Fungování

**Verze (VERSION file):** Timestamp poslední změny pravidel
```
1735410000
```

**Workflow Claude při startu:**
```bash
1. Načti lokální verzi: ~/.wikisys-local/VERSION
2. Načti WikiSys verzi: ssh ... "cat wikisys/VERSION"
3. Pokud WikiSys > lokální:
   → Stáhni aktualizované soubory
   → Zobraz CHANGELOG poslední změny
   → Aktualizuj lokální cache
   → Informuj uživatele o změnách
4. Pokud lokální > WikiSys:
   → VAROVÁNÍ: Lokální verze novější (conflict!)
```

### 3.2 Skript pro Synchronizaci

**Soubor:** `common/scripts/wikisys-sync.sh`

```bash
#!/bin/bash
# WikiSys Synchronizační Skript pro Claude

WIKISYS_SSH="u458763-sub3@u458763.your-storagebox.de"
WIKISYS_PORT="23"
WIKISYS_KEY="$HOME/.ssh/id_ed25519"
LOCAL_CACHE="$HOME/.wikisys-local"
WIKISYS_PATH="wikisys"

# Funkce: Získat remote verzi
get_remote_version() {
    ssh -p $WIKISYS_PORT -i "$WIKISYS_KEY" "$WIKISYS_SSH" \
        "cat $WIKISYS_PATH/VERSION" 2>/dev/null || echo "0"
}

# Funkce: Získat lokální verzi
get_local_version() {
    cat "$LOCAL_CACHE/VERSION" 2>/dev/null || echo "0"
}

# Funkce: Synchronizovat
sync_wikisys() {
    local remote_ver=$(get_remote_version)
    local local_ver=$(get_local_version)

    if [ "$remote_ver" -gt "$local_ver" ]; then
        echo "🔄 WikiSys aktualizace dostupná: $local_ver → $remote_ver"

        # Stáhnout dokumentaci
        mkdir -p "$LOCAL_CACHE"
        scp -P $WIKISYS_PORT -i "$WIKISYS_KEY" -r \
            "$WIKISYS_SSH:$WIKISYS_PATH/docs" "$LOCAL_CACHE/"

        # Uložit novou verzi
        echo "$remote_ver" > "$LOCAL_CACHE/VERSION"

        # Zobrazit změny
        echo ""
        echo "📋 Poslední změny:"
        cat "$LOCAL_CACHE/docs/CHANGELOG.md" | head -20

        return 0
    elif [ "$local_ver" -gt "$remote_ver" ]; then
        echo "⚠️  VAROVÁNÍ: Lokální verze ($local_ver) je novější než WikiSys ($remote_ver)"
        return 1
    else
        echo "✓ WikiSys je synchronizovaný (verze: $local_ver)"
        return 0
    fi
}

# Spustit synchronizaci
sync_wikisys
```

### 3.3 Aktualizace Pravidel - Workflow

**Když Claude potřebuje změnit pravidla:**

1. **Stáhni současná pravidla**
2. **Uprav lokálně**
3. **Přidej záznam do CHANGELOG.md**:
   ```markdown
   ## 2025-12-28 19:45 - Přidána podpora Ansible
   - Přidán postup pro Ansible playbooks
   - Aktualizována struktura adresářů
   - Změnil: Claude na serveru lenovo-adm
   ```
4. **Aktualizuj VERSION** (nový timestamp)
5. **Nahraj zpět do WikiSys**
6. **Informuj uživatele** o změně

---

## 4. BEZPEČNÝ SYSTÉM SPRÁVY CREDENTIALS

### 4.1 Architektura - Šifrování s Master Password

**Princip:**
- Všechny credentials šifrovány pomocí GPG/age
- Master password zadává uživatel při přístupu
- Claude NIKDY neukládá master password
- Credentials dočasně dešifrovány pouze v RAM

### 4.2 Implementace - age (moderní, jednodušší než GPG)

**Instalace age:**
```bash
sudo apt install age  # nebo: https://github.com/FiloSottile/age
```

**Struktur secrets:**
```
wikisys/secrets/
├── README.md
├── ssh-keys/
│   ├── server1.key.age           # Šifrovaný SSH klíč
│   └── server1.key.pub           # Veřejný klíč (nešifrovaný)
├── api-tokens/
│   ├── hetzner-api.token.age
│   └── github-api.token.age
└── passwords/
    └── database-passwords.yaml.age
```

### 4.3 Skript pro Správu Secrets

**Soubor:** `common/scripts/secrets-manager.sh`

```bash
#!/bin/bash
# Secrets Manager s age encryption

SECRETS_DIR="$HOME/.wikisys-secrets"
WIKISYS_SSH="u458763-sub3@u458763.your-storagebox.de"
WIKISYS_PORT="23"
WIKISYS_KEY="$HOME/.ssh/id_ed25519"
AGE_KEY_FILE="$HOME/.wikisys-age-key.txt"

# Inicializace age klíče
init_age_key() {
    if [ ! -f "$AGE_KEY_FILE" ]; then
        echo "🔐 Generuji age klíč..."
        age-keygen -o "$AGE_KEY_FILE"
        chmod 600 "$AGE_KEY_FILE"
        echo "✓ Age klíč vygenerován: $AGE_KEY_FILE"
        echo ""
        echo "⚠️  DŮLEŽITÉ: Zálohuj tento klíč na bezpečné místo!"
        echo "   Bez něj nelze dešifrovat secrets!"
    fi
}

# Šifrovat soubor
encrypt_secret() {
    local source_file="$1"
    local dest_name="$2"

    if [ ! -f "$source_file" ]; then
        echo "❌ Soubor neexistuje: $source_file"
        return 1
    fi

    echo "🔒 Šifruji: $source_file → $dest_name.age"
    age -e -i "$AGE_KEY_FILE" -o "$SECRETS_DIR/$dest_name.age" "$source_file"

    echo "✓ Zašifrováno"
}

# Dešifrovat secret (do RAM)
decrypt_secret() {
    local secret_name="$1"
    local remote_path="wikisys/secrets/$secret_name.age"

    echo "🔓 Dešifruji: $secret_name"

    # Stáhnout a rovnou dešifrovat (bez ukládání na disk)
    ssh -p $WIKISYS_PORT -i "$WIKISYS_KEY" "$WIKISYS_SSH" \
        "cat $remote_path" | age -d -i "$AGE_KEY_FILE"
}

# Nahrát šifrovaný secret
upload_secret() {
    local secret_file="$1"
    local category="$2"  # ssh-keys / api-tokens / passwords

    scp -P $WIKISYS_PORT -i "$WIKISYS_KEY" \
        "$secret_file" \
        "$WIKISYS_SSH:wikisys/secrets/$category/"
}

# Příklady použití
case "$1" in
    init)
        init_age_key
        ;;
    encrypt)
        encrypt_secret "$2" "$3"
        ;;
    decrypt)
        decrypt_secret "$2"
        ;;
    upload)
        upload_secret "$2" "$3"
        ;;
    get-ssh-key)
        # Speciální funkce: Získat SSH klíč a přidat do ssh-agent
        decrypt_secret "ssh-keys/$2" > /tmp/temp_key
        chmod 600 /tmp/temp_key
        ssh-add /tmp/temp_key
        shred -u /tmp/temp_key  # Bezpečně smazat
        ;;
    *)
        echo "Usage: $0 {init|encrypt|decrypt|upload|get-ssh-key}"
        ;;
esac
```

### 4.4 Workflow pro Claude

**Když Claude potřebuje credentials:**

```bash
# 1. Uživatel poskytne master password (age key)
# 2. Claude dešifruje potřebný secret
SECRET=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt "api-tokens/hetzner-api")

# 3. Použije secret v paměti
curl -H "Authorization: Bearer $SECRET" https://api.hetzner.com/...

# 4. Secret je automaticky zapomenut (není uložen)
```

**Důležité:**
- Claude NIKDY neukládá hesla do historie
- Credentials pouze v RAM, ne na disku
- Po použití okamžitě zapomenout

---

## 5. AUTOMATIZAČNÍ SYSTÉMY

### 5.1 Borg Backup - Automatizace

**Struktura:**
```
wikisys/docs/procedures/borg-backup.md          # Dokumentace
wikisys/docs/common/scripts/borg-runner.sh      # Spouštěcí skript
wikisys/secrets/passwords/borg-repos.yaml.age   # Šifrovaná hesla k repos
```

**Skript:** `common/scripts/borg-runner.sh`

```bash
#!/bin/bash
# Automatické spouštění Borg zálohy

WIKISYS_SCRIPTS="$HOME/.wikisys-local/scripts"
BORG_CONFIG="$HOME/.wikisys-local/config/borg-repos.yaml"

# Načíst konfiguraci repozitářů (dešifrovanou)
load_borg_config() {
    bash "$WIKISYS_SCRIPTS/secrets-manager.sh" decrypt "passwords/borg-repos" > "$BORG_CONFIG"
}

# Spustit zálohu
run_backup() {
    local repo_name="$1"
    local source_paths="$2"

    # Načíst heslo k repo z konfigurace
    export BORG_PASSPHRASE=$(yq eval ".repos.$repo_name.password" "$BORG_CONFIG")
    local repo_path=$(yq eval ".repos.$repo_name.path" "$BORG_CONFIG")

    echo "🔄 Spouštím zálohu: $repo_name"

    borg create \
        --stats \
        --compression lz4 \
        --exclude-caches \
        "$repo_path::$(hostname)-{now}" \
        $source_paths

    # Vyčistit heslo z paměti
    unset BORG_PASSPHRASE

    echo "✓ Záloha dokončena: $repo_name"
}

# Vyčistit config po skončení
cleanup() {
    shred -u "$BORG_CONFIG" 2>/dev/null
}
trap cleanup EXIT

# Hlavní logika
load_borg_config
run_backup "$@"
```

**Konfigurace (borg-repos.yaml) - před šifrováním:**
```yaml
repos:
  hetzner-main:
    path: "ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups/main"
    password: "super-tajne-heslo-123"

  local-backup:
    path: "/mnt/backup-drive/borg"
    password: "jine-heslo-456"
```

### 5.2 Ansible - Semi-Automatický Systém

**Struktura:**
```
wikisys/docs/procedures/ansible/
├── inventory.yaml.age              # Šifrovaný inventory
├── playbooks/
│   ├── common-setup.yaml          # Základní setup
│   ├── security-hardening.yaml
│   └── backup-config.yaml
└── roles/
    ├── wikisys-client/            # Role pro instalaci WikiSys klienta
    └── secrets-manager/
```

**Workflow s Claude:**
1. Claude navrhne Ansible playbook
2. Uživatel schválí
3. Claude vygeneruje playbook do `/tmp/`
4. Spustí: `ansible-playbook /tmp/playbook.yaml --ask-become-pass`
5. Po úspěchu: uloží playbook do WikiSys

### 5.3 Salt - Alternativa k Ansible

**Pokud preferujete Salt:**
- Podobná struktura jako Ansible
- State files v `wikisys/docs/procedures/salt/states/`
- Pillar data šifrovaná

---

## 6. POLOAUTOMATICKÉ WORKFLOW

### 6.1 Denní Rutiny

**Skript:** `common/scripts/daily-tasks.sh`

```bash
#!/bin/bash
# Denní automatické úkoly

# 1. Synchronizace WikiSys
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# 2. Kontrola dostupnosti serverů
echo "🔍 Kontrola serverů..."
for server in $(yq eval '.servers[].hostname' ~/.wikisys-local/config/servers.yaml); do
    if ping -c 1 -W 2 "$server" &>/dev/null; then
        echo "  ✓ $server"
    else
        echo "  ❌ $server - NEDOSTUPNÝ!"
    fi
done

# 3. Kontrola diskového prostoru
df -h | grep -E '(8[0-9]|9[0-9])%' && echo "⚠️  Nízký disk!"

# 4. Kontrola aktualizací
apt list --upgradable 2>/dev/null | grep -v "Listing" && echo "📦 Dostupné aktualizace"
```

### 6.2 Quick Commands pro Claude

**Přidat do CLAUDE-SYSTEM-RULES.md:**

```markdown
## Quick Commands

Claude může používat tyto rychlé příkazy:

### Synchronizace
bash ~/.wikisys-local/scripts/wikisys-sync.sh

### Získat secret
bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt "<kategorie>/<název>"

### Spustit backup
bash ~/.wikisys-local/scripts/borg-runner.sh <repo-name> "<cesty>"

### Zkontrolovat stav systému
bash ~/.wikisys-local/scripts/daily-tasks.sh
```

---

## 7. IMPLEMENTAČNÍ PLÁN

### Fáze 1: Základy (Priorita: VYSOKÁ)
- [ ] Vytvořit novou strukturu adresářů ve WikiSys
- [ ] Implementovat VERSION a CHANGELOG systém
- [ ] Vytvořit `wikisys-sync.sh` skript
- [ ] Aktualizovat CLAUDE-SYSTEM-RULES.md

### Fáze 2: Secrets Management (Priorita: VYSOKÁ)
- [ ] Nainstalovat `age` na všechny servery
- [ ] Vygenerovat age klíč a bezpečně zálohovat
- [ ] Vytvořit `secrets-manager.sh` skript
- [ ] Zašifrovat existující credentials
- [ ] Nahrát do WikiSys secrets/

### Fáze 3: Automatizace Backupů (Priorita: STŘEDNÍ)
- [ ] Vytvořit `borg-runner.sh` skript
- [ ] Nakonfigurovat Borg repositories
- [ ] Otestovat zálohy na testovacích datech
- [ ] Nastavit cron pro automatické zálohy
- [ ] Dokumentovat v WikiSys

### Fáze 4: Ansible/Salt (Priorita: STŘEDNÍ)
- [ ] Rozhodnout: Ansible nebo Salt
- [ ] Vytvořit základní playbooks/states
- [ ] Vytvořit role pro WikiSys klienta
- [ ] Otestovat na testovacím serveru
- [ ] Dokumentovat v WikiSys

### Fáze 5: Poloautomatizace (Priorita: NÍZKÁ)
- [ ] Vytvořit `daily-tasks.sh`
- [ ] Přidat monitoring skripty
- [ ] Vytvořit quick command aliasy
- [ ] Dokumentovat workflow v WikiSys

---

## 8. BEZPEČNOSTNÍ CHECKLIST

### Must-Have
- [x] SSH klíče místo hesel
- [ ] Všechny secrets šifrovány (age)
- [ ] Master password NIKDY neuložen
- [ ] Secrets pouze v RAM, ne na disku
- [ ] Shred/secure delete po použití
- [ ] Age klíč zálohován offline
- [ ] Pravidelná rotace credentials
- [ ] 2FA kde možné (GitHub, Hetzner, atd.)

### Nice-to-Have
- [ ] Fail2ban na všech serverech
- [ ] UFW/iptables firewall
- [ ] Audit logs (aureport)
- [ ] SIEM integrace
- [ ] Vault pro enterprise (HashiCorp Vault)

---

## 9. TESTOVACÍ SCÉNÁŘE

### Test 1: Multi-Claude Sync
1. Claude na serveru A změní pravidla
2. Claude na serveru B detekuje změnu
3. Claude B stáhne a aplikuje nová pravidla
4. Verifikovat: Oba Claude používají stejná pravidla

### Test 2: Secrets Management
1. Zašifrovat testovací API token
2. Nahrát do WikiSys
3. Dešifrovat na jiném serveru
4. Verifikovat: Token funkční
5. Verifikovat: Token není uložen na disku

### Test 3: Borg Backup
1. Vytvořit testovací soubory (100MB)
2. Spustit `borg-runner.sh`
3. Verifikovat: Backup vytvořen
4. Restore test: Obnovit soubory
5. Verifikovat: Data identická

---

## 10. MĚŘITELNÉ CÍLE

### Bezpečnost
- ✅ 100% credentials šifrováno
- ✅ 0% plain-text passwords v repozitářích
- ✅ SSH klíče s passphrase

### Konzistence
- ✅ Claude na všech serverech používá stejná pravidla
- ✅ Změny propagovány <5 minut
- ✅ 100% historie změn zaznamenána

### Automatizace
- ✅ Borg backupy jednou denně automaticky
- ✅ WikiSys sync při každém startu Claude
- ✅ Daily tasks automaticky přes cron

### Rychlost
- ✅ Získání secretu <5 sekund
- ✅ WikiSys sync <30 sekund
- ✅ Ansible deploy <5 minut

---

## 11. OPEN QUESTIONS

1. **Backup strategie:**
   - Jak často zálohovat? (denně / týdně)
   - Retention policy? (kolik verzí uchovávat)
   - Offsite backups? (jiný poskytovatel než Hetzner)

2. **Ansible vs Salt:**
   - Preferujete push (Ansible) nebo pull (Salt) model?
   - Potřebujete real-time configuration?

3. **Monitoring:**
   - Používáte nějaký monitoring? (Prometheus, Grafana, Zabbix)
   - Chcete integrovat s WikiSys?

4. **Notifikace:**
   - Jak chcete být informováni o problémech?
   - Email / Slack / Telegram / SMS?

5. **Multi-tenant:**
   - Budou na serverech i jiní uživatelé?
   - Potřebujete RBAC (role-based access control)?

---

## 12. DALŠÍ NÁPADY K ZVÁŽENÍ

### 12.1 GitOps Workflow
- WikiSys jako Git repozitář
- Automatické verzování přes Git
- Pull requests pro změny pravidel
- GitHub Actions pro validaci

### 12.2 Web Interface
- WebDAV UI pro WikiSys
- Read-only přístup k dokumentaci
- Search přes celý WikiSys

### 12.3 Claude Agent Communication
- Claude instance si mohou posílat zprávy
- Koordinace složitějších úkolů
- Distribuované zpracování

### 12.4 Compliance & Audit
- ISO 27001 compliance
- GDPR considerations
- Audit trail všech přístupů k secrets

---

## ZÁVĚR

Tento plán poskytuje:
1. ✅ **Multi-Claude synchronizaci** přes VERSION systém
2. ✅ **Bezpečnou správu credentials** přes age encryption
3. ✅ **Automatizaci backupů** přes Borg + scripty
4. ✅ **Configuration management** přes Ansible/Salt
5. ✅ **Poloautomatické workflow** pro zrychlení práce

**Doporučené pořadí implementace:**
1. Fáze 1 (Základy) - **START HERE**
2. Fáze 2 (Secrets) - **KRITICKÉ**
3. Fáze 3 (Backupy) - důležité
4. Fáze 4 (Ansible) - nice-to-have
5. Fáze 5 (Automatizace) - kontinuálně

**Odhad času:**
- Fáze 1+2: 2-4 hodiny
- Fáze 3: 2-3 hodiny
- Fáze 4: 4-6 hodin
- Fáze 5: průběžně

---

**Připraven začít s implementací?**
**Otázky? Připomínky? Změny v návrhu?**
