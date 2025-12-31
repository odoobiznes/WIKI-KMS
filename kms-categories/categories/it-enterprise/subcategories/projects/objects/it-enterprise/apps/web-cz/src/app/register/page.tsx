'use client'

import { RegisterForm } from '../../components/Auth/RegisterForm'
import { Navbar } from '../../components/Navigation/Navbar'
import { useAuth } from '@it-enterprise/api-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Načítání...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registrace do IT Enterprise
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nebo{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              se přihlaste
            </a>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

