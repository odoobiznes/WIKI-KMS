# Testing Guide

Průvodce testováním IT Enterprise platformy.

## 🧪 Typy testů

### 1. Strukturní testy

```bash
# Spuštění strukturních testů
./scripts/test.sh
```

Kontroluje:
- ✅ Existenci všech kritických souborů
- ✅ Strukturu projektu
- ✅ Docker konfiguraci
- ✅ Package konfigurace

### 2. TypeScript Type Checking

```bash
# Root level
npm run type-check

# Konkrétní package
cd packages/database
npm run type-check

# Konkrétní service
cd services/api
npm run type-check
```

### 3. Build Test

```bash
# Build všech aplikací
npm run build

# Build konkrétní aplikace
cd apps/web-cz
npm run build
```

### 4. Linting

```bash
# Lint všech aplikací
npm run lint

# Lint konkrétní aplikace
cd apps/web-cz
npm run lint
```

### 5. Docker Test

```bash
# Spuštění všech služeb
docker-compose up -d

# Kontrola stavu
docker-compose ps

# Kontrola logů
docker-compose logs -f

# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### 6. API Testy

```bash
# Health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed

# API info
curl http://localhost:3000/api

# Test registrace (mělo by selhat kvůli rate limitu po několika pokusech)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"test123456"}'
```

### 7. Database Test

```bash
# Připojení k databázi
docker-compose exec postgres psql -U itenterprise -d itenterprise

# Kontrola tabulek
\dt

# Kontrola dat
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Product";
```

## 🔍 Testovací scénáře

### Scénář 1: Registrace a přihlášení

1. Registrace nového uživatele
2. Přihlášení s novými credentials
3. Ověření JWT tokenu
4. Kontrola welcome emailu

### Scénář 2: Vytvoření projektu

1. Přihlášení uživatele
2. Vytvoření nového projektu
3. Výběr AI platformy
4. Publikace projektu

### Scénář 3: Vytvoření domény

1. Přihlášení uživatele
2. Vytvoření nové domény 3. úrovně
3. Kontrola automatické konfigurace
4. Kontrola email notifikace

### Scénář 4: Nákup produktu

1. Přihlášení uživatele
2. Zobrazení produktů
3. Vytvoření payment intentu
4. Dokončení platby (test mode)
5. Kontrola order confirmation emailu

## 🐛 Debugging

### API Logs

```bash
docker-compose logs -f api
```

### Domain Manager Logs

```bash
docker-compose logs -f domain-manager
```

### Email Service Logs

```bash
docker-compose logs -f email-service
```

### Database Logs

```bash
docker-compose logs -f postgres
```

## 📊 Monitoring

### Health Checks

- API: `http://localhost:3000/health`
- Domain Manager: `http://localhost:3001/health`
- Email Service: `http://localhost:3002/health`

### Traefik Dashboard

- `http://localhost:8080`

### Statistics

- `GET /api/stats` (vyžaduje admin auth)

## ✅ Test Checklist

- [ ] Všechny služby se spouštějí
- [ ] Health checks fungují
- [ ] Database connection funguje
- [ ] API endpoints odpovídají
- [ ] Rate limiting funguje
- [ ] Email service funguje
- [ ] Payment webhook funguje
- [ ] Domain Manager funguje
- [ ] Frontend aplikace se buildují
- [ ] TypeScript type checking projde

## 🚀 Production Testing

Před nasazením do produkce:

1. **Security Audit**
   - Kontrola environment variables
   - Kontrola secrets
   - Kontrola CORS settings
   - Kontrola rate limits

2. **Performance Test**
   - Load testing
   - Stress testing
   - Database query optimization

3. **Backup Test**
   - Database backup
   - Restore test

4. **SSL Test**
   - Certifikáty fungují
   - HTTPS redirect funguje

---

**Poznámka**: Pro produkční testování použijte staging prostředí.

