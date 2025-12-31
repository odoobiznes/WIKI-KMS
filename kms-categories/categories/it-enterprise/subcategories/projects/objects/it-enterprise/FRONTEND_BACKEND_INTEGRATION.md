# Frontend-Backend Integration - Status

## ✅ Dokončeno

### 1. API Client Package
- ✅ **API Client utility** (`packages/api-client`)
  - Type-safe API client s fetch wrapper
  - Automatické přidávání JWT tokenů
  - Error handling
  - localStorage pro token persistence

### 2. React Query Integration
- ✅ **QueryProvider** pro Next.js
  - React Query setup
  - DevTools v development módu
  - Default query options

### 3. Custom Hooks
- ✅ **useAuth** - autentizace
  - Login, register, logout
  - Current user state
  - Token management

- ✅ **useProducts** - produkty
  - Seznam produktů
  - Detail produktu
  - Nákup produktu

- ✅ **useDomains** - domény
  - Seznam domén
  - Vytvoření domény
  - Aktualizace domény
  - Smazání domény

- ✅ **useProjects** - projekty
  - Seznam projektů
  - Vytvoření projektu
  - Aktualizace projektu
  - Publikace projektu

- ✅ **useContent** - CMS obsah
  - Seznam obsahu s filtry
  - Obsah podle slug

### 4. UI Components
- ✅ **LoginForm** - přihlašovací formulář
- ✅ **ProductList** - seznam produktů
- ✅ **DomainManager** - správa domén

### 5. Next.js Pages
- ✅ `/login` - přihlášení
- ✅ `/dashboard` - uživatelský dashboard
- ✅ `/products` - seznam produktů

## 📁 Struktura

```
packages/api-client/
├── src/
│   ├── utils/
│   │   └── api.ts              # API Client
│   ├── types/
│   │   └── index.ts            # TypeScript typy
│   └── hooks/
│       ├── useAuth.ts          # Autentizace
│       ├── useProducts.ts      # Produkty
│       ├── useDomains.ts        # Domény
│       ├── useProjects.ts       # Projekty
│       └── useContent.ts        # CMS obsah
└── index.ts                     # Public exports

apps/web-cz/
├── src/
│   ├── providers/
│   │   └── QueryProvider.tsx   # React Query setup
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginForm.tsx
│   │   ├── Products/
│   │   │   └── ProductList.tsx
│   │   └── Domains/
│   │       └── DomainManager.tsx
│   └── app/
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       └── products/page.tsx
```

## 🔧 Použití

### API Client

```typescript
import { apiClient } from '@it-enterprise/api-client'

// Automatické přidání tokenu
const products = await apiClient.get('/api/products')

// Manuální nastavení tokenu
apiClient.setToken('your-jwt-token')
```

### React Hooks

```typescript
import { useAuth, useProducts, useDomains } from '@it-enterprise/api-client'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  const { data: products } = useProducts()
  const { data: domains } = useDomains()
  
  // ...
}
```

### Query Provider Setup

```tsx
// app/layout.tsx
import { QueryProvider } from '../providers/QueryProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
```

## 🎯 Funkce

### Autentizace
- ✅ Login s email/heslo
- ✅ Registrace nového uživatele
- ✅ JWT token management
- ✅ Automatické přidávání tokenu do requestů
- ✅ Protected routes (dashboard)

### Produkty
- ✅ Seznam všech produktů
- ✅ Detail produktu
- ✅ Nákup produktu (s autentizací)

### Domény
- ✅ Seznam domén uživatele
- ✅ Vytvoření nové domény 3. úrovně
- ✅ Aktualizace domény
- ✅ Smazání domény

### Projekty
- ✅ Seznam projektů uživatele
- ✅ Vytvoření projektu s AI nástrojem
- ✅ Aktualizace projektu
- ✅ Publikace projektu

### CMS Obsah
- ✅ Seznam obsahu s filtry (type, company, tag, category)
- ✅ Obsah podle slug
- ✅ Podpora pro všechny typy obsahu

## 🔄 Data Flow

1. **User Action** → React Component
2. **React Hook** → API Client
3. **API Client** → Backend API (s JWT token)
4. **Backend API** → Database
5. **Response** → React Query cache
6. **UI Update** → React Component

## 📝 Další kroky

1. **Register Page**
   - Registrační formulář
   - Validace

2. **Error Handling**
   - Global error boundary
   - Toast notifications

3. **Loading States**
   - Skeleton loaders
   - Spinner components

4. **Form Validation**
   - React Hook Form integrace
   - Zod validation

5. **Protected Routes**
   - Middleware pro Next.js
   - Redirect logic

## 🚀 Testování

```bash
# Spuštění development serveru
cd apps/web-cz
npm run dev

# Otevřít http://localhost:3001
# Testovat:
# - /login - přihlášení
# - /dashboard - dashboard (vyžaduje auth)
# - /products - seznam produktů
```

## 🔐 Security

- ✅ JWT tokeny v localStorage (v produkci použít httpOnly cookies)
- ✅ Automatické přidávání tokenu do headers
- ✅ Protected routes s redirectem
- ✅ Error handling pro neautorizované requesty

---

**Status**: ✅ Frontend-Backend integrace dokončena
**Další krok**: Rozšíření UI komponent a testování

