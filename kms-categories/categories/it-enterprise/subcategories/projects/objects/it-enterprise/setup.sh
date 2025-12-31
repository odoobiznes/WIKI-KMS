#!/bin/bash

# IT Enterprise Setup Script
# Vytvoření struktury projektu a příprava pro GitHub

echo "=== IT Enterprise Setup ==="

# Vytvoření základní struktury
mkdir -p /opt/IT-Enterprise/{domains,scripts,config,docker}

# Doménové struktury
mkdir -p /opt/IT-Enterprise/domains/{cz,solutions,cloud,pro,eu,co.il}

# Každá doména má své podsložky
for domain in cz solutions cloud pro eu co.il; do
    mkdir -p /opt/IT-Enterprise/domains/$domain/{src,assets,config,locales}
done

# Skripty pro správu
mkdir -p /opt/IT-Enterprise/scripts/{deployment,backup,monitoring}

# Konfigurace
mkdir -p /opt/IT-Enterprise/config/{nginx,traefik,ssl,database}

# Docker kontejnery
mkdir -p /opt/IT-Enterprise/docker/{apps,databases,proxies}

echo "Struktura vytvořena!"

# Inicializace Git repozitáře
cd /opt/IT-Enterprise
if [ ! -d ".git" ]; then
    git init
    echo "Git repozitář inicializován"
fi

# Vytvoření .gitignore
cat > /opt/IT-Enterprise/.gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed

# Coverage directory used by tools like istanbul
coverage/

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/

# OS generated files
.DS_Store
Thumbs.db

# Config files with sensitive data
config/database.yml
config/secrets.yml
config/*.key
config/*.pem

# Backup files
*.bak
*.backup

# Temporary files
tmp/
temp/

# SSL certificates
*.crt
*.key
*.pem

# Docker
docker-compose.override.yml
EOF

echo "GitIgnore vytvořen!"

# Vytvoření README
cat > /opt/IT-Enterprise/README.md << 'EOF'
# IT Enterprise - Modern Multi-Domain Platform

## Architektura

### Domény
- **it-enterprise.cz** - Hlavní klientský portál
- **it-enterprise.solutions** - Produkty a služby  
- **it-enterprise.cloud** - Admin panel
- **it-enterprise.pro** - Edukační portál
- **it-enterprise.eu** - Prezentace v angličtině
- **it-enterprise.co.il** - Hebrejská verze

### 3. úrovňové domény
- xxx.business.eu.com
- xxx.biznes.cz
- xxx.services.eu.com
- xxx.businesmen.eu.com
- xxx.businessmen.pro

## Technologie
- Moderní UI/UX design
- Responsive design
- Multi-jazyčný systém (CZ, EN, UA, IL, RU, FR, DE)
- AI integrace
- Bezpečnostní řešení

## Spolupráce
- G7 Praha o.p.s. - Česká republika
- Beit Lubavitch - Izrael
- Hasidav - Ukrajina

## Instalace
```bash
./setup.sh
```

## Vývoj
```bash
npm run dev
```
EOF

echo "README vytvořen!"

echo "=== Setup dokončen ==="
