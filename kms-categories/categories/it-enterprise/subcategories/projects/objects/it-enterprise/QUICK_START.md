# 🚀 Quick Start Guide - IT Enterprise Platform

## ✅ Co je hotové

- ✅ **11 homepage** - všechny weby s moderním designem
- ✅ **Docker Compose** - všechny služby nakonfigurované
- ✅ **Traefik routing** - automatické směrování všech domén
- ✅ **Multi-jazyčná podpora** - CZ, EN, UA, IL (připraveno pro RU, FR, DE)
- ✅ **AI platformy** - Windsurf, Lovable, OneSpace, Cursor integrace
- ✅ **Domény 3. úrovně** - sekce na všech relevantních webech

## 🎯 Rychlý start (3 kroky)

### 1. Nastavit DNS záznamy

Pro všechny domény přidejte A záznamy na IP vašeho serveru:

```
it-enterprise.cz          A    <SERVER_IP>
it-enterprise.solutions    A    <SERVER_IP>
it-enterprise.cloud       A    <SERVER_IP>
it-enterprise.pro         A    <SERVER_IP>
it-enterprise.eu          A    <SERVER_IP>
it-enterprise.co.il       A    <SERVER_IP>
biznesmen.cz              A    <SERVER_IP>
gazdaservice.cz           A    <SERVER_IP>
zmankesef.cz              A    <SERVER_IP>
zman-kesef.eu             A    <SERVER_IP>
avoda.cz                  A    <SERVER_IP>
bus-ticket.info           A    <SERVER_IP>
```

### 2. Nastavit environment

```bash
cd /opt/IT-Enterprise
cp .env.example .env
nano .env  # Upravte hodnoty
```

Důležité hodnoty:
- `POSTGRES_PASSWORD` - silné heslo
- `JWT_SECRET` - náhodný secret
- `ACME_EMAIL` - email pro SSL certifikáty
- `DATABASE_URL` - connection string

### 3. Spustit

```bash
# Instalace závislostí
npm install

# Build aplikací (volitelné - pro test)
npm run build

# Spuštění Docker služeb
docker-compose up -d

# Kontrola
docker-compose ps
docker-compose logs -f
```

## 🌐 Přístup k webům

Po nastavení DNS a spuštění Docker služeb budou všechny weby dostupné na:

- https://it-enterprise.cz
- https://it-enterprise.solutions
- https://it-enterprise.cloud
- https://it-enterprise.pro
- https://it-enterprise.eu
- https://it-enterprise.co.il
- https://biznesmen.cz
- https://gazdaservice.cz
- https://zmankesef.cz
- https://zman-kesef.eu
- https://avoda.cz
- https://bus-ticket.info

**SSL certifikáty se vytvoří automaticky během několika minut!**

## 📊 Traefik Dashboard

- URL: `http://<SERVER_IP>:8080`
- Zobrazuje všechny routy, služby a SSL certifikáty

## 🔧 Užitečné příkazy

```bash
# Restart všech služeb
docker-compose restart

# Restart konkrétní služby
docker-compose restart web-cz

# Logy konkrétní služby
docker-compose logs -f web-cz

# Rebuild konkrétní služby
docker-compose build web-cz
docker-compose up -d web-cz

# Zastavit všechny služby
docker-compose down

# Zastavit a smazat volumes
docker-compose down -v
```

## ⚠️ Důležité poznámky

1. **DNS záznamy** musí být aktivní před spuštěním (pro SSL certifikáty)
2. **Porty 80 a 443** musí být otevřené v firewallu
3. **Dostatek zdrojů** - doporučeno min. 16GB RAM pro všechny služby
4. **První spuštění** může trvat déle (build, SSL certifikáty)

## 🎉 Hotovo!

Všechny weby jsou připravené a běží na jednom serveru s automatickým routingem!

