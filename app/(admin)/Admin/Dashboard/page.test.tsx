import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Prisma, ReviewStatus, StockStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import Dashboard from './page'
import StatCard from '@/app/components/ui/Card/StatCard'
import { AdminRecentReview } from '@/app/components/admin/AdminRecentReview'
import { AdminTopProduct } from '@/app/components/admin/AdminTopProduct'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('@/app/components/ui/Card/StatCard', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/admin/AdminRecentReview', () => ({
  AdminRecentReview: vi.fn(() => null),
}))
vi.mock('@/app/components/admin/AdminTopProduct', () => ({
  AdminTopProduct: vi.fn(() => null),
}))

// Formes des retours Prisma (respectant le select réel).
type RecentReview = {
  id: number
  author: string
  email: string
  rating: number
  comment: string
  status: ReviewStatus
  productId: number
  createdAt: Date
  updatedAt: Date
  product: { title: string }
}

type TopProduct = {
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
  category: {
    id: number
    name: string
    slug: string
    createdAt: Date
    updatedAt: Date
  }
  _count: { review: number }
}

function makeRecentReview(overrides: Partial<RecentReview> = {}): RecentReview {
  return {
    id: 1,
    author: 'Jean Dupont',
    email: 'jean@test.com',
    rating: 5,
    comment: 'Excellent',
    status: ReviewStatus.published,
    productId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    product: { title: 'Tapis Berbère' },
    ...overrides,
  }
}

