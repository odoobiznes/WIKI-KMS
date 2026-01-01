# Prompt pro Claude AI - Dokončení KMS Projektu

Zkopíruj tento prompt a pošli ho Claude AI (který původně KMS vytvářel):

---

## PROMPT:

```
Mám KMS projekt na serveru devsoft.it-enterprise.solutions. Potřebuji od tebe kompletní dokumentaci a plán dokončení.

## Aktuální stav projektu:

**Umístění:**
- `/opt/kms-tools/` - Backend API (FastAPI), Frontend, nástroje
- `/opt/kms/` - Data repository (categories, objects, documents)

**Co funguje (ověřeno):**
✅ KMS API - běží na portu 8000
✅ Frontend - https://kms.it-enterprise.solutions/
✅ Web Terminal (ttyd) - port 7681
✅ File Browser - port 8082
✅ VS Code (code-server) - port 8443
✅ PostgreSQL databáze - kms_db
✅ Nginx reverse proxy
✅ SSL certifikát (Let's Encrypt)
✅ Kategorie a objekty se zobrazují ve frontendu
✅ Tools sidebar funguje
✅ Claude AI chat endpoint

**Nově přidáno dnes (30.12.2025):**
✅ Resource Block System - centrální registr zdrojů
  - API: /api/resources/
  - CLI: /opt/kms-tools/bin/resource-manager.py
  - DB schéma: sql/resources-schema.sql
  - Sleduje: porty, adresáře, databáze, služby, domény

**Problémy které jsem zjistil:**
⚠️ Desktop editory (Windsurf, Cursor) - spouští se ale okamžitě končí (chybí DISPLAY env)
⚠️ Některé porty nejsou registrovány (zjištěno přes resource-manager conflicts)

## Co potřebuji od tebe:

1. **Kompletní architektura KMS:**
   - Jaký byl původní záměr systému?
   - Jak má fungovat synchronizace mezi /opt/kms (filesystem) a PostgreSQL?
   - Jaké jsou plánované workflow?

2. **Seznam nedokončených funkcí:**
   - Co je hotovo a co ještě chybí?
   - Jaké jsou priority?

3. **Instrukce pro dokončení:**
   - Krok za krokem co implementovat
   - Které soubory upravit
   - Potřebné konfigurace

4. **Plánované rozšíření:**
   - Jak má systém fungovat s novými projekty?
   - Integrace s dalšími systémy?

5. **Testovací procedury:**
   - Jak ověřit správnou funkčnost?
   - Jaké jsou očekávané výstupy?

## Kontext projektu:

Server má tyto systémy:
- WikiSys Local (~/.wikisys-local/) - dokumentace, secrets, backup
- KMS Tools (/opt/kms-tools/) - knowledge management + tools
- Resource Block System - centrální registr zdrojů (nově integrováno)
- Odoo 19 (/opt/Odoo/)
- BUS Tickets (/opt/BUS-Tickets/)

Porty které používáme:
- 8000: KMS API
- 7681: Web Terminal
- 8082: File Browser
- 8443: VS Code Web
- 8069/8072: Odoo
- 44770: Bus Tickets

Databáze:
- PostgreSQL 16: kms_db
- PostgreSQL 18: odoo19

Prosím dej mi detailní odpovědi na všechny body. Potřebuji tento projekt dokončit a mít jasný přehled co zbývá udělat.
```

---

## Poznámky k použití:

1. Tento prompt pošli Claude AI v nové session
2. Pokud máš historii konverzace kde byl KMS vytvářen, použij tu session
3. Po odpovědi si poznamenej klíčové body
4. Vytvoř TODO list pro dokončení

---

## Alternativní kratší prompt:

```
Vytvořil jsi mi KMS projekt na /opt/kms-tools a /opt/kms.

Aktuální stav:
- API funguje (FastAPI port 8000)
- Frontend zobrazuje kategorie a objekty
- Web tools fungují (Terminal, FileBrowser, VS Code)
- Přidal jsem Resource Block System pro správu zdrojů

Potřebuji:
1. Co ještě chybí dokončit?
2. Jaký byl plán pro synchronizaci filesystem <-> databáze?
3. Jaké jsou priority pro dokončení?
4. Krok za krokem instrukce co dodělat

Dej mi kompletní přehled a plán dokončení.
```
