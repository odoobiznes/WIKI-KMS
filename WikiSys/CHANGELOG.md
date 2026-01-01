# KMS Tools - Changelog

## [2.1.0] - 2026-01-01

### 🆕 New Features

#### AI Integration System
- **Chat Guide** - nový interaktivní AI asistent pro projekty
  - Tlačítko "Chat Guide" v IDEAS modulu
  - Podpora více AI providerů (Claude, OpenAI, Gemini)
  - Tři akce: Popis, Úkoly, Návrhy
  - Progress indikátor během generování
  - Automatické ukládání do metadata projektu

#### Settings Module
- **Nová stránka Nastavení** v user menu
  - Záložka **AI Agents** - konfigurace AI providerů
  - Záložka **General** - obecné nastavení
  - Záložka **Appearance** - vzhled aplikace
  - Záložka **Integrations** - propojení služeb

#### AI Providers Configuration
- Podpora providerů: Claude, OpenAI, Gemini, Cursor, Composer, SWE
- API klíč management s možností testu připojení
- Výběr modelu pro každého providera
- Toggle pro zapnutí/vypnutí jednotlivých providerů

#### Ideas Module Improvements
- **Save specification** - ukládání popisu projektu do localStorage + API
- **AI Generate dropdown** - výběr AI providera pro generování
- **Generate Phases** - AI generování fází projektu
- **Generate Tasks** - AI generování úkolů
- Inline editing fází a úkolů
- Automatické načítání uložených dat při otevření projektu

### 🔧 Improvements

#### Header & Navigation
- Klikatelné logo IT-ENTERPRISE (navigace na IDEAS)
- Zobrazení vybraného projektu v headeru
- Zobrazení aktuálního modulu s ikonou
- Kompaktní "peek" navigační lišta s hover efektem
- Responzivní design pro různé velikosti okna

#### Module UI Consistency
- Jednotný vzhled všech modulů (IDEAS, DEVELOP, DEPLOY, TASKS, ANALYTICS, CLIENTS, FINANCE, LOGINS, RESOURCES)
- Kompaktní statistiky s toggle tlačítkem (oko)
- Zmenšení vertikální velikosti o 30%
- Zarovnání obsahu k levému hornímu rohu

#### Resource Management
- PostgreSQL view `v_resource_conflicts` pro detekci konfliktů
- Trigger `prevent_duplicate_resource` pro prevenci duplicit
- API endpointy pro kontrolu dostupnosti zdrojů

### 🐛 Bug Fixes
- Opraveno zdvojení toolbar tlačítek v modulech
- Opraveno načítání projektu z localStorage
- Opraveno responzivní rozložení headeru
- Opraveny permission denied chyby pro resource views

### 📁 Files Changed
- `frontend/public/js/modules/module-ideas.js` - Chat Guide, AI integration
- `frontend/public/js/modules/module-settings.js` - Settings UI
- `frontend/public/styles.css` - UI styles, modal, dropdown
- `frontend/public/index.html` - Settings menu item, scripts
- `api/routers/tools/tools_ai.py` - AI generate/test endpoints
- `api/routers/tools_claude.py` - Claude API integration

---

## [2.0.0] - 2025-12-31

### Initial Modular Architecture
- 7 feature modules: IDEAS, DEVELOP, DEPLOY, TASKS, ANALYTICS, CLIENTS, FINANCE
- Additional modules: LOGINS, RESOURCES
- Module router with hash-based navigation
- Unified toolbar component
- Project panel component

---

## [1.0.0] - 2025-12-30

### Initial Release
- Basic KMS structure (categories, objects, documents)
- Tools dropdown (VS Code, Terminal, Git, Import, Claude AI)
- Folder picker and project folder view
- Git operations (status, pull, commit, push)
- Basic filters (Categories, Documents)

