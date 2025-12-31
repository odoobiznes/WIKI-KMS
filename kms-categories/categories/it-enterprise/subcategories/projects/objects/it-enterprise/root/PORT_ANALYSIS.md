# 🔍 Analýza Portů

## Aktuální Stav

### Používané Porty

#### Lokální služby
- **Port 3000**: API service (nebo jiná aplikace)
- **Port 3001**: Web-CZ aplikace ✅

#### Docker služby
- **Port 5432**: PostgreSQL (externí instance, ne Docker)
- **Port 6379**: Redis ✅

#### Očekávané porty (z docker-compose.yml)

**Next.js aplikace:**
- web-cz: 3001
- web-solutions: 3002
- web-cloud: 3003
- web-pro: 3004
- web-eu: 3005
- web-coil: 3006
- web-biznesmen: 3007
- web-gazdaservice: 3008
- web-zmankesef: 3009
- web-avoda: 3010
- web-busticket: 3011

**Backend services:**
- api: 3000
- domain-manager: 3001 ⚠️ KONFLIKT s web-cz
- email-service: 3002 ⚠️ KONFLIKT s web-solutions

**Infrastructure:**
- postgres: 5432 (externí)
- redis: 6379 ✅
- traefik: 80, 443, 8080

## ⚠️ Zjištěné Problémy

### Konflikty portů v docker-compose.yml

1. **Port 3001**: 
   - web-cz: 3001
   - domain-manager: 3001 ⚠️

2. **Port 3002**:
   - web-solutions: 3002
   - email-service: 3002 ⚠️

## ✅ Řešení

### Varianta 1: Opravit porty v docker-compose.yml
- domain-manager: změnit na 3012
- email-service: změnit na 3013

### Varianta 2: Použít Traefik routing
- Všechny služby přes Traefik (porty 80/443)
- Interní porty mohou být libovolné
- Traefik routuje podle domén

## 📊 Aktuální použití

```bash
# Zkontrolovat porty
netstat -tlnp | grep -E ":(3000|3001|5432|6379)"
# nebo
ss -tlnp | grep -E ":(3000|3001|5432|6379)"
```

## 🎯 Doporučení

Pro produkci použít Traefik routing:
- Všechny služby přes Traefik
- Interní porty nejsou důležité
- Externí přístup přes domény (80/443)

---

**Status**: ⚠️ Konflikty portů zjištěny
**Datum**: 2025-01-01

