# Analýza Nedokončených Plánů - KMS Tools

**Datum:** 31.12.2025
**Status:** 🔴 Analýza nedokončených funkcí

---

## 📊 Aktuální Stav Systému

### ✅ Co je Implementováno

1. **Základní KMS Struktura**
   - ✅ Kategorie a objekty (projekty)
   - ✅ Dokumenty a jejich správa
   - ✅ Sidebar navigace s kategoriemi
   - ✅ Main content area
   - ✅ Tools dropdown s nástroji (VS Code, Terminal, Git, Import, Claude AI)

2. **Funkce Projektů**
   - ✅ Folder picker (MC Commander style)
   - ✅ Project folder view (tree/list)
   - ✅ Git operace (status, pull, commit, push)
   - ✅ Import projektů (SFTP, SMB/CIFS, NFS, Git)
   - ✅ Pamatování folder_path v metadata

3. **UI Komponenty**
   - ✅ Categories tree
   - ✅ Object view
   - ✅ Document view (list mode)
   - ✅ Tools dropdown
   - ✅ Modals (folder picker, import, Claude AI)

4. **Filtry (částečně)**
   - ✅ Category filter v sidebaru (All, Product, System) - **MÁ ZŮSTAT**
   - ✅ Document filter (All, Doc, Code, Plany, Instrukce) - **MÁ ZŮSTAT**
   - ⚠️ View modes (tiles/kanban/list) - **MÁ BÝT ODSTRANĚNO v některých modulech**

---

## ❌ Co Chybí - Nedokončené Plány

### 1. **Modulární Architektura**

Podle memories máme plánovanou **Unified Workflow Architecture** s těmito moduly:

#### 🟡 **IDEAS MODULE** (Create/Plan Phase)
**Status:** ❌ Není implementován

**Plánované funkce:**
- Tools: Konsolidovat, AI Analýza, Generovat (tasks/phases/guides), Vizualizace, Backup
- Actions: Describe project, Generate phases, tasks, guides, Add attachments, Consolidate info
- Output: Complete project specification

**Co chybí:**
- Samostatný modul/sekce v UI
- Tools pro konsolidaci a generování
- AI analýza projektů
- Generování fází, úkolů, návodů

---

#### 🟡 **DEVELOP MODULE** (Development Phase)
**Status:** ❌ Není implementován jako samostatný modul

**Plánované funkce:**
- Tools: Add License, Author, Price; Create/Update each stage
- Actions: Terminal access, Analysis, AI Cursor (code generation), Backup, Version control
- Stages: Analyze→CreateTZ→Approve→Realize; Security→Test→Fix; Create Technical Docs
- Auto-buttons: Semi-automatic processing for each work item
- Output: Development artifacts, technical docs, scripts

**Co má být zachováno:**
- ✅ Terminal, Analysis, Load Tasks, Version +1 buttons
- ✅ Tabs: Overview, Phases, Tasks, Guides, Attachments, Comments, History

**Co má být odstraněno:**
- ❌ Search box
- ❌ Status filter
- ❌ Category filter
- ❌ Priority filter
- ❌ View mode (tiles/kanban/list)

**Co chybí:**
- Samostatný modul/sekce v UI
- Tabs struktura (Overview, Phases, Tasks, Guides, Attachments, Comments, History)
- Auto-buttons pro semi-automatické zpracování
- Stage workflow (Analyze→CreateTZ→Approve→Realize; Security→Test→Fix)

---

#### 🟡 **DEPLOY MODULE** (Release Phase)
**Status:** ❌ Není implementován

**Plánované funkce:**
- Tools: Add Clients, Client assignment, Credentials check, Server setup verification
- Actions: Export&Backup (personal disks), Test Backup (restore verification), Test Deploy (auto on servers)
- Client Management: Export/Publish, Version, Backup, Deploy to all clients
- Billing: Issue and send invoices to clients
- Output: Deployed systems, backup archives, client delivery

**Co má být odstraněno:**
- ❌ Search box
- ❌ Status filter
- ❌ Category filter
- ❌ Priority filter
- ❌ View modes (tiles/kanban/list)
- ❌ "Recent" filter

**Co chybí:**
- Samostatný modul/sekce v UI
- Client management interface
- Export/Backup functionality
- Billing systém
- Deploy automation

---

#### 🟡 **TASKS MODULE** (Team Work)
**Status:** ❌ Není implementován

**Plánované funkce:**
- Behavior: Projects hidden by default, shown in collapsed mode
- Trigger: When project selected or passed from other module, used as filter
- Actions: New, Edit, Delete tasks; Assign to team, Change stage, Set priority
- UI: Simplest functional interface for ongoing work
- Output: Tracked task completion

**Co chybí:**
- Samostatný modul/sekce v UI
- Hidden projects by default functionality
- Task management interface (New/Edit/Delete)
- Team assignment
- Stage and priority management
- Project filter mechanism (when passed from other module)

---

#### 🟡 **ANALYTICS MODULE** (Monitoring)
**Status:** ❌ Není implementován

**Plánované funkce:**
- Behavior: Same as Tasks - hidden projects default
- Metrics: Usage count, Billing, Errors, Processing time, AI usage
- Filter: Applied when project selected/passed from other module
- Output: Performance insights

**Co chybí:**
- Samostatný modul/sekce v UI
- Hidden projects by default
- Metrics dashboard (Usage count, Billing, Errors, Processing time, AI usage)
- Project filter mechanism

