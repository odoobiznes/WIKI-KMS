'use client'

import { useAuth } from '@it-enterprise/api-client'
import { Navbar } from '../../components/Navigation/Navbar'
import { Input, Button } from '@it-enterprise/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Načítání...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement update user profile
    alert('Funkce bude brzy dostupná')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nastavení</h1>
          <p className="mt-2 text-gray-600">
            Spravujte svůj účet a preference
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profil</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Jméno"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vaše jméno"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              disabled
              helperText="Email nelze změnit"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary">
                Uložit změny
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Zabezpečení</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Změna hesla</h3>
              <p className="text-sm text-gray-600 mb-4">
                Změňte své heslo pro lepší zabezpečení účtu
              </p>
              <Button variant="outline" size="sm">
                Změnit heslo
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Nebezpečná zóna</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Odhlásit se ze všech zařízení</h3>
              <p className="text-sm text-gray-600 mb-4">
                Odhlásí vás ze všech zařízení, kde jste přihlášeni
              </p>
              <Button variant="outline" size="sm">
                Odhlásit se ze všech zařízení
              </Button>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 text-red-600">Smazat účet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Trvale smaže váš účet a všechna data. Tato akce je nevratná.
              </p>
              <Button variant="danger" size="sm">
                Smazat účet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

