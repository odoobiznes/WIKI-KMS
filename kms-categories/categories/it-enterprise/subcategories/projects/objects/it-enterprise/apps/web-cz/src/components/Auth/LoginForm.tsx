'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@it-enterprise/api-client'
import { useToastContext, Button } from '@it-enterprise/ui'
import { loginSchema, type LoginFormData } from '@it-enterprise/ui'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const { loginAsync, isLoggingIn } = useAuth()
  const { success, error: showError } = useToastContext()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginAsync({ email: data.email, password: data.password })
      success('Úspěšně jste se přihlásili!')
      router.push('/dashboard')
    } catch (err: any) {
      const errorMessage = err.error?.error || err.message || 'Přihlášení selhalo'
      showError(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.email
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Heslo
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.password
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        isLoading={isLoggingIn}
        className="w-full"
        size="lg"
      >
        Přihlásit se
      </Button>
    </form>
  )
}

