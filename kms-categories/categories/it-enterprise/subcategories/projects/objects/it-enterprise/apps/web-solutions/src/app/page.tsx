'use client'

import { useState, useEffect } from 'react'
import { getTranslations, type Locale } from '@it-enterprise/i18n'

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('cs')
  const [translations, setTranslations] = useState<any>(null)

  useEffect(() => {
    const t = getTranslations(locale)
    setTranslations(t)
    document.documentElement.lang = locale === 'il' ? 'he' : locale
    document.documentElement.dir = locale === 'il' ? 'rtl' : 'ltr'
  }, [locale])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale | null
      if (savedLocale) {
        setLocale(savedLocale)
      }
    }
  }, [])

  if (!translations) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  const products = [
    {
      name: 'IT Enterprise Accounting',
      description: 'Kompletní účetní systém s AI asistentem',
      price: '990 Kč/měsíc',
      icon: '📊',
      color: 'blue',
      features: ['Automatické OCR dokladů', 'Daňové přiznání', 'Reporting a dashboard']
    },
    {
      name: 'IT Enterprise HR',
      description: 'Moderní HR systém pro správu zaměstnanců a mezd',
      price: '790 Kč/měsíc',
      icon: '👥',
      color: 'purple',
      features: ['Mzdová účetnictví', 'Dovolená a absence', 'Výkazy a hodnocení']
    },
    {
      name: 'IT Enterprise E-commerce',
      description: 'Plnohodnotný e-commerce systém pro online prodej',
      price: '1290 Kč/měsíc',
      icon: '🛒',
      color: 'green',
      features: ['Produktový katalog', 'Platební brány', 'Marketingové nástroje']
    },
    {
      name: 'AI Data Processor',
      description: 'AI systém pro automatické zpracování a analýzu dat',
      price: '2490 Kč/měsíc',
      icon: '🤖',
      color: 'orange',
      features: ['Machine Learning modely', 'Prediktivní analýza', 'Automatizace procesů']
    },
    {
      name: 'AI Business Assistant',
      description: 'Inteligentní asistent pro podporu obchodních rozhodnutí',
      price: '1890 Kč/měsíc',
      icon: '💡',
      color: 'indigo',
      features: ['Chatbot pro zákazníky', 'Analýza trhu', 'Personalizované doporučení']
    },
    {
      name: 'BI Dashboard',
      description: 'Business Intelligence dashboard s pokročilou analýzou',
      price: '1590 Kč/měsíc',
      icon: '📈',
      color: 'red',
      features: ['Real-time analytics', 'Custom reporty', 'Data vizualizace']
    }
  ]

  const downloads = [
    { name: 'IT Enterprise Accounting', version: '2.1.0', size: '125 MB' },
    { name: 'IT Enterprise HR', version: '1.8.5', size: '98 MB' },
    { name: 'IT Enterprise E-commerce', version: '3.2.1', size: '156 MB' },
    { name: 'AI Data Processor', version: '1.5.3', size: '234 MB' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Enterprise</span>
              <span className="text-sm text-gray-500">Solutions</span>
            </div>
            <div className={`hidden md:flex items-center ${locale === 'il' ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
              <a href="#produkty" className="text-gray-700 hover:text-indigo-600 transition">{translations?.common?.nav?.products || 'Produkty'}</a>
              <a href="#download" className="text-gray-700 hover:text-indigo-600 transition">{translations?.common?.nav?.download || 'Download'}</a>
              <a href="#sluzby" className="text-gray-700 hover:text-indigo-600 transition">{translations?.common?.nav?.services || 'Služby'}</a>
              <a href="#kontakt" className="text-gray-700 hover:text-indigo-600 transition">{translations?.common?.nav?.contact || 'Kontakt'}</a>
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
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                {translations?.common?.nav?.login || 'Přihlásit se'}
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
              Software pro{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                váš byznys
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Kompletní portfolio produktů pro automatizaci a optimalizaci vašeho podnikání.
              Nákup, instalace a aktualizace na jednom místě.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl">
                Prohlédnout produkty
              </button>
              <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition">
                Konzultace zdarma
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produkty" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{translations?.solutions?.products?.title || 'Naše produkty'}</h2>
            <p className="text-xl text-gray-600">
              {translations?.solutions?.products?.subtitle || 'Vyberte si z našeho portfolia software produktů'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition border-2 border-transparent hover:border-indigo-200"
              >
                <div className={`bg-gradient-to-r from-${product.color}-500 to-${product.color}-600 text-white p-6`}>
                  <div className="text-4xl mb-4">{product.icon}</div>
                  <h3 className="text-xl font-bold">{product.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    {product.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-indigo-600">{product.price}</span>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                      {translations?.solutions?.products?.buy || 'Koupit'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{translations?.solutions?.download?.title || 'Download centrum'}</h2>
            <p className="text-xl text-gray-600">
              {translations?.solutions?.download?.subtitle || 'Stáhněte si naše produkty a aktualizace'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold mb-6">{translations?.solutions?.download?.sectionTitle || 'Stažte si naše produkty'}</h3>
            <div className="space-y-4">
              {downloads.map((download, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-indigo-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div>
                      <h4 className="font-bold">{download.name}</h4>
                      <p className="text-sm text-gray-600">{translations?.solutions?.download?.version || 'Verze'} {download.version} | {download.size}</p>
                    </div>
                  </div>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    {translations?.solutions?.products?.download || 'Stáhnout'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="sluzby" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{translations?.solutions?.services?.title || 'Naše služby'}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Vývoj software', icon: '💻', desc: 'Custom vývoj na míru' },
              { title: 'Automatizace', icon: '⚙️', desc: 'Procesní automatizace' },
              { title: 'Kyberbezpečnost', icon: '🔒', desc: 'Ochrana dat a systémů' },
              { title: 'Konzultace', icon: '📋', desc: 'IT a business poradenství' }
            ].map((service, idx) => (
              <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 text-center hover:shadow-lg transition">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">IT</span>
                </div>
                <span className="text-xl font-bold">Enterprise</span>
              </div>
              <p className="text-gray-400">Software a služby pro váš byznys</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Produkty</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Accounting</a></li>
                <li><a href="#" className="hover:text-white transition">HR</a></li>
                <li><a href="#" className="hover:text-white transition">E-commerce</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Podpora</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Download</a></li>
                <li><a href="#" className="hover:text-white transition">Dokumentace</a></li>
                <li><a href="#" className="hover:text-white transition">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+420 608 958 313</li>
                <li>office@it-enterprise.cz</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 IT Enterprise Solutions. {translations?.common?.footer?.rights || 'Všechna práva vyhrazena'}.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
