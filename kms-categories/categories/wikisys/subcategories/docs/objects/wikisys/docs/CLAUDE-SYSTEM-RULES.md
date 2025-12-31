# CLAUDE SYSTEM RULES - WikiSys IT Enterprise Solutions

**Verze:** 2.0
**Poslední aktualizace:** 2025-12-28

---

## 🚀 STARTUP PROTOCOL - POVINNÉ PŘI KAŽDÉM STARTU!

**KRITICKÉ:** Claude MUSÍ při startu (první zpráva s uživatelem) spustit:

```bash
bash ~/.wikisys-local/scripts/wikisys-sync.sh
```

**Co to dělá:**
1. Zkontroluje verzi WikiSys (VERSION file)
2. Stáhne aktualizace, pokud jsou dostupné
3. Zobrazí CHANGELOG s novými změnami
4. Synchronizuje lokální cache

**Proč je to důležité:**
- Zajišťuje, že všechny Claude instance pracují se stejnými pravidly
- Detekuje změny provedené jinými Claude instancemi
- Udržuje konzistenci napříč všemi servery

---

## Základní Pravidla

### 1. Workflow pro každý úkol

#### PŘED řešením:
1. **Synchronizuj WikiSys** (pokud nebylo provedeno při startu)
   ```bash
   bash ~/.wikisys-local/scripts/wikisys-sync.sh
   ```

2. **Vyhledej existující řešení** ve WikiSys:
   ```bash
   ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de \
       "grep -r 'klíčové slovo' wikisys/docs/"
   ```

#### BĚHEM řešení:
- Dokumentuj postup a nálezy
- Používej lokální cache: `~/.wikisys-local/docs/`
- Pro secrets používej `secrets-manager.sh`

#### PO vyřešení:
1. **Ulož řešení** do WikiSys (`wikisys/docs/solutions/YYYY-MM-DD-popis.md`)
2. **Aktualizuj VERSION** (nový timestamp)
3. **Přidej záznam do CHANGELOG.md**
4. **Nahraj změny** do WikiSys

---

### 2. WikiSys Přístup

#### SSH Přístup
```bash
ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de
```

#### Lokální Cache
- **Umístění:** `~/.wikisys-local/`
- **Synchronizace:** `bash ~/.wikisys-local/scripts/wikisys-sync.sh`
- **Verze:** `cat ~/.wikisys-local/VERSION`

#### WebDAV (read-only)
- **URL:** `https://u458763-sub3.your-storagebox.de/wikisys/docs/`

---

### 3. Struktura WikiSys

```
wikisys/
├── VERSION                        # Verze systému (timestamp)
├── CHANGELOG.md                   # Historie změn
│
├── docs/                          # Hlavní dokumentace
│   ├── CLAUDE-SYSTEM-RULES.md    # Tato pravidla
│   ├── WIKISYS-IMPROVEMENT-PLAN.md
│   │
│   ├── infrastructure/            # Infrastruktura a servery
│   ├── servers/                   # Dokumentace serverů
│   ├── solutions/                 # Řešení problémů (YYYY-MM-DD-*.md)
│   ├── procedures/                # Postupy a návody
│   ├── security/                  # Bezpečnostní dokumentace
│   │
│   └── common/
│       ├── scripts/               # Sdílené skripty
│       │   ├── wikisys-sync.sh   # Synchronizační skript
│       │   ├── secrets-manager.sh # Správa credentials (Fáze 2)
│       │   └── borg-runner.sh    # Borg backup (Fáze 3)
│       └── templates/             # Šablony
│
├── secrets/                       # ŠIFROVANÉ credentials (age)
│   ├── README.md                  # Jak používat secrets
│   ├── ssh-keys/                  # Šifrované SSH klíče (*.key.age)
│   ├── api-tokens/                # Šifrované API tokeny (*.token.age)
│   └── passwords/                 # Šifrovaná hesla (*.yaml.age)
│
└── state/                         # Stav systému
    └── servers/                   # Stav jednotlivých serverů (JSON)
```

---

### 4. Multi-Claude Synchronizace

#### Princip VERSION Systému

**VERSION soubor** obsahuje timestamp poslední změny:
```
1766952010
```

#### Synchronizační Workflow

```bash
# Při startu Claude
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# Výstup:
# ✓ WikiSys je aktuální (verze: 1766952010)
# NEBO
# 🔄 WikiSys aktualizace dostupná: 1766952000 → 1766952010
# ... stahování změn ...
# 📋 POSLEDNÍ ZMĚNY: [zobrazí CHANGELOG]
```

