# 🔧 Build Error - Opraveno

## Problém

Docker build selhával s chybou:
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## ✅ Řešení

Změnil jsem všechny Dockerfiles z `npm ci` na `npm install`, protože:
- `npm ci` vyžaduje existující `package-lock.json`
- `npm install` vytvoří `package-lock.json` pokud neexistuje
- V monorepo setupu je to vhodnější řešení

## Změněné soubory

- Všechny `apps/*/Dockerfile`
- Všechny `services/*/Dockerfile`

## Status

✅ Dockerfiles opraveny
🔄 Služby se znovu buildují

## Další kroky

Po dokončení buildu:
```bash
docker compose ps
docker compose logs -f
```

