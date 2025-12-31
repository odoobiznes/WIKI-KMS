# IT Enterprise - Deploy Instructions

## GitHub Deployment

### 1. Vytvoření GitHub repozitáře
```bash
# Vytvořte si nový privátní repozitář na GitHub
# Název: it-enterprise-platform
```

### 2. Konfigurace přístupových údajů
```bash
# Získejte GitHub Personal Access Token
# Settings -> Developer settings -> Personal access tokens -> Generate new token
# Potřebná oprávnění: repo, workflow
```

### 3. Spuštění deployment skriptu
```bash
cd /opt/IT-Enterprise
./github-deploy.sh <github_username> <repository_name> <access_token>
```

### Příklad:
```bash
./github-deploy.sh myusername it-enterprise-platform ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Struktura projektu po deploy

### Doménové struktury:
- `/domains/cz/` - Hlavní klientský portál
- `/domains/solutions/` - Produkty a služby
- `/domains/cloud/` - Admin panel
- `/domains/pro/` - Edukační portál
- `/domains/eu/` - Anglická verze
- `/domains/co.il/` - Hebrejská verze

### Konfigurační soubory:
- `/config/nginx/` - Nginx konfigurace
- `/config/traefik/` - Traefik konfigurace
- `/config/ssl/` - SSL certifikáty

### Deployment skripty:
- `/scripts/deployment/` - Deploy skripty
- `/scripts/backup/` - Zálohovací skripty
- `/scripts/monitoring/` - Monitorovací skripty

## Další kroky

1. **Nastavení domén**: Propojte domény s vaším serverem
2. **Konfigurace SSL**: Nastavte SSL certifikáty
3. **Databáze**: Nainstalujte a nakonfigurujte databázi
4. **Monitoring**: Nastavte monitoring a logování
5. **CI/CD**: Vytvořte GitHub Actions pro automatický deploy

## Bezpečnostní doporučení

- Ukládejte citlivé údaje do environment variables
- Používejte privátní repozitáře
- Pravidelně zálohujte data
- Monitorujte bezpečnostní upozornění

## Podpora

Pro technickou podporu kontaktujte:
- Email: support@it-enterprise.cz
- Telefon: +420 608 958 313
