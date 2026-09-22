import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ReviewStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import { GET } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })

type ReviewItem = {
  id: number
  author: string
  rating: number
  comment: string
  status: ReviewStatus
  productId: number
  createdAt: string
  updatedAt: string
  product: { id: number; title: string; slug: string }
}

type SuccessResponse = {
  success: true
  data: ReviewItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type ErrorResponse = { success: false; message: string }
type ApiResponse = SuccessResponse | ErrorResponse

function createRequest(options: {
  url?: string
  adminHeader?: string | null
} = {}): NextRequest {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  if (options.adminHeader === null) {
    // pas de header
  } else if (options.adminHeader === undefined) {
    headers.set('x-admin-data', ADMIN_HEADER)
  } else {
    headers.set('x-admin-data', options.adminHeader)
  }

  return new NextRequest(
    options.url ?? 'http://localhost/api/admin/reviews',
    { method: 'GET', headers },
  )
}

async function callGET(options: {
  url?: string
  adminHeader?: string | null
} = {}): Promise<{ status: number; json: ApiResponse }> {
  const response = await GET(createRequest(options))
  return {
    status: response.status,
    json: (await response.json()) as ApiResponse,
  }
}

// Représente l'objet retourné par findMany avec le select de la route.
function makeReview(overrides: Partial<{
  id: number
  author: string
  rating: number
  comment: string
  status: ReviewStatus
  productId: number
  createdAt: Date
  updatedAt: Date
  productTitle: string
}> = {}) {
  const {
    productTitle = 'Tapis Berbère',
    createdAt = new Date('2024-01-01T00:00:00Z'),
    updatedAt = new Date('2024-01-01T00:00:00Z'),
    ...reviewOverrides
  } = overrides

  return {
    id: 1,
    author: 'Jean Dupont',
    rating: 5,
    comment: 'Excellent produit',
    status: ReviewStatus.published,
    productId: 1,
    createdAt,
    updatedAt,
    product: { id: 1, title: productTitle, slug: 'tapis-berbere' },
    ...reviewOverrides,
  }
}

const SELECT_REVIEW = {
  id: true,
  author: true,
  rating: true,
  comment: true,
  status: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: { id: true, title: true, slug: true },
  },
} as const

describe('GET /api/admin/reviews', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('renvoie la liste paginée par défaut', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([makeReview()] as never)
    prismaMock.review.count.mockResolvedValueOnce(1)

    const { status, json } = await callGET()

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    if (!json.success) throw new Error('devrait réussir')

    expect(json.data).toHaveLength(1)
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith({
      where: {},
      select: SELECT_REVIEW,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    })
    expect(prismaMock.review.count).toHaveBeenCalledWith({ where: {} })
  })

  it('filtre par productId', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([] as never)
    prismaMock.review.count.mockResolvedValueOnce(0)

    await callGET({ url: 'http://localhost/api/admin/reviews?productId=5' })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 5 } }),
    )
  })

  it('filtre par status', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([] as never)
    prismaMock.review.count.mockResolvedValueOnce(0)

    await callGET({
      url: `http://localhost/api/admin/reviews?status=${ReviewStatus.hidden}`,
    })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: ReviewStatus.hidden } }),
    )
  })

  it('combine filtres + pagination', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([] as never)
    prismaMock.review.count.mockResolvedValueOnce(0)

    await callGET({
      url: `http://localhost/api/admin/reviews?productId=1&status=${ReviewStatus.published}&page=2&limit=5`,
    })

    expect(prismaMock.review.findMany).toHaveBeenCalledWith({
      where: { productId: 1, status: ReviewStatus.published },
      select: SELECT_REVIEW,
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    })
  })

  it('calcule totalPages correctement', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([] as never)
    prismaMock.review.count.mockResolvedValueOnce(45)

    const { json } = await callGET({
      url: 'http://localhost/api/admin/reviews?limit=20',
    })

    expect(json.success).toBe(true)
    if (!json.success) throw new Error('devrait réussir')
    expect(json.pagination.totalPages).toBe(3) // 45 / 20 = 2.25 → 3
  })

  it('renvoie 200 avec un tableau vide et totalPages = 0', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([] as never)
    prismaMock.review.count.mockResolvedValueOnce(0)

    const { status, json } = await callGET()

    expect(status).toBe(200)
    if (!json.success) throw new Error('devrait réussir')
    expect(json.data).toEqual([])
    expect(json.pagination.totalPages).toBe(0)
  })

  it('accepte un limit à 50 (borne max)', async () => {
    prismaMock.review.findMany.mockResolvedValueOnce([] as never)
    prismaMock.review.count.mockResolvedValueOnce(0)

    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?limit=50',
    })

    expect(status).toBe(200)
    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    )
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callGET({ adminHeader: null })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.review.findMany).not.toHaveBeenCalled()
    expect(prismaMock.review.count).not.toHaveBeenCalled()
  })

  it('renvoie 400 si productId est invalide', async () => {
    const { status, json } = await callGET({
      url: 'http://localhost/api/admin/reviews?productId=abc',
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'productId invalide',
    })
  })

  it('renvoie 400 si productId = "12abc"', async () => {
    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?productId=12abc',
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si productId = 0', async () => {
    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?productId=0',
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si productId est négatif', async () => {
    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?productId=-1',
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si status est invalide', async () => {
    const { status, json } = await callGET({
      url: 'http://localhost/api/admin/reviews?status=peut-etre',
    })

    expect(status).toBe(400)
    expect(json).toEqual({ success: false, message: 'status invalide' })
  })

  it('renvoie 400 si page est invalide', async () => {
    const { status, json } = await callGET({
      url: 'http://localhost/api/admin/reviews?page=abc',
    })

    expect(status).toBe(400)
    expect(json).toEqual({ success: false, message: 'page invalide' })
  })

  it('renvoie 400 si page = 0', async () => {
    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?page=0',
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si limit est invalide', async () => {
    const { status, json } = await callGET({
      url: 'http://localhost/api/admin/reviews?limit=abc',
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'limit doit être un entier entre 1 et 50',
    })
  })

  it('renvoie 400 si limit dépasse 50', async () => {
    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?limit=51',
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si limit = 0', async () => {
    const { status } = await callGET({
      url: 'http://localhost/api/admin/reviews?limit=0',
    })

    expect(status).toBe(400)
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.review.findMany.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callGET()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API reviews GET:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.review.findMany.mockRejectedValueOnce('boom')

    const { status } = await callGET()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith('Erreur API reviews GET:', 'boom')
  })
})