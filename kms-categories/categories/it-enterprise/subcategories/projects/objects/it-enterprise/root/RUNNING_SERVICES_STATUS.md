# 🚀 Running Services Status

Generated: $(date)

## Services Status

```bash
docker compose ps
```

## Health Checks

### API Service
- Health: `curl http://localhost:3000/health`
- Detailed: `curl http://localhost:3000/health/detailed`
- API Info: `curl http://localhost:3000/api`

### Database
```bash
docker compose exec postgres psql -U itenterprise -d itenterprise -c "SELECT version();"
```

## View Logs

### All Services
```bash
docker compose logs -f
```

### Specific Service
```bash
docker compose logs -f api
docker compose logs -f postgres
docker compose logs -f domain-manager
docker compose logs -f email-service
```

## Service URLs

- API: http://localhost:3000
- Traefik Dashboard: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Quick Commands

```bash
# Restart service
docker compose restart <service-name>

# Stop all
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild and restart
docker compose up -d --build
```

