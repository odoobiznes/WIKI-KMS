# API Documentation

Kompletní dokumentace IT Enterprise API.

## Base URL

```
Production: https://api.it-enterprise.cz
Development: http://localhost:3000
```

## Autentizace

Většina endpointů vyžaduje JWT token v headeru:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### Autentizace

#### Registrace
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Jan Novák",
  "password": "securepassword123",
  "companyId": "optional-company-id"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Jan Novák",
    "role": "USER"
  },
  "token": "jwt-token"
}
```

#### Přihlášení
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Jan Novák",
    "role": "USER"
  },
  "token": "jwt-token"
}
```

### Produkty

#### Seznam produktů
```http
GET /api/products
```

**Response:**
```json
[
  {
    "id": "product-id",
    "name": "Windsurf Platform",
    "slug": "windsurf-platform",
    "description": "AI-powered web builder",
    "price": 99.99,
    "category": "Platform",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

#### Detail produktu
```http
GET /api/products/:id
```

#### Nákup produktu
```http
POST /api/products/:id/purchase
Authorization: Bearer YOUR_TOKEN
```

### Domény

#### Seznam domén
```http
GET /api/domains
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
[
  {
    "id": "domain-id",
    "subdomain": "jan-czech",
    "domain": "biznes.cz",
    "fullDomain": "jan-czech.biznes.cz",
    "status": "ACTIVE",
    "sslEnabled": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

#### Vytvoření domény
```http
POST /api/domains
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "subdomain": "jan-czech",
  "domain": "biznes.cz",
  "projectId": "optional-project-id"
}
```

#### Aktualizace domény
```http
PUT /api/domains/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "SUSPENDED"
}
```

#### Smazání domény
```http
DELETE /api/domains/:id
Authorization: Bearer YOUR_TOKEN
```

### Projekty

#### Seznam projektů
```http
GET /api/projects
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
[
  {
    "id": "project-id",
    "name": "Můj web",
    "tool": "WINDSURF",
    "status": "PUBLISHED",
    "published": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

#### Vytvoření projektu
```http
POST /api/projects
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Můj web",
  "tool": "WINDSURF",
  "template": "optional-template",
  "config": {}
}
```

#### Aktualizace projektu
```http
PUT /api/projects/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Nový název",
  "status": "READY"
}
```

#### Publikace projektu
```http
POST /api/projects/:id/publish
Authorization: Bearer YOUR_TOKEN
```

### Obsah (CMS)

#### Seznam obsahu
```http
GET /api/content?type=ARTICLE&limit=20&offset=0
```

**Query Parameters:**
- `type` - Typ obsahu (ARTICLE, SERVICE, PRODUCT, etc.)
- `companyId` - ID společnosti
- `tag` - Tag slug
- `category` - Category slug
- `featured` - Pouze featured (true/false)
- `limit` - Počet výsledků (default: 20)
- `offset` - Offset (default: 0)

#### Obsah podle slug
```http
GET /api/content/slug/:slug
```

#### Vytvoření obsahu
```http
POST /api/content
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Nadpis článku",
  "slug": "nadpis-clanku",
  "type": "ARTICLE",
  "body": "Obsah článku...",
  "excerpt": "Krátký popis",
  "published": true,
  "tagIds": ["tag-id-1"],
  "categoryIds": ["category-id-1"]
}
```

#### Aktualizace obsahu
```http
PUT /api/content/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Nový nadpis",
  "published": false
}
```

#### Smazání obsahu
```http
DELETE /api/content/:id
Authorization: Bearer YOUR_TOKEN
```

## Error Responses

Všechny chyby vrací standardní formát:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Úspěch
- `201` - Vytvořeno
- `400` - Chybný request
- `401` - Neautorizováno
- `403` - Zakázáno
- `404` - Nenalezeno
- `500` - Server error

## Rate Limiting

(Plánováno) API má rate limiting:
- 100 requests za minutu pro autentizované uživatele
- 20 requests za minutu pro neautentizované

## Pagination

Seznamy podporují pagination přes query parametry:
- `limit` - Počet výsledků (max 100)
- `offset` - Offset

## Filtrování

Některé endpointy podporují filtrování:
- `type` - Filtrování podle typu
- `status` - Filtrování podle statusu
- `companyId` - Filtrování podle společnosti

## Examples

### cURL

```bash
# Registrace
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Jan Novák","password":"password123"}'

# Přihlášení
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Seznam produktů
curl http://localhost:3000/api/products

# Vytvoření domény
curl -X POST http://localhost:3000/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"jan-czech","domain":"biznes.cz"}'
```

### JavaScript/TypeScript

```typescript
import { apiClient } from '@it-enterprise/api-client'

// Registrace
const response = await apiClient.post('/api/auth/register', {
  email: 'user@example.com',
  name: 'Jan Novák',
  password: 'password123'
})

// Nastavení tokenu
apiClient.setToken(response.token)

// Seznam produktů
const products = await apiClient.get('/api/products')

// Vytvoření domény
const domain = await apiClient.post('/api/domains', {
  subdomain: 'jan-czech',
  domain: 'biznes.cz'
})
```

---

**Verze API**: 1.0.0
**Poslední aktualizace**: 2025-01-01

