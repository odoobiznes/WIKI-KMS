# 👀 Jak Zobrazit Web Aplikaci

## 🌐 URL

**Web-CZ aplikace**: http://localhost:3001

## 📋 Způsoby zobrazení

### 1. V IDE (Cursor)
- Klikněte na odkaz: http://localhost:3001
- Nebo otevřete soubor: `web-cz-preview.html`

### 2. V prohlížeči
- Otevřete prohlížeč
- Zadejte: `http://localhost:3001`

### 3. Z terminálu
```bash
# Zobrazit HTML
curl http://localhost:3001

# Nebo otevřít v prohlížeči
xdg-open http://localhost:3001
# nebo
firefox http://localhost:3001
```

## 🔍 Kontrola, zda běží

```bash
# Zkontrolovat proces
ps aux | grep "next.*dev.*3001"

# Zkontrolovat port
netstat -tlnp | grep 3001
# nebo
ss -tlnp | grep 3001

# Testovat HTTP
curl -I http://localhost:3001
```

## 🚀 Restart, pokud neběží

```bash
cd /opt/IT-Enterprise/apps/web-cz
npm run dev
```

## 📄 Preview soubor

Pokud web neběží, můžete zobrazit statický preview:
- Soubor: `web-cz-preview.html`
- Otevřete v IDE nebo prohlížeči

---

**Poznámka**: Pokud nic nevidíte, zkontrolujte:
1. Zda proces běží (`ps aux | grep next`)
2. Zda port je otevřený (`netstat -tlnp | grep 3001`)
3. Zda aplikace odpovídá (`curl http://localhost:3001`)

