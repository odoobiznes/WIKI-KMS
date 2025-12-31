import { Router } from 'express'
import { prisma } from '@it-enterprise/database'

const router = Router()

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    const dbStatus = 'healthy'

    // Get basic stats
    const [userCount, productCount, domainCount, projectCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.domain.count(),
      prisma.project.count(),
    ])

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy',
      },
      stats: {
        users: userCount,
        products: productCount,
        domains: domainCount,
        projects: projectCount,
      },
      version: '1.0.0',
    })
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    })
  }
})

// Simple health check
router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString() })
  }
})

export default router

