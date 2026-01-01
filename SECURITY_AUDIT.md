# 🔒 Bezpečnostní audit KMS - Citlivé údaje

## ⚠️ KRITICKÉ - OKAMŽITĚ ZMĚNIT

### 1. **Výchozí hesla uživatelů**
- **devsoft**: Heslo `devsoft123` je v kódu (`bin/create-user-devsoft.py`)
- **admin**: Heslo `admin123` je v kódu (`bin/create-admin-user.py`, `sql/auth-schema.sql`)
- **Akce**: OKAMŽITĚ změnit heslo uživatele `devsoft` přes webové rozhraní

### 2. **JWT Secret Key**
- **Status**: Používá se defaultní hodnota (generuje se při každém restartu)
- **Riziko**: Pokud se server restartuje, všechny existující tokeny se stanou neplatnými
- **Akce**: Nastavit `JWT_SECRET_KEY` jako environment variable s pevným, silným klíčem

### 3. **Databázové přihlašovací údaje**
- **Uživatel**: `kms_user`
- **Databáze**: `kms_db`
- **Heslo**: Ukládá se v secrets (zkontrolovat, jestli není v kódu)
- **Akce**: Zkontrolovat, že heslo není v plaintextu v žádném souboru

## 📋 CITLIVÉ ÚDAJE V KÓDU

### 4. **Email adresy**
- `admin@it-enterprise.solutions` - v SQL schématu
- `devsoft@it-enterprise.solutions` - v kódu
- **Riziko**: Nízké, ale může být použito pro phishing
- **Akce**: Zvážit použití generických emailů nebo aliasů

### 5. **IP adresy a logy**
- Logy obsahují IP adresy uživatelů
- Audit log ukládá IP adresy a user agent
- **Riziko**: Střední - může odhalit interní síťovou strukturu
- **Akce**: Zvážit anonymizaci IP adres v logách

### 6. **Výchozí konfigurace**
- API běží na `0.0.0.0:8000` (přístupné z internetu)
- Nginx proxy konfigurace
- **Riziko**: Střední - pokud není správně nakonfigurován firewall
- **Akce**: Zkontrolovat firewall a omezit přístup pouze na potřebné IP

## 🔍 CO BY MĚLO BÝT ZMĚNĚNO

### Priorita 1 (OKAMŽITĚ):
1. ✅ Změnit heslo uživatele `devsoft` (aktuálně `devsoft123`)
2. ✅ Nastavit `JWT_SECRET_KEY` jako environment variable
3. ✅ Zkontrolovat, že databázové heslo není v plaintextu

### Priorita 2 (DO 24 HODIN):
4. ✅ Smazat nebo změnit výchozí hesla z kódu
5. ✅ Zkontrolovat audit logy pro podezřelou aktivitu
6. ✅ Ověřit, že všechny uživatelské účty mají silná hesla

### Priorita 3 (DO TÝDNE):
7. ✅ Zvážit anonymizaci IP adres v logách
8. ✅ Nastavit rate limiting na API endpointy
9. ✅ Zkontrolovat oprávnění souborů (neměly by být čitelné všem)

## 📝 DOPORUČENÍ

1. **Hesla**: Použít silná hesla (min. 16 znaků, kombinace velkých/malých písmen, čísla, symboly)
2. **2FA**: Zvážit implementaci dvoufaktorové autentizace
3. **Secrets Management**: Použít proper secrets management (např. HashiCorp Vault, AWS Secrets Manager)
4. **Backup**: Zkontrolovat, že zálohy neobsahují plaintext hesla
5. **Monitoring**: Nastavit monitoring pro podezřelou aktivitu

## 🚨 HISTORIE KONVERZACE

V této konverzaci byly zveřejněny:
- Výchozí hesla (`admin123`, `devsoft123`)
- Struktura databáze
- Email adresy
- Názvy uživatelů
- IP adresy (v logách)

**Doporučení**: Pokud je tato konverzace veřejně dostupná, všechny tyto údaje by měly být považovány za kompromitované.
