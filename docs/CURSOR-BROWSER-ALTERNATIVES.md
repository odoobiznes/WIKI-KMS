# Cursor Editor v Browseru - Alternativní řešení

## 📋 Přehled

Cursor Editor **nemá built-in remote tunnel** jako VS Code. Toto jsou dostupné alternativy pro použití Cursor-like prostředí v browseru.

---

## 🎯 Řešení B: Code-Server s Cursor Extensions

### ✅ Nejjednodušší řešení

**Code-Server** (VS Code v browseru) je již nainstalován a běží na portu `8443`.

### Jak použít:

1. **Otevři VS Code v browseru**
   - V KMS klikni na **VS Code** tlačítko
   - Nebo jdi na: `https://kms.it-enterprise.solutions/tools/vscode/`
   - **Heslo**: `kms2025`

2. **Nainstaluj Cursor-like extensions**
   - Otevři Extensions (`Ctrl+Shift+X`)
   - Vyhledej a nainstaluj:
     - **GitHub Copilot** (AI assistant)
     - **GitHub Copilot Chat** (AI chat)
     - **Tabnine AI** (AI autocomplete)
     - **Codeium** (AI coding assistant)

3. **Hotovo!** 🎉
   - Máš VS Code v browseru s AI funkcemi podobnými Cursor

### Výhody:
- ✅ Funguje přímo v browseru
- ✅ Žádné další nastavení
- ✅ Podobné funkce jako Cursor
- ✅ Už běží na serveru

### Nevýhody:
- ❌ Není to přesně Cursor (jiný UI)
- ❌ Některé Cursor-specific funkce chybí

---

## 🔧 Řešení C: SSH Tunnel + Cursor Remote

### Pokročilejší řešení

Můžeme vytvořit SSH tunnel který umožní připojení k Cursor přes SSH.

### Nastavení:

1. **Vytvoř SSH tunnel script**
   ```bash
   # /opt/kms-tools/bin/cursor-tunnel.sh
   #!/bin/bash
   # SSH tunnel pro Cursor Remote Development
   ```

2. **Použij Cursor Remote SSH extension**
   - V lokálním Cursor editoru (na tvém počítači)
   - Nainstaluj extension: **Remote - SSH**
   - Připoj se k serveru přes SSH

### Jak to funguje:

```
[Lokální Cursor] → [SSH Tunnel] → [Server] → [Cursor Server]
```

### Výhody:
- ✅ Používáš skutečný Cursor
- ✅ Všechny Cursor funkce dostupné
- ✅ Bezpečné připojení přes SSH

### Nevýhody:
- ❌ Potřebuješ Cursor nainstalovaný lokálně
- ❌ Vyžaduje SSH konfiguraci
- ❌ Ne v browseru (ale v desktop aplikaci)

---

## 🚀 Řešení D: Cursor Server Mode (Experimentální)

### Pokus o spuštění Cursor v server módu

Cursor může mít možnost spustit se jako server (podobně jako code-server).

### Zkus to:

```bash
# Zkus spustit Cursor v server módu
cursor --help | grep -i server
cursor --list-extensions
```

**Status**: ⚠️ Cursor **nepodporuje** server mode jako code-server.

---

## 📊 Srovnání řešení

| Řešení | V Browseru | Cursor UI | Snadné | Status |
|--------|-----------|----------|--------|--------|
| **A) XRDP** | ❌ | ✅ | ✅ | ✅ Doporučeno |
| **B) Code-Server + Extensions** | ✅ | 🟡 | ✅ | ✅ Funguje |
| **C) SSH Tunnel** | ❌ | ✅ | 🟡 | ⚠️ Vyžaduje setup |
| **D) Cursor Server** | ❌ | ✅ | ❌ | ❌ Není podporováno |

---

## 🎯 Doporučení

### Pro rychlé použití:
→ **Řešení B**: Použij Code-Server s AI extensions

### Pro plnou Cursor zkušenost:
→ **Řešení A**: Připoj se přes XRDP a používej Cursor na desktopu

### Pro pokročilé uživatele:
→ **Řešení C**: SSH Tunnel s Remote SSH extension

---

## 🔍 Testování

### Test Code-Server:
```bash
# Zkontroluj že běží
curl -k https://localhost:8443

# Nebo v browseru
https://kms.it-enterprise.solutions/tools/vscode/
```

### Test XRDP:
```bash
# Zkontroluj port
sudo netstat -tlnp | grep :3389

# Zkontroluj službu
sudo systemctl status xrdp
```

---

## 📚 Další informace

- Code-Server dokumentace: https://coder.com/docs
- Cursor dokumentace: https://cursor.sh/docs
- XRDP dokumentace: `/opt/kms-tools/docs/XRDP-CONNECTION-GUIDE.md`

---

**Závěr**: Pro použití Cursor v browseru je **nejlepší použít Code-Server s AI extensions** (Řešení B), nebo se připojit přes **XRDP** (Řešení A) pro plnou Cursor zkušenost.
