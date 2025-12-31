# Secrets Management - Quick Workflow Guide

**Verze:** 1.0
**Datum:** 2025-12-28
**Status:** Fáze 2 - DOKONČENO ✅

---

## 🚀 QUICK START

### 1. Inicializace (pouze jednou)

```bash
# Vygeneruj age klíč
bash ~/.wikisys-local/scripts/secrets-manager.sh init

# ⚠️ KRITICKÉ: ZÁLOHUJ age klíč!
cp ~/.wikisys-age-key.txt /bezpečné/místo/wikisys-age-key-backup.txt

# Ověř, že šifrování funguje
bash ~/.wikisys-local/scripts/secrets-manager.sh test
```

---

## 📝 BĚŽNÉ OPERACE

### Zašifrovat a Nahrát API Token

```bash
# 1. Vytvoř soubor s tokenem
echo "ghp_your_github_token_here" > /tmp/github-token.txt

# 2. Zašifruj
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt \
    /tmp/github-token.txt \
    api-tokens/github

# 3. Nahraj do WikiSys
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
    ~/.wikisys-secrets/api-tokens/github.age \
    api-tokens

# 4. Bezpečně smaž originál
shred -u /tmp/github-token.txt

# ✅ Hotovo! Token je bezpečně uložen ve WikiSys
```

### Použít API Token

```bash
# Dešifruj do proměnné (pouze v RAM!)
TOKEN=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt \
    api-tokens/github)

# Použij token
curl -H "Authorization: Bearer $TOKEN" \
    https://api.github.com/user

# Zapomeň token
unset TOKEN
```

### SSH Klíč do ssh-agent

```bash
# Přidej SSH klíč do agentu (bez ukládání na disk)
bash ~/.wikisys-local/scripts/secrets-manager.sh get-ssh-key production-server

# Použij
ssh user@production-server

# Klíč je v ssh-agent, NIKDY nebyl na disku!
```

### Zašifrovat Hesla (YAML)

```bash
# 1. Vytvoř YAML s hesly
cat > /tmp/db-passwords.yaml << EOF
postgres:
  host: db.example.com
  port: 5432
  database: mydb
  username: admin
  password: super-tajne-heslo

mysql:
  host: mysql.example.com
  database: app
  username: app_user
  password: jine-heslo
EOF

# 2. Zašifruj
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt \
    /tmp/db-passwords.yaml \
    passwords/databases

# 3. Nahraj
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
    ~/.wikisys-secrets/passwords/databases.age \
    passwords

# 4. Smaž originál
shred -u /tmp/db-passwords.yaml

# Později použij:
# bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt passwords/databases
```

---

## 📋 SEZNAM SECRETS

```bash
# Zobraz všechny uložené secrets
bash ~/.wikisys-local/scripts/secrets-manager.sh list
```

---

## 🔒 BEZPEČNOSTNÍ PRAVIDLA

### ✅ VŽDY

1. **Zálohuj age klíč** na bezpečné místo (USB, password manager)
2. **Zašifruj PŘED nahráním** do WikiSys
3. **Dešifruj pouze do RAM** (proměnné, `/dev/shm`)
4. **Bezpečně maž** originály (`shred -u`)
5. **Zapomeň** secrets po použití (`unset`)
6. **Permissions 600** na age klíči a šifrovaných souborech

### ❌ NIKDY

1. **Neukládej plain-text** credentials na disk
2. **Nesdílej age klíč**
3. **Necommituj** secrets do gitu
4. **Neloguj** credentials
5. **Nezobrazuj** v plain-text (kromě dočasně)

---

## 🛠️ CLAUDE WORKFLOW

### Když Claude Potřebuje Credentials

1. **Claude požádá uživatele** o potvrzení
   ```
   Claude: "Potřebuji GitHub API token pro získání informací o repozitáři.
            Mohu dešifrovat api-tokens/github?"
   User: "Ano"
   ```

2. **Dešifruj do RAM**
   ```bash
   TOKEN=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt api-tokens/github)
   ```

3. **Použij**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" https://api.github.com/...
   ```

4. **Zapomeň**
   ```bash
   unset TOKEN
   ```

### Claude NIKDY

- ❌ Nezobrazuje secrets v plain-text (kromě confirm ování s uživatelem)
- ❌ Neukládá do historie
- ❌ Neloguje credentials
- ❌ Neukládá na disk

---

## 🔄 BACKUP & RECOVERY

### Zálohování Age Klíče

```bash
# Primární záloha (USB)
cp ~/.wikisys-age-key.txt /media/usb/wikisys-backups/age-key-backup.txt

# Sekundární záloha (password manager)
cat ~/.wikisys-age-key.txt
# → Zkopíruj do password manageru (1Password, Bitwarden, atd.)