#### Když Claude Mění Pravidla

1. **Stáhni** aktuální soubory z WikiSys
2. **Uprav** lokálně
3. **Aktualizuj CHANGELOG.md:**
   ```markdown
   ## 2025-12-28 20:15 - Přidán Ansible Support

   **Verze:** 1766953000

   **Změny:**
   - Přidány Ansible playbooks
   - Aktualizována struktura

   **Změnil:** Claude na serveru lenovo-adm
   ```

4. **Vygeneruj nový VERSION:**
   ```bash
   date +%s > /tmp/VERSION
   ```

5. **Nahraj do WikiSys:**
   ```bash
   scp -P 23 -i ~/.ssh/id_ed25519 \
       /tmp/CHANGELOG.md /tmp/VERSION \
       u458763-sub3@u458763.your-storagebox.de:wikisys/
   ```

6. **Informuj uživatele** o změně

---

### 5. Komunikace v češtině/slovenštině

- Pokud uživatel komunikuje česky nebo slovensky, odpovídej v tomtéž jazyce
- Dokumentace ve WikiSys může být v češtině i angličtině
- CHANGELOG vždy v češtině pro konzistenci

---

### 6. Práce s Omezeným Shellem (Hetzner Storage Box)

Storage Box má omezený shell **BEZ podpory**:
- ❌ Pipes (`|`)
- ❌ Redirects (`>`, `>>`)
- ❌ `echo` příkazu
- ❌ `cd &&` konstrukce
- ❌ `find` příkazu

**✅ Podporované příkazy:**
- `ls`, `ll`, `tree`, `pwd`
- `cat`, `head`, `tail`, `grep`
- `mkdir`, `rmdir`, `cp`, `mv`, `rm`
- `chmod`, `stat`
- `md5`, `sha256`, atd.

**Řešení:**
- Pro nahrání: `scp` z lokálního systému
- Pro úpravu: stáhni → uprav lokálně → nahraj zpět
- Pro komplexní operace: prováděj lokálně

---

### 7. Bezpečnost a Secrets Management

#### ⚠️ KRITICKÁ PRAVIDLA

**Claude NIKDY:**
- ❌ Neukládá plain-text credentials nikam
- ❌ Nezobrazuje hesla v logách
- ❌ Neukládá master password
- ❌ Neukládá secrets na disk (pouze RAM)

**Claude VŽDY:**
- ✅ Používá `secrets-manager.sh` pro přístup k credentials
- ✅ Požádá uživatele o potvrzení před přístupem k secretu
- ✅ Dešifruje secrets pouze do paměti (RAM)
- ✅ Zapomene secret po použití

#### Použití Secrets (Fáze 2 - zatím nedostupné)

```bash
# Získat secret do proměnné (pouze v RAM)
SECRET=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt \
    "api-tokens/hetzner-api")

# Použít secret
curl -H "Authorization: Bearer $SECRET" https://api.example.com/

# Secret automaticky zapomenut po skončení
```

**Dokumentace:** `wikisys/secrets/README.md`

---

### 8. Ukládání Řešení

Každé nové řešení ulož jako:
- **Název:** `YYYY-MM-DD-stručný-popis.md`
- **Umístění:** `wikisys/docs/solutions/`
- **Formát:** Markdown podle šablony níže

**Šablona:**
```markdown
# Název problému/úkolu

**Datum:** YYYY-MM-DD
**Server:** název-serveru
**Kategorie:** [infrastruktura/aplikace/bezpečnost/síť/backup/ansible/...]

## Problém
Popis problému nebo požadavku

## Řešení
Postup řešení krok za krokem

1. Krok 1
2. Krok 2
3. ...

## Příkazy/Skripty
```bash
# Použité příkazy s komentáři
command --option value
```

## Výsledek
Co bylo dosaženo

## Poznámky
- Důležité poznámky
- Odkazy na související dokumentaci
- Lessons learned

## Reference
- Link na související solutions
- Link na dokumentaci
```

**Po vytvoření:**
1. Ulož do `/tmp/YYYY-MM-DD-popis.md`
2. Nahraj: `scp -P 23 -i ~/.ssh/id_ed25519 /tmp/... u458763-sub3@...:wikisys/docs/solutions/`

---

### 9. Quick Commands

#### Synchronizace
```bash
# Standardní sync
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# Zobrazit info
bash ~/.wikisys-local/scripts/wikisys-sync.sh info

# Vynucená sync (smaže lokální cache)
bash ~/.wikisys-local/scripts/wikisys-sync.sh force

# Zobrazit CHANGELOG
bash ~/.wikisys-local/scripts/wikisys-sync.sh changelog
```

