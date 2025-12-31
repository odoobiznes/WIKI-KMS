# Error Analysis & Solutions

## Current Issues

### Check Service Logs
```bash
# View all logs
docker compose logs

# View specific service
docker compose logs api
docker compose logs postgres
```

### Common Errors & Solutions

#### 1. Port Already in Use
**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**:
```bash
# Find process using port
sudo lsof -i :3000

# Kill process or change port in docker-compose.yml
```

#### 2. Database Connection Failed
**Error**: `P1010: User was denied access`

**Solution**:
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check database exists
docker compose exec postgres psql -U itenterprise -l

# Recreate database if needed
docker compose down postgres
docker compose up -d postgres
```

#### 3. Docker Daemon Not Running
**Error**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

#### 4. Build Errors
**Error**: `npm install` fails or build fails

**Solution**:
```bash
# Rebuild without cache
docker compose build --no-cache

# Check node_modules
rm -rf node_modules
npm install
```

#### 5. Permission Denied
**Error**: Permission denied on files

**Solution**:
```bash
# Fix permissions
sudo chown -R $USER:$USER /opt/IT-Enterprise
chmod -R 755 /opt/IT-Enterprise
```

## Debugging Steps

1. **Check Docker Status**
   ```bash
   docker ps
   docker compose ps
   ```

2. **Check Logs**
   ```bash
   docker compose logs -f
   ```

3. **Check Configuration**
   ```bash
   docker compose config
   ```

4. **Test Individual Services**
   ```bash
   docker compose up -d postgres
   docker compose up -d api
   ```

5. **Rebuild Services**
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

## Health Checks

```bash
# API
curl http://localhost:3000/health

# Database
docker compose exec postgres psql -U itenterprise -d itenterprise -c "SELECT 1;"
```

