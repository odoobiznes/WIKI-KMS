# WikiSys → KMS Integrace - Automatické Předávání Pravidel

**Datum:** 2025-12-30
**Verze:** 1.0
**Status:** Aktivní

---

## 📋 Přehled

Tento dokument popisuje, jak jsou pravidla a dokumentace z WikiSys automaticky předávána všem uživatelům KMS systému, včetně budoucích uživatelů.

---

## 🎯 Cíl

Zajistit, aby **všichni uživatelé KMS** (současní i budoucí) měli automaticky přístup k:
- ✅ Pravidlům pro práci s Claude AI
- ✅ Postupům a procedurám
- ✅ Známým řešením problémů
- ✅ Dokumentaci serverů a infrastruktury
- ✅ Best practices a workflow

---

## 📂 Struktura v KMS

### Kategorie: WikiSys

```
wikisys/
└── docs/                    # Podkategorie: Dokumentace
    └── wikisys/            # Projekt: WikiSys
        ├── docs/           # Hlavní dokumentace
        │   ├── CLAUDE-SYSTEM-RULES.md
        │   ├── WIKISYS-IMPROVEMENT-PLAN.md
        │   └── WIKISYS-TO-KMS-INTEGRATION.md (tento soubor)
        ├── procedures/     # Postupy a návody
        │   ├── backup-strategy.md
        │   ├── secrets-workflow.md
        │   ├── notification-system.md
        │   ├── resource-management.md
        │   └── quick-reference.md
        ├── scripts/        # Sdílené skripty
        │   ├── wikisys-sync.sh
        │   ├── secrets-manager.sh
        │   ├── borg-runner.sh
        │   └── notify.sh
        └── ansible/        # Ansible konfigurace
            └── inventory.yml
```

---

## 🔄 Automatické Předávání Pravidel

### 1. Při Prvním Přístupu do KMS

**Když nový uživatel poprvé otevře KMS:**

1. **Zobrazí se kategorie "WikiSys"** v sidebaru
2. **Uživatel vidí projekt "wikisys"** s ikonou knihy
3. **Po kliknutí na projekt** se zobrazí všechny dokumenty:
   - 📘 CLAUDE-SYSTEM-RULES.md - **POVINNÉ PŘEČTENÍ**
   - 📘 WIKISYS-IMPROVEMENT-PLAN.md
   - 📘 Postupy (backup, secrets, notifications)
   - 📘 Quick Reference

### 2. Při Práci s Claude AI v KMS

**Když uživatel otevře Claude AI v KMS:**

1. **Claude AI automaticky načte pravidla** z `CLAUDE-SYSTEM-RULES.md`
2. **Claude AI ví:**
   - Jak synchronizovat WikiSys
   - Jak pracovat s secrets
   - Jak dokumentovat řešení
   - Jak používat backup systémy
   - Jak posílat notifikace

### 3. Při Hledání Řešení

**Když uživatel hledá řešení problému:**

1. **Klikne na projekt "wikisys"**
2. **Projde dokumenty v `procedures/`**
3. **Najde známé řešení** nebo vytvoří nové
4. **Nové řešení se automaticky uloží** do KMS

---

## 📚 Klíčové Dokumenty

### 1. CLAUDE-SYSTEM-RULES.md

**Účel:** Hlavní pravidla pro práci s Claude AI

**Obsahuje:**
- Startup protocol (synchronizace WikiSys)
- Workflow pro každý úkol
- Multi-Claude synchronizace
- Secrets management
- Ukládání řešení
- Quick commands

**Kdo to potřebuje:**
- ✅ Všichni uživatelé pracující s Claude AI
- ✅ Noví uživatelé (automaticky vidí při prvním přístupu)

### 2. Quick Reference

**Účel:** Rychlý referenční průvodce

**Obsahuje:**
- Běžné postupy
- Synchronizace WikiSys
- Vyhledávání
- Uložení nového řešení
- Secrets management
- Backup operace
- Notifikace

**Kdo to potřebuje:**
- ✅ Všichni uživatelé (rychlé vyhledání)

### 3. Procedures

**Účel:** Detailní postupy pro konkrétní úkoly

**Dokumenty:**
- `backup-strategy.md` - Backup strategie a level systém
- `secrets-workflow.md` - Práce s secrets (age encryption)
- `notification-system.md` - Multi-channel notifikace
- `resource-management.md` - Správa serverových zdrojů

**Kdo to potřebuje:**
- ✅ Admin uživatelé
- ✅ DevOps týmy
- ✅ Uživatelé řešící konkrétní problémy

---

## 🚀 Workflow pro Nové Uživatele

### Krok 1: První Přístup

1. Uživatel otevře KMS
2. V sidebaru vidí kategorii **"WikiSys"**
3. Klikne na kategorii → zobrazí se projekt **"wikisys"**

### Krok 2: Přečtení Pravidel

1. Uživatel klikne na projekt **"wikisys"**
2. Otevře dokument **"CLAUDE-SYSTEM-RULES.md"**
3. Přečte si:
   - Startup protocol
   - Základní workflow
   - Jak synchronizovat WikiSys

### Krok 3: První Práce s Claude AI

1. Uživatel otevře **Claude AI** v KMS
2. Claude AI automaticky:
   - Zkontroluje verzi WikiSys
   - Synchronizuje lokální cache
   - Načte aktuální pravidla
3. Uživatel může začít pracovat

