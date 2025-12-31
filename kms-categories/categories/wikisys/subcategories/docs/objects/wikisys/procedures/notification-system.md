# Notification System - WikiSys Enterprise

**Verze:** 1.0
**Datum:** 2025-12-28
**Status:** Aktivní

---

## 📋 Obsah

1. [Přehled](#přehled)
2. [Channels](#channels)
3. [Setup](#setup)
4. [Použití](#použití)
5. [Troubleshooting](#troubleshooting)

---

## Přehled

WikiSys používá **multi-channel notifikační systém** pro informování o důležitých událostech.

### Architektura

```
┌─────────────┐
│   Event     │ (backup failed, server down, atd.)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Notification     │
│ Router           │
└──────┬───────────┘
       │
       ├───────────┬───────────┐
       ▼           ▼           ▼
   ┌──────┐   ┌─────────┐ ┌───────┐
   │Email │   │Telegram │ │ Slack │
   └──────┘   └─────────┘ └───────┘
```

### Filosofie

- **Email** = Denní reporty, non-urgent
- **Telegram** = Urgent alerts, quick info
- **Slack** = Centrální hub, historie, team collaboration

---

## Channels

### 1. Email

**Použití:**
- ✅ Denní/týdenní reporty
- ✅ Detailní analýzy
- ✅ Non-urgent alerts
- ❌ Urgent alerts (příliš pomalé)

**Konfigurace:**

```yaml
email:
  smtp:
    host: "smtp.gmail.com"
    port: 587
    use_tls: true
  recipients:
    - "admin@example.com"
```

**Credentials:**
- Username/Password v `secrets/passwords/email-smtp.yaml.age`

**Setup:**

```bash
# 1. Vytvoř App-Specific Password (Gmail)
# Jdi na: https://myaccount.google.com/apppasswords

# 2. Zašifruj credentials
cat > /tmp/email-smtp.yaml << EOF
username: "your-email@gmail.com"
password: "your-app-specific-password"
EOF

bash secrets-manager.sh encrypt /tmp/email-smtp.yaml passwords/email-smtp
bash secrets-manager.sh upload ~/.wikisys-secrets/passwords/email-smtp.yaml.age passwords

# 3. Test
bash notify.sh test email
```

---

### 2. Telegram

**Použití:**
- ✅ Urgent alerts (🚨)
- ✅ Quick confirmations (✅)
- ✅ Real-time status
- ✅ Interactive bots

**Proč Telegram:**
- Instant push notifications
- Zdarma, bez limitu
- Bot API jednoduché
- Lepší než SMS

**Setup:**

#### Krok 1: Vytvoř Telegram Bota

```bash
# 1. Otevři Telegram a najdi @BotFather
# 2. Pošli: /newbot
# 3. Zadej název: WikiSys Notification Bot
# 4. Zadej username: wikisys_notify_bot
# 5. Dostaneš TOKEN: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### Krok 2: Získej Chat ID

```bash
# 1. Pošli zprávu svému botovi (cokoli)
# 2. Otevři v browseru:
https://api.telegram.org/bot<TOKEN>/getUpdates

# 3. Najdi "chat":{"id":123456789}
# To je tvoje chat_id
```

#### Krok 3: Uložte Credentials

```bash
# Zašifruj token
echo "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" | \
  bash secrets-manager.sh encrypt - api-tokens/telegram-bot

# Zašifruj chat ID
echo "123456789" | \
  bash secrets-manager.sh encrypt - api-tokens/telegram-chat-id

# Nahraj do WikiSys
bash secrets-manager.sh upload \
  ~/.wikisys-secrets/api-tokens/telegram-bot.token.age \
  api-tokens
```

#### Krok 4: Test

```bash
# Test notifikace
bash notify.sh test telegram

# Měl bys dostat zprávu:
# 🧪 Test WikiSys Notification System - 2025-12-28 20:30:15
```

**Příklady zpráv:**

```bash
# Backup success
✅ Backup úspěšný
📦 Repo: hetzner-main
🖥️ Server: lenovo-adm
💾 Velikost: 2.5 GB
⏱️ Čas: 5m 23s

# Server down
🚨 SERVER DOWN!
🖥️ Server: lenovo-adm
📍 IP: 192.168.1.100
⏱️ Downtime: 15m

⚡ Akce: Okamžitě zkontroluj!
```

---

### 3. Slack (Volitelné)

**Použití:**
- ✅ Centrální dashboard pro všechny notifikace
- ✅ Historie a vyhledávání
- ✅ Team collaboration
- ✅ Integrace s nástroji

**Proč přidat Slack:**

1. **Organizace**
   ```
   #backups     → Všechny backup události
   #servers     → Server monitoring
   #security    → Security alerts
   #wikisys     → WikiSys změny
   ```

2. **Historie**
   - Můžeš vyhledat "kdy naposledy selhal backup server X?"
   - Threads pro diskuze o problémech

3. **Integrace**
   - GitHub commits
   - Grafana alerts
   - CI/CD notifications

**Setup:**

#### Krok 1: Vytvoř Slack Workspace

```
1. Jdi na: https://slack.com/create
2. Vytvoř workspace: "YourCompany IT"
```

#### Krok 2: Vytvoř Incoming Webhook

```
1. Jdi na: https://api.slack.com/apps
2. Create New App → From scratch
3. Název: "WikiSys Notifications"
4. Vyberte workspace
5. Incoming Webhooks → Activate
6. Add New Webhook → Vybrat channel (#backups)
7. Zkopíruj Webhook URL:
   https://hooks.slack.com/services/T.../B.../XXX...
```

#### Krok 3: Uložit Webhook

```bash
# Zašifruj webhook URL
echo "https://hooks.slack.com/services/T.../B.../XXX..." | \
  bash secrets-manager.sh encrypt - api-tokens/slack-webhook

# Nahraj
bash secrets-manager.sh upload \
  ~/.wikisys-secrets/api-tokens/slack-webhook.token.age \
  api-tokens
```

#### Krok 4: Vytvoř Channels

```
#backups      - Backup události
#servers      - Server monitoring
#security     - Security alerts
#wikisys      - WikiSys updates
#monitoring   - General monitoring
```

#### Krok 5: Test

```bash
# Enable Slack v konfiguraci
vim ~/.wikisys-local/config/notification-config.yaml
# Set: slack.enabled: true

# Test
bash notify.sh test slack
```

**Příklad Slack zprávy:**

```
┌─────────────────────────────────────┐
│ 💾 Backup Successful                │
├─────────────────────────────────────┤
│ Repository: hetzner-main            │
│ Server: lenovo-adm                  │
│ Size: 2.5 GB                        │
│ Duration: 5m 23s                    │
│ Status: ✅ Success                  │
│                                     │
│ Time: 2025-12-28 20:30:15          │
└─────────────────────────────────────┘
```

---

## Event Types & Severity

### Severity Levels

```
INFO     → 📘 Informační (jen pro historii)
SUCCESS  → ✅ Potvrzení úspěšné operace
WARNING  → ⚠️  Varování (pozor!)
CRITICAL → 🚨 Kritické (okamžitá akce!)
```

### Event Routing

| Event | Severity | Email | Telegram | Slack |
|-------|----------|-------|----------|-------|
| Backup Success | SUCCESS | ❌ | ✅ | ✅ |
| Backup Failure | CRITICAL | ✅ | ✅ | ✅ |
| Server Down | CRITICAL | ✅ | ✅ | ✅ |
| Disk >80% | WARNING | ❌ | ✅ | ✅ |
| Disk >90% | CRITICAL | ✅ | ✅ | ✅ |
| SSH Login | INFO | ❌ | ❌ | ✅ |
| SSH Fail (3x) | CRITICAL | ✅ | ✅ | ✅ |
| WikiSys Update | INFO | ❌ | ✅ | ✅ |
| Daily Report | INFO | ✅ | ❌ | ✅ |

---

## Reporting Schedule

### Denní Report (8:00)

**Kanály:** Email

**Obsahuje:**
- ✅ Backup status (všechny servery)
- 💽 Disk usage
- 🖥️ Server uptime
- ❌ Failed services
- 🔒 Security events summary

**Příklad:**

```
WikiSys Denní Report - 2025-12-28
═══════════════════════════════════

BACKUP STATUS:
✅ lenovo-adm: 3/3 backupy úspěšné
✅ server2: 2/2 backupy úspěšné

DISK USAGE:
lenovo-adm: 65% (OK)
server2: 82% (⚠️  Pozor)

SERVER UPTIME:
lenovo-adm: 45 days
server2: 12 days

FAILED SERVICES:
Žádné

SECURITY EVENTS:
2× SSH login successful
0× failed login attempts
```

### Týdenní Report (Pondělí 9:00)

**Kanály:** Email, Slack

**Obsahuje:**
- 📊 Backup status summary
- 📈 Disk usage trends
- 📊 Server statistics
- 🔒 Security summary
- 📝 WikiSys změny
- 💡 Recommendations

### Měsíční Report (1. den, 10:00) - Volitelné

**Kanály:** Email

**Obsahuje:**
- Comprehensive report
- Cost analysis
- Capacity planning

---

## Smart Features

### 1. Quiet Hours (22:00 - 07:00)

```yaml
quiet_hours:
  enabled: true
  start: "22:00"
  end: "07:00"
  allow_severity: ["critical"]  # Pouze kritické
```

**Během quiet hours:**
- ✅ CRITICAL events → posílá se
- ❌ WARNING/INFO → čeká do rána
- 📋 Ráno dostaneš summary propasnutých eventů

### 2. Rate Limiting

```yaml
rate_limit:
  max_messages_per_hour: 10
  max_messages_per_day: 50
```

**Pokud překročeno:**
- Místo 20 zpráv → pošle 1 summary
- "⚠️ 20 disk warnings za poslední hodinu"

### 3. Event Grouping

```yaml
grouping:
  time_window: 300  # 5 minut
```

**Příklad:**
- Pokud 5× stejný event za 5 min
- → Pošle 1 zprávu: "5× backup failed na server X"

### 4. Escalation (Volitelné)

```yaml
escalation:
  levels:
    - delay: 30   # Po 30 min bez ACK
      channels: ["email", "telegram"]
    - delay: 60   # Po 1h bez ACK
      channels: ["all"]  # + zavolat
```

---

## Použití

### Manuální Notifikace

```bash
# Telegram
bash notify.sh telegram "✅ Deployment úspěšný!"

# Email
bash notify.sh email "Subject" "Body content"

# Slack
bash notify.sh slack "#backups" "Backup dokončen"

# Všechny kanály
bash notify.sh all "🚨 URGENT: Server down!"
```

### Ze Skriptů

```bash
#!/bin/bash
# Váš backup script

if borg create ...; then
    notify.sh telegram "✅ Backup OK"
else
    notify.sh all "❌ BACKUP FAILED!"
    exit 1
fi
```

### Z Cronu

```cron
# Denní report
0 8 * * * /root/notify.sh daily-report

# Týdenní report
0 9 * * 1 /root/notify.sh weekly-report
```

---

## Integrace

### Healthchecks.io

```bash
# Ping po úspěšném backupu
curl https://hc-ping.com/YOUR-UUID
```

### Grafana Alerts

```yaml
# Grafana → WikiSys notifications
contact_points:
  - name: wikisys-telegram
    type: webhook
    url: http://your-server/notify/grafana
```

---

## Troubleshooting

### Email se neposílá

```bash
# Test SMTP
telnet smtp.gmail.com 587

# Zkontroluj credentials
bash secrets-manager.sh decrypt passwords/email-smtp

# Test
bash notify.sh test email
```

### Telegram nefunguje

```bash
# Ověř token
TOKEN=$(bash secrets-manager.sh decrypt api-tokens/telegram-bot)
curl "https://api.telegram.org/bot$TOKEN/getMe"

# Měl bys dostat JSON s info o botovi
```

### Slack webhook error

```bash
# Test webhook
WEBHOOK=$(bash secrets-manager.sh decrypt api-tokens/slack-webhook)
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  "$WEBHOOK"
```

---

## Best Practices

### ✅ DO

- Testuj notifikace pravidelně
- Používej severity levels správně
- Nastavuj quiet hours
- Monitoruj notification delivery
- Uchovávej logy

### ❌ DON'T

- Nespamuj s INFO zpráv ami
- Neignoruj CRITICAL alerts
- Neposílej plain-text secrets
- Nesdílej webhook URLs veřejně

---

## Security

### Ochrana Credentials

```bash
# ✅ SPRÁVNĚ
TOKEN=$(bash secrets-manager.sh decrypt api-tokens/telegram-bot)
curl -H "Authorization: Bearer $TOKEN" ...
unset TOKEN  # Zapo meň!

# ❌ ŠPATNĚ
TOKEN="hardcoded-token-123"  # NIKDY!
```

### Webhook Security

```bash
# Slack webhooks → nelze restrict IP
# → Používej neočekávaný URL
# → Rotuj pravidelně

# Telegram bot token → protect!
chmod 600 ~/.wikisys-secrets/*
```

---

## Reference

**Konfigurace:**
- `notification-config.yaml` - hlavní konfigurace
- `~/.wikisys-local/config/notification-config.yaml` - lokální

**Skripty:**
- `notify.sh` - notifikační skript
- `daily-report.sh` - denní report
- `weekly-report.sh` - týdenní report

**APIs:**
- Telegram Bot API: https://core.telegram.org/bots/api
- Slack Webhooks: https://api.slack.com/messaging/webhooks

---

**Autor:** Claude (WikiSys Setup)
**Verze:** 1.0
**Poslední aktualizace:** 2025-12-28
