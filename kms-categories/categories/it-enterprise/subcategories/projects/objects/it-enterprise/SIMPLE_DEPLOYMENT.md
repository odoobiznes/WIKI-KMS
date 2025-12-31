# 🚀 Jednodušší Nasazení - Bez Docker Build

## Problém s Docker Build

Docker build selhává kvůli workspace dependencies v monorepo.

## ✅ Jednodušší řešení

### Varianta 1: Hybridní nasazení (doporučeno pro vývoj)

1. **Spustit jen infrastrukturu v Dockeru:**
   ```bash
   docker compose up -d postgres redis
   ```

2. **Buildovat a spustit aplikace lokálně:**
   ```bash
   # Build všech aplikací
   npm run build
   
   # Spustit konkrétní aplikaci
   cd apps/web-cz
   npm run dev
   ```

### Varianta 2: Použít existující PostgreSQL

Pokud máte PostgreSQL běžící externě:

1. **Nastavit DATABASE_URL v .env:**
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/itenterprise
   ```

2. **Spustit aplikace lokálně:**
   ```bash
   cd apps/web-cz
   npm run dev
   ```

### Varianta 3: Production Docker Build

Pro produkci:
1. Buildovat aplikace lokálně
2. Kopírovat build artifacts do Docker images
3. Nebo publikovat workspace packages do npm registry

## Rychlý Start

```bash
# 1. Spustit databázi
docker compose up -d postgres redis

# 2. Nastavit databázi
cd packages/database
DATABASE_URL="postgresql://itenterprise:changeme@localhost:5432/itenterprise" npm run db:push

# 3. Spustit API lokálně
cd ../../services/api
npm run dev

# 4. Spustit web aplikaci
cd ../../apps/web-cz
npm run dev
```

## Výhody

- ✅ Rychlejší vývoj
- ✅ Snadnější debugging
- ✅ Žádné problémy s workspace dependencies
- ✅ Hot reload funguje

## Pro produkci

Použijte CI/CD pipeline, který:
1. Builduje aplikace
2. Vytváří Docker images s build artifacts
3. Deployuje do produkce

