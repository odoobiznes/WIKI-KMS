# Domain Manager Service - Status

## ✅ Dokončeno

### 1. Domain Manager Service
- ✅ Express.js server s TypeScript
- ✅ Automatické monitorování databáze (cron job každých 5 minut)
- ✅ API endpoints pro správu domén
- ✅ Health check endpoint

### 2. Domain Service
- ✅ `getPendingDomains()` - získání čekajících domén
- ✅ `configureDomain()` - konfigurace domény
- ✅ `activateDomain()` - aktivace domény
- ✅ `suspendDomain()` - pozastavení domény
- ✅ `getUserDomains()` - domény uživatele

### 3. Traefik Service
- ✅ Generování Traefik konfigurací
- ✅ Generování Docker labels pro Traefik
- ✅ Aktualizace Traefik labels přes Docker API
- ✅ Generování dynamických Traefik konfigurací
- ✅ Odstraňování labels při pozastavení

### 4. Nginx Service
- ✅ Generování Nginx konfigurací
- ✅ SSL konfigurace
- ✅ Security headers
- ✅ Proxy settings
- ✅ Static files caching
- ✅ Health check endpoint

### 5. DNS Helper
- ✅ Validace domén a subdomén
- ✅ Generování DNS záznamů (A, CNAME)
- ✅ Template pro DNS provider integraci
- ✅ Utility funkce pro práci s doménami

### 6. Docker Integration
- ✅ Dockerfile pro Domain Manager
- ✅ Přidáno do docker-compose.yml
- ✅ Přístup k Docker socketu
- ✅ Traefik routing pro Domain Manager API

## 📋 Struktura

```
services/domain-manager/
├── src/
│   ├── index.ts                    # Express server + cron jobs
│   ├── services/
│   │   ├── domainService.ts        # Hlavní logika správy domén
│   │   ├── traefikService.ts       # Traefik integrace
│   │   └── nginxService.ts          # Nginx konfigurace
│   └── utils/
│       └── dnsHelper.ts             # DNS utility funkce
├── Dockerfile
├── tsconfig.json
└── package.json
```

## 🔄 Workflow

1. **Vytvoření domény**
   - Uživatel vytvoří doménu přes API (`POST /api/domains`)
   - Doména je uložena se statusem `PENDING`

2. **Automatická konfigurace**
   - Domain Manager detekuje novou doménu (cron job každých 5 minut)
   - Nebo manuálně přes `POST /api/domains/:id/configure`

3. **Generování konfigurací**
   - Traefik konfigurace (JSON)
   - Nginx konfigurace (backup)
   - Traefik Docker labels

4. **Aktivace**
   - Status změněn na `ACTIVE`
   - SSL certifikát získán přes Let's Encrypt (Traefik)
   - Doména je dostupná

## 🚀 API Endpoints

### Health Check
```
GET /health
```

### Domény
```
GET /api/domains/pending          # Seznam čekajících domén
POST /api/domains/:id/configure   # Konfigurovat doménu
POST /api/domains/:id/activate     # Aktivovat doménu
POST /api/domains/:id/suspend      # Pozastavit doménu
```

## 🔧 Konfigurace

### Environment Variables
- `DOMAIN_MANAGER_PORT` - Port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection
- `ALLOWED_ORIGINS` - CORS origins

### Docker Volumes
- `/var/run/docker.sock` - Docker socket (read-only)
- `./config/nginx` - Nginx konfigurace
- `./config/letsencrypt` - SSL certifikáty

## 📝 Další kroky

1. **DNS Provider Integration**
   - Cloudflare API
   - AWS Route53
   - DigitalOcean DNS
   - Nebo jiný provider

2. **Monitoring & Logging**
   - Logování všech operací
   - Metriky pro monitoring
   - Alerting při chybách

3. **Backup & Recovery**
   - Zálohování konfigurací
   - Obnova při selhání

4. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

5. **Webhook Integration**
   - Notifikace při změnách
   - Webhook pro DNS updates

## 🎯 Použití

```bash
# Spuštění v Docker
docker-compose up domain-manager

# Manuální konfigurace domény
curl -X POST http://localhost:3001/api/domains/{domainId}/configure

# Aktivace domény
curl -X POST http://localhost:3001/api/domains/{domainId}/activate
```

