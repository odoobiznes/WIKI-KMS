'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/api'
import type { Domain, CreateDomainRequest } from '../types'

export function useDomains() {
  return useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => apiClient.get<Domain[]>('/api/domains'),
  })
}

export function useCreateDomain() {
  const queryClient = useQueryClient()

  return useMutation<Domain, Error, CreateDomainRequest>({
    mutationFn: async (data) => {
      return apiClient.post<Domain>('/api/domains', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
    },
  })
}

export function useUpdateDomain() {
  const queryClient = useQueryClient()

  return useMutation<Domain, Error, { id: string; data: Partial<Domain> }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put<Domain>(`/api/domains/${id}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: ['domains', variables.id] })
    },
  })
}

export function useDeleteDomain() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete<void>(`/api/domains/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
    },
  })
}