### Krok 4: Hledání Řešení

1. Uživatel má problém
2. Otevře projekt **"wikisys"** → **"procedures"**
3. Prohledá dokumenty nebo použije Quick Reference
4. Najde řešení nebo vytvoří nové

---

## 🔧 Technické Detaily

### Synchronizace s WikiSys

**WikiSys** je centrální úložiště na Hetzner Storage Box:
- SSH: `u458763-sub3@u458763.your-storagebox.de:23`
- Lokální cache: `~/.wikisys-local/`

**KMS** obsahuje kopii všech dokumentů:
- Cesta: `/opt/kms/categories/wikisys/`
- Synchronizace: Automaticky přes `kms-sync-daemon`

### Aktualizace Pravidel

**Když se změní pravidla v WikiSys:**

1. Admin aktualizuje WikiSys
2. `kms-sync-daemon` detekuje změny
3. Dokumenty v KMS se automaticky aktualizují
4. Všichni uživatelé vidí nová pravidla při příštím přístupu

### Nové Dokumenty

**Když se přidá nový dokument:**

1. Admin přidá dokument do WikiSys
2. Dokument se zkopíruje do KMS struktury
3. `kms-sync-daemon` ho importuje do databáze
4. Dokument je okamžitě viditelný všem uživatelům

---

## 📖 Best Practices

### Pro Uživatele

✅ **Při prvním přístupu:**
- Přečti si `CLAUDE-SYSTEM-RULES.md`
- Projdi Quick Reference
- Otestuj synchronizaci WikiSys

✅ **Při práci:**
- Před řešením problému zkontroluj existující řešení
- Po vyřešení dokumentuj nové řešení
- Používej Quick Reference pro rychlé vyhledání

✅ **Při problémech:**
- Prohledej dokumenty v `procedures/`
- Zkontroluj známá řešení
- Pokud nenajdeš → vytvoř nové řešení

### Pro Adminy

✅ **Aktualizace pravidel:**
- Aktualizuj WikiSys jako primární zdroj
- KMS se automaticky synchronizuje
- Informuj uživatele o důležitých změnách

✅ **Přidání nových dokumentů:**
- Přidej do WikiSys
- Zkopíruj do KMS struktury
- Ověř synchronizaci

---

## 🔍 Vyhledávání

### V KMS

**Vyhledávání dokumentů:**
1. Použij vyhledávací pole v KMS
2. Hledej podle klíčových slov
3. Výsledky zahrnují dokumenty z WikiSys

**Příklady vyhledávání:**
- "backup" → najde `backup-strategy.md`
- "secrets" → najde `secrets-workflow.md`
- "notification" → najde `notification-system.md`

### V WikiSys

**Lokální cache:**
```bash
grep -r "klíčové slovo" ~/.wikisys-local/docs/
```

**Na WikiSys serveru:**
```bash
ssh -p 23 -i ~/.ssh/id_ed25519 \
    u458763-sub3@u458763.your-storagebox.de \
    "grep -r 'klíčové slovo' wikisys/docs/"
```

---

## 📊 Statistiky

**Aktuální stav:**
- ✅ 16 souborů zkopírováno z WikiSys do KMS
- ✅ 3 hlavní dokumenty (RULES, IMPROVEMENT-PLAN, INTEGRATION)
- ✅ 6 procedur (backup, secrets, notifications, atd.)
- ✅ 5 skriptů (sync, secrets-manager, borg-runner, notify, atd.)
- ✅ 1 Ansible konfigurace

---

## 🎓 Školení Nových Uživatelů

### 5-Minutový Úvod

1. **Otevři KMS** → kategorie "WikiSys" → projekt "wikisys"
2. **Přečti** `CLAUDE-SYSTEM-RULES.md` (5 min)
3. **Projdi** Quick Reference (2 min)
4. **Otestuj** synchronizaci WikiSys (1 min)

**Celkem: ~8 minut**

### Kompletní Školení

1. Úvod do WikiSys (10 min)
2. Pravidla pro Claude AI (15 min)
3. Postupy a procedury (20 min)
4. Praktické cvičení (15 min)

**Celkem: ~60 minut**

---

## 🔗 Reference

**WikiSys:**
- SSH: `u458763-sub3@u458763.your-storagebox.de:23`
- Lokální cache: `~/.wikisys-local/`
- WebDAV: `https://u458763-sub3.your-storagebox.de/wikisys/docs/`

**KMS:**
- URL: `https://kms.it-enterprise.solutions/`
- Cesta: `/opt/kms/categories/wikisys/`
- API: `https://kms.it-enterprise.solutions/api/`

**Dokumentace:**
- CLAUDE-SYSTEM-RULES.md
- WIKISYS-IMPROVEMENT-PLAN.md
- Quick Reference
- Procedures

---

## ✅ Checklist pro Nové Uživatele

- [ ] Otevřel jsem KMS
- [ ] Vidím kategorii "WikiSys"
- [ ] Přečetl jsem CLAUDE-SYSTEM-RULES.md
- [ ] Prošel jsem Quick Reference
- [ ] Otestoval jsem synchronizaci WikiSys
- [ ] Vím, kde najít postupy
- [ ] Vím, jak dokumentovat nová řešení

---

**Autor:** Claude AI (WikiSys → KMS Integration)
**Verze:** 1.0
**Poslední aktualizace:** 2025-12-30
**Status:** PRODUCTION READY ✅
