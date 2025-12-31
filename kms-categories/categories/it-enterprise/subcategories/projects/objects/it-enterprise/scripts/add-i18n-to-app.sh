#!/bin/bash
# Skript pro přidání i18n podpory do aplikace

APP_DIR=$1
if [ -z "$APP_DIR" ]; then
  echo "Použití: $0 <app-directory>"
  exit 1
fi

APP_PATH="apps/$APP_DIR"
PAGE_PATH="$APP_PATH/src/app/page.tsx"

if [ ! -f "$PAGE_PATH" ]; then
  echo "❌ Soubor $PAGE_PATH neexistuje"
  exit 1
fi

echo "🔧 Přidávám i18n do $APP_DIR..."

# Zkontroluj, zda už má i18n
if grep -q "getTranslations" "$PAGE_PATH"; then
  echo "  ✅ $APP_DIR už má i18n"
  exit 0
fi

# Přidat import
if ! grep -q "@it-enterprise/i18n" "$PAGE_PATH"; then
  sed -i "1a import { getTranslations, type Locale } from '@it-enterprise/i18n'" "$PAGE_PATH"
fi

# Přidat useState a useEffect pro locale
if ! grep -q "const \[locale" "$PAGE_PATH"; then
  # Najít první useState a přidat po něm
  sed -i '/useState/a\  const [locale, setLocale] = useState<Locale>('"'"'cs'"'"')\n  const [translations, setTranslations] = useState<any>(null)' "$PAGE_PATH"
fi

echo "  ✅ i18n přidán do $APP_DIR"

