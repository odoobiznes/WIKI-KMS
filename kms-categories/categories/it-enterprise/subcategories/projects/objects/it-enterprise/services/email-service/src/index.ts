import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { emailService } from './services/emailService'

dotenv.config()

const app = express()
const PORT = process.env.EMAIL_SERVICE_PORT || 3002

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
    service: 'email-service'
  })
})

// Send email endpoint
app.post('/api/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body
    
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
    }

    const result = await emailService.sendEmail({ to, subject, html, text })
    
    if (result.success) {
      res.json({ success: true, messageId: result.messageId })
    } else {
      res.status(500).json({ error: 'Failed to send email', details: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Welcome email
app.post('/api/welcome', async (req, res) => {
  try {
    const { email, name } = req.body
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, name' })
    }

    const result = await emailService.sendWelcomeEmail(email, name)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Password reset email
app.post('/api/password-reset', async (req, res) => {
  try {
    const { email, token } = req.body
    
    if (!email || !token) {
      return res.status(400).json({ error: 'Missing required fields: email, token' })
    }

    const result = await emailService.sendPasswordResetEmail(email, token)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Order confirmation
app.post('/api/order-confirmation', async (req, res) => {
  try {
    const { email, name, order } = req.body
    
    if (!email || !name || !order) {
      return res.status(400).json({ error: 'Missing required fields: email, name, order' })
    }

    const result = await emailService.sendOrderConfirmationEmail(email, name, order)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Domain activation
app.post('/api/domain-activation', async (req, res) => {
  try {
    const { email, name, domain } = req.body
    
    if (!email || !name || !domain) {
      return res.status(400).json({ error: 'Missing required fields: email, name, domain' })
    }

    const result = await emailService.sendDomainActivationEmail(email, name, domain)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`📧 Email service running on port ${PORT}`)
})

