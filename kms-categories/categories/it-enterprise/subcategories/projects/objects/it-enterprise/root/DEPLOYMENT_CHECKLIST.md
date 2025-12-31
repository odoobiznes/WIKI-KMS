# Deployment Checklist

## ✅ Pre-Deployment

### 1. Dependencies
- [x] npm install completed
- [x] Prisma client generated
- [x] All packages installed

### 2. Environment Setup
- [ ] Copy env.example to .env
- [ ] Configure DATABASE_URL
- [ ] Configure JWT_SECRET
- [ ] Configure STRIPE keys (if using payments)
- [ ] Configure SMTP settings (if using email)
- [ ] Configure ACME_EMAIL for Let's Encrypt

### 3. Database
- [ ] PostgreSQL running (via Docker or external)
- [ ] Run Prisma migrations: `cd packages/database && npm run db:push`
- [ ] Seed database (optional): `cd packages/database && npm run db:seed`

### 4. Docker
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Docker daemon running
- [ ] Sufficient disk space

## 🚀 Deployment Steps

### Step 1: Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT tokens
- `ACME_EMAIL` - Email for Let's Encrypt certificates
- `NEXT_PUBLIC_API_URL` - API URL (http://api:3000 for Docker)
- `NEXT_PUBLIC_APP_URL` - Main app URL

**Optional variables:**
- `STRIPE_SECRET_KEY` - For payment processing
- `STRIPE_PUBLISHABLE_KEY` - For payment processing
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - For email service

### Step 2: Database Setup

```bash
# Navigate to database package
cd packages/database

# Generate Prisma client (if not done)
npm run db:generate

# Push schema to database
npm run db:push

# Seed database (optional)
npm run db:seed
```

### Step 3: Build Applications

```bash
# Build all applications
npm run build

# Or build specific app
cd apps/web-cz
npm run build
```

### Step 4: Docker Deployment

```bash
# Build all Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed

# Check Traefik dashboard
# Open http://localhost:8080 in browser

# Check API
curl http://localhost:3000/api
```

## 🔍 Post-Deployment Checks

### Services
- [ ] All Docker containers running
- [ ] Health checks passing
- [ ] API responding
- [ ] Database connected
- [ ] Email service running
- [ ] Domain manager running

### Applications
- [ ] Next.js apps building successfully
- [ ] Frontend accessible
- [ ] API endpoints working
- [ ] Authentication working

### Infrastructure
- [ ] Traefik routing correctly
- [ ] SSL certificates issued (if using Let's Encrypt)
- [ ] Network connectivity
- [ ] Disk space sufficient

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL container
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U itenterprise -d itenterprise
```

### API Not Responding

```bash
# Check API logs
docker-compose logs api

# Check API health
curl http://localhost:3000/health
```

### Build Failures

```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Check specific app
cd apps/web-cz
npm run build
```

### Docker Issues

```bash
# Check Docker status
docker ps
docker-compose ps

# Restart services
docker-compose restart

# Rebuild services
docker-compose up -d --build
```

## 📊 Monitoring

### Health Checks
- API: `http://localhost:3000/health`
- Domain Manager: `http://localhost:3001/health`
- Email Service: `http://localhost:3002/health`

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
```

### Statistics
```bash
# API stats (requires admin auth)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/stats
```

## 🔒 Security Checklist

- [ ] Strong JWT_SECRET configured
- [ ] Database password secure
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (production)
- [ ] Environment variables secured
- [ ] Secrets not in version control

## 📝 Notes

- First deployment may take 10-15 minutes
- Let's Encrypt certificates may take a few minutes to issue
- Database migrations should be run before starting services
- Monitor logs during first startup

---

**Status**: Ready for deployment
**Last Updated**: 2025-01-01

