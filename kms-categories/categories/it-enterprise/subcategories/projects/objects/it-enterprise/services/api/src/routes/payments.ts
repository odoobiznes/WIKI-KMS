import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@it-enterprise/database'
import { authenticate } from '../middleware/auth'
import Stripe from 'stripe'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

const createPaymentIntentSchema = z.object({
  productId: z.string(),
  amount: z.number().positive(),
})

// Create payment intent
router.post('/create-intent', authenticate, async (req: any, res) => {
  try {
    const data = createPaymentIntentSchema.parse(req.body)
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    })
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: 'czk',
      metadata: {
        userId: req.userId!,
        productId: data.productId,
      },
    })
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Webhook handler for Stripe (raw body already parsed by middleware)
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return res.status(400).send('Webhook secret not configured')
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Update purchase status
      await prisma.purchase.updateMany({
        where: {
          userId: paymentIntent.metadata.userId,
          productId: paymentIntent.metadata.productId,
          status: 'pending',
        },
        data: {
          status: 'completed',
        },
      })
      
      // Send confirmation email (via email service)
      if (process.env.EMAIL_SERVICE_URL) {
        try {
          const purchase = await prisma.purchase.findFirst({
            where: {
              userId: paymentIntent.metadata.userId,
              productId: paymentIntent.metadata.productId,
              status: 'completed',
            },
            include: {
              product: true,
              user: true,
            },
          })
          
          if (purchase) {
            const response = await fetch(`${process.env.EMAIL_SERVICE_URL}/api/order-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: purchase.user.email,
                name: purchase.user.name || purchase.user.email,
                order: {
                  id: purchase.id,
                  productName: purchase.product.name,
                  amount: purchase.amount,
                  createdAt: purchase.createdAt,
                },
              }),
            })
            if (!response.ok) {
              console.error('Email service error:', await response.text())
            }
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError)
        }
      }
      
      break
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      
      await prisma.purchase.updateMany({
        where: {
          userId: failedPayment.metadata.userId,
          productId: failedPayment.metadata.productId,
          status: 'pending',
        },
        data: {
          status: 'failed',
        },
      })
      break
      
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
})

export default router

