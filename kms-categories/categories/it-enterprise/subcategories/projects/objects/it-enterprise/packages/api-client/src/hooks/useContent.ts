'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/api'
import type { Content } from '../types'

interface ContentQueryParams {
  type?: string
  companyId?: string
  tag?: string
  category?: string
  featured?: boolean
  limit?: number
  offset?: number
}

export function useContent(params?: ContentQueryParams) {
  const queryParams = new URLSearchParams()
  if (params?.type) queryParams.append('type', params.type)
  if (params?.companyId) queryParams.append('companyId', params.companyId)
  if (params?.tag) queryParams.append('tag', params.tag)
  if (params?.category) queryParams.append('category', params.category)
  if (params?.featured) queryParams.append('featured', 'true')
  if (params?.limit) queryParams.append('limit', String(params.limit))
  if (params?.offset) queryParams.append('offset', String(params.offset))

  const queryString = queryParams.toString()
  const endpoint = `/api/content${queryString ? `?${queryString}` : ''}`

  return useQuery<Content[]>({
    queryKey: ['content', params],
    queryFn: () => apiClient.get<Content[]>(endpoint),
  })
}

export function useContentBySlug(slug: string) {
  return useQuery<Content>({
    queryKey: ['content', 'slug', slug],
    queryFn: () => apiClient.get<Content>(`/api/content/slug/${slug}`),
    enabled: !!slug,
  })
}

