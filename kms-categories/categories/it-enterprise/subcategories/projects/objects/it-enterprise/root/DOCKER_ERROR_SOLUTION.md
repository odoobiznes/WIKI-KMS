# 🔴 Docker Error - Řešení

## Problém

**Chyba**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

## ✅ Řešení

### 1. Spustit Docker Daemon

```bash
# Spustit Docker
sudo systemctl start docker

# Nebo pokud nemáte sudo přístup
sudo service docker start

# Ověřit, že běží
sudo systemctl status docker
```

### 2. Alternativní řešení - Použít existující PostgreSQL

Vidím, že PostgreSQL už běží na portu 5432 (ne přes Docker).

Můžeme:
- **A)** Spustit Docker daemon a použít Docker kontejnery
- **B)** Použít existující PostgreSQL a spustit jen aplikace

### 3. Pokud nemáte sudo přístup

Kontaktujte administrátora serveru, aby spustil Docker daemon:
```bash
sudo systemctl start docker
sudo systemctl enable docker  # Pro automatické spuštění po restartu
```

## 📊 Aktuální stav

- ✅ PostgreSQL běží na portu 5432 (externí instance)
- ❌ Docker daemon neběží
- ✅ Docker Compose v5.0.0 je nainstalován
- ✅ Všechny konfigurační soubory jsou připraveny

## 🚀 Možnosti nasazení

### Varianta A: S Dockerem (doporučeno)

1. Spustit Docker:
   ```bash
   sudo systemctl start docker
   ```

2. Spustit služby:
   ```bash
   docker compose up -d
   ```

### Varianta B: Bez Dockeru (pouze aplikace)

Pokud máte PostgreSQL běžící externě, můžete spustit aplikace přímo:

1. Nastavit DATABASE_URL v .env na existující PostgreSQL
2. Spustit aplikace lokálně:
   ```bash
   cd apps/web-cz
   npm run dev
   ```

## 🔍 Diagnostika

Zkontrolujte:
```bash
# Docker status
sudo systemctl status docker

# Docker socket permissions
ls -la /var/run/docker.sock

# User v docker group
groups | grep docker
```

## 💡 Rychlé řešení

Pokud máte sudo přístup:
```bash
sudo systemctl start docker
docker compose up -d
```

Pokud nemáte sudo:
- Požádejte administrátora o spuštění Docker daemonu
- Nebo použijte existující PostgreSQL a spusťte aplikace lokálně

---

**Status**: ⚠️ Čeká na spuštění Docker daemonu
**Datum**: 2025-01-01

