# WIKI-KMS

Complete Knowledge Management System with WikiSys integration and secure credentials management.

## 🎯 Overview

WIKI-KMS is a comprehensive enterprise knowledge management platform that combines:
- **KMS Tools** - Full-featured knowledge management system
- **WikiSys** - Secure secrets management with Age encryption
- **LOGINS Module** - Credentials vault with audit logging

## 🚀 Features

### Knowledge Management
- Multi-level categorization system
- Document management with versioning
- Full-text search and filtering
- Project-based organization
- Real-time synchronization

### Credentials Management (LOGINS)
- Secure storage with Age encryption
- 6 credential types: API Keys, SSH Keys, Databases, OAuth, SSL, Services
- Auto-hide secrets (30s), auto-clear clipboard (60s)
- Connection testing for databases, APIs, SSH
- Comprehensive audit logging
- JWT authentication

### WikiSys Integration
- Age encryption for secrets at rest
- CLI and API interfaces
- Automatic key rotation support
- Secure file cleanup

## 📦 Architecture

```
WIKI-KMS/
├── api/                    # FastAPI backend
│   ├── routers/           # API endpoints
│   │   ├── logins.py      # Credentials management
│   │   ├── categories.py  # Categories API
│   │   ├── objects.py     # Objects API
│   │   └── ...
│   ├── lib/               # Libraries
│   │   └── secrets.py     # WikiSys wrapper
│   └── models.py          # Pydantic models
├── frontend/              # Web interface
│   └── public/
│       ├── js/
│       │   └── modules/
│       │       ├── module-logins.js    # Credentials UI
│       │       ├── module-finance.js   # Finance module
│       │       └── ...
│       ├── styles.css     # Global styles
│       └── index.html     # Main HTML
├── sql/                   # Database schemas
│   ├── 001_credentials_migration.sql
│   └── kms-schema.sql
├── WikiSys/               # Secrets management
├── kms-categories/        # Category templates
├── bin/                   # Utility scripts
└── docs/                  # Documentation
```

## 🔧 Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Nginx
- Age encryption tool

### Setup

1. **Clone repository**
```bash
git clone git@github.com:odoobiznes/WIKI-KMS.git
cd WIKI-KMS
```

2. **Install dependencies**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r api/requirements.txt
```

3. **Configure database**
```bash
sudo -u postgres psql -f sql/kms-schema.sql
sudo -u postgres psql -f sql/001_credentials_migration.sql
```

4. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize WikiSys**
```bash
# Generate Age key
age-keygen -o ~/.wikisys-age-key.txt
```

6. **Start services**
```bash
# API
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4

# Or use systemd
sudo systemctl start kms-api
```

## 🌐 Deployment

Configured for production at: https://kms.it-enterprise.solutions

### Nginx Configuration
See `/etc/nginx/sites-available/kms-tools.conf`

### Systemd Services
- `kms-api.service` - FastAPI backend
- `kms-sync-daemon.service` - Sync daemon

## 🔒 Security

### Authentication
- JWT tokens with expiration
- User ownership verification
- Rate limiting ready

### Encryption
- Age encryption for credentials at rest
- Base64 encoding for database storage
- Secure file cleanup (shred -u)

### Audit Logging
All credential operations logged:
- View, Create, Update, Delete
- Decrypt, Test connection, Copy
- IP address, User agent tracking

## 📚 API Documentation

API docs available at: `/api/docs` (Swagger UI)

### Key Endpoints

**Authentication**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

**Credentials (LOGINS)**
- `GET /api/logins/categories` - List credential types
- `GET /api/logins/credentials` - List credentials
- `POST /api/logins/credentials` - Create credential
- `POST /api/logins/credentials/{id}/decrypt` - Decrypt secret
- `POST /api/logins/credentials/{id}/test` - Test connection
- `GET /api/logins/audit/{id}` - Audit log

**Knowledge Base**
- `GET /api/categories` - Categories
- `GET /api/objects` - Objects
- `GET /api/documents` - Documents
- `GET /api/search/global` - Global search

## 🧪 Testing

```bash
# Backend tests
pytest tests/

# API endpoint tests
bash /tmp/test-logins-api.sh

# Manual testing
curl -k https://kms.it-enterprise.solutions/api/health
```

## 📖 Documentation

- [Architecture](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Phase 1: Backend](~/FAZE-1-BACKEND-COMPLETED.md)
- [Phase 2: Frontend](~/FAZE-2-FRONTEND-COMPLETED.md)

## 🛠️ Development

### Frontend Modules
Each module follows this pattern:
```javascript
const ModuleName = {
    async loadData() { /* ... */ },
    render() { /* ... */ },
    // Module-specific methods
};
```

### Adding New Credential Type
1. Update `sql/001_credentials_migration.sql`
2. Add category in `api/routers/logins.py`
3. Update frontend `module-logins.js`
4. Add CSS styling in `styles.css`

## 📊 Statistics

- **Backend:** ~5,000 lines (Python)
- **Frontend:** ~15,000 lines (JavaScript, CSS)
- **Database:** 20+ tables
- **API Endpoints:** 50+
- **Modules:** 8 (IDEAS, DEVELOP, DEPLOY, TASKS, ANALYTICS, CLIENTS, FINANCE, LOGINS)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

Copyright © 2025 IT-Enterprise Solutions

## 👥 Authors

- **Odoo Biznes** - Initial work - odoo@biznes.cz
- **Claude Sonnet 4.5** - Co-development

## 🔗 Links

- Production: https://kms.it-enterprise.solutions
- GitHub: https://github.com/odoobiznes/WIKI-KMS
- Issues: https://github.com/odoobiznes/WIKI-KMS/issues

---

**Built with [Claude Code](https://claude.com/claude-code)** 🤖
