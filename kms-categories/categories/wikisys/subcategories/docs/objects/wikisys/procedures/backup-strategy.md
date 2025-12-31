# Backup Strategie - WikiSys Enterprise

**Verze:** 1.0
**Datum:** 2025-12-28
**Status:** Aktivní

---

## 📋 Obsah

1. [Přehled](#přehled)
2. [Level Systém](#level-systém)
3. [Konfigurace](#konfigurace)
4. [Použití](#použití)
5. [Troubleshooting](#troubleshooting)

---

## Přehled

WikiSys používá **3-číselný Level systém** pro definici backup strategií:

```
FORMAT: FREQUENCY,RETENTION,OFFSITE

Příklad: 4,30,2
  └─ 4  = 4x denně
  └─ 30 = uchovávat 30 verzí
  └─ 2  = na 2 offsite lokacích
```

### Proč tento systém?

✅ **Jednoduchost** - "náš server je na 4,30,2"
✅ **Flexibilita** - snadno upravitelné podle potřeb
✅ **Standardizace** - všichni v týmu rozumí
✅ **Škálovatelnost** - od 1,1,1 do 24,365,3

---

## Level Systém

### FREQUENCY (Jak často zálohovat)

| Level | Frekvence | Interval | Use Case |
|-------|-----------|----------|----------|
| `1` | Denně | 24h | Standardní data |
| `2` | 2x denně | 12h | Důležitá data |
| `3` | 3x denně | 8h | Produkční systémy |
| `4` | 4x denně | 6h | Kritické databáze |
| `6` | 6x denně | 4h | High-frequency data |
| `12` | 12x denně | 2h | Real-time systémy |
| `24` | Hodinově | 1h | Mission-critical |

**Doporučení:**
- `1` - nekritická data, development
- `2-4` - produkční aplikace
- `6+` - kritické databáze

### RETENTION (Kolik verzí uchovávat)

| Level | Retention | Období | Use Case |
|-------|-----------|--------|----------|
| `1` | 1 verze | Aktuální | Testing only |
| `3` | 3 verze | 3 dny | Krátkodobé |
| `7` | 7 verzí | 1 týden | Standard |
| `14` | 14 verzí | 2 týdny | Produkce |
| `30` | 30 verzí | 1 měsíc | Důležitá data |
| `90` | 90 verzí | 3 měsíce | Compliance |
| `365` | 365 verzí | 1 rok | Právní požadavky |

**Doporučení:**
- `7` - běžná data
- `30` - produkční data
- `90+` - compliance, archiv

### OFFSITE (Počet vzdálených lokací)

| Level | Lokace | Popis | Security Level |
|-------|--------|-------|----------------|
| `0` | Žádná | ⚠️ NE DOPORUČENO | Nízká |
| `1` | 1 offsite | Minimum | Střední |
| `2` | 2 offsite | Doporučeno | Vysoká |
| `3` | 3 offsite | Maximum | Velmi vysoká |

**Doporučení:**
- `1` - minimum pro produkci
- `2` - doporučeno pro kritická data
- `3` - regulované prostředí, finance

---

## Konfigurace

### Předdefinované Profily

#### Critical (4,30,2)
```yaml
frequency: 4        # 4x denně
retention: 30       # 30 verzí
offsite: 2          # 2 lokace

Použití:
  - Produkční databáze
  - WikiSys data
  - Kritické konfigurace
  - Šifrované secrets
```

#### Standard (1,7,1)
```yaml
frequency: 1        # Denně
retention: 7        # 7 verzí
offsite: 1          # 1 lokace

Použití:
  - Dokumenty
  - Skripty
  - Uživatelská data
  - Development projekty
```

#### Archive (1,90,1)
```yaml
frequency: 1        # Denně
retention: 90       # 90 verzí
offsite: 1          # 1 lokace

Použití:
  - Logy
  - Staré backupy
  - Archivní dokumenty
  - Compliance data
```

#### Minimum (1,1,1)
```yaml
frequency: 1        # Denně
retention: 1        # 1 verze
offsite: 1          # 1 lokace

Použití:
  - Testing
  - Cache
  - Nekritická data
```

### Vlastní Konfigurace

**Příklad: High-Frequency Database (6,14,2)**
```yaml
# Databáze s častými změnami, potřeba rychlý recovery
frequency: 6        # 6x denně (každé 4h)
retention: 14       # 2 týdny historie
offsite: 2          # 2 offsite lokace

Use case:
  - E-commerce databáze
  - Real-time analytics
  - Financial transactions
```

**Příklad: Long-Term Archive (1,365,3)**
```yaml
# Dlouhodobé uchovávání, compliance
frequency: 1        # Denně stačí
retention: 365      # 1 rok
offsite: 3          # Maximum bezpečnost

Use case:
  - Právní dokumenty
  - Financial records
  - GDPR compliance data
```

---

## Použití

### 1. Definice Backup Setu

V `backup-levels.yaml`:

```yaml
servers:
  lenovo-adm:
    backup_sets:
      - name: "production-db"
        level: "critical"  # 4,30,2
        paths:
          - "/var/lib/postgresql"
        exclude:
          - "*.tmp"

      - name: "user-documents"
        level: "standard"  # 1,7,1
        paths:
          - "/home/*/Documents"
```

### 2. Spuštění Backupu

```bash
# Automaticky použije level z konfigurace
bash ~/.wikisys-local/scripts/borg-runner.sh production-db

# Nebo manuálně specifikovat level
BACKUP_LEVEL="4,30,2" bash borg-runner.sh custom-backup /path/to/data
```

### 3. Monitoring

```bash
# Status všech backupů
borg-status.sh

# Výstup:
# production-db (critical 4,30,2): ✅ Last: 2h ago
# user-documents (standard 1,7,1): ✅ Last: 6h ago
# logs (archive 1,90,1): ✅ Last: 1d ago
```

### 4. Změna Levelu

Pokud potřebujete změnit úroveň:

```yaml
# Bylo: standard (1,7,1)
# Nově: high-priority (3,14,2)

- name: "important-project"
  level: "custom"
  frequency: 3
  retention: 14
  offsite: 2
```

**Pak:**
```bash
# Aktualizuj WikiSys
bash update-backup-config.sh

# Synchronizuj na všechny servery
ansible-playbook update-backup-levels.yml
```

---

## Kalkulace Úložného Prostoru

### Vzorec

```
SPACE = DATA_SIZE × RETENTION × (1 + GROWTH) / COMPRESSION
```

### Příklady

**Příklad 1: Standard (1,7,1)**
```
Data: 100 GB
Retention: 7
Růst: 5% = 1.05
Komprese: 2.0 (50%)

SPACE = 100 × 7 × 1.05 / 2.0 = 368 GB
```

**Příklad 2: Critical (4,30,2)**
```
Data: 50 GB
Retention: 30
Růst: 10% = 1.10
Komprese: 1.5 (33%)
Offsite: 2× (duplikace)

SPACE = 50 × 30 × 1.10 / 1.5 × 2 = 2200 GB (2.2 TB)
```

### Kalkulátor

```bash
# Použij built-in kalkulátor
bash backup-calculator.sh 100 7 1.05 2.0
# Výstup: Potřebné místo: 368 GB
```

---

## Borg Repositories (Offsite)

### Primary: Hetzner Storage Box

```yaml
URL: ssh://u458763-sub3@u458763.your-storagebox.de:23/./borg-backups
Encryption: repokey-blake2
Kapacita: Podle plánu
Priority: 1 (primary)
```

### Secondary: Local Backup (volitelné)

```yaml
URL: /mnt/backup-drive/borg
Encryption: repokey-blake2
Priority: 2 (secondary)
```

### Tertiary: Cloud Provider (volitelné)

```yaml
# AWS S3, Backblaze B2, atd.
Priority: 3 (tertiary)
```

---

## Automatizace

### Cron Setup

```bash
# Critical backups - každých 6 hodin
0 */6 * * * /root/borg-runner.sh production-db

# Standard backups - denně ve 2:00
0 2 * * * /root/borg-runner.sh user-documents

# Archive backups - denně ve 3:00
0 3 * * * /root/borg-runner.sh logs
```

### Ansible Playbook

```yaml
# deploy-backup-jobs.yml
- hosts: all
  tasks:
    - name: Deploy backup configuration
      copy:
        src: backup-levels.yaml
        dest: /etc/wikisys/backup-levels.yaml

    - name: Setup cron jobs based on levels
      include_tasks: setup-backup-cron.yml
```

---

## Prune Strategie

Automatické čištění starých backupů:

```yaml
prune:
  keep_daily: 7      # Posledních 7 denních
  keep_weekly: 4     # Posledních 4 týdenních
  keep_monthly: 6    # Posledních 6 měsíčních
  keep_yearly: 2     # Posledních 2 ročních
```

**Výsledek:**
- Denní backupy: 7 dní zpět
- Týdenní: 4 týdny (~1 měsíc)
- Měsíční: 6 měsíců
- Roční: 2 roky

**Celkem ~50 verzí**, místo retention*frequency

---

## Recovery Postupy

### Quick Recovery (poslední verze)

```bash
# List backups
borg list ssh://...::

# Restore latest
borg extract ssh://...::lenovo-adm-2025-12-28
```

### Point-in-Time Recovery

```bash
# Najdi backup z konkrétního času
borg list ssh://... | grep "2025-12-20"

# Restore
borg extract ssh://...::lenovo-adm-2025-12-20-12:00
```

### Partial Recovery

```bash
# Restore pouze specifické soubory
borg extract ssh://...::lenovo-adm-latest path/to/file.txt
```

---

## Troubleshooting

### Problém: Backup trvá příliš dlouho

**Řešení:**
1. Zkontroluj exclude patterns
2. Zvyš compression (lz4 je rychlejší)
3. Použij `--exclude-caches`

### Problém: Nedostatek místa

**Řešení:**
1. Spusť prune: `borg prune ...`
2. Sniž retention level
3. Zvyš compression ratio

### Problém: Backup selhal

**Řešení:**
1. Zkontroluj logy: `journalctl -u borg-backup`
2. Ověř SSH přístup
3. Zkontroluj diskové místo

---

## Best Practices

### ✅ DO

- Používej encryption (vždy!)
- Testuj recovery pravidelně
- Monitoruj backup status
- Uchovávej offsite kopie
- Dokumentuj recovery procedury

### ❌ DON'T

- Neukládej backupy pouze lokálně
- Nezapomeň testovat recovery
- Nepoužívej slabá hesla
- Neignoruj failed backupy

---

## Reference

**Konfigurace:**
- `wikisys/backup-levels.yaml` - hlavní konfigurace
- `~/.wikisys-local/config/backup-levels.yaml` - lokální kopie

**Skripty:**
- `borg-runner.sh` - spouštěcí skript
- `borg-status.sh` - status monitoring
- `backup-calculator.sh` - kalkulátor prostoru

**Dokumentace:**
- Borg Documentation: https://borgbackup.readthedocs.io/
- WikiSys Improvement Plan: `WIKISYS-IMPROVEMENT-PLAN.md`

---

**Autor:** Claude (WikiSys Setup)
**Verze:** 1.0
**Poslední aktualizace:** 2025-12-28
