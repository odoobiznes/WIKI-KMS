# Nastavení Claude API v KMS systému

## Jak získat Claude API klíč

1. **Zaregistrujte se na Anthropic**
   - Navštivte: https://console.anthropic.com/
   - Vytvořte účet nebo se přihlaste

2. **Vytvořte API klíč**
   - V dashboardu přejděte na "API Keys"
   - Klikněte na "Create Key"
   - Zkopírujte klíč (začíná `sk-ant-...`)
   - ⚠️ **DŮLEŽITÉ**: Klíč se zobrazí pouze jednou, uložte si ho!

3. **Nastavení v KMS systému**

### Metoda 1: Přes Settings modul
1. Otevřete modul **Settings** (⚙️)
2. Přejděte na záložku **AI Providers**
3. Najděte **Claude** provider
4. Vložte API klíč do pole **API Key**
5. Vyberte model (doporučeno: `claude-sonnet-4-5-20250929`)
6. Zaškrtněte **Enabled**
7. Klikněte na **Save**

### Metoda 2: Přes Chat Guide v Ideas modulu
1. Otevřete modul **Ideas**
2. Klikněte na **Chat Guide**
3. V dropdownu **AI Provider** vyberte **Claude**
4. Klikněte na ikonu **Test** (✓) vedle modelu
5. Pokud není nastaven klíč, zobrazí se chyba
6. Nastavte klíč v Settings modulu (viz Metoda 1)

## Dostupné Claude modely

### Doporučené modely (nejnovější):
- **claude-sonnet-4-5-20250929** - Nejrychlejší, doporučeno pro většinu úkolů
- **claude-opus-4-5-20251101** - Nejsilnější model, pro složité úkoly
- **claude-haiku-4-5-20251001** - Nejrychlejší a nejlevnější model

### Starší modely (stále funkční):
- **claude-3-5-sonnet-20241022** - Stabilní verze
- **claude-3-5-haiku-20241022** - Rychlý a levný
- **claude-3-opus-20240229** - Starší verze Opus
- **claude-3-sonnet-20240229** - Starší verze Sonnet
- **claude-3-haiku-20240307** - Starší verze Haiku

## Testování připojení

1. V **Chat Guide** klikněte na ikonu **Test** (✓) vedle výběru modelu
2. Pokud je připojení úspěšné, ikona se změní na zelenou ✓
3. Pokud selže, zkontrolujte:
   - Zda je API klíč správně zadaný
   - Zda máte dostatek kreditu na účtu Anthropic
   - Zda je vybraný správný model

## Řešení problémů

### Chyba: "404: model: claude-haiku-4.5"
**Problém**: Model neexistuje nebo má špatný název
**Řešení**:
- Použijte správný název modelu (např. `claude-sonnet-4-5-20250929`)
- Zkontrolujte seznam dostupných modelů výše

### Chyba: "401 Unauthorized"
**Problém**: Neplatný nebo chybějící API klíč
**Řešení**:
- Zkontrolujte, zda je API klíč správně zkopírovaný (bez mezer)
- Vytvořte nový klíč v Anthropic Console

### Chyba: "429 Too Many Requests"
**Problém**: Překročen limit požadavků
**Řešení**:
- Počkejte chvíli a zkuste znovu
- Zkontrolujte limity na vašem účtu Anthropic

## Ukládání nastavení

Nastavení AI providerů se ukládají v:
- **LocalStorage** (prohlížeč): Klíč `kms-ai-settings`
- Data zůstávají i po zavření prohlížeče
- Pro smazání: Otevřete Developer Tools (F12) → Application → Local Storage → smažte `kms-ai-settings`

## Bezpečnost

⚠️ **VAROVÁNÍ**: API klíče jsou citlivé údaje!
- Nikdy nesdílejte svůj API klíč
- Neukládejte klíče do veřejných repozitářů
- Pravidelně rotujte klíče (vytvářejte nové a mažte staré)

## Ceny (přibližné, 2025)

- **Claude Sonnet 4.5**: ~$3 za 1M input tokens, ~$15 za 1M output tokens
- **Claude Opus 4.5**: ~$15 za 1M input tokens, ~$75 za 1M output tokens
- **Claude Haiku 3.5**: ~$0.25 za 1M input tokens, ~$1.25 za 1M output tokens

Více informací: https://www.anthropic.com/pricing
