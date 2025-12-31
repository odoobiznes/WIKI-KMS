import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@it-enterprise.cz' },
    update: {},
    create: {
      email: 'admin@it-enterprise.cz',
      name: 'Admin User',
      password: '$2a$10$rKZ8vJ8vJ8vJ8vJ8vJ8vJ.8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ', // changeme
      role: Role.SUPER_ADMIN
    }
  })

  console.log('✅ Created admin user:', admin.email)

  // Create companies
  const companies = [
    {
      name: 'IT Enterprise',
      domain: 'it-enterprise.cz',
      website: 'https://it-enterprise.cz',
      description: 'Hlavní společnost IT Enterprise'
    },
    {
      name: 'Biznesmen',
      domain: 'biznesmen.cz',
      website: 'https://biznesmen.cz',
      description: 'Podpora podnikání, koučing, poradenství'
    },
    {
      name: 'Gazda Service',
      domain: 'gazdaservice.cz',
      website: 'https://gazdaservice.cz',
      description: 'Účetní a administrativní služby'
    },
    {
      name: 'Zman Kesef',
      domain: 'zmankesef.cz',
      website: 'https://zmankesef.cz',
      description: 'Finanční služby'
    },
    {
      name: 'Avoda',
      domain: 'avoda.cz',
      website: 'https://avoda.cz',
      description: 'Agentura práce'
    },
    {
      name: 'Bus Ticket',
      domain: 'bus-ticket.info',
      website: 'https://bus-ticket.info',
      description: 'Podpora mezinárodní dopravy'
    }
  ]

  for (const company of companies) {
    const created = await prisma.company.upsert({
      where: { domain: company.domain },
      update: {},
      create: company
    })
    console.log(`✅ Created company: ${created.name}`)
  }

  // Create sample products
  const products = [
    {
      name: 'Windsurf Platform',
      slug: 'windsurf-platform',
      description: 'AI-powered web builder platform',
      price: 99.99,
      category: 'Platform'
    },
    {
      name: 'Lovable Web Builder',
      slug: 'lovable-web-builder',
      description: 'Advanced AI web creation tool',
      price: 149.99,
      category: 'Platform'
    },
    {
      name: 'OneSpace Business Planner',
      slug: 'onespace-business-planner',
      description: 'AI business planning and project management',
      price: 79.99,
      category: 'Business'
    },
    {
      name: 'Cursor Development Suite',
      slug: 'cursor-development-suite',
      description: 'AI-powered development environment',
      price: 199.99,
      category: 'Development'
    }
  ]

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product
    })
    console.log(`✅ Created product: ${created.name}`)
  }

  // Create sample tags
  const tags = [
    { name: 'AI', slug: 'ai' },
    { name: 'Web Development', slug: 'web-development' },
    { name: 'Business', slug: 'business' },
    { name: 'Finance', slug: 'finance' },
    { name: 'Marketing', slug: 'marketing' }
  ]

  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag
    })
    console.log(`✅ Created tag: ${created.name}`)
  }

  // Create sample categories
  const categories = [
    { name: 'News', slug: 'news' },
    { name: 'Services', slug: 'services' },
    { name: 'Products', slug: 'products' },
    { name: 'Partners', slug: 'partners' }
  ]

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    })
    console.log(`✅ Created category: ${created.name}`)
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

