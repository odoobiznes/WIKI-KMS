'use client'

export default function HomePage() {
  const solutions = [
    {
      title: 'פתרונות AI מתקדמים',
      titleEn: 'AI-Powered Analytics',
      description: 'פתרונות למידת מכונה מתקדמים לבינה עסקית וניתוח תחזיתי',
      descriptionEn: 'Advanced machine learning solutions for business intelligence and predictive analytics.',
      icon: '🧠',
      color: 'blue'
    },
    {
      title: 'טכנולוגיה פיננסית',
      titleEn: 'Financial Technology',
      description: 'פתרונות פינטק מתקדמים לפעולות פיננסיות מודרניות ובנקאות דיגיטלית',
      descriptionEn: 'Cutting-edge fintech solutions for modern financial operations and digital banking.',
      icon: '💳',
      color: 'indigo'
    },
    {
      title: 'אבטחת סייבר',
      titleEn: 'Cybersecurity',
      description: 'פתרונות אבטחה ברמה ארגונית להגנה על הנכסים והנתונים הדיגיטליים שלך',
      descriptionEn: 'Enterprise-grade security solutions to protect your digital assets and data.',
      icon: '🔒',
      color: 'purple'
    }
  ]

  const partners = [
    { name: 'G7 Prague', country: 'צ\'כיה', countryEn: 'Czech Republic', description: 'ארגון חדשנות והשפעה חברתית', link: 'https://g7-praha.eu' },
    { name: 'Beit Lubavitch', country: 'ישראל', countryEn: 'Israel', description: 'מוסד חינוכי המשלב ערכים מסורתיים עם טכנולוגיה מודרנית', link: 'https://beitlubavitch.co.il' },
    { name: 'Hasidav', country: 'אוקראינה', countryEn: 'Ukraine', description: 'ארגון פיתוח המתמקד בחינוך טכנולוגי', link: 'https://hasidav.org' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Enterprise</span>
              <span className="text-sm text-gray-500">ישראל</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#solutions" className="text-gray-700 hover:text-blue-600 transition">פתרונות</a>
              <a href="#products" className="text-gray-700 hover:text-blue-600 transition">מוצרים</a>
              <a href="#partners" className="text-gray-700 hover:text-blue-600 transition">שותפים</a>
              <a href="#investors" className="text-gray-700 hover:text-blue-600 transition">משקיעים</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">יצירת קשר</a>
              <select className="bg-transparent border border-gray-300 rounded px-3 py-1 text-sm">
                <option value="il">🇮🇱 עברית</option>
                <option value="en">🇬🇧 English</option>
                <option value="cs">🇨🇿 Čeština</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                התחברות
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-5xl font-bold mb-6">
                פתרונות תוכנה{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  דור הבא
                </span>
              </h1>
              <p className="text-xl mb-8 text-gray-600">
                העצמת עסקים עם טכנולוגיה מונעת AI, חדשנות פיננסית ושינוי דיגיטלי מקיף.
                שיתוף פעולה בינלאומי בין צ\'כיה, ישראל ואוקראינה.
              </p>
              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg">
                  התחל עכשיו
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                  הזמן הדגמה
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-200">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">חדשנות גלובלית</h3>
                  <p className="text-gray-600">חיבור בין צ\'כיה, ישראל ואוקראינה דרך טכנולוגיה</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">הפתרונות שלנו</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="text-4xl mb-4">{solution.icon}</div>
                <h3 className="text-xl font-bold mb-4">{solution.title}</h3>
                <p className="text-gray-600 mb-4">{solution.description}</p>
                <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">
                  למידע נוסף →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">שותפים אסטרטגיים</h2>
            <p className="text-xl text-gray-600">
              שיתוף פעולה בינלאומי בין צ\'כיה, ישראל ואוקראינה
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {partners.map((partner, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{partner.name}</h3>
                <p className="text-gray-600 mb-2">{partner.country}</p>
                <p className="text-sm text-gray-600 mb-4">{partner.description}</p>
                <a href={partner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">
                  ביקור באתר →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section id="investors" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">הזדמנות השקעה</h2>
            <p className="text-xl text-gray-600">הצטרפו אלינו במהפכת תעשיית התוכנה</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-12">
            <h3 className="text-3xl font-bold mb-6">למה להשקיע ב-IT Enterprise?</h3>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-xl font-semibold mb-4 text-blue-600">הזדמנות שוק</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>ביקוש גובר לפתרונות עסקיים מונעי AI</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>שוק פינטק מתפתח במרכז ומזרח אירופה</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>שותפויות בינלאומיות חזקות</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-4 text-blue-600">יתרונות תחרותיים</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>טכנולוגיית AI קניינית</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>נוכחות ומומחיות רב-מדינתית</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>יכולות מחקר ופיתוח חזקות</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                הורדת תשקיף השקעה
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">צור קשר</h2>
            <p className="text-xl text-gray-600">מוכנים לשנות את העסק שלכם?</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">פרטי יצירת קשר</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+420 608 958 313</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>international@it-enterprise.eu</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Domanovická 2480, Prague 9, Czech Republic</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6">שלח הודעה</h3>
                <form className="space-y-4">
                  <input type="text" placeholder="שמך" className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                  <input type="email" placeholder="כתובת אימייל" className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                  <select className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600">
                    <option>בחר עניין</option>
                    <option>שותפות</option>
                    <option>השקעה</option>
                    <option>מוצרים</option>
                    <option>פנייה כללית</option>
                  </select>
                  <textarea placeholder="הודעה" rows={4} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600"></textarea>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                    שלח הודעה
                  </button>
                </form>
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
              <h4 className="text-xl font-bold mb-4">IT Enterprise</h4>
              <p className="text-gray-400">פתרונות תוכנה גלובליים מונעי AI וחדשנות</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">פתרונות</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">ניתוח AI</a></li>
                <li><a href="#" className="hover:text-white transition">פינטק</a></li>
                <li><a href="#" className="hover:text-white transition">אבטחת סייבר</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">שותפים</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">G7 Prague</a></li>
                <li><a href="#" className="hover:text-white transition">Beit Lubavitch</a></li>
                <li><a href="#" className="hover:text-white transition">Hasidav</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">התחבר</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 IT Enterprise. כל הזכויות שמורות. | חיבור בין צ\'כיה, ישראל ואוקראינה דרך טכנולוגיה</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
