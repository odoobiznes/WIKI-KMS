# Deployment Guide

Kompletní průvodce nasazením IT Enterprise platformy.

## 📋 Požadavky

### Server
- Ubuntu 20.04+ nebo Debian 11+
- Minimálně 4 CPU cores
- Minimálně 8GB RAM
- Minimálně 50GB disk space
- Root nebo sudo přístup

### Software
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Nginx (volitelné, pokud nepoužíváte Traefik)

## 🚀 Krok za krokem

### 1. Příprava serveru

```bash
# Aktualizace systému
sudo apt update && sudo apt upgrade -y

# Instalace Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalace Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Přidání uživatele do docker skupiny
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Klonování projektu

```bash
cd /opt
git clone <repository-url> IT-Enterprise
cd IT-Enterprise
```

### 3. Konfigurace

```bash
# Kopírování environment souboru
cp env.example .env

# Úprava .env souboru
nano .env
```

**Důležité proměnné:**
```env
# Database
DATABASE_URL=postgresql://itenterprise:STRONG_PASSWORD@postgres:5432/itenterprise
POSTGRES_PASSWORD=STRONG_PASSWORD

# JWT
JWT_SECRET=VERY_STRONG_SECRET_KEY_HERE

# Traefik
ACME_EMAIL=your-email@domain.com
```

### 4. DNS konfigurace

Pro každou doménu vytvořte A záznamy směřující na IP adresu serveru:

```
it-enterprise.cz          A    YOUR_SERVER_IP
www.it-enterprise.cz      A    YOUR_SERVER_IP
it-enterprise.solutions   A    YOUR_SERVER_IP
it-enterprise.cloud       A    YOUR_SERVER_IP
# ... atd.
```

### 5. Spuštění služeb

```bash
# Spuštění databáze a Redis
docker-compose up -d postgres redis

# Počkat na inicializaci databáze (cca 10 sekund)
sleep 10

# Generování Prisma Client a migrace
cd packages/database
npm install
npm run db:generate
npm run db:push
npm run db:seed
cd ../..

# Spuštění všech služeb
docker-compose up -d
```

### 6. Kontrola stavu

```bash
# Zobrazení stavu všech služeb
docker-compose ps

# Zobrazení logů
docker-compose logs -f

# Kontrola Traefik dashboardu
# http://YOUR_SERVER_IP:8080
```

## 🔒 SSL Certifikáty

Traefik automaticky získává SSL certifikáty přes Let's Encrypt pro všechny domény.

**První spuštění může trvat několik minut** - Traefik musí získat certifikáty.

Kontrola certifikátů:
```bash
docker-compose logs traefik | grep "certificate"
```

## 📊 Monitoring

### Health Checks

Všechny služby mají health check endpointy:

```bash
# API
curl http://localhost:3000/health

# Domain Manager
curl http://localhost:3001/health
```

### Logy

```bash
# Všechny logy
docker-compose logs -f

# Konkrétní služba
docker-compose logs -f api
docker-compose logs -f web-cz
docker-compose logs -f domain-manager
```

### Metriky

Traefik dashboard: `http://YOUR_SERVER_IP:8080`

## 🔄 Aktualizace

### Aktualizace kódu

```bash
cd /opt/IT-Enterprise
git pull origin main

# Rebuild a restart služeb
docker-compose up -d --build
```

### Aktualizace databáze

```bash
cd packages/database
npm run db:migrate
```

## 💾 Zálohování

### Databáze

```bash
# Manuální záloha
docker-compose exec postgres pg_dump -U itenterprise itenterprise > backup_$(date +%Y%m%d).sql

# Automatické zálohování (cron)
# Přidat do crontab:
0 2 * * * docker-compose exec -T postgres pg_dump -U itenterprise itenterprise > /backup/db_$(date +\%Y\%m\%d).sql
```

### Obnova zálohy

```bash
docker-compose exec -T postgres psql -U itenterprise itenterprise < backup_YYYYMMDD.sql
```

## 🐛 Troubleshooting

### Služby se nespouštějí

```bash
# Kontrola logů
docker-compose logs [service-name]

# Kontrola portů
sudo netstat -tulpn | grep LISTEN

# Restart služby
docker-compose restart [service-name]
```

### Databáze nefunguje

```bash
# Kontrola připojení
docker-compose exec postgres psql -U itenterprise -d itenterprise -c "SELECT 1;"

# Kontrola logů
docker-compose logs postgres
```

### SSL certifikáty se negenerují

```bash
# Kontrola Traefik logů
docker-compose logs traefik

# Kontrola DNS záznamů
dig it-enterprise.cz

# Kontrola Let's Encrypt rate limits
# https://letsencrypt.org/docs/rate-limits/
```

### Porty jsou obsazené

```bash
# Najít proces používající port
sudo lsof -i :80
sudo lsof -i :443

# Zastavit proces nebo změnit porty v docker-compose.yml
```

## 🔐 Bezpečnost

### Firewall

```bash
# UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Aktualizace

```bash
# Pravidelné aktualizace
sudo apt update && sudo apt upgrade -y

# Aktualizace Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

### Monitoring

- Nastavit monitoring služeb (např. Uptime Robot)
- Nastavit alerting pro kritické chyby
- Pravidelné kontroly logů

## 📈 Škálování

### Horizontální škálování

Pro větší zátěž můžete škálovat služby:

```bash
# Škálování API služby
docker-compose up -d --scale api=3

# Škálování web služeb
docker-compose up -d --scale web-cz=2
```

### Vertikální škálování

Zvýšit resources v `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 🎯 Production Checklist

- [ ] Všechny environment variables nastaveny
- [ ] Silná hesla pro databázi a JWT
- [ ] DNS záznamy správně nastaveny
- [ ] SSL certifikáty fungují
- [ ] Firewall nakonfigurován
- [ ] Zálohování nastaveno
- [ ] Monitoring nastaven
- [ ] Logy jsou sledovány
- [ ] Aktualizace plánovány
- [ ] Dokumentace aktualizována

---

**Poznámka**: Tento průvodce předpokládá základní znalost Docker a Linux administrace.
