# Deployment Status Report

Generated: $(date)

## Services Status

$(docker compose ps 2>&1)

## Recent Logs

$(docker compose logs --tail=30 2>&1 | head -50)

## System Information

- Docker: $(docker --version 2>&1)
- Docker Compose: $(docker compose version 2>&1)
- Disk Space: $(df -h / | tail -1)

## Next Steps

1. Review logs in SERVICE_LOGS.txt
2. Check service status in SERVICE_STATUS.json
3. See ERROR_ANALYSIS.md for solutions
