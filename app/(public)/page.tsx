import { prisma } from "@/app/lib/prisma"
import HeroSection from "../components/public/HeroSection"

export default async function Home() {
  const [products] = await Promise.all([
    await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      where: {
        stockStatus: "disponible",
      },
      include: {
        category: true
      }
    }),
  ])

  return (
    <main>
      <HeroSection />
    </main>
  );
}
