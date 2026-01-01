# 🔐 KMS OAuth2 Provider - Průvodce

KMS má vlastní OAuth2 provider, který umožňuje externím aplikacím přistupovat k API pomocí OAuth2.

## 📋 Přehled

KMS OAuth2 provider podporuje standardní OAuth2 Authorization Code flow:
1. Aplikace žádá o autorizaci
2. Uživatel se přihlásí a schválí přístup
3. Aplikace dostane authorization code
4. Aplikace vymění code za access token
5. Aplikace používá token pro přístup k API

## 🚀 Vytvoření OAuth2 aplikace

### 1. Přihlaste se jako superuser

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"devsoft","password":"YOUR_PASSWORD"}'
```

### 2. Vytvořte OAuth2 aplikaci

```bash
curl -X POST http://localhost:8000/api/auth/oauth2/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Application",
    "description": "Description of my app",
    "redirect_uris": [
      "https://myapp.com/callback",
      "http://localhost:3000/callback"
    ],
    "scopes": ["read", "write"]
  }'
```

**Odpověď:**
```json
{
  "client_id": "abc123...",
  "client_secret": "xyz789...",  // ⚠️ Uložte si to - zobrazí se jen jednou!
  "name": "My Application",
  "description": "Description of my app",
  "redirect_uris": ["https://myapp.com/callback"],
  "scopes": ["read", "write"],
  "created_at": "2025-12-30T..."
}
```

⚠️ **DŮLEŽITÉ**: `client_secret` se zobrazí jen jednou při vytvoření. Uložte si ho bezpečně!

## 🔄 OAuth2 Flow

### Krok 1: Žádost o autorizaci

Uživatel přejde na:
```
GET /api/auth/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=read+write&state=random_string
```

**Parametry:**
- `client_id` - ID vaší aplikace
- `redirect_uri` - Musí být v seznamu povolených redirect URIs
- `response_type` - Musí být `code`
- `scope` - Požadovaná oprávnění (volitelné)
- `state` - Náhodný řetězec pro CSRF ochranu (doporučeno)

**Příklad:**
```
https://kms.it-enterprise.solutions/api/auth/oauth2/authorize?client_id=abc123&redirect_uri=https://myapp.com/callback&response_type=code&scope=read+write&state=xyz789
```

### Krok 2: Uživatel se přihlásí

Pokud uživatel není přihlášen, bude přesměrován na login stránku.

### Krok 3: Získání authorization code

Po schválení bude uživatel přesměrován na `redirect_uri` s authorization code:
```
https://myapp.com/callback?code=AUTHORIZATION_CODE&state=xyz789
```

### Krok 4: Výměna code za token

```bash
curl -X POST http://localhost:8000/api/auth/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=YOUR_REDIRECT_URI"
```

**Odpověď:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGci...",
  "scope": "read write"
}
```

### Krok 5: Použití access tokenu

```bash
curl -X GET http://localhost:8000/api/categories/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 User Info Endpoint

Získání informací o uživateli:

```bash
curl -X GET http://localhost:8000/api/auth/oauth2/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Odpověď:**
```json
{
  "sub": "2",
  "username": "devsoft",
  "email": "devsoft@it-enterprise.solutions",
  "name": "DevSoft Administrator",
  "email_verified": true
}
```

## 🔒 Revoke Token

Zneplatnění tokenu:

```bash
curl -X POST http://localhost:8000/api/auth/oauth2/revoke \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=TOKEN_TO_REVOKE"
```

## 📝 Seznam aplikací

Zobrazení všech vašich OAuth2 aplikací:

```bash
curl -X GET http://localhost:8000/api/auth/oauth2/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔐 Bezpečnost

- ✅ Client secret se ukládá jako hash
- ✅ Authorization codes expirují po 10 minutách
- ✅ Access tokeny expirují po 60 minutách
- ✅ Refresh tokeny expirují po 30 dnech
- ✅ Všechny endpointy vyžadují autentizaci
- ✅ Redirect URIs jsou validovány

## 📚 Scopes

Dostupné scopes:
- `read` - Čtení dat
- `write` - Zápis dat
- `admin` - Administrátorské oprávnění (pouze pro superusery)

## ⚠️ Důležité poznámky

1. **Client Secret**: Uložte si ho bezpečně - zobrazí se jen jednou při vytvoření
2. **Redirect URIs**: Musí přesně odpovídat těm, které jste zadali při vytvoření
3. **HTTPS**: V produkci vždy používejte HTTPS
4. **State parameter**: Vždy používejte pro CSRF ochranu
