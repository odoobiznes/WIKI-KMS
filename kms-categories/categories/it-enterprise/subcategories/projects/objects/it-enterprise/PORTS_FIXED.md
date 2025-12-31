# ✅ Porty Opraveny

## Problém

V `docker-compose.yml` byly konflikty portů:
- domain-manager a web-cz: oba port 3001
- email-service a web-solutions: oba port 3002

## ✅ Řešení

Opravil jsem porty v `docker-compose.yml`:

### Backend Services
- **api**: 3000 ✅
- **domain-manager**: 3012 ✅ (bylo 3001)
- **email-service**: 3013 ✅ (bylo 3002)

### Next.js Aplikace
- **web-cz**: 3001 ✅
- **web-solutions**: 3002 ✅
- **web-cloud**: 3003
- **web-pro**: 3004
- **web-eu**: 3005
- **web-coil**: 3006
- **web-biznesmen**: 3007
- **web-gazdaservice**: 3008
- **web-zmankesef**: 3009
- **web-avoda**: 3010
- **web-busticket**: 3011

### Infrastructure
- **postgres**: 5432 (externí instance)
- **redis**: 6379
- **traefik**: 80, 443, 8080

## 📊 Aktuální Stav

### Běžící služby
- ✅ **Web-CZ**: Port 3001
- ✅ **Redis**: Port 6379 (Docker)
- ⚠️ **PostgreSQL**: Port 5432 (externí, ne Docker)

### Volné porty pro další služby
- 3000 - API (může být použito)
- 3002-3011 - Pro další Next.js aplikace
- 3012 - Domain Manager
- 3013 - Email Service

## 🎯 Pro produkci

Všechny služby budou přístupné přes Traefik:
- Interní porty nejsou důležité
- Externí přístup přes domény (80/443)
- Traefik routuje podle Host header

---

**Status**: ✅ Porty opraveny
**Datum**: 2025-01-01

