# Payment & Email Services - Status

## ✅ Dokončeno

### 1. Email Service
- ✅ **Email Service** (`services/email-service`)
  - Nodemailer integrace
  - SMTP konfigurace
  - Email templates s HTML
  - API endpoints pro různé typy emailů

- ✅ **Email Templates**
  - Welcome email (vítací email po registraci)
  - Password reset email (obnovení hesla)
  - Order confirmation email (potvrzení objednávky)
  - Domain activation email (aktivace domény)

- ✅ **API Endpoints**
  - `POST /api/send` - Obecné poslání emailu
  - `POST /api/welcome` - Vítací email
  - `POST /api/password-reset` - Email pro obnovení hesla
  - `POST /api/order-confirmation` - Potvrzení objednávky
  - `POST /api/domain-activation` - Aktivace domény

### 2. Payment Integration (Stripe)
- ✅ **Stripe Integration**
  - Payment Intent creation
  - Webhook handling
  - Purchase status updates
  - Automatic email notifications

- ✅ **API Endpoints**
  - `POST /api/payments/create-intent` - Vytvoření payment intentu
  - `POST /api/payments/webhook` - Stripe webhook handler

- ✅ **Features**
  - Secure payment processing
  - Automatic purchase status updates
  - Email confirmation after payment
  - Error handling

## 📁 Struktura

```
services/
├── email-service/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   └── services/
│   │       └── emailService.ts   # Email service logic
│   ├── Dockerfile
│   └── package.json

services/api/
└── src/
    └── routes/
        └── payments.ts            # Stripe integration
```

## 🎨 Email Templates

### Welcome Email
- Gradient header
- Welcome message
- Feature list
- CTA button to dashboard

### Password Reset Email
- Red header (security)
- Reset link
- Security warning
- 1 hour validity notice

### Order Confirmation
- Green header (success)
- Order details
- Product information
- Order number

### Domain Activation
- Blue header
- Domain display
- SSL confirmation
- Visit domain button

## 💳 Payment Flow

1. **Client** → Vytvoří payment intent přes API
2. **Stripe** → Vrátí client secret
3. **Client** → Dokončí platbu přes Stripe
4. **Stripe** → Pošle webhook na server
5. **Server** → Aktualizuje purchase status
6. **Email Service** → Pošle confirmation email

## 📝 Použití

### Email Service

```typescript
// Welcome email
await fetch('http://email-service:3002/api/welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'Jan Novák'
  })
})

// Password reset
await fetch('http://email-service:3002/api/password-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    token: 'reset-token'
  })
})
```

### Payment Integration

```typescript
// Create payment intent
const response = await fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'product-id',
    amount: 99.99
  })
})

const { clientSecret } = await response.json()

// Use with Stripe.js
const stripe = new Stripe(process.env.STRIPE_PUBLISHABLE_KEY)
await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  }
})
```

## 🔧 Konfigurace

### Email Service

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@it-enterprise.cz
APP_URL=https://it-enterprise.cz
```

### Stripe

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔐 Bezpečnost

- ✅ Webhook signature verification
- ✅ JWT authentication pro payment intents
- ✅ Secure SMTP connection
- ✅ Email validation
- ✅ Rate limiting (doporučeno přidat)

## 🚀 Integrace

1. **Email Service**
   - ✅ Přidáno do docker-compose.yml
   - ✅ Traefik routing
   - ✅ Health check endpoint

2. **Payment Integration**
   - ✅ Integrováno do API
   - ✅ Webhook handling
   - ✅ Automatic email notifications

## 📋 Další kroky

1. **Email Queue**
   - Queue systém pro hromadné emaily
   - Retry mechanismus
   - Email templates management

2. **Payment Methods**
   - PayPal integrace
   - Bank transfer
   - Cryptocurrency

3. **Email Analytics**
   - Open rates
   - Click tracking
   - Bounce handling

4. **Testing**
   - Email service tests
   - Payment flow tests
   - Webhook tests

---

**Status**: ✅ Email Service a Payment Integration dokončeny
**Další krok**: Testing a optimalizace

