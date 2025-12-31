# Domain Manager Service

Automatická správa domén 3. úrovně pro IT Enterprise platformu.

## Funkce

- ✅ Automatická detekce nových domén v databázi
- ✅ Generování Traefik konfigurací
- ✅ Generování Nginx konfigurací (backup)
- ✅ Správa SSL certifikátů přes Let's Encrypt
- ✅ Aktualizace Traefik labels pro Docker kontejnery
- ✅ Cron job pro automatické zpracování čekajících domén

## API Endpoints

### GET `/health`
Health check endpoint

### GET `/api/domains/pending`
Získat seznam čekajících domén

### POST `/api/domains/:id/configure`
Konfigurovat doménu (generovat konfigurace)

### POST `/api/domains/:id/activate`
Aktivovat doménu

### POST `/api/domains/:id/suspend`
Pozastavit doménu

## Automatické zpracování

Service automaticky kontroluje databázi každých 5 minut a konfiguruje nové čekající domény.

## Konfigurace

### Environment Variables

- `DOMAIN_MANAGER_PORT` - Port pro Domain Manager service (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_ORIGINS` - Povolené CORS origins

### Docker Requirements

Service potřebuje přístup k Docker socketu (`/var/run/docker.sock`) pro správu Traefik labels.

## Traefik Integration

Domain Manager automaticky generuje Traefik labels pro nové domény:

```yaml
traefik.enable: true
traefik.http.routers.domain-{id}.rule: Host(`{fullDomain}`)
traefik.http.routers.domain-{id}.entrypoints: websecure
traefik.http.routers.domain-{id}.tls.certresolver: letsencrypt
traefik.http.services.domain-{id}.loadbalancer.server.port: {port}
```

## Nginx Backup

Service také generuje Nginx konfigurace jako backup řešení. Konfigurace jsou uloženy v `config/nginx/`.

## DNS Management

DNS helper poskytuje utility funkce pro správu DNS záznamů. Aktuální implementace je template - pro produkci je potřeba integrovat s DNS providerem (Cloudflare, AWS Route53, DigitalOcean, etc.).

## Spuštění

```bash
# Development
cd services/domain-manager
npm run dev

# Production (Docker)
docker-compose up domain-manager
```

## Workflow

1. Uživatel vytvoří novou doménu přes API
2. Doména je uložena do databáze se statusem `PENDING`
3. Domain Manager detekuje novou doménu (cron job nebo API call)
4. Service vygeneruje Traefik a Nginx konfigurace
5. Aktualizuje Traefik labels (pokud je kontejner dostupný)
6. Změní status domény na `ACTIVE`
7. Traefik automaticky získává SSL certifikát přes Let's Encrypt

