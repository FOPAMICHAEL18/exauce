import dotenv from 'dotenv'
dotenv.config({ path: '.dev.vars' })
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function rebuildViews() {
  const products = await prisma.product.findMany({ select: { id: true } })
  console.log(`${products.length} produits à reconstruire`)

  for (const p of products) {
    const count = await prisma.view.count({ where: { productId: p.id } })
    await prisma.product.update({
      where: { id: p.id },
      data: { views: count },
    })
  }

  console.log('Reconstruction terminée')
}

rebuildViews()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())