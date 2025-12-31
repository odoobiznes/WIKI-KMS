# Knowledge Management System (KMS)

**Verze:** 1767032223
**Vytvořeno:** Mon Dec 29 19:17:03 CET 2025

---

## 📊 Struktura

```
/opt/kms/
├── categories/                 # Všechny kategorie
│   ├── odoo/                  # Produktové kategorie (8)
│   ├── pohoda/
│   ├── busticket/
│   ├── x-man/
│   ├── sysadmin/
│   ├── servers/
│   ├── devops/
│   ├── platforms/
│   ├── sablona/               # Systémové kategorie (5)
│   ├── plany/
│   ├── task/
│   ├── projekty/
│   └── instrukce/
├── _global_templates/          # Globální šablony
├── VERSION                     # Verze systému
├── CHANGELOG.md                # Historie změn
└── README.md                   # Tento soubor
```

## 🚀 Použití

### Přidání nové kategorie
```bash
python /opt/kms-tools/kms-cli.py create-category --name "nova-kategorie" --type product
```

### Vytvoření nového objektu
```bash
python /opt/kms-tools/kms-cli.py create-object \
    --category odoo \
    --subcategory mobil \
    --name "muj-projekt"
```

### Aplikace šablony
```bash
python /opt/kms-tools/kms-cli.py apply-template \
    --object bus-ticket \
    --template roadmap_template
```

## 📚 Dokumentace

- Architektura: ~/wikisys-local/docs/procedures/kms-architecture.md
- API Reference: (TBD)
- Web Interface: https://kms.it-enterprise.solutions (TBD)

---

*Knowledge Management System - IT Enterprise Solutions*
