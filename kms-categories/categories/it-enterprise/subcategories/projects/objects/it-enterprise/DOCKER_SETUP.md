# Docker Setup - Kompletní konfigurace

## ✅ Všechny služby v Docker Compose

### Infrastruktura
- ✅ **PostgreSQL** - Hlavní databáze (port 5432)
- ✅ **Redis** - Cache a sessions (port 6379)
- ✅ **Traefik** - Reverse proxy a load balancer (porty 80, 443, 8080)

### IT Enterprise weby (6 aplikací)
- ✅ **web-cz** - it-enterprise.cz (port 3001)
- ✅ **web-solutions** - it-enterprise.solutions (port 3002)
- ✅ **web-cloud** - it-enterprise.cloud (port 3003)
- ✅ **web-pro** - it-enterprise.pro (port 3004)
- ✅ **web-eu** - it-enterprise.eu (port 3005)
- ✅ **web-coil** - it-enterprise.co.il (port 3006)

### Partnerské weby (5 aplikací)
- ✅ **web-biznesmen** - biznesmen.cz (port 3007)
- ✅ **web-gazdaservice** - gazdaservice.cz (port 3008)
- ✅ **web-zmankesef** - zmankesef.cz, zman-kesef.eu (port 3009)
- ✅ **web-avoda** - avoda.cz (port 3010)
- ✅ **web-busticket** - bus-ticket.info (port 3011)

## Traefik Routing

Všechny domény jsou automaticky směrovány Traefikem:
- **Automatické SSL certifikáty** (Let's Encrypt)
- **HTTPS redirect** (HTTP → HTTPS)
- **Load balancing** připraveno
- **Health checks** pro všechny služby

## Spuštění

### 1. Příprava
```bash
cd /opt/IT-Enterprise
cp .env.example .env
# Upravte .env soubor
```

### 2. Build aplikací
```bash
# Build všech aplikací
npm install
npm run build
```

### 3. Spuštění Docker služeb
```bash
# Spuštění všech služeb
docker-compose up -d

# Kontrola stavu
docker-compose ps

# Logy
docker-compose logs -f
```

### 4. Kontrola Traefik dashboardu
- URL: `http://<SERVER_IP>:8080`
- Zobrazuje všechny routy a služby

## DNS Nastavení

Pro všechny domény přidejte A záznamy na IP serveru:

```
it-enterprise.cz          A    <SERVER_IP>
it-enterprise.solutions    A    <SERVER_IP>
it-enterprise.cloud       A    <SERVER_IP>
it-enterprise.pro         A    <SERVER_IP>
it-enterprise.eu          A    <SERVER_IP>
it-enterprise.co.il       A    <SERVER_IP>
biznesmen.cz              A    <SERVER_IP>
gazdaservice.cz           A    <SERVER_IP>
zmankesef.cz              A    <SERVER_IP>
zman-kesef.eu             A    <SERVER_IP>
avoda.cz                  A    <SERVER_IP>
bus-ticket.info           A    <SERVER_IP>
```

## Wildcard domény 3. úrovně

Pro podporu domén 3. úrovně přidejte také wildcard záznamy:

```
*.it-enterprise.cloud     A    <SERVER_IP>
*.it-enterprise.eu        A    <SERVER_IP>
*.it-enterprise.pro       A    <SERVER_IP>
*.biznes.cz               A    <SERVER_IP>
*.business.eu.com         A    <SERVER_IP>
*.services.eu.com         A    <SERVER_IP>
*.businesmen.eu.com       A    <SERVER_IP>
*.businessmen.pro         A    <SERVER_IP>
```

Traefik automaticky detekuje všechny subdomény a směruje je na správnou aplikaci.

## Monitoring

### Health Checks
```bash
# Kontrola všech služeb
docker-compose ps

# Logy konkrétní služby
docker-compose logs -f web-cz

# Restart služby
docker-compose restart web-cz
```

### Traefik Dashboard
- Zobrazuje všechny routy
- Status služeb
- SSL certifikáty
- Metriky

## Aktualizace

```bash
# Pull změny
git pull

# Rebuild aplikací
npm run build

# Restart služeb
docker-compose restart

# Nebo rebuild konkrétní služby
docker-compose build web-cz
docker-compose up -d web-cz
```

## Troubleshooting

### SSL certifikáty se nevytváří
- Zkontrolujte DNS záznamy (musí být aktivní)
- Ověřte, že porty 80 a 443 jsou otevřené
- Zkontrolujte logy: `docker-compose logs traefik`

### Aplikace se nespouští
- Zkontrolujte logy: `docker-compose logs <service-name>`
- Ověřte build: `docker-compose build <service-name>`
- Zkontrolujte porty (nesmí být obsazené)

### Databáze není dostupná
- Zkontrolujte: `docker-compose ps postgres`
- Ověřte connection string v `.env`
- Zkontrolujte logy: `docker-compose logs postgres`

