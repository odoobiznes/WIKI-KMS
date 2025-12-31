'use client'

import { useState } from 'react'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const stats = [
    { label: 'Aktivní servery', value: '24', change: '+12%', icon: '🖥️', color: 'blue' },
    { label: 'Domény', value: '156', change: '+8%', icon: '🌐', color: 'green' },
    { label: 'Uživatelé', value: '1,248', change: '+25%', icon: '👥', color: 'purple' },
    { label: 'Uptime', value: '98.5%', change: '-3%', icon: '📊', color: 'orange' }
  ]

  const servers = [
    { name: 'web-01', type: 'Nginx + PHP', status: 'online', cpu: '45%', ram: '2.1GB' },
    { name: 'db-01', type: 'PostgreSQL', status: 'online', cpu: '23%', ram: '4.2GB' },
    { name: 'app-01', type: 'Node.js', status: 'warning', cpu: '78%', ram: '3.8GB' },
    { name: 'cache-01', type: 'Redis', status: 'online', cpu: '12%', ram: '512MB' }
  ]

  const recentActivity = [
    { type: 'domain', message: 'Nová doména přidána', detail: 'client123.it-enterprise.pro', time: 'před 5 minutami', icon: '➕' },
    { type: 'update', message: 'Aktualizace systému', detail: 'Server web-01 aktualizován', time: 'před 1 hodinou', icon: '🔄' },
    { type: 'warning', message: 'Vysoká zátěž', detail: 'Server app-01 má vysokou CPU zátěž', time: 'před 2 hodinami', icon: '⚠️' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">IT</span>
              </div>
              <div>
                <div className="font-bold">IT Enterprise</div>
                <div className="text-xs text-gray-300">Cloud Admin</div>
              </div>
            </div>
            
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'servers', label: 'Servery', icon: '🖥️' },
                { id: 'domains', label: 'Domény', icon: '🌐' },
                { id: 'users', label: 'Uživatelé', icon: '👥' },
                { id: 'monitoring', label: 'Monitoring', icon: '📈' },
                { id: 'backups', label: 'Zálohy', icon: '💾' },
                { id: 'settings', label: 'Nastavení', icon: '⚙️' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                    activeTab === item.id ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="absolute bottom-0 w-64 p-6 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm">A</span>
              </div>
              <div>
                <div className="font-semibold">Admin</div>
                <div className="text-xs text-gray-300">Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-gray-600">Přehled systému</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center text-2xl`}>
                      {stat.icon}
                    </div>
                    <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Server Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Stav serverů</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {servers.map((server, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            server.status === 'online' ? 'bg-green-500' : 
                            server.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="font-semibold">{server.name}</div>
                            <div className="text-sm text-gray-600">{server.type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">CPU: {server.cpu}</div>
                          <div className="text-sm text-gray-600">RAM: {server.ram}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Nedávná aktivita</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'domain' ? 'bg-green-100' :
                          activity.type === 'update' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          <span className="text-sm">{activity.icon}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{activity.message}</div>
                          <div className="text-sm text-gray-600">{activity.detail}</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Rychlé akce</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Přidat server', icon: '➕', color: 'blue' },
                    { label: 'Nová doména', icon: '🌐', color: 'green' },
                    { label: 'Přidat uživatele', icon: '👤', color: 'purple' },
                    { label: 'Záloha', icon: '💾', color: 'orange' }
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
                    >
                      <div className={`text-2xl mb-2 text-${action.color}-600`}>{action.icon}</div>
                      <div className="font-semibold">{action.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
