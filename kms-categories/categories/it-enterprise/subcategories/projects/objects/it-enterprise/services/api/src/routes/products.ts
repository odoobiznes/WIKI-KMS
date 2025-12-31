import { Router } from 'express'
import { prisma } from '@it-enterprise/database'
import { authenticate } from '../middleware/auth'

const router = Router()

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        company: true,
        _count: {
          select: {
            purchases: true,
            downloads: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        downloads: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Purchase product (requires auth)
router.post('/:id/purchase', authenticate, async (req: any, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    })
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    const purchase = await prisma.purchase.create({
      data: {
        userId: req.userId!,
        productId: product.id,
        amount: product.price,
        status: 'pending'
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
    
    res.status(201).json(purchase)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