---

#### 🟡 **CLIENTS MODULE** (Customer Management)
**Status:** ❌ Není implementován

**Plánované funkce:**
- Behavior: Hidden projects default
- Lists: All clients or filtered by project
- Data stored: Billing info, Multiple contacts, Server credentials/security, Client management
- Software catalog: Products purchased + prices
- Documents: Contracts, Orders, Instructions, Complaints
- Histories: Billing, Payment
- Actions: New, Edit, Delete, Send, Remind, Send instructions, Confirm order/payment
- Analysis: Quick client evaluation
- Output: Client records, order/payment tracking

**Co chybí:**
- Samostatný modul/sekce v UI
- Hidden projects by default
- Client management interface
- Software catalog
- Document management (Contracts, Orders, Instructions, Complaints)
- Billing and payment history
- Client evaluation tools

---

#### 🟡 **FINANCE MODULE** (Financial Ops)
**Status:** ❌ Není implementován

**Plánované funkce:**
- Behavior: Same as Clients/Analytics (hidden projects, filters)
- Operations: Create invoices, Payment instructions, Reminders, Contracts, Order confirmations
- Output: Financial records and documents

**Co chybí:**
- Samostatný modul/sekce v UI
- Hidden projects by default
- Invoice creation and management
- Payment instructions
- Reminders system
- Contract and order confirmations

---

### 2. **Chybějící Komponenty**

#### ❌ **Unified Project Panel Component**
**Status:** Není vytvořen

**Účel:** Znovupoužitelná komponenta pro zobrazení projektů ve všech modulech

**Funkce:**
- Zobrazení seznamu projektů
- Skrytí projektů defaultně (pro Tasks/Analytics/Clients/Finance)
- Zobrazení při výběru nebo předání z jiného modulu
- Filtrování podle předaného projektu

---

#### ❌ **Unified Toolbar Component**
**Status:** Není vytvořen

**Účel:** Znovupoužitelná toolbar pro modulově specifické tlačítka

**Funkce:**
- Modulově specifické akce
- Konzistentní UI napříč moduly
- Integrace s Tools dropdown

---

#### ❌ **"Pass Project Between Modules" Mechanism**
**Status:** Není implementován

**Účel:** Předávání projektu mezi moduly pomocí up arrow (↑)

**Funkce:**
- Tlačítko s up arrow pro předání projektu
- Automatické filtrování v cílovém modulu
- State management pro předaný projekt

---

#### ❌ **Hidden Projects Toggle**
**Status:** Není implementován

**Účel:** Skrytí projektů defaultně v Tasks/Analytics/Clients/Finance modulech

**Funkce:**
- Toggle pro zobrazení/skrytí projektů
- Collapsed mode defaultně
- Zobrazení při výběru nebo předání

---

### 3. **Co Má Být Odstraněno**

#### ❌ **Filtry v některých modulech:**
- Search box (v DEVELOP, DEPLOY modulech)
- Status filter (v DEVELOP, DEPLOY modulech)
- Category filter (v DEVELOP, DEPLOY modulech)
- Priority filter (v DEVELOP, DEPLOY modulech)
- View mode selectors (tiles/kanban/list) (v DEVELOP, DEPLOY modulech)
- "Recent" filter (v DEPLOY modulu)

**Poznámka:** Filtry v sidebaru (Categories) a Document filtry mají zůstat!

---

## 🎯 Prioritní Úkoly

### Vysoká Priorita

1. **Vytvořit modulární strukturu v UI**
   - Přidat navigaci mezi moduly (IDEAS, DEVELOP, DEPLOY, TASKS, ANALYTICS, CLIENTS, FINANCE)
   - Implementovat routing mezi moduly

2. **Vytvořit Unified Project Panel Component**
   - Znovupoužitelná komponenta
   - Hidden projects functionality
   - Project filter mechanism

3. **Vytvořit Unified Toolbar Component**
   - Modulově specifické akce
   - Konzistentní UI

4. **Implementovat "Pass Project" mechanism**
   - Up arrow button
   - State management

### Střední Priorita

5. **Implementovat DEVELOP MODULE**
   - Tabs struktura
   - Auto-buttons
   - Stage workflow
   - Odstranit nepotřebné filtry

6. **Implementovat DEPLOY MODULE**
   - Client management
   - Export/Backup
   - Billing systém
   - Odstranit nepotřebné filtry

7. **Implementovat TASKS MODULE**
   - Hidden projects defaultně
   - Task management
   - Team assignment

### Nízká Priorita

8. **Implementovat zbývající moduly**
   - ANALYTICS MODULE
   - CLIENTS MODULE
   - FINANCE MODULE
   - IDEAS MODULE

---

## 📝 Poznámky

- Aktuální systém má dobrý základ, ale chybí modulární architektura
- Tools dropdown je implementován, ale chybí modulově specifické nástroje
- Filtry jsou implementovány, ale některé mají být odstraněny v určitých modulech
- Project folder view je implementován, ale chybí unified project panel
- Git a Import funkce jsou implementovány a fungují

---

## 🔄 Další Kroky

1. Vytvořit modulární navigaci v UI
2. Implementovat Unified Project Panel Component
3. Implementovat Unified Toolbar Component
4. Přidat "Pass Project" mechanism
5. Začít s DEVELOP modulem jako první
