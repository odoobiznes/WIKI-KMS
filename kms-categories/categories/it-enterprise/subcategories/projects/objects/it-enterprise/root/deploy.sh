#!/bin/bash

# IT Enterprise - Complete Deployment Script
# Tento skript nainstaluje a nakonfiguruje kompletní prostředí

set -e

echo "=== IT Enterprise Deployment Script ==="
echo "Starting complete server setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="it-enterprise-platform"
GITHUB_USER="your-github-username"
GITHUB_TOKEN="your-github-token"
DOMAINS=("it-enterprise.cz" "it-enterprise.solutions" "it-enterprise.cloud" "it-enterprise.pro" "it-enterprise.eu" "it-enterprise.co.il")
EMAIL="admin@it-enterprise.cz"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
    exit 1
fi

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y

# Install basic packages
log_info "Installing basic packages..."
apt install -y curl wget git vim htop unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential

# Install Docker
log_info "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
log_info "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create project directory
PROJECT_DIR="/opt/IT-Enterprise"
log_info "Creating project directory at $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone project from GitHub
log_info "Cloning project from GitHub..."
git clone https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$GITHUB_REPO.git .

# Install security tools
log_info "Installing security tools..."
apt install -y fail2ban ufw clamav rkhunter

# Configure UFW firewall
log_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure Fail2ban
log_info "Configuring Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Install Nginx
log_info "Installing Nginx..."
apt install -y nginx

# Create Nginx configuration
log_info "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/it-enterprise << 'EOF'
server {
    listen 80;
    server_name it-enterprise.cz www.it-enterprise.cz;
    
    root /opt/IT-Enterprise/domains/cz;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/it-enterprise /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
systemctl restart nginx
systemctl enable nginx

# Install PostgreSQL
log_info "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER itenterprise WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "CREATE DATABASE itenterprise_db OWNER itenterprise;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE itenterprise_db TO itenterprise;"

# Install Redis
log_info "Installing Redis..."
apt install -y redis-server

# Configure Redis
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
systemctl restart redis.service
systemctl enable redis

# Install Memcached
log_info "Installing Memcached..."
apt install -y memcached

# Configure Memcached
sed -i 's/-m 64/-m 256/' /etc/memcached.conf
systemctl restart memcached
systemctl enable memcached

# Install Certbot for SSL
log_info "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create Docker Compose configuration
log_info "Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=admin@it-enterprise.cz"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    networks:
      - web
    restart: unless-stopped

  app:
    build: .
    container_name: it-enterprise-app
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`it-enterprise.cz`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=myresolver"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
    volumes:
      - "./domains:/var/www/domains"
    networks:
      - web
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    container_name: it-enterprise-db
    environment:
      POSTGRES_DB: itenterprise_db
      POSTGRES_USER: itenterprise
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - web
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: it-enterprise-redis
    volumes:
      - redis_data:/data
    networks:
      - web
    restart: unless-stopped

  memcached:
    image: memcached:1.6-alpine
    container_name: it-enterprise-memcached
    networks:
      - web
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - web
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  grafana_data:
  prometheus_data:

networks:
  web:
    driver: bridge
EOF

# Create monitoring configuration
mkdir -p monitoring
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'docker'
    static_configs:
      - targets: ['cadvisor:8080']
EOF

# Create Windsurf deployment script
log_info "Creating Windsurf deployment script..."
cat > scripts/deploy-windsurf.sh << 'EOF'
#!/bin/bash

# Windsurf Deployment Script
echo "Deploying Windsurf platform..."

cd /opt/IT-Enterprise

# Pull latest changes
git pull origin main

# Build and start services
docker-compose down
docker-compose build
docker-compose up -d

# Wait for services to start
sleep 30

# Check services
docker-compose ps

echo "Windsurf deployment completed!"
echo "Access URLs:"
echo "Main site: https://it-enterprise.cz"
echo "Admin panel: https://it-enterprise.cloud"
echo "Solutions: https://it-enterprise.solutions"
echo "Pro portal: https://it-enterprise.pro"
echo "Grafana: https://it-enterprise.cz:3001"
echo "Prometheus: https://it-enterprise.cz:9090"
EOF

chmod +x scripts/deploy-windsurf.sh

# Create backup script
log_info "Creating backup script..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for IT Enterprise
BACKUP_DIR="/opt/backups/it-enterprise"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec it-enterprise-db pg_dump -U itenterprise itenterprise_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /opt/IT-Enterprise/domains

# Backup Docker volumes
docker run --rm -v /opt/IT-Enterprise:/backup -v postgres_data:/data alpine tar czf /backup/postgres_backup_$DATE.tar.gz -C /data .

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x scripts/backup.sh

# Setup cron jobs
log_info "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/IT-Enterprise/scripts/backup.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 /opt/IT-Enterprise/scripts/deploy-windsurf.sh") | crontab -

# Start services
log_info "Starting services..."
docker-compose up -d

# Wait for services to start
sleep 30

# Get SSL certificates
log_info "Getting SSL certificates..."
for domain in "${DOMAINS[@]}"; do
    certbot --nginx -d $domain -d www.$domain --non-interactive --agree-tos --email $EMAIL || true
done

# Final setup
log_info "Performing final setup..."

# Set permissions
chown -R www-data:www-data /opt/IT-Enterprise/domains
chmod -R 755 /opt/IT-Enterprise/domains

# Create startup script
cat > /etc/systemd/system/it-enterprise.service << 'EOF'
[Unit]
Description=IT Enterprise Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/IT-Enterprise
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable it-enterprise.service

# Display status
echo ""
echo "=== Deployment Complete ==="
echo "Service status:"
docker-compose ps

echo ""
echo "Access URLs:"
echo "Main site: http://it-enterprise.cz"
echo "Solutions: http://it-enterprise.solutions"
echo "Admin panel: http://it-enterprise.cloud"
echo "Pro portal: http://it-enterprise.pro"
echo "Grafana: http://localhost:3001 (admin/admin123)"
echo "Prometheus: http://localhost:9090"

echo ""
echo "Next steps:"
echo "1. Configure DNS records"
echo "2. Update GITHUB_USER and GITHUB_TOKEN in deploy.sh"
echo "3. Run: certbot --nginx for SSL certificates"
echo "4. Monitor logs: docker-compose logs -f"

echo ""
echo "To update/deploy: ./scripts/deploy-windsurf.sh"
echo "To backup: ./scripts/backup.sh"

log_info "IT Enterprise deployment completed successfully!"
EOF
