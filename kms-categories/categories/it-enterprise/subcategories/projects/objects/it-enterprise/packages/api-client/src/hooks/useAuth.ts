'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/api'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types'

export function useAuth() {
  const queryClient = useQueryClient()

  // Get current user
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        // Try to get user from token
        const token = apiClient.getToken()
        if (!token) return null
        
        // In a real app, you'd have a /me endpoint
        // For now, we'll decode the token or return null
        return null
      } catch {
        return null
      }
    },
    staleTime: Infinity,
  })

  // Login mutation
  const loginMutation = useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', data)
      apiClient.setToken(response.token)
      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user)
    },
  })

  // Register mutation
  const registerMutation = useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', data)
      apiClient.setToken(response.token)
      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user)
    },
  })

  // Logout
  const logout = () => {
    apiClient.setToken(null)
    queryClient.setQueryData(['auth', 'user'], null)
    queryClient.clear()
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}

