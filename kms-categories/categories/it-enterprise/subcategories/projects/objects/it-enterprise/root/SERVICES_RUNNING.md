# 🚀 Spuštěné Služby

## Status

### Docker Services
- PostgreSQL: `docker compose ps postgres`
- Redis: `docker compose ps redis`

### Lokální Services
- API: http://localhost:3000
- Web-CZ: http://localhost:3001

## Logy

### API Logy
```bash
tail -f API_LOG.txt
```

### Web-CZ Logy
```bash
tail -f WEB_CZ_LOG.txt
```

## Zastavení služeb

### Zastavit API
```bash
kill $(cat API_PID.txt)
```

### Zastavit Web-CZ
```bash
kill $(cat WEB_CZ_PID.txt)
```

### Zastavit Docker služby
```bash
docker compose down
```

## Health Checks

### API
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed
```

### Web
```bash
curl http://localhost:3001
```

## Restart

### Restart API
```bash
kill $(cat API_PID.txt)
cd services/api && npm run dev > ../../API_LOG.txt 2>&1 &
echo $! > ../../API_PID.txt
```

### Restart Web-CZ
```bash
kill $(cat WEB_CZ_PID.txt)
cd apps/web-cz && npm run dev > ../../WEB_CZ_LOG.txt 2>&1 &
echo $! > ../../WEB_CZ_PID.txt
```