#### Vyhledávání
```bash
# Hledat ve WikiSys (lokální cache)
grep -r "klíčové slovo" ~/.wikisys-local/docs/

# Hledat přímo na WikiSys
ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de \
    "grep -r 'klíčové slovo' wikisys/docs/"
```

#### Práce s Dokumentací
```bash
# Přečíst pravidla
cat ~/.wikisys-local/docs/CLAUDE-SYSTEM-RULES.md

# Přečíst improvement plan
cat ~/.wikisys-local/docs/WIKISYS-IMPROVEMENT-PLAN.md

# Seznam solutions
ls -lh ~/.wikisys-local/docs/solutions/
```

---

### 10. Servery

#### lenovo-adm
- **Role:** Hlavní administrační server
- **SSH klíč:** `/home/resu/.ssh/id_ed25519`
- **Dokumentace:** `wikisys/docs/infrastructure/lenovo-adm.md`

#### Přidání Nového Serveru

1. Vytvořit dokumentaci: `wikisys/docs/infrastructure/server-name.md`
2. Přidat stav: `wikisys/state/servers/server-name.json`
3. Aktualizovat CHANGELOG
4. Aktualizovat VERSION
5. Synchronizovat všechny Claude instance

---

### 11. Implementační Fáze

#### ✅ Fáze 1: Základy (DOKONČENO)
- [x] Adresářová struktura
- [x] VERSION systém
- [x] CHANGELOG
- [x] wikisys-sync.sh
- [x] Aktualizovaná pravidla

#### 🔄 Fáze 2: Secrets Management (DALŠÍ)
- [ ] Instalace `age` na všechny servery
- [ ] Vytvoření `secrets-manager.sh`
- [ ] Generování age klíče
- [ ] Šifrování existujících credentials

#### 🔜 Fáze 3: Automatizace Backupů
- [ ] `borg-runner.sh`
- [ ] Konfigurace Borg repositories
- [ ] Cron nastavení

#### 🔜 Fáze 4: Ansible/Salt
- [ ] Výběr nástroje
- [ ] Základní playbooks
- [ ] WikiSys role

---

### 12. Troubleshooting

#### "Nelze se připojit k WikiSys"
```bash
# Test SSH připojení
ssh -p 23 -i ~/.ssh/id_ed25519 u458763-sub3@u458763.your-storagebox.de "pwd"

# Zkontroluj SSH klíč
ls -lh ~/.ssh/id_ed25519
```

#### "Lokální verze novější než WikiSys"
```bash
# Počkej 1-2 minuty a zkus znovu
sleep 120
bash ~/.wikisys-local/scripts/wikisys-sync.sh

# Nebo vynuť sync (smaže lokální cache)
bash ~/.wikisys-local/scripts/wikisys-sync.sh force
```

#### "Lokální cache neexistuje"
```bash
# Spusť iniciální sync
bash ~/.wikisys-local/scripts/wikisys-sync.sh
```

---

### 13. Best Practices

#### Pro Claude
- ✅ VŽDY synchronizuj při startu
- ✅ VŽDY zkontroluj existující řešení před prací
- ✅ VŽDY dokumentuj nová řešení
- ✅ VŽDY aktualizuj CHANGELOG při změnách
- ✅ VŽDY používej secrets-manager pro credentials

#### Pro Uživatele
- ✅ Pravidelně zálohuj age klíč
- ✅ Používej silná master passwords
- ✅ Kontroluj CHANGELOG pro změny
- ✅ Pravidelně aktualizuj všechny servery

---

### 14. Reference

**Hlavní Dokumentace:**
- Improvement Plan: `wikisys/docs/WIKISYS-IMPROVEMENT-PLAN.md`
- Secrets README: `wikisys/secrets/README.md`
- CHANGELOG: `wikisys/CHANGELOG.md`

**Skripty:**
- Sync: `wikisys/docs/common/scripts/wikisys-sync.sh`
- Secrets (Fáze 2): `wikisys/docs/common/scripts/secrets-manager.sh`
- Borg (Fáze 3): `wikisys/docs/common/scripts/borg-runner.sh`

**Kontakty:**
- WikiSys SSH: `u458763-sub3@u458763.your-storagebox.de`
- Port: `23`
- WebDAV: `https://u458763-sub3.your-storagebox.de/wikisys/`

---

**Verze:** 2.0
**Poslední aktualizace:** 2025-12-28
**WikiSys VERSION:** 1766952010
**Fáze:** 1/5 (Základy - Dokončeno)
