'use client'

export default function HomePage() {
  const services = [
    {
      title: 'Rezervace jízdenek',
      description: 'Online rezervace autobusových jízdenek',
      icon: '🎫',
      color: 'blue'
    },
    {
      title: 'Marketing pro dopravce',
      description: 'Marketingové služby pro provozovatele dopravy',
      icon: '🚌',
      color: 'green'
    },
    {
      title: 'Mezinárodní doprava',
      description: 'Podpora mezinárodní dopravy osob',
      icon: '🌍',
      color: 'purple'
    },
    {
      title: 'Reklamní služby',
      description: 'Reklama pro dopravce a provozovatele',
      icon: '📢',
      color: 'orange'
    }
  ]

  const aiTools = [
    'Vytvořte si rezervační systém',
    'Generujte marketingové kampaně',
    'Vytvořte jízdní řády',
    'Analyzujte trasy',
    'Vytvořte reklamní obsah',
    'Generujte inzeráty',
    'Vytvořte web pro dopravce',
    'Analyzujte poptávku'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">BT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Bus Ticket</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-teal-600 transition">Служби</a>
              <a href="#rezervace" className="text-gray-700 hover:text-teal-600 transition">Резервація</a>
              <a href="#marketing" className="text-gray-700 hover:text-teal-600 transition">Маркетинг</a>
              <a href="#kontakt" className="text-gray-700 hover:text-teal-600 transition">Контакт</a>
              <select className="bg-transparent border border-gray-300 rounded px-3 py-1 text-sm">
                <option value="ua">🇺🇦 Українська</option>
                <option value="cs">🇨🇿 Čeština</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                Увійти
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
              Новий рівень сервісу{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                бронювання квитків
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Підтримка менших перевізників міжнародного транспорту осіб.
              Створіть все за допомогою AI платформ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-teal-700 transition shadow-lg hover:shadow-xl">
                Замовити квиток
              </button>
              <button className="border-2 border-teal-600 text-teal-600 px-8 py-4 rounded-lg font-semibold hover:bg-teal-50 transition">
                Зв'язатися з нами
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
              Створіть проекти для транспорту за допомогою AI
            </h2>
            <p className="text-xl text-gray-600">
              Windsurf, Lovable, OneSpace, Cursor, OpenAI, Claude, Lumo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-teal-200"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                  Створити →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="marketing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Транспортні інструменти з AI</h2>
            <p className="text-xl text-gray-600">
              Створіть повне транспортне рішення за допомогою AI платформ
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiTools.map((tool, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <h4 className="font-bold mb-2">{tool}</h4>
                <p className="text-sm text-gray-600 mb-3">За допомогою AI платформ</p>
                <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                  Почати →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Ми — ваш надійний навігатор</h2>
              <p className="text-lg text-gray-600 mb-6">
                Наш сервіс створений для тих, хто цінує свій час та свободу вибору.
                Ми не є перевізником, і саме це — наша головна перевага.
                Ми — незалежний експерт, який допомагає вам знайти найвигідніший рейс.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Підтримка менших перевізників</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Маркетингові послуги</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI підтримка</span>
                </li>
              </ul>
              <button className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
                Зв'язатися з нами
              </button>
            </div>
            <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-2">Міжнародний транспорт</h4>
                <p className="text-gray-600">З AI підтримкою</p>
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
                <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">BT</span>
                </div>
                <span className="text-xl font-bold">Bus Ticket</span>
              </div>
              <p className="text-gray-400">Автобусні квитки онлайн</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Послуги</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Резервація</a></li>
                <li><a href="#" className="hover:text-white transition">Маркетинг</a></li>
                <li><a href="#" className="hover:text-white transition">Транспорт</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">AI Інструменти</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Системи резервації</a></li>
                <li><a href="#" className="hover:text-white transition">Маркетингові кампанії</a></li>
                <li><a href="#" className="hover:text-white transition">Аналіз</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Контакт</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+380 75 505 62 95</li>
                <li>yulianna@biznesmen.cz</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bus Ticket. Всі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
