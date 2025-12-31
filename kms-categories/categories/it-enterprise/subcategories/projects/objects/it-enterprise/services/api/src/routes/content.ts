import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@it-enterprise/database'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

const createContentSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['ARTICLE', 'SERVICE', 'PRODUCT', 'PARTNER', 'NEWS', 'FAQ', 'TESTIMONIAL', 'CASE_STUDY']),
  body: z.string().min(1),
  excerpt: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  companyId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional()
})

// Get all published content
router.get('/', async (req, res) => {
  try {
    const { type, companyId, tag, category, featured, limit = '20', offset = '0' } = req.query
    
    const where: any = {
      published: true
    }
    
    if (type) where.type = type
    if (companyId) where.companyId = companyId
    if (featured === 'true') where.featured = true
    
    const content = await prisma.content.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        company: true,
        tags: tag ? {
          where: {
            slug: tag as string
          }
        } : true,
        categories: category ? {
          where: {
            slug: category as string
          }
        } : true
      },
      orderBy: { publishedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })
    
    res.json(content)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get content by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const content = await prisma.content.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        company: true,
        tags: true,
        categories: true,
        related: {
          where: { published: true },
          take: 5
        }
      }
    })
    
    if (!content || (!content.published && !req.headers.authorization)) {
      return res.status(404).json({ error: 'Content not found' })
    }
    
    res.json(content)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create content (requires auth)
router.post('/', authenticate, async (req: any, res) => {
  try {
    const data = createContentSchema.parse(req.body)
    
    const content = await prisma.content.create({
      data: {
        title: data.title,
        slug: data.slug,
        type: data.type,
        body: data.body,
        excerpt: data.excerpt,
        featured: data.featured || false,
        published: data.published || false,
        publishedAt: data.published ? new Date() : null,
        companyId: data.companyId,
        authorId: req.userId!,
        tags: data.tagIds ? {
          connect: data.tagIds.map(id => ({ id }))
        } : undefined,
        categories: data.categoryIds ? {
          connect: data.categoryIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        author: true,
        company: true,
        tags: true,
        categories: true
      }
    })
    
    res.status(201).json(content)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update content (requires auth)
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const content = await prisma.content.findUnique({
      where: { id: req.params.id }
    })
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' })
    }
    
    if (content.authorId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    const updated = await prisma.content.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        author: true,
        company: true,
        tags: true,
        categories: true
      }
    })
    
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete content (requires auth, admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await prisma.content.delete({
      where: { id: req.params.id }
    })
    
    res.json({ message: 'Content deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

