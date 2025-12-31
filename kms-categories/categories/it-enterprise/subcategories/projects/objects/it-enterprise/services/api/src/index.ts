import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}))

// Stripe webhook needs raw body - must be before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use(logger.request.bind(logger))

// Rate limiting
import { apiRateLimit } from './middleware/rateLimit'
app.use('/api', apiRateLimit)

// Health check routes
import healthRoutes from './routes/health'
app.use('/health', healthRoutes)

// API Routes
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import domainRoutes from './routes/domains'
import projectRoutes from './routes/projects'
import contentRoutes from './routes/content'
import paymentRoutes from './routes/payments'
import statsRoutes from './routes/stats'

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/domains', domainRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/stats', statsRoutes)

app.get('/api', (req, res) => {
  res.json({ 
    message: 'IT Enterprise API',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/products',
      '/api/domains',
      '/api/projects',
      '/api/content',
      '/api/payments',
      '/api/stats',
      '/health'
    ]
  })
})

// Error handling middleware
import { errorHandler } from './middleware/errorHandler'
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 API server running on port ${PORT}`)
})