function makeTopProduct(overrides: Partial<TopProduct> = {}): TopProduct {
  return {
    id: 1,
    title: 'Tapis Berbère',
    slug: 'tapis-berbere',
    description: 'Un beau tapis',
    price: new Prisma.Decimal('99.99'),
    stockStatus: StockStatus.disponible,
    categoryId: 1,
    views: 42,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    category: {
      id: 1,
      name: 'Tapis',
      slug: 'tapis',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    _count: { review: 3 },
    ...overrides,
  }
}

// Helpers typés pour récupérer les props passées aux enfants mockés.
function getStatCardProps() {
  return vi.mocked(StatCard).mock.calls.map((c: unknown[]) => c[0] as { statName: string; statValue: number | string })
}

function getRecentReviewProps() {
  const call = vi.mocked(AdminRecentReview).mock.calls[0]
  if (!call) throw new Error('AdminRecentReview non rendu')
  return call[0]
}

function getTopProductProps() {
  const call = vi.mocked(AdminTopProduct).mock.calls[0]
  if (!call) throw new Error('AdminTopProduct non rendu')
  return call[0]
}

async function renderPage(): Promise<void> {
  const jsx = await Dashboard()
  render(jsx)
}

// Setup par défaut : tout vide. Chaque test surcharge selon ses besoins.
// On fait un reset complet des mocks Prisma utilisés par la page pour
// éviter que les valeurs d'un appel précédent (dans beforeEach) restent
// empilées dans la queue des mockResolvedValueOnce.
function mockDefaults(overrides: {
  totalProducts?: number
  totalReviews?: number
  pendingReviews?: number
  avgRating?: number | null
  recentReviews?: RecentReview[]
  topProducts?: TopProduct[]
} = {}) {
  prismaMock.product.count.mockReset()
  prismaMock.review.count.mockReset()
  prismaMock.review.aggregate.mockReset()
  prismaMock.review.findMany.mockReset()
  prismaMock.product.findMany.mockReset()

  prismaMock.product.count.mockResolvedValue(overrides.totalProducts ?? 0)
  prismaMock.review.count
    .mockResolvedValueOnce(overrides.totalReviews ?? 0) // 1er appel : total
    .mockResolvedValueOnce(overrides.pendingReviews ?? 0) // 2e appel : hidden
  prismaMock.review.aggregate.mockResolvedValueOnce({
    _avg: { rating: overrides.avgRating ?? null },
  } as never)
  prismaMock.review.findMany.mockResolvedValueOnce(
    (overrides.recentReviews ?? []) as never,
  )
  prismaMock.product.findMany.mockResolvedValueOnce(
    (overrides.topProducts ?? []) as never,
  )
}

describe('Page Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockDefaults()
  })

  it('compte les produits avec stockStatus = disponible', async () => {
    await renderPage()

    expect(prismaMock.product.count).toHaveBeenCalledWith({
      where: { stockStatus: 'disponible' },
    })
  })

  it('compte tous les avis puis les avis masqués', async () => {
    await renderPage()

    expect(prismaMock.review.count).toHaveBeenCalledTimes(2)
    expect(prismaMock.review.count).toHaveBeenNthCalledWith(1)
    expect(prismaMock.review.count).toHaveBeenNthCalledWith(2, {
      where: { status: 'hidden' },
    })
  })

  it('demande la moyenne de rating via aggregate', async () => {
    await renderPage()

    expect(prismaMock.review.aggregate).toHaveBeenCalledWith({
      _avg: { rating: true },
    })
  })

  it('récupère les 5 derniers avis triés par createdAt desc', async () => {
    await renderPage()

    expect(prismaMock.review.findMany).toHaveBeenCalledWith({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { title: true } } },
    })
  })

  it('récupère les 3 produits les plus vus, disponibles uniquement', async () => {
    await renderPage()

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      take: 3,
      orderBy: { views: 'desc' },
      include: {
        category: true,
        _count: { select: { review: true } },
      },
      where: { stockStatus: 'disponible' },
    })
  })

  it('rend 4 StatCard avec les bonnes valeurs', async () => {
    mockDefaults({
      totalProducts: 12,
      totalReviews: 34,
      pendingReviews: 5,
      avgRating: 4.5,
    })

    await renderPage()

    const props = getStatCardProps()
    expect(props).toHaveLength(4)
    expect(props[0]).toEqual({
      statName: 'PRODUITS PUBLIES',
      statValue: 12,
    })
    expect(props[1]).toEqual({ statName: 'TOTAL AVIS', statValue: 34 })
    expect(props[2]).toEqual({ statName: 'AVIS MASQUES', statValue: 5 })
    expect(props[3]).toEqual({
      statName: 'NOTE MOYENNE',
      statValue: '4.5 / 5',
    })
  })

  it('affiche 0.0 / 5 si aucun avis (moyenne null)', async () => {
    mockDefaults({ avgRating: null })

    await renderPage()

    const props = getStatCardProps()
    expect(props[3]).toEqual({
      statName: 'NOTE MOYENNE',
      statValue: '0.0 / 5',
    })
  })

  it('affiche 0.0 / 5 si la moyenne vaut exactement 0', async () => {
    mockDefaults({ avgRating: 0 })

    await renderPage()

    const props = getStatCardProps()
    expect(props[3]).toEqual({
      statName: 'NOTE MOYENNE',
      statValue: '0.0 / 5',
    })
  })

  it('arrondit la note moyenne à une décimale', async () => {
    mockDefaults({ avgRating: 4.256 })

    await renderPage()

    const props = getStatCardProps()
    expect(props[3]?.statValue).toBe('4.3 / 5')
  })

  it('propage recentReviews à AdminRecentReview', async () => {
    const recentReviews = [
      makeRecentReview({ id: 1 }),
      makeRecentReview({ id: 2 }),
    ]
    mockDefaults({ recentReviews })

    await renderPage()

    expect(getRecentReviewProps()).toEqual({ recentReviews })
  })

  it('propage topProducts à AdminTopProduct', async () => {
    const topProducts = [makeTopProduct({ id: 1 }), makeTopProduct({ id: 2 })]
    mockDefaults({ topProducts })

    await renderPage()

    expect(getTopProductProps()).toEqual({ topProducts })
  })

  it('rend AdminRecentReview et AdminTopProduct une seule fois', async () => {
    await renderPage()

    expect(AdminRecentReview).toHaveBeenCalledTimes(1)
    expect(AdminTopProduct).toHaveBeenCalledTimes(1)
  })

  it('exécute les 6 requêtes Prisma', async () => {
    await renderPage()

    expect(prismaMock.product.count).toHaveBeenCalledTimes(1)
    expect(prismaMock.review.count).toHaveBeenCalledTimes(2)
    expect(prismaMock.review.aggregate).toHaveBeenCalledTimes(1)
    expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
  })

  it('remonte l’erreur si une requête Prisma plante', async () => {
    prismaMock.product.count.mockReset()
    prismaMock.product.count.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage()).rejects.toThrow('DB down')
  })
})