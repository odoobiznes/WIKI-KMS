'use client'

import { useState, useEffect } from 'react'
import { getTranslations, type Locale } from '@it-enterprise/i18n'

export default function HomePage() {
  const [selectedPlatform, setSelectedPlatform] = useState('windsurf')
  const [locale, setLocale] = useState<Locale>('cs')
  const [translations, setTranslations] = useState<any>(null)

  useEffect(() => {
    // Load translations for current locale
    const t = getTranslations(locale)
    setTranslations(t)
    
    // Set HTML lang attribute and dir for RTL languages
    document.documentElement.lang = locale === 'il' ? 'he' : locale
    document.documentElement.dir = locale === 'il' ? 'rtl' : 'ltr'
  }, [locale])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale
    setLocale(newLocale)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }
  }

  useEffect(() => {
    // Load saved locale from localStorage
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale | null
      if (savedLocale) {
        setLocale(savedLocale)
      }
    }
  }, [])

  const aiPlatforms = [
    { id: 'windsurf', name: 'Windsurf', color: 'from-blue-500 to-blue-600' },
    { id: 'lovable', name: 'Lovable', color: 'from-purple-500 to-purple-600' },
    { id: 'onespace', name: 'OneSpace', color: 'from-green-500 to-green-600' },
    { id: 'cursor', name: 'Cursor', color: 'from-orange-500 to-orange-600' },
  ]

  const aiOptions = [
    {
      id: 'web',
      title: 'Vytvořte si web',
      description: 'Profesionální webové stránky pomocí AI',
      icon: '🌐',
      color: 'blue'
    },
    {
      id: 'app',
      title: 'Vytvořte si aplikaci',
      description: 'Mobilní nebo webové aplikace',
      icon: '📱',
      color: 'purple'
    },
    {
      id: 'business-plan',
      title: 'Naplánujte si business projekt',
      description: 'Kompletní business plán s AI asistencí',
      icon: '📊',
      color: 'green'
    },
    {
      id: 'course',
      title: 'Vytvořte si online kurz',
      description: 'Vzdělávací kurzy s AI podporou (OpenAI, Claude, Lumo)',
      icon: '🎓',
      color: 'orange'
    },
    {
      id: 'images',
      title: 'Vygenerujte si obrázky',
      description: 'Obrázky podle šablon a popisu',
      icon: '🖼️',
      color: 'pink'
    },
    {
      id: 'video',
      title: 'Vygenerujte si video',
      description: 'Videa podle šablon z popisu',
      icon: '🎬',
      color: 'red'
    },
    {
      id: 'business-model',
      title: 'Navrhněte si business model',
      description: 'Kompletní business model s AI',
      icon: '💡',
      color: 'indigo'
    },
    {
      id: 'content',
      title: 'Vytvořte si obsah',
      description: 'Texty, články, dokumenty pomocí AI',
      icon: '✍️',
      color: 'teal'
    }
  ]

  const domainExamples = [
    'jan-czech.biznes.cz',
    'muj-projekt.business.eu.com',
    'firma.services.eu.com',
    'startup.businesmen.eu.com'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Enterprise</span>
            </div>
            <div className={`hidden md:flex items-center ${locale === 'il' ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
              <a href="#sluzby" className="text-gray-700 hover:text-blue-600 transition">
                {translations?.navigation?.services || 'Služby'}
              </a>
              <a href="#ai-platforms" className="text-gray-700 hover:text-blue-600 transition">
                {translations?.navigation?.aiPlatforms || 'AI Platformy'}
              </a>
              <a href="#domains" className="text-gray-700 hover:text-blue-600 transition">
                {translations?.navigation?.domains || 'Domény'}
              </a>
              <a href="#kontakt" className="text-gray-700 hover:text-blue-600 transition">
                {translations?.navigation?.contact || 'Kontakt'}
              </a>
              <select 
                className="bg-transparent border border-gray-300 rounded px-3 py-1 text-sm"
                value={locale}
                onChange={handleLanguageChange}
              >
                <option value="cs">🇨🇿 Čeština</option>
                <option value="en">🇬🇧 English</option>
                <option value="ua">🇺🇦 Українська</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="il">🇮🇱 עברית</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                {translations?.common?.login || 'Přihlásit se'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {translations?.homepage?.title || 'Moderní řešení pro váš byznys'}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {translations?.homepage?.subtitle || 'Komplexní software pro účetnictví, personální agendu a automatizaci procesů. Využijte sílu AI a moderních technologií.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                {translations?.homepage?.cta?.startFree || 'Začít zdarma'}
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition">
                {translations?.homepage?.cta?.demo || 'Ukázka'}
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Účetní systémy</h3>
              <p className="text-gray-600">Moderní software pro správu účetnictví a financí s AI asistentem.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Personální agenda</h3>
              <p className="text-gray-600">Kompletní řešení pro HR, mzdy a správu zaměstnanců.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Automatizace</h3>
              <p className="text-gray-600">Automatické zpracování dat a inteligentní analýzy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Platforms Section */}
      <section id="ai-platforms" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vytvořte si cokoliv pomocí AI platforem
            </h2>
            <p className="text-xl text-gray-600">
              Vyberte si z nejlepších AI platforem a vytvořte si přesně to, co potřebujete
            </p>
          </div>

          {/* Platform Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {aiPlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedPlatform === platform.id
                    ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {platform.name}
              </button>
            ))}
          </div>

          {/* AI Options Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiOptions.map((option) => (
              <div
                key={option.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-200"
              >
                <div className="text-4xl mb-4">{option.icon}</div>
                <h3 className="text-lg font-bold mb-2">{option.title}</h3>
                <p className="text-gray-600 text-sm">{option.description}</p>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  Začít →
                </button>
              </div>
            ))}
          </div>

          {/* Additional Options */}
          <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">A ještě více možností...</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-bold mb-2">📝 Dokumenty</h4>
                <p className="text-sm text-gray-600">Smlouvy, faktury, reporty</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-bold mb-2">🎨 Design</h4>
                <p className="text-sm text-gray-600">Loga, vizitky, prezentace</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-bold mb-2">📧 Marketing</h4>
                <p className="text-sm text-gray-600">E-maily, reklamy, kampaně</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Domains 3rd Level Section */}
      <section id="domains" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Domény 3. úrovně pro vaše projekty
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Získejte vlastní doménu pro váš projekt. Například pokud jste Jan Czech a chcete projekt "Jan Czech",
              můžete spustit svůj projekt na adrese <span className="font-bold text-blue-600">jan-czech.biznes.cz</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Dostupné domény</h3>
                <div className="space-y-3">
                  {domainExamples.map((domain, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm">{domain}</span>
                      <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                        Zkontrolovat →
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Příklady domén:</strong> biznes.cz, business.eu.com, services.eu.com, 
                    businesmen.eu.com, businessmen.pro, it-enterprise.cloud, it-enterprise.eu, it-enterprise.pro
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6">Výhody</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">SSL certifikát zdarma</h4>
                      <p className="text-sm text-gray-600">Automatické HTTPS pro všechny domény</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">Automatická konfigurace</h4>
                      <p className="text-sm text-gray-600">Nginx a Traefik nastavení automaticky</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">24/7 podpora</h4>
                      <p className="text-sm text-gray-600">Vždy jsme tu pro vás</p>
                    </div>
                  </li>
                </ul>
                <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                  Získat doménu
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">IT</span>
                </div>
                <span className="text-xl font-bold">Enterprise</span>
              </div>
              <p className="text-gray-400">Moderní software pro váš byznys</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Služby</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Účetnictví</a></li>
                <li><a href="#" className="hover:text-white transition">HR systémy</a></li>
                <li><a href="#" className="hover:text-white transition">AI řešení</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Produkty</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">AI Platformy</a></li>
                <li><a href="#" className="hover:text-white transition">Domény</a></li>
                <li><a href="#" className="hover:text-white transition">Cloud</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+420 608 958 313</li>
                <li>office@it-enterprise.cz</li>
                <li>Domanovická 2480, Praha 9</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 IT Enterprise. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
