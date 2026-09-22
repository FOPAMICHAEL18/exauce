import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Prisma, ReviewStatus, StockStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import Home from './page'
import ProductHighlight from '../components/public/ProductHighlight'
import CategoriesShowcase from '../components/public/CategoriesShowcase'
import Testimonials from '../components/public/Testimonials'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('../components/public/ProductHighlight', () => ({
  default: vi.fn(() => null),
}))
vi.mock('../components/public/CategoriesShowcase', () => ({
  default: vi.fn(() => null),
}))
vi.mock('../components/public/Testimonials', () => ({
  default: vi.fn(() => null),
}))

function makeCategory(overrides: Partial<{
  id: number
  name: string
  slug: string
}> = {}) {
  return { id: 1, name: 'Tapis', slug: 'tapis', ...overrides }
}

function makeProduct(overrides: Partial<{
  id: number
  title: string
  slug: string
  description: string
  price: Prisma.Decimal
  stockStatus: StockStatus
  categoryId: number
  views: number
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: 1,
    title: 'Tapis Berbère',
    slug: 'tapis-berbere',
    description: 'Un tapis',
    price: new Prisma.Decimal('99.99'),
    stockStatus: StockStatus.disponible,
    categoryId: 1,
    views: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    category: { ...makeCategory(), createdAt: new Date(), updatedAt: new Date() },
    image: [],
    ...overrides,
  }
}

function makeTestimonial(overrides: Partial<{
  id: number
  author: string
  rating: number
  comment: string
  createdAt: Date
}> = {}) {
  return {
    id: 1,
    author: 'Jean',
    rating: 5,
    comment: 'Top',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
}

function mockDefaults(overrides: {
  products?: ReturnType<typeof makeProduct>[]
  categories?: ReturnType<typeof makeCategory>[]
  testimonials?: ReturnType<typeof makeTestimonial>[]
} = {}) {
  prismaMock.product.findMany.mockReset()
  prismaMock.category.findMany.mockReset()
  prismaMock.review.findMany.mockReset()

  prismaMock.product.findMany.mockResolvedValueOnce(
    (overrides.products ?? []) as never,
  )
  prismaMock.category.findMany.mockResolvedValueOnce(
    (overrides.categories ?? []) as never,
  )
  prismaMock.review.findMany.mockResolvedValueOnce(
    (overrides.testimonials ?? []) as never,
  )
}

async function renderPage(): Promise<void> {
  const jsx = await Home()
  render(jsx)
}

describe('Page Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockDefaults()
  })

  it('fetch les 4 derniers produits disponibles triés par createdAt desc', async () => {
    await renderPage()

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 4,
      where: { stockStatus: 'disponible' },
      include: { category: true, image: true },
    })
  })

  it('fetch les 4 catégories triées par name asc, sans plus', async () => {
    await renderPage()

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
      take: 4,
    })
  })

  it('fetch les 3 derniers avis triés par createdAt desc', async () => {
    await renderPage()

    expect(prismaMock.review.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        author: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })
  })

  it('exécute les 3 requêtes Prisma', async () => {
    await renderPage()

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.category.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1)
  })

  it('convertit le prix Decimal en number', async () => {
    mockDefaults({
      products: [makeProduct({ price: new Prisma.Decimal('42.5') })],
    })

    await renderPage()

    const props = firstProps<{ products: { price: number }[] }>(
      vi.mocked(ProductHighlight),
    )
    expect(props.products[0]?.price).toBe(42.5)
    expect(typeof props.products[0]?.price).toBe('number')
  })

  it('propage les produits transformés à ProductHighlight', async () => {
    const product = makeProduct({ id: 1, title: 'Tapis' })
    mockDefaults({ products: [product] })

    await renderPage()

    const props = firstProps<{ products: (typeof product)[] }>(
      vi.mocked(ProductHighlight),
    )
    expect(props.products).toHaveLength(1)
    expect(props.products[0]?.id).toBe(1)
    expect(props.products[0]?.title).toBe('Tapis')
  })

  it('propage les catégories à CategoriesShowcase', async () => {
    const categories = [
      makeCategory({ id: 1, name: 'Tapis' }),
      makeCategory({ id: 2, name: 'Miroirs' }),
    ]
    mockDefaults({ categories })

    await renderPage()

    const props = firstProps<{ categories: typeof categories }>(
      vi.mocked(CategoriesShowcase),
    )
    expect(props.categories).toEqual(categories)
  })

  it('propage les avis à Testimonials', async () => {
    const testimonials = [
      makeTestimonial({ id: 1, author: 'Alice' }),
      makeTestimonial({ id: 2, author: 'Bob' }),
    ]
    mockDefaults({ testimonials })

    await renderPage()

    const props = firstProps<{ testimonials: typeof testimonials }>(
      vi.mocked(Testimonials),
    )
    expect(props.testimonials).toEqual(testimonials)
  })

  it('remonte l’erreur si Prisma plante', async () => {
    prismaMock.product.findMany.mockReset()
    prismaMock.product.findMany.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage()).rejects.toThrow('DB down')
  })
})