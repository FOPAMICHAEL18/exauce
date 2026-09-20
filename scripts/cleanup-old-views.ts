import dotenv from 'dotenv'
dotenv.config({ path: '.dev.vars' })
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function cleanup() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const result = await prisma.view.deleteMany({
    where: { createdAt: { lt: sixMonthsAgo } },
  })

  console.log(`${result.count} vues supprimées`)
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect())