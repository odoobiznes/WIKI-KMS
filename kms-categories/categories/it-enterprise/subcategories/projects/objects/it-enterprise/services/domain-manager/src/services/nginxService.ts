import { Domain } from '@it-enterprise/database'

export const nginxService = {
  /**
   * Generate Nginx configuration for domain
   */
  generateConfig(domain: Domain & { project?: any }) {
    const serverName = domain.fullDomain
    const upstreamName = `domain_${domain.id.replace(/-/g, '_')}`
    const port = domain.project?.port || 3000
    const host = domain.project?.host || 'localhost'

    const config = `# Domain: ${domain.fullDomain}
# Generated: ${new Date().toISOString()}

upstream ${upstreamName} {
    server ${host}:${port};
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${serverName};

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${serverName};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${serverName}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${serverName}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/${domain.id}.access.log;
    error_log /var/log/nginx/${domain.id}.error.log;

    # Proxy Settings
    location / {
        proxy_pass http://${upstreamName};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching (if applicable)
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://${upstreamName};
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://${upstreamName}/health;
        access_log off;
    }
}
`

    return config
  },

  /**
   * Generate Nginx configuration file path
   */
  getConfigPath(domain: Domain) {
    return `/etc/nginx/sites-available/${domain.id}.conf`
  },

  /**
   * Generate Nginx symlink path
   */
  getSymlinkPath(domain: Domain) {
    return `/etc/nginx/sites-enabled/${domain.id}.conf`
  },

  /**
   * Generate SSL certificate paths
   */
  getSSLCertPaths(domain: Domain) {
    return {
      cert: `/etc/letsencrypt/live/${domain.fullDomain}/fullchain.pem`,
      key: `/etc/letsencrypt/live/${domain.fullDomain}/privkey.pem`
    }
  }
}

