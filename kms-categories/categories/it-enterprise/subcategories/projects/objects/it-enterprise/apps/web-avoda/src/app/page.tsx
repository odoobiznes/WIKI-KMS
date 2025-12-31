'use client'

export default function HomePage() {
  const services = [
    {
      title: 'Zprostředkování zaměstnání',
      description: 'Najděte si práci nebo najděte zaměstnance pomocí AI',
      icon: '👔',
      color: 'blue'
    },
    {
      title: 'Dokumenty pro práci v EU',
      description: 'Vytvořte si všechny potřebné dokumenty pomocí AI',
      icon: '📄',
      color: 'green'
    },
    {
      title: 'HR služby',
      description: 'Kompletní HR řešení s AI podporou',
      icon: '👥',
      color: 'purple'
    },
    {
      title: 'Legální zaměstnávání',
      description: 'Zajištění legálního zaměstnávání v zahraničí',
      icon: '⚖️',
      color: 'orange'
    }
  ]

  const aiTools = [
    'Vytvořte si životopis',
    'Napište motivační dopis',
    'Připravte se na pohovor',
    'Vytvořte pracovní smlouvu',
    'Generujte pracovní dokumenty',
    'Analyzujte trh práce',
    'Vytvořte inzerát',
    'Najděte kandidáty'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Avoda</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-purple-600 transition">Služby</a>
              <a href="#prace" className="text-gray-700 hover:text-purple-600 transition">Práce</a>
              <a href="#dokumenty" className="text-gray-700 hover:text-purple-600 transition">Dokumenty</a>
              <a href="#kontakt" className="text-gray-700 hover:text-purple-600 transition">Kontakt</a>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
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
              Agentura{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                práce
              </span>{' '}
              s AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Zprostředkování zaměstnání, legální zaměstnávání v zahraničí a příprava dokumentů pro práci v EU.
              Vše pomocí AI platforem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg hover:shadow-xl">
                Najít práci
              </button>
              <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition">
                Nabídnout zaměstnání
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
              Vytvořte si HR projekty pomocí AI
            </h2>
            <p className="text-xl text-gray-600">
              Windsurf, Lovable, OneSpace, Cursor, OpenAI, Claude, Lumo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-purple-200"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                  Vytvořit →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="dokumenty" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">HR nástroje s AI</h2>
            <p className="text-xl text-gray-600">
              Vytvořte si všechny potřebné dokumenty a materiály pomocí AI platforem
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
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                  Začít →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="prace" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Umožňujeme úspěšné zaměstnání</h2>
              <p className="text-lg text-gray-600 mb-6">
                Aby firmy měly ty nejlepší pracovníky a uchazeči práci svých snů.
                Vše s AI podporou pro efektivní matching.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI matching kandidátů</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automatické generování dokumentů</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Legální zaměstnávání v EU</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>24/7 podpora</span>
                </li>
              </ul>
              <div className="flex gap-4">
                <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                  Najít práci
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition">
                  Nabídnout zaměstnání
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-2">Úspěšné zaměstnání</h4>
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
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-xl font-bold">Avoda</span>
              </div>
              <p className="text-gray-400">Agentura práce</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Služby</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Zaměstnání</a></li>
                <li><a href="#" className="hover:text-white transition">Dokumenty</a></li>
                <li><a href="#" className="hover:text-white transition">HR služby</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">AI Nástroje</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Životopisy</a></li>
                <li><a href="#" className="hover:text-white transition">Smlouvy</a></li>
                <li><a href="#" className="hover:text-white transition">Dokumenty EU</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+420 608 958 313</li>
                <li>office@avoda.cz</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Avoda. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
