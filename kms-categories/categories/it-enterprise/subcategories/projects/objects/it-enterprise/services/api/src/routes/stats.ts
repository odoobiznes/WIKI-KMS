import { Router } from 'express'
import { prisma } from '@it-enterprise/database'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

// Get platform statistics (admin only)
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalDomains,
      totalProjects,
      activeDomains,
      publishedProjects,
      totalPurchases,
      completedPurchases,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.domain.count(),
      prisma.project.count(),
      prisma.domain.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count({ where: { published: true } }),
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: 'completed' } }),
    ])

    const revenue = await prisma.purchase.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
    })

    res.json({
      users: {
        total: totalUsers,
      },
      products: {
        total: totalProducts,
      },
      domains: {
        total: totalDomains,
        active: activeDomains,
      },
      projects: {
        total: totalProjects,
        published: publishedProjects,
      },
      purchases: {
        total: totalPurchases,
        completed: completedPurchases,
        revenue: revenue._sum.amount || 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

