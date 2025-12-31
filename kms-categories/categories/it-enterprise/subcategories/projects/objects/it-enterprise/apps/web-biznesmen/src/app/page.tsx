'use client'

export default function HomePage() {
  const services = [
    {
      title: 'Business koučing',
      description: 'Osobní koučing pro rozvoj vašeho podnikání s AI asistencí',
      icon: '🎯',
      color: 'blue'
    },
    {
      title: 'Marketingové kampaně',
      description: 'Vytvořte si efektivní marketingové kampaně pomocí AI',
      icon: '📢',
      color: 'purple'
    },
    {
      title: 'Reklamní obsah',
      description: 'Generujte reklamní texty, obrázky a videa pomocí AI',
      icon: '🎨',
      color: 'green'
    },
    {
      title: 'Business strategie',
      description: 'Navrhněte si kompletní business strategii s AI',
      icon: '💼',
      color: 'orange'
    }
  ]

  const aiOptions = [
    'Vytvořte si marketingový plán',
    'Generujte reklamní texty',
    'Navrhněte logo a brand',
    'Vytvořte prezentaci',
    'Naplánujte marketingovou kampaň',
    'Analyzujte konkurenci',
    'Vytvořte obsah pro sociální sítě',
    'Generujte e-mailové kampaně'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Biznesmen</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-orange-600 transition">Služby</a>
              <a href="#koucing" className="text-gray-700 hover:text-orange-600 transition">Koučing</a>
              <a href="#marketing" className="text-gray-700 hover:text-orange-600 transition">Marketing</a>
              <a href="#kontakt" className="text-gray-700 hover:text-orange-600 transition">Kontakt</a>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
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
              Podpora{' '}
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                podnikání
              </span>{' '}
              s AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Business koučing, poradenství, zprostředkování prodeje a reklamní agentura.
              Vytvořte si vše pomocí nejlepších AI platforem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-700 transition shadow-lg hover:shadow-xl">
                Začít zdarma
              </button>
              <button className="border-2 border-orange-600 text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-orange-50 transition">
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
              Vytvořte si marketingové projekty pomocí AI
            </h2>
            <p className="text-xl text-gray-600">
              Windsurf, Lovable, OneSpace, Cursor, OpenAI, Claude, Lumo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-orange-200"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <button className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
                  Vytvořit →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Marketing Options */}
      <section id="marketing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Marketingové nástroje s AI</h2>
            <p className="text-xl text-gray-600">
              Vytvořte si kompletní marketingové řešení pomocí AI platforem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiOptions.map((option, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <h4 className="font-bold mb-2">{option}</h4>
                <p className="text-sm text-gray-600 mb-3">Pomocí AI platforem</p>
                <button className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
                  Začít →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Section */}
      <section id="koucing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Business koučing s AI podporou</h2>
              <p className="text-lg text-gray-600 mb-6">
                Osobní koučing kombinovaný s AI nástroji pro maximální efektivitu.
                Vytvořte si vlastní koučovací programy a materiály.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Osobní koučing programy</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI generované materiály</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Zprostředkování prodeje</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reklamní agentura služby</span>
                </li>
              </ul>
              <button className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition">
                Začít s koučingem
              </button>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-2">Rychlý růst</h4>
                <p className="text-gray-600">S AI podporou dosáhnete výsledků rychleji</p>
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
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <span className="text-xl font-bold">Biznesmen</span>
              </div>
              <p className="text-gray-400">Podpora podnikání a marketing</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Služby</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Koučing</a></li>
                <li><a href="#" className="hover:text-white transition">Marketing</a></li>
                <li><a href="#" className="hover:text-white transition">Reklama</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">AI Nástroje</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Marketing plány</a></li>
                <li><a href="#" className="hover:text-white transition">Reklamní obsah</a></li>
                <li><a href="#" className="hover:text-white transition">Strategie</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+420 608 958 313</li>
                <li>yulianna@biznesmen.cz</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Biznesmen. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
