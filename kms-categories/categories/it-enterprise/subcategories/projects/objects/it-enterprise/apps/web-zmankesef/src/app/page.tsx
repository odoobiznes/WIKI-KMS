'use client'

export default function HomePage() {
  const services = [
    {
      title: 'Finanční služby',
      description: 'Kompletní finanční řešení s AI podporou',
      icon: '💰',
      color: 'blue'
    },
    {
      title: 'Stavební projekty',
      description: 'Plánování a řízení stavebních projektů',
      icon: '🏗️',
      color: 'green'
    },
    {
      title: 'Investiční poradenství',
      description: 'AI-powered investiční analýzy a doporučení',
      icon: '📈',
      color: 'purple'
    },
    {
      title: 'Financování',
      description: 'Půjčky a financování projektů',
      icon: '💳',
      color: 'orange'
    }
  ]

  const aiTools = [
    'Vytvořte si finanční plán',
    'Analyzujte investiční příležitosti',
    'Navrhněte stavební projekt',
    'Vypočítejte financování',
    'Vytvořte smlouvy',
    'Generujte faktury',
    'Analyzujte rizika',
    'Vytvořte reporty'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ZK</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Zman Kesef</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-blue-600 transition">Služby</a>
              <a href="#finance" className="text-gray-700 hover:text-blue-600 transition">Finance</a>
              <a href="#stavby" className="text-gray-700 hover:text-blue-600 transition">Stavby</a>
              <a href="#kontakt" className="text-gray-700 hover:text-blue-600 transition">Kontakt</a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
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
              Finanční služby a{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                stavební projekty
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Kompletní finanční řešení, investiční poradenství a stavební projekty.
              Vytvořte si vše pomocí AI platforem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                Začít zdarma
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition">
                Ukázka
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="sluzby" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vytvořte si finanční projekty pomocí AI
            </h2>
            <p className="text-xl text-gray-600">
              Windsurf, Lovable, OneSpace, Cursor, OpenAI, Claude, Lumo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-blue-200"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  Vytvořit →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="finance" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Finanční nástroje s AI</h2>
            <p className="text-xl text-gray-600">
              Vytvořte si kompletní finanční řešení pomocí AI platforem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiTools.map((tool, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <h4 className="font-bold mb-2">{tool}</h4>
                <p className="text-sm text-gray-600 mb-3">Pomocí AI platforem</p>
                <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  Začít →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Construction Section */}
      <section id="stavby" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Stavební projekty s AI</h2>
              <p className="text-lg text-gray-600 mb-6">
                Plánování, projektování a řízení stavebních projektů s AI asistencí.
                Vytvořte si kompletní projektovou dokumentaci.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Projektová dokumentace</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Rozpočty a kalkulace</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Harmonogramy prací</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Financování projektů</span>
                </li>
              </ul>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Začít projekt
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-2">Profesionální projekty</h4>
                <p className="text-gray-600">S AI podporou</p>
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">ZK</span>
                </div>
                <span className="text-xl font-bold">Zman Kesef</span>
              </div>
              <p className="text-gray-400">Finanční služby a stavební projekty</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Služby</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Finance</a></li>
                <li><a href="#" className="hover:text-white transition">Stavby</a></li>
                <li><a href="#" className="hover:text-white transition">Investice</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">AI Nástroje</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Finanční plány</a></li>
                <li><a href="#" className="hover:text-white transition">Projekty</a></li>
                <li><a href="#" className="hover:text-white transition">Analýzy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+420 734 421 430</li>
                <li>office@zmankesef.cz</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Zman Kesef. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
