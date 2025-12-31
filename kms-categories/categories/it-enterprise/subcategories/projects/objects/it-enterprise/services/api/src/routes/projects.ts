import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@it-enterprise/database'
import { authenticate } from '../middleware/auth'

const router = Router()

const createProjectSchema = z.object({
  name: z.string().min(1),
  template: z.string().optional(),
  tool: z.enum(['WINDSURF', 'LOVABLE', 'ONESPACE', 'CURSOR']),
  config: z.record(z.any()).optional()
})

// Get user projects (requires auth)
router.get('/', authenticate, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      include: {
        domain: true,
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
    
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create project (requires auth)
router.post('/', authenticate, async (req: any, res) => {
  try {
    const data = createProjectSchema.parse(req.body)
    
    const project = await prisma.project.create({
      data: {
        name: data.name,
        template: data.template,
        tool: data.tool,
        config: data.config || {},
        userId: req.userId!,
        status: 'DRAFT'
      },
      include: {
        domain: true
      }
    })
    
    res.status(201).json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update project (requires auth)
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        domain: true
      }
    })
    
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Publish project (requires auth)
router.post('/:id/publish', authenticate, async (req: any, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        published: true,
        publishedAt: new Date()
      },
      include: {
        domain: true
      }
    })
    
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

