import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { domainService } from './services/domainService'
import { traefikService } from './services/traefikService'

dotenv.config()

const app = express()
const PORT = process.env.DOMAIN_MANAGER_PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'domain-manager'
  })
})

// API Routes
app.get('/api/domains/pending', async (req, res) => {
  try {
    const domains = await domainService.getPendingDomains()
    res.json(domains)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/domains/:id/configure', async (req, res) => {
  try {
    const domain = await domainService.configureDomain(req.params.id)
    res.json(domain)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/domains/:id/activate', async (req, res) => {
  try {
    const domain = await domainService.activateDomain(req.params.id)
    res.json(domain)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/domains/:id/suspend', async (req, res) => {
  try {
    const domain = await domainService.suspendDomain(req.params.id)
    res.json(domain)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Cron job: Check for pending domains every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('🔍 Checking for pending domains...')
  try {
    const pendingDomains = await domainService.getPendingDomains()
    
    for (const domain of pendingDomains) {
      console.log(`⚙️  Configuring domain: ${domain.fullDomain}`)
      await domainService.configureDomain(domain.id)
    }
  } catch (error) {
    console.error('❌ Error processing pending domains:', error)
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Domain Manager service running on port ${PORT}`)
  console.log('📋 Monitoring domains for configuration...')
})

