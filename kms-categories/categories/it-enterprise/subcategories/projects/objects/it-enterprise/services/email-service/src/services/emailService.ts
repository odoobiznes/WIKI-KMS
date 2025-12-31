import nodemailer from 'nodemailer'
import { prisma } from '@it-enterprise/database'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const emailService = {
  /**
   * Send email
   */
  async sendEmail(options: EmailOptions) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      })

      console.log('Email sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }
  },

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail: string, userName: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Vítejte v IT Enterprise!</h1>
            </div>
            <div class="content">
              <p>Ahoj ${userName},</p>
              <p>Děkujeme za registraci v IT Enterprise platformě. Jsme rádi, že jste s námi!</p>
              <p>Nyní můžete:</p>
              <ul>
                <li>Vytvářet projekty pomocí AI platforem</li>
                <li>Spravovat domény 3. úrovně</li>
                <li>Nakupovat produkty a služby</li>
              </ul>
              <a href="${process.env.APP_URL || 'https://it-enterprise.cz'}/dashboard" class="button">Přejít na Dashboard</a>
              <p>Pokud máte jakékoliv otázky, neváhejte nás kontaktovat.</p>
              <p>S pozdravem,<br>Tým IT Enterprise</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: userEmail,
      subject: 'Vítejte v IT Enterprise!',
      html,
    })
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string) {
    const resetUrl = `${process.env.APP_URL || 'https://it-enterprise.cz'}/reset-password?token=${resetToken}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Obnovení hesla</h1>
            </div>
            <div class="content">
              <p>Obdrželi jsme žádost o obnovení hesla pro váš účet.</p>
              <p>Klikněte na tlačítko níže pro obnovení hesla:</p>
              <a href="${resetUrl}" class="button">Obnovit heslo</a>
              <div class="warning">
                <p><strong>Bezpečnostní upozornění:</strong></p>
                <p>Pokud jste o obnovení hesla nežádali, ignorujte tento email. Odkaz je platný pouze 1 hodinu.</p>
              </div>
              <p>S pozdravem,<br>Tým IT Enterprise</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: userEmail,
      subject: 'Obnovení hesla - IT Enterprise',
      html,
    })
  },

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(userEmail: string, userName: string, order: any) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Objednávka potvrzena!</h1>
            </div>
            <div class="content">
              <p>Ahoj ${userName},</p>
              <p>Děkujeme za vaši objednávku!</p>
              <div class="order-details">
                <h3>Detaily objednávky</h3>
                <p><strong>Produkt:</strong> ${order.productName}</p>
                <p><strong>Cena:</strong> ${order.amount} Kč</p>
                <p><strong>Číslo objednávky:</strong> ${order.id}</p>
                <p><strong>Datum:</strong> ${new Date(order.createdAt).toLocaleDateString('cs-CZ')}</p>
              </div>
              <a href="${process.env.APP_URL || 'https://it-enterprise.cz'}/dashboard" class="button">Zobrazit objednávku</a>
              <p>S pozdravem,<br>Tým IT Enterprise</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: userEmail,
      subject: `Objednávka #${order.id} potvrzena`,
      html,
    })
  },

  /**
   * Send domain activation email
   */
  async sendDomainActivationEmail(userEmail: string, userName: string, domain: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .domain-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; color: #3b82f6; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Doména aktivována!</h1>
            </div>
            <div class="content">
              <p>Ahoj ${userName},</p>
              <p>Vaše doména byla úspěšně aktivována a je nyní dostupná!</p>
              <div class="domain-box">
                https://${domain}
              </div>
              <p>SSL certifikát byl automaticky nainstalován a doména je připravena k použití.</p>
              <a href="https://${domain}" class="button" target="_blank">Navštívit doménu</a>
              <p>S pozdravem,<br>Tým IT Enterprise</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: userEmail,
      subject: `Doména ${domain} aktivována`,
      html,
    })
  },
}

