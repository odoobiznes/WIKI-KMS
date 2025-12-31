# 🚀 IT Enterprise - Complete Services Report

## Status Overview

$(docker compose ps 2>&1)

## Health Checks

### API Health
$(curl -s http://localhost:3000/health 2>&1 | head -5)

### Detailed Health
$(curl -s http://localhost:3000/health/detailed 2>&1 | python3 -m json.tool 2>/dev/null | head -20 || echo "Not available yet")

## Recent Logs

$(docker compose logs --tail=20 2>&1 | head -50)

## System Info

- Docker: $(docker --version 2>&1)
- Docker Compose: $(docker compose version 2>&1)
- Running Containers: $(docker ps -q 2>/dev/null | wc -l)

## Files Created

- SERVICES_RUNNING.txt - Service status
- ALL_SERVICES_LOGS.txt - All service logs
- API_HEALTH_DETAILED.json - API health details
- RUNNING_SERVICES_STATUS.md - This file

