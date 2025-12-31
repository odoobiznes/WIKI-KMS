# Service Status & Logs

## Current Status

Generated: $(date)

## Services

```bash
docker compose ps
```

## Logs

### All Services
```bash
docker compose logs -f
```

### Specific Service
```bash
docker compose logs -f <service-name>
```

## Common Issues

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

### Database Connection Error
```bash
# Check PostgreSQL logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U itenterprise -d itenterprise
```

### Service Won't Start
```bash
# Check logs
docker compose logs <service-name>

# Rebuild
docker compose up -d --build <service-name>
```

