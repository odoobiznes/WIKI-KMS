# Cursor Editor - Kompletní Setup Guide

## ✅ Co jsme nastavili

### 1. **XRDP Připojení** (Řešení C)
- ✅ XRDP služba běží na portu 3389
- ✅ GNOME desktop environment připraven
- ✅ Návod vytvořen: `/opt/kms-tools/docs/XRDP-CONNECTION-GUIDE.md`

### 2. **SSH Tunnel Setup** (Řešení B - část)
- ✅ SSH tunnel script vytvořen: `/opt/kms-tools/bin/cursor-ssh-tunnel.sh`
- ✅ Návod pro použití připraven

### 3. **Code-Server Oprava**
- ✅ Working directory opravena: `/opt/kms` (místo `/opt/DevOPS/Internal/Proects`)
- ✅ Code-server restartován a funguje

---

## 🚀 Jak použít

### Varianta A: XRDP (Doporučeno pro desktop)

1. **Připoj se přes RDP klienta**
   - Windows: `mstsc` → `kms.it-enterprise.solutions`
   - macOS: Microsoft Remote Desktop
   - Linux: Remmina
   - **Uživatel**: `devops`
   - **Port**: `3389`

2. **Otevři Cursor v GNOME**
   - Activities → Hledat "Cursor"
   - Nebo v terminálu: `cursor /opt/kms/categories/...`

3. **Hotovo!** 🎉

**Návod**: Viz `/opt/kms-tools/docs/XRDP-CONNECTION-GUIDE.md`

---

### Varianta B: SSH Tunnel + Remote SSH

1. **Spusť SSH tunnel setup**
   ```bash
   /opt/kms-tools/bin/cursor-ssh-tunnel.sh
   ```

2. **V lokálním Cursor editoru**
   - `Ctrl+Shift+P` → "Remote-SSH: Connect to Host"
   - Vyber: `kms-cursor`
   - Po připojení: Otevři složku `/opt/kms/...`

3. **Hotovo!** 🎉

**Návod**: Viz `/opt/kms-tools/docs/CURSOR-BROWSER-ALTERNATIVES.md`

---

### Varianta C: Code-Server v Browseru (Alternativa)

1. **Otevři VS Code v browseru**
   - V KMS klikni na **VS Code** tlačítko
   - Nebo: `https://kms.it-enterprise.solutions/tools/vscode/`
   - **Heslo**: `kms2025`

2. **Nainstaluj AI extensions**
   - GitHub Copilot
   - Codeium
   - Tabnine AI

3. **Hotovo!** 🎉

**Návod**: Viz `/opt/kms-tools/docs/CURSOR-BROWSER-ALTERNATIVES.md`

---

## 📊 Srovnání řešení

| Řešení | V Browseru | Cursor UI | Snadné | Status |
|--------|-----------|----------|--------|--------|
| **A) XRDP** | ❌ | ✅ | ✅ | ✅ **Doporučeno** |
| **B) SSH Tunnel** | ❌ | ✅ | 🟡 | ✅ **Funguje** |
| **C) Code-Server** | ✅ | 🟡 | ✅ | ✅ **Alternativa** |

---

## 🔍 Testování

### Test XRDP:
```bash
sudo systemctl status xrdp
sudo netstat -tlnp | grep :3389
```

### Test SSH:
```bash
ssh kms-cursor
# Nebo
ssh devops@kms.it-enterprise.solutions
```

### Test Code-Server:
```bash
curl -k https://localhost:8443
# Nebo v browseru
https://kms.it-enterprise.solutions/tools/vscode/
```

### Test Cursor:
```bash
cursor --version
cursor /opt/kms/categories/odoo/objects/bus-ticket
```

---

## 📚 Dokumentace

- **XRDP Návod**: `/opt/kms-tools/docs/XRDP-CONNECTION-GUIDE.md`
- **Alternativy**: `/opt/kms-tools/docs/CURSOR-BROWSER-ALTERNATIVES.md`
- **SSH Tunnel Script**: `/opt/kms-tools/bin/cursor-ssh-tunnel.sh`

---

## ✅ Status

- ✅ XRDP běží a je připraven
- ✅ SSH tunnel script vytvořen
- ✅ Code-server opraven
- ✅ Dokumentace kompletní

**Všechno je připraveno! Můžeš začít používat Cursor Editor.** 🎉
