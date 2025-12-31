#!/bin/bash
# Skript pro trvalé zastavení BUS-Tickets aplikace

echo "🛑 Zastavuji BUS-Tickets aplikaci..."

# Zastavit všechny Next.js procesy
pkill -9 -f "next" 2>/dev/null

# Uvolnit port 3001
if lsof -ti:3001 > /dev/null 2>&1; then
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo "✅ Port 3001 uvolněn"
fi

# Zastavit systemd služby
sudo systemctl stop bus-tickets-admin.service 2>/dev/null || true
sudo systemctl stop bus-tickets-api.service 2>/dev/null || true
sudo systemctl stop bus-tickets-central-web.service 2>/dev/null || true
sudo systemctl stop bus-tickets-client-BIZNESMEN-api.service 2>/dev/null || true
sudo systemctl stop bus-tickets-client-BIZNESMEN-web.service 2>/dev/null || true
sudo systemctl stop bus-tickets-client-SYMCHE-web.service 2>/dev/null || true

# Zakázat automatické spouštění
sudo systemctl disable bus-tickets-admin.service 2>/dev/null || true
sudo systemctl disable bus-tickets-api.service 2>/dev/null || true
sudo systemctl disable bus-tickets-central-web.service 2>/dev/null || true
sudo systemctl disable bus-tickets-client-BIZNESMEN-api.service 2>/dev/null || true
sudo systemctl disable bus-tickets-client-BIZNESMEN-web.service 2>/dev/null || true
sudo systemctl disable bus-tickets-client-SYMCHE-web.service 2>/dev/null || true

# Zastavit docker kontejnery (pokud existují)
docker stop $(docker ps -q --filter "name=bus") 2>/dev/null || true
docker stop $(docker ps -q --filter "name=ticket") 2>/dev/null || true

# Zastavit PM2 procesy (pokud existují)
pm2 stop bus-tickets 2>/dev/null || true
pm2 delete bus-tickets 2>/dev/null || true

echo "✅ BUS-Tickets aplikace zastavena natrvalo"
echo "✅ Automatické spouštění zakázáno"
