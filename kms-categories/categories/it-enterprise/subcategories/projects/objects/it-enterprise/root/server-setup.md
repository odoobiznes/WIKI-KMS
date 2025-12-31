# IT Enterprise - Server Configuration Guide

## 1. Doporučený OS: Ubuntu 22.04 LTS

**Proč Ubuntu:**
- Stabilní a podporovaná LTS verze
- Široká podpora software
- Pravidelné bezpečnostní aktualizace
- Velká komunita a dokumentace
- Kompatibilita s Traefik, Docker, Nginx

## 2. Technické parametry serveru

### Minimální konfigurace (pro start):
- **CPU:** 4 vCPU cores
- **RAM:** 8GB DDR4
- **Disk:** 100GB NVMe SSD
- **Síť:** 1Gbps

### Doporučená konfigurace (pro produkci):
- **CPU:** 8 vCPU cores
- **RAM:** 16GB DDR4
- **Disk:** 250GB NVMe SSD + 500GB HDD pro zálohy
- **Síť:** 1Gbps

### Enterprise konfigurace (pro velký provoz):
- **CPU:** 16 vCPU cores
- **RAM:** 32GB DDR4
- **Disk:** 500GB NVMe SSD + 1TB HDD pro zálohy
- **Síť:** 10Gbps

## 3. Software stack

### Core stack:
- **Docker & Docker Compose** - Kontejnerizace
- **Traefik** - Reverse proxy a load balancer
- **Nginx** - Web server a static files
- **PostgreSQL** - Databáze
- **Redis** - Cache a session storage
- **Memcached** - Další cache layer

### Bezpečnost:
- **Fail2ban** - Ochrana proti útokům
- **UFW Firewall** - Firewall
- **Certbot** - SSL certifikáty
- **ClamAV** - Antivirus
- **Rkhunter** - Rootkit detection

### Monitoring:
- **Prometheus** - Metriky
- **Grafana** - Dashboard
- **Node Exporter** - System metrics
- **cAdvisor** - Container metrics

### Backup:
- **Restic** - Zálohování
- **Automated backup scripts**

## 4. DNS nastavení

### Hlavní domény:
```
it-enterprise.cz      A     <SERVER_IP>
it-enterprise.solutions A   <SERVER_IP>
it-enterprise.cloud   A     <SERVER_IP>
it-enterprise.pro     A     <SERVER_IP>
it-enterprise.eu      A     <SERVER_IP>
it-enterprise.co.il   A     <SERVER_IP>
```

### Subdomény:
```
www.it-enterprise.cz      CNAME it-enterprise.cz
api.it-enterprise.cz      CNAME it-enterprise.cz
admin.it-enterprise.cz    CNAME it-enterprise.cz
cloud.it-enterprise.cz    CNAME it-enterprise.cz
```

### 3. úrovňové domény (wildcard):
```
*.it-enterprise.pro       CNAME it-enterprise.pro
*.business.eu.com         CNAME it-enterprise.cz
*.biznes.cz              CNAME it-enterprise.cz
*.services.eu.com        CNAME it-enterprise.cz
*.businesmen.eu.com      CNAME it-enterprise.cz
*.businessmen.pro        CNAME it-enterprise.cz
*.it-enterprise.cloud    CNAME it-enterprise.cz
*.it-enterprise.eu       CNAME it-enterprise.cz
*.it-enterprise.pro      CNAME it-enterprise.cz
```

### DNS records:
```
MX    mail.it-enterprise.cz
TXT   "v=spf1 include:_spf.google.com ~all"
DMARC "v=DMARC1; p=quarantine; rua=mailto:dmarc@it-enterprise.cz"
```

## 5. Bezpečnostní prvky

### Firewall pravidla:
```bash
# Povolit SSH (omezeno na IP)
ufw allow from <YOUR_IP> to any port 22
# Povolit HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
# Povolit Traefik dashboard (omezeno)
ufw allow from 127.0.0.1 to any port 8080
```

### SSL/TLS:
- Let's Encrypt certifikáty
- Automatická obnova
- HSTS headers
- Secure cookies

### Další bezpečnost:
- Regular security updates
- Intrusion detection
- Log monitoring
- Backup encryption
