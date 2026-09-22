import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ReviewStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import Reviews from './page'
import StatCard from '@/app/components/ui/Card/StatCard'
import AdminReviewTable from '@/app/components/admin/AdminReviewTable'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('@/app/components/ui/Card/StatCard', () => ({
  default: vi.fn(() => null),
}))

vi.mock('@/app/components/admin/AdminReviewTable', () => ({
  default: vi.fn(() => null),
}))

const REVIEWS_PER_PAGE = 8

type ReviewItem = {
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

function makeReview(overrides: Partial<ReviewItem> = {}): ReviewItem {
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

function makeProps(params: { page?: string } = {}): {
  searchParams: Promise<{ page?: string }>
} {
  return { searchParams: Promise.resolve(params) }
}

async function renderPage(params: { page?: string } = {}): Promise<void> {
  const jsx = await Reviews(makeProps(params))
  render(jsx)
}

function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
}

function getStatCardProps() {
  return vi.mocked(StatCard).mock.calls.map((c) => c[0])
}

function mockDefaults(overrides: {
  totalReviews?: number
  pendingReviews?: number
  avgRating?: number | null
  reviews?: ReviewItem[]
} = {}) {
  prismaMock.review.count.mockReset()
  prismaMock.review.aggregate.mockReset()
  prismaMock.review.findMany.mockReset()

  prismaMock.review.count
    .mockResolvedValueOnce(overrides.totalReviews ?? 0)
    .mockResolvedValueOnce(overrides.pendingReviews ?? 0)

  prismaMock.review.aggregate.mockResolvedValueOnce({
    _avg: { rating: overrides.avgRating ?? null },
  } as never)

  prismaMock.review.findMany.mockResolvedValueOnce(
    (overrides.reviews ?? []) as never,
  )
}

describe('Page Admin/Reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockDefaults()
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

  it('fetch les avis triés par createdAt desc avec le bon take/skip', async () => {
    await renderPage()

    expect(prismaMock.review.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { title: true } } },
      skip: 0,
      take: REVIEWS_PER_PAGE,
    })
  })

  it('calcule skip correctement pour page=2', async () => {
    await renderPage({ page: '2' })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: REVIEWS_PER_PAGE }),
    )
  })

  it('calcule skip correctement pour page=3', async () => {
    await renderPage({ page: '3' })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: REVIEWS_PER_PAGE * 2 }),
    )
  })

  it('retombe sur page=1 pour page=abc', async () => {
    await renderPage({ page: 'abc' })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    )
    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminReviewTable))
    expect(props.currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=-5', async () => {
    await renderPage({ page: '-5' })

    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminReviewTable))
    expect(props.currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=0', async () => {
    await renderPage({ page: '0' })

    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminReviewTable))
    expect(props.currentPage).toBe(1)
  })

  it('parse page=1.5 comme page=1 (parseInt)', async () => {
    await renderPage({ page: '1.5' })

    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminReviewTable))
    expect(props.currentPage).toBe(1)
  })

  it('propage currentPage à AdminReviewTable', async () => {
    await renderPage({ page: '4' })

    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminReviewTable))
    expect(props.currentPage).toBe(4)
  })

  it('calcule totalPages=0 quand aucun avis', async () => {
    mockDefaults({ totalReviews: 0 })

    await renderPage()

    const props = firstProps<{ totalPages: number }>(vi.mocked(AdminReviewTable))
    expect(props.totalPages).toBe(0)
  })

  it('calcule totalPages=1 pour 8 avis', async () => {
    mockDefaults({ totalReviews: 8 })

    await renderPage()

    const props = firstProps<{ totalPages: number }>(vi.mocked(AdminReviewTable))
    expect(props.totalPages).toBe(1)
  })

  it('calcule totalPages=2 pour 9 avis', async () => {
    mockDefaults({ totalReviews: 9 })

    await renderPage()

    const props = firstProps<{ totalPages: number }>(vi.mocked(AdminReviewTable))
    expect(props.totalPages).toBe(2)
  })

  it('propage les reviews à AdminReviewTable', async () => {
    const reviews = [makeReview({ id: 1 }), makeReview({ id: 2 })]
    mockDefaults({ reviews })

    await renderPage()

    const props = firstProps<{ reviews: ReviewItem[] }>(vi.mocked(AdminReviewTable))
    expect(props.reviews).toEqual(reviews)
  })

  it('rend 3 StatCard avec les bonnes valeurs', async () => {
    mockDefaults({
      totalReviews: 34,
      pendingReviews: 5,
      avgRating: 4.5,
    })

    await renderPage()

    const props = getStatCardProps()
    expect(props).toHaveLength(3)
    expect(props[0]).toEqual({
      statName: 'TOTAL COMMENTAIRES',
      statValue: 34,
    })
    expect(props[1]).toEqual({
      statName: 'EN ATTENTE DE MODERATION',
      statValue: 5,
    })
    expect(props[2]).toEqual({
      statName: 'NOTE MOYENNE',
      statValue: '4.5 / 5',
    })
  })

  it('affiche 0.0 / 5 si aucun avis (moyenne null)', async () => {
    mockDefaults({ avgRating: null })

    await renderPage()

    const props = getStatCardProps()
    expect(props[2]).toEqual({
      statName: 'NOTE MOYENNE',
      statValue: '0.0 / 5',
    })
  })

  it('affiche 0.0 / 5 si la moyenne vaut exactement 0', async () => {
    mockDefaults({ avgRating: 0 })

    await renderPage()

    const props = getStatCardProps()
    expect(props[2]).toEqual({
      statName: 'NOTE MOYENNE',
      statValue: '0.0 / 5',
    })
  })

  it('arrondit la note moyenne à une décimale', async () => {
    mockDefaults({ avgRating: 4.256 })

    await renderPage()

    const props = getStatCardProps()
    expect(props[2]?.statValue).toBe('4.3 / 5')
  })

  it('exécute les 4 requêtes Prisma', async () => {
    await renderPage()

    expect(prismaMock.review.count).toHaveBeenCalledTimes(2)
    expect(prismaMock.review.aggregate).toHaveBeenCalledTimes(1)
    expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1)
  })

  it('remonte l’erreur si une requête Prisma plante', async () => {
    prismaMock.review.count.mockReset()
    prismaMock.review.count.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage()).rejects.toThrow('DB down')
  })
})