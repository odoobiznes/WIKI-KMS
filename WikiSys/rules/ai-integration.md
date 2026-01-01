# AI Integration Rules

## Overview
KMS podporuje integraci s více AI poskytovateli pro generování obsahu, analýzu projektů a asistenci při vývoji.

## Supported Providers

### Claude (Anthropic)
- **Doporučený model**: `claude-sonnet-4-5-20250929`
- **API endpoint**: `https://api.anthropic.com/v1/messages`
- **Získání API klíče**: https://console.anthropic.com/

### OpenAI
- **Doporučený model**: `gpt-4` nebo `gpt-4-turbo`
- **API endpoint**: `https://api.openai.com/v1/chat/completions`
- **Získání API klíče**: https://platform.openai.com/api-keys

### Google Gemini
- **Doporučený model**: `gemini-pro`
- **API endpoint**: `https://generativelanguage.googleapis.com/v1/`
- **Získání API klíče**: https://aistudio.google.com/app/apikey

## Configuration

### Frontend (Settings → AI Agents)
1. Klikněte na ikonu uživatele → Nastavení
2. Vyberte záložku "AI Agents"
3. Pro každého providera:
   - Zadejte API klíč
   - Vyberte model
   - Zaškrtněte "Enabled"
4. Klikněte "Save Changes"

### API Key Storage
- API klíče jsou uloženy v `localStorage` pod klíčem `kms-ai-settings`
- Klíče jsou předávány v requestu, nikoli jako environment variables
- Pro produkční nasazení zvažte šifrování

## Usage Patterns

### Chat Guide (Ideas Module)
```javascript
// Volání AI s kontextem projektu
IdeasModule.sendChatMessageWithAction('description'); // Generuje popis
IdeasModule.sendChatMessageWithAction('tasks');       // Generuje úkoly
IdeasModule.sendChatMessageWithAction('suggestions'); // Generuje návrhy
```

### API Endpoints
```
POST /api/tools/ai/generate     - Generování obsahu
POST /api/tools/ai/test         - Test připojení
POST /api/tools/claude/chat     - Claude chat s kontextem projektu
GET  /api/tools/claude/models   - Seznam dostupných modelů
```

## Security Considerations

1. **API klíče nikdy nelogujte** v plném znění
2. **Validujte vstupy** před odesláním do AI API
3. **Limitujte počet requestů** (rate limiting)
4. **Monitorujte náklady** - AI API jsou placené

## Error Handling

```javascript
try {
    const response = await callAIProvider(provider, prompt);
} catch (error) {
    if (error.status === 401) {
        // Neplatný API klíč
    } else if (error.status === 404) {
        // Model neexistuje
    } else if (error.status === 429) {
        // Rate limit exceeded
    }
}
```

## Best Practices

1. **Vždy testujte připojení** před použitím (tlačítko "Test Connection")
2. **Používejte správné modely** pro daný úkol
3. **Strukturujte prompty** pro lepší výsledky
4. **Ukládejte výsledky** do projektu pro pozdější použití
5. **Implementujte fallback** pro případ selhání AI

