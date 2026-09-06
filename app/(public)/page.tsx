import { prisma } from "@/app/lib/prisma"
import HeroSection from "../components/public/HeroSection"
import ProductHighlight from "../components/public/ProductHighlight"
import CategoriesShowcase from "../components/public/CategoriesShowcase"
import TrustSection from "../components/public/TrustSection"
import HowItWorks from "../components/public/HowItWorks"
import Testimonials from "../components/public/Testimonials"


export default async function Home() {
  const [products, categories, testimonials] = await Promise.all([
    prisma.product.findMany({
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
    prisma.category.findMany({
      orderBy: {
        name: 'asc' , // Trie par ordre alphabetique
      },
      select: { id: true, name: true, slug: true },
      take: 4
    }),
    prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
      id: true,
      author: true,
      rating: true,
      comment: true,
      createdAt: true,
      }
    })
  ])

  const featureProducts = products.map((product) => (
    {
      ...product,
      price: Number(product.price),
    }
  ))

  return (
    <main>
      <HeroSection />
      <ProductHighlight products={featureProducts} />
      <CategoriesShowcase categories={categories} />
      <TrustSection />
      <HowItWorks />
      <Testimonials testimonials={testimonials} />
    </main>
  );
}
