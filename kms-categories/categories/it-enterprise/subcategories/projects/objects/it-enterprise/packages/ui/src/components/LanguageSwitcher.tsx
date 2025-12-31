'use client'

import { type Locale } from '@it-enterprise/i18n'

interface LanguageSwitcherProps {
  locale: Locale
  onChange: (locale: Locale) => void
  className?: string
}

export function LanguageSwitcher({ locale, onChange, className = '' }: LanguageSwitcherProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as Locale)
  }

  return (
    <select
      className={`bg-transparent border border-gray-300 rounded px-3 py-1 text-sm ${className}`}
      value={locale}
      onChange={handleChange}
    >
      <option value="cs">🇨🇿 Čeština</option>
      <option value="en">🇬🇧 English</option>
      <option value="ua">🇺🇦 Українська</option>
      <option value="ru">🇷🇺 Русский</option>
      <option value="de">🇩🇪 Deutsch</option>
      <option value="fr">🇫🇷 Français</option>
      <option value="il">🇮🇱 עברית</option>
    </select>
  )
}

