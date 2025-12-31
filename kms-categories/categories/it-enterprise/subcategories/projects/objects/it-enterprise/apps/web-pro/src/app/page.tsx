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
  const services = [
    {
      title: '3. úrovňové domény',
      description: 'Získejte profesionální doménu pro své projekty a životopisy zdarma',
      icon: '🌐',
      color: 'green'
    },
    {
      title: 'Vývojové nástroje',
      description: 'Přístup k moderním nástrojům pro vývoj a testování',
      icon: '💻',
      color: 'blue'
    },
    {
      title: 'Vzdělávání',
      description: 'Kurzy a workshopy pro rozvoj vašich dovedností',
      icon: '🎓',
      color: 'purple'
    }
  ]

  const studentProjects = [
    { name: 'Portfolio web designera', domain: 'petr-svoboda.it-enterprise.pro', color: 'blue' },
    { name: 'E-commerce projekt', domain: 'maria-novotna.it-enterprise.pro', color: 'purple' },
    { name: 'Blog o technologii', domain: 'tomas-prochazka.it-enterprise.pro', color: 'green' }
  ]

  const availableDomains = [
    '.it-enterprise.pro',
    '.business.eu.com',
    '.biznes.cz',
    '.services.eu.com'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Enterprise</span>
              <span className="text-sm text-gray-500">Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-green-600 transition">Služby</a>
              <a href="#domeny" className="text-gray-700 hover:text-green-600 transition">Domény</a>
              <a href="#projekty" className="text-gray-700 hover:text-green-600 transition">Projekty</a>
              <a href="#registrace" className="text-gray-700 hover:text-green-600 transition">Registrace</a>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                Přihlásit se
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
              Vytvořte si svou{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                online přítomnost
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Pro studenty a začínající profesionály. Získejte 3. úrovňovou doménu zdarma
              a prezentujte své projekty pomocí AI platforem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl">
                Vytvořit web zdarma
              </button>
              <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition">
                Ukázky projektů
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="sluzby" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Co nabízíme</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  {service.title === '3. úrovňové domény' && (
                    <>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Vaše.jméno.it-enterprise.pro
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        SSL certifikát zdarma
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Automatická konfigurace
                      </li>
                    </>
                  )}
                  {service.title === 'Vývojové nástroje' && (
                    <>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Git repozitáře
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Testovací prostředí
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        CI/CD pipeline
                      </li>
                    </>
                  )}
                  {service.title === 'Vzdělávání' && (
                    <>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Programovací kurzy
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Workshopy
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mentoring
                      </li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section id="domeny" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Vytvořte si svou doménu</h2>
            <p className="text-xl text-gray-600">
              Získejte vlastní doménu 3. úrovně zdarma pro své projekty
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vaše jméno nebo projekt</label>
                <input
                  type="text"
                  placeholder="jan-novak"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doména</label>
                <select className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600">
                  {availableDomains.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">jan-novak.it-enterprise.pro</div>
                <div className="text-gray-600">Vaše nová doména bude aktivní během 5 minut</div>
              </div>
            </div>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Vytvořit doménu zdarma
            </button>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projekty" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ukázky studentských projektů</h2>
            <p className="text-xl text-gray-600">
              Vytvořte si podobné projekty pomocí AI platforem: Windsurf, Lovable, OneSpace, Cursor
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {studentProjects.map((project, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className={`h-48 bg-gradient-to-br from-${project.color}-400 to-${project.color}-600`}></div>
                <div className="p-6">
                  <h3 className="font-bold mb-2">{project.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">Vytvořeno pomocí AI platforem</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-mono">{project.domain}</span>
                    <a href="#" className="text-green-600 hover:text-green-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registrace" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Zaregistrujte se zdarma</h2>
            <p className="text-xl text-gray-600">Přidejte se k naší komunitě studentů a profesionálů</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Jméno" className="px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600" />
                <input type="text" placeholder="Příjmení" className="px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600" />
              </div>
              <input type="email" placeholder="Email" className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600" />
              <input type="password" placeholder="Heslo" className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600" />
              <select className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-green-600">
                <option>Vyberte školu/organizaci</option>
                <option>G7 Praha o.p.s.</option>
                <option>Beit Lubavitch</option>
                <option>Hasidav</option>
                <option>Jiné</option>
              </select>
              <div className="flex items-center">
                <input type="checkbox" id="terms" className="mr-2" />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Souhlasím s <a href="#" className="text-green-600 hover:text-green-700">podmínkami použití</a>
                </label>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                Vytvořit účet zdarma
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">IT</span>
                </div>
                <span className="text-xl font-bold">Enterprise Pro</span>
              </div>
              <p className="text-gray-400">Edukační portál pro studenty a profesionály</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Služby</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Domény</a></li>
                <li><a href="#" className="hover:text-white transition">Vývoj</a></li>
                <li><a href="#" className="hover:text-white transition">Vzdělávání</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Partneři</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">G7 Praha</a></li>
                <li><a href="#" className="hover:text-white transition">Beit Lubavitch</a></li>
                <li><a href="#" className="hover:text-white transition">Hasidav</a></li>
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
            <p>&copy; 2025 IT Enterprise Pro. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
