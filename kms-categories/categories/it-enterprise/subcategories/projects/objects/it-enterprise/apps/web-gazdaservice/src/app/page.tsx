'use client'

export default function HomePage() {
  const accountingServices = [
    {
      title: 'Výkazy s unikátními grafy',
      description: 'Vytvořte si výkazy s grafy, které ještě nikdo tak nedělá. Interaktivní vizualizace dat.',
      icon: '📊',
      color: 'blue'
    },
    {
      title: 'Načítání dokumentů přes AI',
      description: 'Automatické načítání a zpracování dokumentů do výpočtů pomocí AI',
      icon: '🤖',
      color: 'purple'
    },
    {
      title: 'Obchodní plány na bázi AI',
      description: 'Kompletní obchodní plány vytvořené pomocí AI s detailní analýzou',
      icon: '💼',
      color: 'green'
    },
    {
      title: 'Finanční analýza',
      description: 'Hluboká analýza finančních dat s prediktivními modely',
      icon: '📈',
      color: 'orange'
    }
  ]

  const aiPlatforms = ['Windsurf', 'Lovable', 'OneSpace', 'Cursor', 'OpenAI', 'Claude', 'Lumo']
  
  const templates = [
    { name: 'Výkaz zisku a ztráty', category: 'Finance' },
    { name: 'Rozvaha', category: 'Finance' },
    { name: 'Cash flow', category: 'Finance' },
    { name: 'Daňové přiznání', category: 'Účetnictví' },
    { name: 'Mzdy a odvody', category: 'Administrace' },
    { name: 'Business plán', category: 'Management' },
    { name: 'Finanční prognóza', category: 'Finance' },
    { name: 'Kontrolní hlášení DPH', category: 'Účetnictví' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">GS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Gazda Service</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-green-600 transition">Služby</a>
              <a href="#ai" className="text-gray-700 hover:text-green-600 transition">AI Nástroje</a>
              <a href="#sablony" className="text-gray-700 hover:text-green-600 transition">Šablony</a>
              <a href="#kontakt" className="text-gray-700 hover:text-green-600 transition">Kontakt</a>
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
              Profesionální{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                účetnictví
              </span>{' '}
              pro vaši firmu
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Vytvořte si vlastní účetní a administrativní projekty pomocí AI platforem.
              Šablony, automatizace, analýzy - vše na jednom místě.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl">
                Začít zdarma
              </button>
              <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition">
                Ukázka
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Services Section */}
      <section id="sluzby" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vytvořte si účetní projekty pomocí AI
            </h2>
            <p className="text-xl text-gray-600">
              Vyberte si z nejlepších AI platforem a vytvořte si přesně to, co potřebujete
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {accountingServices.map((service, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-green-200"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
                  Vytvořit →
                </button>
              </div>
            ))}
          </div>

          {/* AI Platforms */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Dostupné AI platformy</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {aiPlatforms.map((platform) => (
                <span
                  key={platform}
                  className="bg-white px-4 py-2 rounded-lg shadow-sm font-semibold text-gray-700"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="sablony" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Šablony pro začátek</h2>
            <p className="text-xl text-gray-600">
              Začněte s profesionálními šablonami a upravte si je podle svých potřeb
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{template.name}</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Šablona pro {template.name.toLowerCase()}</p>
                <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
                  Použít šablonu →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Kategorie služeb</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {['Finance', 'Administrace', 'Účetnictví', 'Management'].map((category) => (
              <div
                key={category}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center hover:shadow-lg transition"
              >
                <h3 className="text-2xl font-bold mb-2">{category}</h3>
                <p className="text-gray-600 text-sm">
                  Kompletní řešení pro {category.toLowerCase()}
                </p>
                <button className="mt-4 text-green-600 hover:text-green-700 font-semibold">
                  Prozkoumat →
                </button>
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">GS</span>
                </div>
                <span className="text-xl font-bold">Gazda Service</span>
              </div>
              <p className="text-gray-400">Účetní a administrativní služby</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Služby</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Účetnictví</a></li>
                <li><a href="#" className="hover:text-white transition">Finance</a></li>
                <li><a href="#" className="hover:text-white transition">Administrace</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">AI Nástroje</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Šablony</a></li>
                <li><a href="#" className="hover:text-white transition">Automatizace</a></li>
                <li><a href="#" className="hover:text-white transition">Analýzy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+420 734 421 430</li>
                <li>office@gazdaservice.eu.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Gazda Service. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
