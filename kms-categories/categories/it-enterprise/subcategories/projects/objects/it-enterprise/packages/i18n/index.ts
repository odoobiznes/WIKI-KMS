export const locales = ['cs', 'en', 'ua', 'il', 'ru', 'fr', 'de'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'cs'

export function getTranslations(locale: Locale) {
  // Dynamic import based on locale
  switch (locale) {
    case 'cs':
      return require('./locales/cs.json')
    case 'en':
      return require('./locales/en.json')
    case 'ua':
      return require('./locales/ua.json')
    case 'il':
      return require('./locales/he.json') // Hebrew
    case 'ru':
      return require('./locales/ru.json') // Russian
    case 'fr':
      return require('./locales/fr.json') // French
    case 'de':
      return require('./locales/de.json') // German
    default:
      return require('./locales/cs.json')
  }
}

