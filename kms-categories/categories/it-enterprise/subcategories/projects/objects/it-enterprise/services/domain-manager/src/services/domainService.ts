import { prisma, DomainStatus } from '@it-enterprise/database'
import { traefikService } from './traefikService'
import { nginxService } from './nginxService'

export const domainService = {
  /**
   * Get all pending domains
   */
  async getPendingDomains() {
    return prisma.domain.findMany({
      where: { status: DomainStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        project: true
      }
    })
  },

  /**
   * Configure domain - generate configs and update Traefik
   */
  async configureDomain(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
        user: true
      }
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    if (domain.status !== DomainStatus.PENDING) {
      throw new Error(`Domain is not pending (current status: ${domain.status})`)
    }

    try {
      // Generate Traefik configuration
      const traefikConfig = traefikService.generateConfig(domain)
      
      // Generate Nginx configuration (backup/alternative)
      const nginxConfig = nginxService.generateConfig(domain)

      // Update domain with configurations
      const updated = await prisma.domain.update({
        where: { id: domainId },
        data: {
          traefikConfig,
          nginxConfig,
          status: DomainStatus.ACTIVE,
          sslEnabled: true
        }
      })

      // Update Traefik labels (if using Docker labels)
      await traefikService.updateTraefikLabels(domain)

      // Send activation email (async, don't wait)
      if (process.env.EMAIL_SERVICE_URL && domain.user) {
        fetch(`${process.env.EMAIL_SERVICE_URL}/api/domain-activation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: domain.user.email,
            name: domain.user.name || domain.user.email,
            domain: domain.fullDomain,
          }),
        }).catch((err: any) => console.error('Error sending domain activation email:', err))
      }

      console.log(`✅ Domain configured: ${domain.fullDomain}`)
      return updated
    } catch (error) {
      // Mark as error if configuration fails
      await prisma.domain.update({
        where: { id: domainId },
        data: { status: DomainStatus.SUSPENDED }
      })
      throw error
    }
  },

  /**
   * Activate domain
   */
  async activateDomain(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId }
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    const updated = await prisma.domain.update({
      where: { id: domainId },
      data: { status: DomainStatus.ACTIVE }
    })

    await traefikService.updateTraefikLabels(updated)
    
    return updated
  },

  /**
   * Suspend domain
   */
  async suspendDomain(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId }
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    const updated = await prisma.domain.update({
      where: { id: domainId },
      data: { status: DomainStatus.SUSPENDED }
    })

    await traefikService.removeTraefikLabels(domain)
    
    return updated
  },

  /**
   * Get domain by ID
   */
  async getDomain(domainId: string) {
    return prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        user: true,
        project: true
      }
    })
  },

  /**
   * Get all domains for user
   */
  async getUserDomains(userId: string) {
    return prisma.domain.findMany({
      where: { userId },
      include: {
        project: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

