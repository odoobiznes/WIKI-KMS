# Monitoring & Logging - Status

## ✅ Dokončeno

### 1. Rate Limiting
- ✅ **Rate Limit Middleware**
  - Konfigurovatelné okno a limit
  - IP-based rate limiting
  - Rate limit headers (X-RateLimit-*)
  - Retry-After header

- ✅ **Predefined Rate Limiters**
  - `authRateLimit` - 5 requests/15min (pro auth endpoints)
  - `apiRateLimit` - 100 requests/15min (pro API)
  - `strictRateLimit` - 10 requests/hour (pro kritické operace)

- ✅ **Integrace**
  - Auth endpoints (login, register)
  - Všechny API endpoints

### 2. Logging System
- ✅ **Logger Utility**
  - Structured logging (JSON format)
  - Log levels: info, warn, error, debug
  - Request logging middleware
  - Error tracking s stack traces

- ✅ **Request Logging**
  - Method, path, status code
  - Response time
  - IP address
  - User ID (pokud autentizován)

### 3. Error Handling
- ✅ **Error Handler Middleware**
  - Centralizované error handling
  - Zod validation errors
  - JWT errors
  - Prisma errors
  - Development vs Production modes

### 4. Health Checks
- ✅ **Health Check Endpoints**
  - `/health` - Simple health check
  - `/health/detailed` - Detailed health check s stats
  - Database connection check
  - Service status

### 5. Statistics API
- ✅ **Stats Endpoint** (`/api/stats`)
  - Platform statistics
  - User, product, domain, project counts
  - Revenue statistics
  - Admin only access

## 📁 Struktura

```
services/api/
├── src/
│   ├── middleware/
│   │   ├── rateLimit.ts          ✅
│   │   └── errorHandler.ts       ✅
│   ├── routes/
│   │   ├── health.ts              ✅
│   │   └── stats.ts               ✅
│   └── utils/
│       └── logger.ts               ✅
```

## 🎨 Features

### Rate Limiting
- IP-based tracking
- Configurable windows and limits
- Rate limit headers
- Automatic cleanup

### Logging
- JSON structured logs
- Request/response logging
- Error tracking
- Performance metrics

### Error Handling
- Type-specific error handling
- User-friendly error messages
- Development vs Production
- Stack traces in development

### Health Checks
- Database connectivity
- Service status
- Platform statistics
- Version information

## 📝 Použití

### Rate Limiting

```typescript
import { authRateLimit, apiRateLimit } from './middleware/rateLimit'

// Apply to specific route
router.post('/login', authRateLimit, handler)

// Apply to all routes
app.use('/api', apiRateLimit)
```

### Logging

```typescript
import { logger } from './utils/logger'

logger.info('User logged in', { userId: user.id })
logger.error('Payment failed', error, { orderId: order.id })
logger.warn('Rate limit exceeded', { ip: req.ip })
```

### Error Handling

Automaticky zachycuje všechny chyby a vrací standardizované odpovědi.

### Health Checks

```bash
# Simple check
curl http://localhost:3000/health

# Detailed check
curl http://localhost:3000/health/detailed
```

## 🔧 Konfigurace

### Rate Limiting

```typescript
// Custom rate limiter
const customLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: 'Custom error message',
})
```

### Logging

Logs jsou v JSON formátu pro snadné parsování:

```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "data": { "userId": "user-id" }
}
```

## 🚀 Integrace

1. **Rate Limiting**
   - ✅ Auth endpoints
   - ✅ All API endpoints

2. **Logging**
   - ✅ Request logging
   - ✅ Error logging
   - ✅ All routes

3. **Error Handling**
   - ✅ Global error handler
   - ✅ Type-specific handling

4. **Health Checks**
   - ✅ Docker health checks
   - ✅ Monitoring integration ready

## 📋 Další kroky

1. **Advanced Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Alerting

2. **Log Aggregation**
   - ELK stack
   - CloudWatch
   - Datadog

3. **Performance Monitoring**
   - APM tools
   - Response time tracking
   - Database query monitoring

4. **Security Monitoring**
   - Intrusion detection
   - Anomaly detection
   - Security alerts

---

**Status**: ✅ Rate Limiting, Logging, Error Handling a Health Checks dokončeny
**Další krok**: Advanced monitoring nebo testing

