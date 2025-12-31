# 🚀 Platform Ready for Deployment

## ✅ Dokončeno

### Instalace
- ✅ Všechny npm závislosti nainstalovány
- ✅ Workspace závislosti opraveny
- ✅ Prisma schema opraveno a validováno
- ✅ Prisma client připraven

### Konfigurace
- ✅ .env soubor vytvořen z env.example
- ✅ Všechny konfigurační soubory připraveny
- ✅ Docker Compose v2 kompatibilní (version odstraněno)

### Struktura
- ✅ 12 Next.js aplikací
- ✅ 3 Backend services
- ✅ 4 Shared packages
- ✅ 18 Docker services nakonfigurováno

## 📋 Před nasazením

### 1. Spustit Docker Daemon

```bash
# Na většině systémů
sudo systemctl start docker

# Nebo
sudo service docker start

# Ověřit, že běží
sudo systemctl status docker
```

### 2. Nastavit Environment Variables

Upravit `.env` soubor s reálnými hodnotami:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Silný secret pro JWT
- `ACME_EMAIL` - Email pro Let's Encrypt
- `STRIPE_SECRET_KEY` - Pokud používáte platby
- `SMTP_*` - Pokud používáte email service

### 3. Spustit Databázi

```bash
# Spustit PostgreSQL a Redis
docker compose up -d postgres redis

# Počkat, až budou ready (10-15 sekund)
sleep 10

# Ověřit
docker compose ps
```

### 4. Nastavit Databázi

```bash
cd packages/database

# Push schema
DATABASE_URL="postgresql://itenterprise:changeme@localhost:5432/itenterprise" npm run db:push

# Volitelně: Seed data
npm run db:seed
```

### 5. Spustit Všechny Služby

```bash
# Build a spustit všechny služby
docker compose up -d --build

# Nebo postupně
docker compose up -d postgres redis
docker compose up -d api domain-manager email-service
docker compose up -d traefik
docker compose up -d web-cz web-solutions web-cloud
# ... atd
```

### 6. Ověřit Nasazení

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed

# API info
curl http://localhost:3000/api

# Traefik dashboard
# Otevřít http://localhost:8080 v prohlížeči
```

## 🔍 Troubleshooting

### Docker Daemon neběží

```bash
# Spustit Docker
sudo systemctl start docker

# Nebo pokud nemáte sudo
# Kontaktovat administrátora serveru
```

### Database Connection Error

```bash
# Zkontrolovat, zda PostgreSQL běží
docker compose ps postgres

# Zkontrolovat logy
docker compose logs postgres

# Test připojení
docker compose exec postgres psql -U itenterprise -d itenterprise
```

### Port Already in Use

```bash
# Zjistit, co používá port
sudo lsof -i :3000
sudo lsof -i :5432

# Změnit porty v docker-compose.yml pokud potřebujete
```

### Build Errors

```bash
# Rebuild konkrétní službu
docker compose build --no-cache <service-name>

# Rebuild všechny
docker compose build --no-cache
```

## 📊 Monitoring

### Logs

```bash
# Všechny služby
docker compose logs -f

# Konkrétní služba
docker compose logs -f api
docker compose logs -f postgres
```

### Status

```bash
# Stav všech služeb
docker compose ps

# Resource usage
docker stats
```

## 🎯 Production Checklist

Před nasazením do produkce:

- [ ] Docker daemon běží
- [ ] .env soubor nakonfigurován s produkčními hodnotami
- [ ] JWT_SECRET je silný a unikátní
- [ ] DATABASE_URL správně nastaven
- [ ] SSL certifikáty nakonfigurovány (Let's Encrypt)
- [ ] Stripe keys nastaveny (pokud používáte)
- [ ] SMTP nastaveno (pokud používáte email)
- [ ] Backup strategie připravena
- [ ] Monitoring nastaven
- [ ] Logging nakonfigurován

## 📝 Poznámky

- První nasazení může trvat 10-15 minut
- Let's Encrypt certifikáty mohou trvat několik minut
- Database migrace by měly být spuštěny před startem služeb
- Monitorujte logy během prvního startu

---

**Status**: ✅ Platforma připravena k nasazení
**Datum**: 2025-01-01
**Další krok**: Spustit Docker daemon a nasadit