# Veřejný klíč (pro recovery)
grep "# public key:" ~/.wikisys-age-key.txt
# → age1mwx9ar9gcdappptt93vvxw6kj08jfmta5gljp7c2zypefpp4dvwq93feap
```

### Recovery (Ztráta Age Klíče)

**Bez age klíče NELZE obnovit žádné secrets!**

Pokud máš zálohu:
```bash
# Obnov ze zálohy
cp /media/usb/wikisys-backups/age-key-backup.txt ~/.wikisys-age-key.txt
chmod 600 ~/.wikisys-age-key.txt

# Test
bash ~/.wikisys-local/scripts/secrets-manager.sh test
```

Pokud NEMÁŠ zálohu:
```bash
# Musíš znovu vytvořit všechny secrets
bash ~/.wikisys-local/scripts/secrets-manager.sh init

# A znovu zašifrovat VŠE
# (proto je záloha KRITICKÁ!)
```

---

## 📊 PŘÍKLADY PODLE USE CASE

### Use Case 1: Hetzner API

```bash
# 1. Získej API token z Hetzner Cloud Console
# 2. Zašifruj
echo "YOUR_HETZNER_API_TOKEN" | \
  bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt - api-tokens/hetzner

# 3. Nahraj
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
  ~/.wikisys-secrets/api-tokens/hetzner.age api-tokens

# 4. Použij
TOKEN=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt api-tokens/hetzner)
curl -H "Auth-API-Token: $TOKEN" https://api.hetzner.cloud/v1/servers
unset TOKEN
```

### Use Case 2: Database Passwords

```bash
# 1. Vytvoř soubor s hesly
cat > /tmp/prod-db.yaml << EOF
host: db.prod.example.com
port: 5432
database: production
username: app
password: very-secure-password-123
EOF

# 2. Zašifruj a nahraj
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt /tmp/prod-db.yaml passwords/prod-db
bash ~/.wikisys-local/scripts/secrets-manager.sh upload ~/.wikisys-secrets/passwords/prod-db.age passwords
shred -u /tmp/prod-db.yaml

# 3. Použij v skriptu
DB_CONFIG=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt passwords/prod-db)
DB_PASS=$(echo "$DB_CONFIG" | yq eval '.password' -)
psql "postgresql://app:$DB_PASS@db.prod.example.com/production"
unset DB_CONFIG DB_PASS
```

### Use Case 3: SSH Klíč pro Production Server

```bash
# 1. Zašifruj existující klíč
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt \
  ~/.ssh/production_rsa \
  ssh-keys/production

# Také zašifruj public key (volitelné, není secret)
cp ~/.ssh/production_rsa.pub ~/.wikisys-secrets/ssh-keys/production.pub

# 2. Nahraj
bash ~/.wikisys-local/scripts/secrets-manager.sh upload \
  ~/.wikisys-secrets/ssh-keys/production.age ssh-keys

# 3. Použij
bash ~/.wikisys-local/scripts/secrets-manager.sh get-ssh-key production
ssh user@production-server
```

---

## 🧪 TESTOVÁNÍ

```bash
# Test šifrování/dešifrování
bash ~/.wikisys-local/scripts/secrets-manager.sh test

# Test kompletního workflow
echo "test-secret-123" > /tmp/test.txt
bash ~/.wikisys-local/scripts/secrets-manager.sh encrypt /tmp/test.txt api-tokens/test-workflow
bash ~/.wikisys-local/scripts/secrets-manager.sh upload ~/.wikisys-secrets/api-tokens/test-workflow.age api-tokens
RESULT=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt api-tokens/test-workflow)
echo "$RESULT"  # Mělo by být: test-secret-123
shred -u /tmp/test.txt
```

---

## 📚 REFERENCE

**Skripty:**
- `~/.wikisys-local/scripts/secrets-manager.sh` - hlavní skript

**Konfigurace:**
- `~/.wikisys-age-key.txt` - age klíč (PERMISSIONS: 600!)
- `~/.wikisys-secrets/` - lokální zašifrované secrets

**WikiSys:**
- `wikisys/secrets/ssh-keys/` - SSH klíče
- `wikisys/secrets/api-tokens/` - API tokeny
- `wikisys/secrets/passwords/` - Hesla

**Dokumentace:**
- Age: https://github.com/FiloSottile/age
- WikiSys Secrets: `wikisys/secrets/README.md`
- Improvement Plan: `wikisys/docs/WIKISYS-IMPROVEMENT-PLAN.md`

---

## ✅ CHECKLIST - Po Implementaci

- [ ] Age nainstalován (`age --version`)
- [ ] Age klíč vygenerován (`~/.wikisys-age-key.txt`)
- [ ] Age klíč zálohován (USB, password manager)
- [ ] Test encryption OK (`secrets-manager.sh test`)
- [ ] Permissions 600 na age klíči (`chmod 600 ~/.wikisys-age-key.txt`)
- [ ] secrets-manager.sh v `.wikisys-local/scripts/`
- [ ] Dokumentace přečtena

---

**Autor:** Claude (WikiSys Setup - Fáze 2)
**Verze:** 1.0
**Poslední aktualizace:** 2025-12-28
**Status:** PRODUCTION READY ✅
