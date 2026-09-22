import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ReviewStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import { PUT, DELETE } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })
const REVIEW_ID = 1

type ErrorResponse = { success: false; message: string }
type AnyResponse = Record<string, unknown> | ErrorResponse

function makeRequest(options: {
  adminHeader?: string | null
  method?: 'PUT' | 'DELETE'
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

  return new NextRequest(`http://localhost/api/admin/reviews/${REVIEW_ID}`, {
    method: options.method ?? 'PUT',
    headers,
  })
}

async function callPUT(options: {
  adminHeader?: string | null
  id?: string
} = {}): Promise<{ status: number; json: AnyResponse }> {
  const id = options.id ?? String(REVIEW_ID)
  const response = await PUT(makeRequest({ ...options, method: 'PUT' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as AnyResponse }
}

async function callDELETE(options: {
  adminHeader?: string | null
  id?: string
} = {}): Promise<{ status: number; json: AnyResponse }> {
  const id = options.id ?? String(REVIEW_ID)
  const response = await DELETE(makeRequest({ ...options, method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as AnyResponse }
}

function makeReview(overrides: Partial<{
  id: number
  author: string
  rating: number
  comment: string
  status: ReviewStatus
  productId: number
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: REVIEW_ID,
    author: 'Jean Dupont',
    rating: 5,
    comment: 'Excellent produit',
    status: ReviewStatus.published,
    productId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('PUT /api/admin/reviews/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('bascule published → hidden', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      status: ReviewStatus.published,
    } as never)
    prismaMock.review.update.mockResolvedValueOnce(
      makeReview({ status: ReviewStatus.hidden }) as never,
    )

    const { status, json } = await callPUT()

    expect(status).toBe(200)
    expect(json).toMatchObject({ success: true })
    expect(prismaMock.review.update).toHaveBeenCalledWith({
      where: { id: REVIEW_ID },
      data: { status: ReviewStatus.hidden },
      select: expect.objectContaining({ id: true, status: true }),
    })
  })

  it('bascule hidden → published', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      status: ReviewStatus.hidden,
    } as never)
    prismaMock.review.update.mockResolvedValueOnce(
      makeReview({ status: ReviewStatus.published }) as never,
    )

    const { status } = await callPUT()

    expect(status).toBe(200)
    expect(prismaMock.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: ReviewStatus.published },
      }),
    )
  })

  it('ne renvoie pas email du reviewer', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      status: ReviewStatus.published,
    } as never)
    prismaMock.review.update.mockResolvedValueOnce(makeReview() as never)

    const { json } = await callPUT()

    expect(JSON.stringify(json)).not.toContain('email')
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callPUT({ adminHeader: null })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id est invalide', async () => {
    for (const badId of ['abc', '-1', '0', '1.5', '12abc']) {
      const { status } = await callPUT({ id: badId })
      expect(status).toBe(400)
    }
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 404 si l’avis n’existe pas', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPUT()

    expect(status).toBe(404)
    expect(json).toEqual({ success: false, message: 'Avis non trouvé' })
    expect(prismaMock.review.update).not.toHaveBeenCalled()
  })

  it('renvoie 500 si Prisma plante sur findUnique', async () => {
    prismaMock.review.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPUT()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API modification statut avis:',
      'DB down',
    )
  })

  it('renvoie 500 si Prisma plante sur update', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      status: ReviewStatus.published,
    } as never)
    prismaMock.review.update.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPUT()

    expect(status).toBe(500)
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.review.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callPUT()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API modification statut avis:',
      'boom',
    )
  })
})

describe('DELETE /api/admin/reviews/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('supprime un avis', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      author: 'Jean Dupont',
    } as never)
    prismaMock.review.delete.mockResolvedValueOnce(makeReview() as never)

    const { status, json } = await callDELETE()

    expect(status).toBe(200)
    expect(json).toEqual({
      success: true,
      message: 'Avis de Jean Dupont supprimé avec succès',
    })
    expect(prismaMock.review.delete).toHaveBeenCalledWith({
      where: { id: REVIEW_ID },
    })
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status } = await callDELETE({ adminHeader: null })

    expect(status).toBe(401)
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id est invalide', async () => {
    for (const badId of ['abc', '-1', '0', '1.5']) {
      const { status } = await callDELETE({ id: badId })
      expect(status).toBe(400)
    }
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 404 si l’avis n’existe pas', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callDELETE()

    expect(status).toBe(404)
    expect(json).toEqual({ success: false, message: 'Avis non trouvé' })
    expect(prismaMock.review.delete).not.toHaveBeenCalled()
  })

  it('renvoie 404 si l’avis disparaît entre findUnique et delete (P2025)', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      author: 'Jean Dupont',
    } as never)

    // Simule l’erreur Prisma P2025 : record not found au moment du delete.
    const notFoundError = Object.assign(new Error('Record not found'), {
      code: 'P2025',
    })
    prismaMock.review.delete.mockRejectedValueOnce(notFoundError)

    const { status, json } = await callDELETE()

    expect(status).toBe(404)
    expect(json).toEqual({ success: false, message: 'Avis non trouvé' })
  })

  it('renvoie 500 si le delete échoue pour une autre raison', async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      id: REVIEW_ID,
      author: 'Jean Dupont',
    } as never)
    prismaMock.review.delete.mockRejectedValueOnce(new Error('FK violation'))

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API suppression avis:',
      'FK violation',
    )
  })

  it('renvoie 500 si Prisma plante sur findUnique', async () => {
    prismaMock.review.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API suppression avis:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.review.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API suppression avis:',
      'boom',
    )
  })
})