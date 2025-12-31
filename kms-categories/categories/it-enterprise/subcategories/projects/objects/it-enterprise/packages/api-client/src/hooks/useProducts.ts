'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/api'
import type { Product } from '../types'

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiClient.get<Product[]>('/api/products'),
  })
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: () => apiClient.get<Product>(`/api/products/${id}`),
    enabled: !!id,
  })
}

export function usePurchaseProduct() {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, string>({
    mutationFn: async (productId) => {
      return apiClient.post<Product>(`/api/products/${productId}/purchase`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

