import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@it-enterprise/database'
import { authenticate } from '../middleware/auth'

const router = Router()

const createDomainSchema = z.object({
  subdomain: z.string().min(1).max(63),
  domain: z.string().min(1),
  projectId: z.string().optional()
})

// Get user domains (requires auth)
router.get('/', authenticate, async (req: any, res) => {
  try {
    const domains = await prisma.domain.findMany({
      where: { userId: req.userId },
      include: {
        project: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(domains)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create domain (requires auth)
router.post('/', authenticate, async (req: any, res) => {
  try {
    const data = createDomainSchema.parse(req.body)
    const fullDomain = `${data.subdomain}.${data.domain}`
    
    // Check if domain exists
    const existing = await prisma.domain.findUnique({
      where: { fullDomain }
    })
    
    if (existing) {
      return res.status(400).json({ error: 'Domain already exists' })
    }
    
    const domain = await prisma.domain.create({
      data: {
        subdomain: data.subdomain,
        domain: data.domain,
        fullDomain,
        userId: req.userId!,
        projectId: data.projectId,
        status: 'PENDING'
      },
      include: {
        project: true
      }
    })
    
    res.status(201).json(domain)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update domain (requires auth)
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: req.params.id }
    })
    
    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' })
    }
    
    if (domain.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    const updated = await prisma.domain.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        project: true
      }
    })
    
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete domain (requires auth)
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: req.params.id }
    })
    
    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' })
    }
    
    if (domain.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    await prisma.domain.delete({
      where: { id: req.params.id }
    })
    
    res.json({ message: 'Domain deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

