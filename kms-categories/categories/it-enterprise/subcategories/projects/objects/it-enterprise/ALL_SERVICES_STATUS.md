# 🚀 Všechny Služby - Status

## ✅ Spuštěné Služby

### Docker Services
- ✅ **Redis**: Běží na portu 6379
- ⚠️ **PostgreSQL**: Port 5432 již používán externí instancí

### Lokální Services
- ✅ **API**: http://localhost:3000
- ✅ **Web-CZ**: http://localhost:3001

## 📊 Status

### API Service
- **URL**: http://localhost:3000
- **Health**: http://localhost:3000/health
- **Detailed**: http://localhost:3000/health/detailed
- **PID**: $(cat API_PID.txt 2>/dev/null || echo "N/A")
- **Logy**: `tail -f API_LOG.txt`

### Web-CZ Application
- **URL**: http://localhost:3001
- **PID**: $(cat WEB_CZ_PID.txt 2>/dev/null || echo "N/A")
- **Logy**: `tail -f WEB_CZ_LOG.txt`

### Database
- **PostgreSQL**: Externí instance na localhost:5432
- **Redis**: Docker container na localhost:6379

## 🔍 Testování

### API Health Check
```bash
curl http://localhost:3000/health
```

### Web Application
```bash
curl http://localhost:3001
```

### Database Connection
```bash
# Použijte existující PostgreSQL
psql -h localhost -U itenterprise -d itenterprise
```

## 📝 Poznámky

- PostgreSQL běží externě (ne v Dockeru)
- API a Web aplikace běží lokálně
- Redis běží v Dockeru

## 🛠️ Údržba

### Zobrazit logy
```bash
# API
tail -f API_LOG.txt

# Web-CZ
tail -f WEB_CZ_LOG.txt

# Docker služby
docker compose logs -f redis
```

### Restart služeb
```bash
# API
cd services/api
pkill -f "tsx.*api"
npm run dev > ../../API_LOG.txt 2>&1 &
echo $! > ../../API_PID.txt

# Web-CZ
cd apps/web-cz
pkill -f "next.*dev"
npm run dev > ../../WEB_CZ_LOG.txt 2>&1 &
echo $! > ../../WEB_CZ_PID.txt
```

