# IT Enterprise Platform

Moderní multi-domain platforma pro IT Enterprise a partnerské společnosti s automatickou správou domén 3. úrovně, AI platformami a CMS systémem.

## 🚀 Funkce

### Pro klienty
- ✅ Vytváření webů přes AI platformy (Windsurf, Lovable, OneSpace, Cursor)
- ✅ Domény 3. úrovně (např. jan-czech.biznes.cz)
- ✅ Automatická konfigurace SSL
- ✅ Správa projektů
- ✅ Nákup produktů a služeb

### Pro administrátory
- ✅ Admin panel na it-enterprise.cloud
- ✅ Správa uživatelů a domén
- ✅ Monitoring a zálohy
- ✅ CMS pro sdílený obsah

### Pro partnery
- ✅ Vlastní weby s AI nástroji
- ✅ Integrace s hlavní platformou
- ✅ Sdílený obsah a PR materiály

## 📁 Struktura projektu

```
IT-Enterprise/
├── apps/                          # Next.js aplikace
│   ├── web-cz/                   # it-enterprise.cz
│   ├── web-solutions/            # it-enterprise.solutions
│   ├── web-cloud/                # it-enterprise.cloud
│   ├── web-pro/                  # it-enterprise.pro
│   ├── web-eu/                   # it-enterprise.eu
│   ├── web-coil/                 # it-enterprise.co.il
│   ├── web-biznesmen/            # biznesmen.cz
│   ├── web-gazdaservice/         # gazdaservice.cz
│   ├── web-zmankesef/            # zmankesef.cz
│   ├── web-avoda/                # avoda.cz
│   └── web-busticket/            # bus-ticket.info
├── packages/                      # Shared packages
│   ├── database/                 # Prisma schema + client
│   ├── i18n/                     # Translations
│   ├── api-client/               # API client hooks
│   └── ui/                       # UI components
├── services/                      # Backend services
│   ├── api/                      # Express.js API
│   └── domain-manager/           # Domain management
├── config/                        # Konfigurace
│   └── traefik/                  # Traefik config
└── docker-compose.yml             # Docker orchestration
```

## 🛠️ Technologie

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Reverse Proxy**: Traefik
- **Containerization**: Docker, Docker Compose
- **Monorepo**: Turborepo
- **i18n**: next-intl

## 🚀 Rychlý start

### Požadavky

- Node.js 20+
- Docker & Docker Compose
- npm nebo yarn

### Instalace

```bash
# 1. Klonování repozitáře
git clone <repository-url>
cd IT-Enterprise

# 2. Instalace závislostí
npm install

# 3. Nastavení environment variables
cp env.example .env
# Upravit .env podle potřeby

# 4. Spuštění databáze
docker-compose up -d postgres redis

# 5. Generování Prisma Client
cd packages/database
npm run db:generate
npm run db:push
npm run db:seed

# 6. Spuštění všech služeb
cd ../..
docker-compose up -d
```

### Development

```bash
# Spuštění development serveru pro web-cz
cd apps/web-cz
npm run dev

# Spuštění API serveru
cd services/api
npm run dev

# Spuštění Domain Manager
cd services/domain-manager
npm run dev
```

## 📚 Dokumentace

- [Backend Status](./BACKEND_STATUS.md) - Backend API dokumentace
- [Domain Manager Status](./DOMAIN_MANAGER_STATUS.md) - Domain Manager dokumentace
- [Frontend-Backend Integration](./FRONTEND_BACKEND_INTEGRATION.md) - API integrace
- [UI Components Status](./UI_COMPONENTS_STATUS.md) - UI komponenty
- [Toast & Validation](./TOAST_AND_VALIDATION_STATUS.md) - Toast a validace
- [UI Improvements](./UI_IMPROVEMENTS_STATUS.md) - UI vylepšení
- [Additional Features](./ADDITIONAL_FEATURES_STATUS.md) - Další funkce

## 🌐 Domény

### IT Enterprise
- `it-enterprise.cz` - Hlavní klient portál
- `it-enterprise.solutions` - Produkty a řešení
- `it-enterprise.cloud` - Admin panel
- `it-enterprise.pro` - Studentský portál
- `it-enterprise.eu` - Investor relations (EN)
- `it-enterprise.co.il` - Investor relations (HE)

### Partnerské společnosti
- `biznesmen.cz` - Podpora podnikání
- `gazdaservice.cz` - Účetní služby
- `zmankesef.cz` / `zman-kesef.eu` - Finanční služby
- `avoda.cz` - Agentura práce
- `bus-ticket.info` - Dopravní služby

## 🔧 API Endpoints

### Autentizace
- `POST /api/auth/register` - Registrace
- `POST /api/auth/login` - Přihlášení

### Produkty
- `GET /api/products` - Seznam produktů
- `GET /api/products/:id` - Detail produktu
- `POST /api/products/:id/purchase` - Nákup produktu

### Domény
- `GET /api/domains` - Seznam domén
- `POST /api/domains` - Vytvoření domény
- `PUT /api/domains/:id` - Aktualizace domény
- `DELETE /api/domains/:id` - Smazání domény

### Projekty
- `GET /api/projects` - Seznam projektů
- `POST /api/projects` - Vytvoření projektu
- `PUT /api/projects/:id` - Aktualizace projektu
- `POST /api/projects/:id/publish` - Publikace projektu

### Obsah (CMS)
- `GET /api/content` - Seznam obsahu
- `GET /api/content/slug/:slug` - Obsah podle slug
- `POST /api/content` - Vytvoření obsahu
- `PUT /api/content/:id` - Aktualizace obsahu

## 🐳 Docker

### Spuštění všech služeb

```bash
docker-compose up -d
```

### Zobrazení logů

```bash
docker-compose logs -f [service-name]
```

### Zastavení služeb

```bash
docker-compose down
```

### Rebuild služeb

```bash
docker-compose up -d --build
```

## 🔐 Bezpečnost

- JWT autentizace
- HTTPS přes Let's Encrypt
- Input validace (Zod)
- SQL injection prevence (Prisma)
- XSS prevence
- CSRF protection
- Rate limiting (plánováno)

## 📝 Environment Variables

Viz `env.example` pro kompletní seznam proměnných prostředí.

## 🤝 Přispívání

1. Fork projektu
2. Vytvořit feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit změn (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otevřít Pull Request

## 📄 Licence

Tento projekt je proprietární software IT Enterprise.

## 📞 Kontakt

- Email: office@it-enterprise.cz
- Telefon: +420 608 958 313
- Adresa: Domanovická 2480, Praha 9

---

**Status**: ✅ Základní infrastruktura dokončena
**Verze**: 1.0.0
