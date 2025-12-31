export interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  companyId?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  category: string
  companyId: string | null
  createdAt: string
  updatedAt: string
}

export interface Domain {
  id: string
  subdomain: string
  domain: string
  fullDomain: string
  userId: string
  projectId: string | null
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  sslEnabled: boolean
  backupEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  template: string | null
  tool: 'WINDSURF' | 'LOVABLE' | 'ONESPACE' | 'CURSOR'
  userId: string
  status: 'DRAFT' | 'BUILDING' | 'READY' | 'PUBLISHED' | 'ERROR'
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface Content {
  id: string
  title: string
  slug: string
  type: 'ARTICLE' | 'SERVICE' | 'PRODUCT' | 'PARTNER' | 'NEWS' | 'FAQ' | 'TESTIMONIAL' | 'CASE_STUDY'
  body: string
  excerpt: string | null
  featured: boolean
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateDomainRequest {
  subdomain: string
  domain: string
  projectId?: string
}

export interface CreateProjectRequest {
  name: string
  template?: string
  tool: 'WINDSURF' | 'LOVABLE' | 'ONESPACE' | 'CURSOR'
  config?: Record<string, any>
}

