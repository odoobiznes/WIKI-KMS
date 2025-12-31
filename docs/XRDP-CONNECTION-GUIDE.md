# XRDP Připojení - Návod pro Cursor Editor

## 📋 Přehled

XRDP umožňuje připojení k desktopovému prostředí na serveru přes Remote Desktop Protocol (RDP). Toto je **nejjednodušší způsob** jak používat Cursor Editor na serveru.

---

## 🔧 Server Status

- **XRDP Service**: ✅ Aktivní
- **Port**: `3389`
- **Server IP**: `185.185.83.149` nebo `kms.it-enterprise.solutions`
- **Desktop Environment**: GNOME (Ubuntu Desktop)

---

## 💻 Jak se připojit

### Windows

1. **Otevři Remote Desktop Connection**
   - Stiskni `Win + R`
   - Zadej: `mstsc`
   - Stiskni Enter

2. **Zadej připojovací údaje**
   ```
   Computer: kms.it-enterprise.solutions
   User: devops
   ```

3. **Klikni Connect**
   - Při prvním připojení může Windows varovat o certifikátu - klikni "Yes"

4. **Zadej heslo**
   - Heslo pro uživatele `devops`

5. **Hotovo!** 🎉
   - Otevře se GNOME desktop
   - Cursor Editor je dostupný v aplikacích

---

### macOS

1. **Otevři Microsoft Remote Desktop** (z App Store)
   - Nebo použij **Microsoft Remote Desktop** z Mac App Store

2. **Přidej nové připojení**
   - Klikni na `+` → `Add PC`
   - **PC name**: `kms.it-enterprise.solutions`
   - **User account**: `devops`
   - **Password**: (zadej heslo)

3. **Připoj se**
   - Dvojklik na připojení

---

### Linux

1. **Nainstaluj Remmina** (pokud není nainstalováno)
   ```bash
   sudo apt install remmina remmina-plugin-rdp
   ```

2. **Otevři Remmina**
   ```bash
   remmina
   ```

3. **Vytvoř nové připojení**
   - Klikni na `+` (New Connection)
   - **Protocol**: RDP
   - **Server**: `kms.it-enterprise.solutions:3389`
   - **Username**: `devops`
   - **Password**: (zadej heslo)
   - **Color depth**: 24-bit
   - **Quality**: Best

4. **Ulož a připoj se**
   - Klikni "Save and Connect"

---

### Web Browser (HTML5 RDP Client)

Pokud nemáš RDP klienta, můžeš použít webový klient:

1. **Otevři**: `https://kms.it-enterprise.solutions/tools/rdp/` (pokud je nastaveno)
2. Nebo použij externí službu jako:
   - **Guacamole** (pokud je nainstalováno)
   - **Apache Guacamole** web client

---

## 🎯 Použití Cursor Editoru přes XRDP

### Krok 1: Připoj se přes XRDP
- Postupuj podle návodu výše

### Krok 2: Otevři Cursor
1. V GNOME desktopu klikni na **Activities** (levý horní roh)
2. Zadej "Cursor" do vyhledávání
3. Klikni na **Cursor Editor**

### Krok 3: Otevři projekt
- Cursor se otevře
- File → Open Folder
- Vyber projekt z `/opt/kms/...`

---

## 🔍 Ověření připojení

### Zkontroluj XRDP status:
```bash
sudo systemctl status xrdp
```

### Zkontroluj port:
```bash
sudo netstat -tlnp | grep :3389
```

### Zkontroluj aktivní session:
```bash
who
```

---

## ⚠️ Troubleshooting

### Problém: "Connection refused"
- **Řešení**: Zkontroluj firewall
  ```bash
  sudo ufw allow 3389/tcp
  sudo systemctl restart xrdp
  ```

### Problém: "TLS/SSL error"
- **Řešení**: V RDP klientovi zkontroluj nastavení:
  - **Security**: TLS nebo Negotiate
  - **Ignore certificate**: Ano (pro testování)

### Problém: "Black screen" po připojení
- **Řešení**: Zkontroluj GNOME session
  ```bash
  sudo systemctl status gdm3
  sudo systemctl restart xrdp
  ```

### Problém: Cursor se nespustí
- **Řešení**: Zkontroluj DISPLAY
  ```bash
  echo $DISPLAY
  export DISPLAY=:10
  cursor /opt/kms/categories/odoo/objects/bus-ticket
  ```

---

## 🔐 Bezpečnost

⚠️ **Důležité**: XRDP používá nešifrované připojení (pokud není nastaveno TLS).

**Doporučení**:
- Používej VPN pro připojení k serveru
- Nebo nastav SSH tunnel (viz níže)

---

## 📚 Další informace

- XRDP dokumentace: `man xrdp`
- Konfigurace: `/etc/xrdp/xrdp.ini`
- Logy: `/var/log/xrdp/`

---

## ✅ Test připojení

Po připojení přes XRDP zkus:

```bash
# Ověř že jsi připojen
who
echo $DISPLAY

# Otevři Cursor
cursor /opt/kms/categories/odoo/objects/bus-ticket

# Nebo jakýkoliv jiný projekt
cursor /opt/kms/categories/busticket/subcategories/backend/objects/api-server
```

---

**Hotovo!** 🎉 Nyní můžeš používat Cursor Editor přes XRDP připojení.
