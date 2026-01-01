# KMS - Knowledge Management System

**Version**: 2.1.0  
**Author**: IT-ENTERPRISE Solutions  
**URL**: https://kms.it-enterprise.solutions/

## Overview

KMS je komplexní systém pro správu znalostí a projektů. Poskytuje centralizované rozhraní pro:
- Správu projektů a jejich dokumentace
- AI-asistované generování obsahu
- Verzování a Git operace
- Správu klientů a zdrojů
- Finanční operace a analytiku

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (SPA)                          │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐       │
│  │  IDEAS  │ DEVELOP │ DEPLOY  │  TASKS  │ANALYTICS│       │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┤       │
│  │ CLIENTS │ FINANCE │ LOGINS  │RESOURCES│SETTINGS │       │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                   BACKEND (FastAPI)                         │
│  ┌──────────┬───────────┬───────────┬───────────┐          │
│  │   Auth   │  Objects  │   Tools   │    AI     │          │
│  └──────────┴───────────┴───────────┴───────────┘          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    PostgreSQL                               │
│  categories, objects, documents, resources, logins          │
└─────────────────────────────────────────────────────────────┘
```

## Modules

### IDEAS (Create/Plan Phase)
- Popis a specifikace projektu
- AI generování fází a úkolů
- Chat Guide pro interaktivní plánování
- Konsolidace informací

### DEVELOP (Development Phase)
- Terminal přístup
- Analýza kódu
- Verzování (Version +1)
- AI asistence (Claude, Cursor)

### DEPLOY (Release Phase)
- Export & Backup
- Test deployment
- Client management
- Billing

### TASKS (Team Work)
- Správa úkolů
- Přiřazení týmu
- Priority a stavy
- Kanban view

### ANALYTICS (Monitoring)
- Usage metrics
- Error tracking
- Performance monitoring
- AI usage statistics

### CLIENTS (Customer Management)
- Kontakty a billing info
- Server credentials
- Software catalog
- Historie plateb

### FINANCE (Financial Ops)
- Faktury
- Platební instrukce
- Smlouvy
- Potvrzení objednávek

### LOGINS (Credentials)
- Uložené přístupy
- Server credentials
- API klíče
- Secure storage

### RESOURCES (System Resources)
- Porty a IP adresy
- Databáze
- Adresáře
- Conflict detection

## Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript** - vanilla JS, no framework
- **Font Awesome** - icons
- **Responsive design** - mobile-friendly

### Backend
- **Python 3.11+**
- **FastAPI** - REST API framework
- **Uvicorn** - ASGI server
- **SQLAlchemy** - ORM
- **httpx** - async HTTP client

### Database
- **PostgreSQL 15+**
- Views for conflict detection
- Triggers for data validation

### AI Integration
- **Anthropic Claude API**
- **OpenAI GPT API**
- **Google Gemini API**

### Infrastructure
- **Nginx** - reverse proxy
- **Systemd** - service management
- **Let's Encrypt** - SSL certificates

## File Structure

```
/opt/kms-tools/
├── api/                    # Backend API
│   ├── main.py            # FastAPI app
│   ├── routers/           # API endpoints
│   │   ├── tools/         # Tools sub-routers
│   │   └── tools_claude.py
│   └── models/            # Pydantic models
├── frontend/              # Frontend app
│   └── public/
│       ├── index.html
│       ├── styles.css
│       ├── app.js
│       ├── api.js
│       └── js/
│           ├── modules/   # Feature modules
│           ├── components-*.js
│           └── app-*.js
├── WikiSys/               # Documentation
│   ├── rules/
│   ├── CHANGELOG.md
│   └── KMS-SYSTEM.md
├── VERSION
└── venv/                  # Python virtualenv
```

## Configuration

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@localhost/kms
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=https://kms.it-enterprise.solutions
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name kms.it-enterprise.solutions;
    
    location / {
        root /opt/kms-tools/frontend/public;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
    }
}
```

### Systemd Service
```ini
[Unit]
Description=KMS REST API

[Service]
WorkingDirectory=/opt/kms-tools/api
ExecStart=/opt/kms-tools/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

## Development

### Local Setup
```bash
cd /opt/kms-tools
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

### Git Workflow
```bash
git add .
git commit -m "feat: description"
git push origin main
```

## Security

- JWT authentication
- CORS protection
- API key encryption in transit
- Rate limiting
- Input validation
- SQL injection prevention

## Monitoring

- Health endpoint: `/api/system/health`
- Stats endpoint: `/api/system/stats`
- Logs: `journalctl -u kms-api.service`

## Support

- **Email**: dev@it-enterprise.cz
- **GitHub**: https://github.com/odoobiznes/kms-tools

