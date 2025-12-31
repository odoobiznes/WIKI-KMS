import Docker from 'dockerode'
import { Domain } from '@it-enterprise/database'

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

export const traefikService = {
  /**
   * Generate Traefik configuration for domain
   */
  generateConfig(domain: Domain & { project?: any }) {
    const config = {
      enabled: true,
      rule: `Host(\`${domain.fullDomain}\`)`,
      entrypoint: 'websecure',
      tls: {
        certResolver: 'letsencrypt'
      },
      service: {
        name: `domain-${domain.id}`,
        port: domain.project?.port || 3000
      }
    }

    return JSON.stringify(config, null, 2)
  },

  /**
   * Generate Traefik labels for Docker container
   */
  generateLabels(domain: Domain & { project?: any }) {
    const labels: Record<string, string> = {
      'traefik.enable': 'true',
      [`traefik.http.routers.domain-${domain.id}.rule`]: `Host(\`${domain.fullDomain}\`)`,
      [`traefik.http.routers.domain-${domain.id}.entrypoints`]: 'websecure',
      [`traefik.http.routers.domain-${domain.id}.tls.certresolver`]: 'letsencrypt',
      [`traefik.http.services.domain-${domain.id}.loadbalancer.server.port`]: String(domain.project?.port || 3000)
    }

    // Add middleware if needed (auth, rate limiting, etc.)
    if (domain.project?.authRequired) {
      labels[`traefik.http.routers.domain-${domain.id}.middlewares`] = 'auth'
    }

    return labels
  },

  /**
   * Update Traefik labels for domain container
   * Note: This requires the domain to be running in a Docker container
   */
  async updateTraefikLabels(domain: Domain & { project?: any }) {
    try {
      const containerName = `domain-${domain.id}`
      
      // Try to find container
      const containers = await docker.listContainers({ all: true })
      const container = containers.find(c => 
        c.Names.some(name => name.includes(containerName))
      )

      if (!container) {
        console.log(`⚠️  Container not found for domain: ${domain.fullDomain}`)
        console.log(`   Domain will be configured when container is created`)
        return
      }

      const dockerContainer = docker.getContainer(container.Id)
      const labels = this.generateLabels(domain)

      // Update container labels
      // Note: This requires container recreation in production
      // For now, we'll just log the labels that should be applied
      console.log(`📋 Traefik labels for ${domain.fullDomain}:`, labels)
      
      return labels
    } catch (error) {
      console.error(`❌ Error updating Traefik labels for ${domain.fullDomain}:`, error)
      throw error
    }
  },

  /**
   * Remove Traefik labels (suspend domain)
   */
  async removeTraefikLabels(domain: Domain) {
    try {
      const containerName = `domain-${domain.id}`
      const containers = await docker.listContainers({ all: true })
      const container = containers.find(c => 
        c.Names.some(name => name.includes(containerName))
      )

      if (container) {
        console.log(`🔒 Suspending domain: ${domain.fullDomain}`)
        // In production, you would update the container to disable Traefik routing
      }
    } catch (error) {
      console.error(`❌ Error removing Traefik labels for ${domain.fullDomain}:`, error)
    }
  },

  /**
   * Generate dynamic Traefik configuration file
   */
  generateDynamicConfig(domains: (Domain & { project?: any })[]) {
    const config = {
      http: {
        routers: {} as Record<string, any>,
        services: {} as Record<string, any>
      }
    }

    for (const domain of domains) {
      if (domain.status === 'ACTIVE') {
        const routerName = `domain-${domain.id}`
        config.http.routers[routerName] = {
          rule: `Host(\`${domain.fullDomain}\`)`,
          entrypoints: ['websecure'],
          service: routerName,
          tls: {
            certResolver: 'letsencrypt'
          }
        }

        config.http.services[routerName] = {
          loadBalancer: {
            servers: [
              {
                url: `http://${domain.project?.host || 'localhost'}:${domain.project?.port || 3000}`
              }
            ]
          }
        }
      }
    }

    return config
  }
}

