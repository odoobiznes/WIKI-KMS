# WikiSys CHANGELOG

Historie změn WikiSys systému.

---

## 2025-12-28 20:35 - Přidán Task Queue Systém

**Verze:** 1766954100

**Změny:**
- ✅ Vytvořena struktura `docs/tasks/` pro task queue
- ✅ Přidán `docs/tasks/README.md` s dokumentací
- ✅ Vytvořeny adresáře: `pending/`, `in-progress/`, `completed/`
- ✅ Definován formát úkolů a workflow mezi Claude instancemi
- ✅ Přidány příklady použití a troubleshooting

**Účel:**
Task queue umožňuje Claude instancem na různých serverech si navzájem
zadávat úkoly a komunikovat. Claude A může vytvořit úkol v pending/,
Claude B ho najde při startu, provede a uloží výsledek do completed/.

**Změnil:** Claude na serveru psql17.zman-kesef.eu

**Soubory:**
- `docs/tasks/README.md` (NOVÝ)
- `docs/tasks/pending/` (NOVÝ)
- `docs/tasks/in-progress/` (NOVÝ)
- `docs/tasks/completed/` (NOVÝ)

---

## 2025-12-28 19:52 - Iniciální WikiSys Setup

**Verze:** 1766953645

**Změny:**
- ✅ Vytvořena základní adresářová struktura
- ✅ CLAUDE-SYSTEM-RULES.md (základní pravidla)
- ✅ WIKISYS-IMPROVEMENT-PLAN.md (plán rozvoje)
- ✅ VERSION systém pro multi-Claude synchronizaci

**Změnil:** Initiální setup

---

**Formát záznamů:**

```
## YYYY-MM-DD HH:MM - Stručný popis změny

**Verze:** [timestamp]

**Změny:**
- Seznam změn

**Změnil:** Claude na serveru [hostname]
```
