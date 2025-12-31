#!/bin/bash

echo "🚀 IT Enterprise Platform - Service Starter"
echo "==========================================="
echo ""

# Check Docker daemon
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo ""
    echo "Spouštění Docker daemonu..."
    
    if sudo systemctl start docker 2>/dev/null; then
        echo "✅ Docker daemon spuštěn"
        sleep 2
    else
        echo "❌ Nelze spustit Docker daemon"
        echo "💡 Zkuste: sudo systemctl start docker"
        exit 1
    fi
else
    echo "✅ Docker daemon běží"
fi

echo ""
echo "📦 Spouštění služeb..."
docker compose up -d

echo ""
echo "⏳ Čekání na služby (10 sekund)..."
sleep 10

echo ""
echo "📊 Status služeb:"
docker compose ps

echo ""
echo "✅ Hotovo!"
echo ""
echo "Test API:"
echo "  curl http://localhost:3000/health"
echo ""
echo "Zobrazit logy:"
echo "  docker compose logs -f"
