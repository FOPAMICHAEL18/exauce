import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma, StockStatus } from '@prisma/client'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/app/test/mocks/prisma'
import { PUT, DELETE, GET } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })
const PRODUCT_ID = 1
const VALID_TITLE = 'Tapis Berbère'
const VALID_SLUG = 'tapis-berbere'
const VALID_DESCRIPTION = 'Un très beau tapis fait main.'
const VALID_PRICE = 99.99
const VALID_CATEGORY_ID = 1
const VALID_STOCK = StockStatus.disponible

type ErrorResponse = { success: false; message: string }
type AnyResponse = Record<string, unknown> | ErrorResponse

function makeRequest(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
  method?: 'PUT' | 'DELETE' | 'GET'
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

  const body =
    options.rawBody !== undefined
      ? options.rawBody
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined

  return new NextRequest(`http://localhost/api/admin/products/${PRODUCT_ID}`, {
    method: options.method ?? 'PUT',
    headers,
    body,
  })
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
    id: PRODUCT_ID,
    title: VALID_TITLE,
    slug: VALID_SLUG,
    description: VALID_DESCRIPTION,
    price: new Prisma.Decimal(VALID_PRICE),
    stockStatus: VALID_STOCK,
    categoryId: VALID_CATEGORY_ID,
    views: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

async function callPUT(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
  id?: string
} = {}): Promise<{ status: number; json: AnyResponse }> {
  const id = options.id ?? String(PRODUCT_ID)
  const response = await PUT(makeRequest({ ...options, method: 'PUT' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as AnyResponse }
}

async function callDELETE(options: {
  adminHeader?: string | null
  id?: string
} = {}): Promise<{ status: number; json: AnyResponse }> {
  const id = options.id ?? String(PRODUCT_ID)
  const response = await DELETE(makeRequest({ ...options, method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as AnyResponse }
}

async function callGET(options: {
  adminHeader?: string | null
  id?: string
} = {}): Promise<{ status: number; json: AnyResponse }> {
  const id = options.id ?? String(PRODUCT_ID)
  const response = await GET(makeRequest({ ...options, method: 'GET' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as AnyResponse }
}

describe('PUT /api/admin/products/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('met à jour tous les champs', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: 2 } as never)
    prismaMock.product.update.mockResolvedValueOnce(
      makeProduct({ title: 'Nouveau', slug: 'nouveau' }) as never,
    )

    const { status, json } = await callPUT({
      body: {
        title: 'Nouveau',
        description: 'Nouvelle description.',
        price: 50,
        categoryId: 2,
        stockStatus: StockStatus.rupture,
      },
    })

    expect(status).toBe(200)
    expect(json).toMatchObject({ success: true })
    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PRODUCT_ID },
        data: expect.objectContaining({
          title: 'Nouveau',
          slug: 'nouveau',
          description: 'Nouvelle description.',
          price: 50,
          categoryId: 2,
          stockStatus: StockStatus.rupture,
        }),
      }),
    )
  })

  it('met à jour uniquement le titre (mise à jour partielle)', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.update.mockResolvedValueOnce(makeProduct() as never)

    await callPUT({ body: { title: 'Juste le titre' } })

    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Juste le titre',
          description: VALID_DESCRIPTION,
          price: VALID_PRICE,
          categoryId: VALID_CATEGORY_ID,
          stockStatus: VALID_STOCK,
        }),
      }),
    )
  })

  it('conserve le slug si le titre ne change pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.update.mockResolvedValueOnce(makeProduct() as never)

    await callPUT({ body: { title: VALID_TITLE } })

    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: VALID_SLUG }),
      }),
    )
  })

  it('régénère le slug si le titre change', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.update.mockResolvedValueOnce(makeProduct() as never)

    await callPUT({ body: { title: 'Nouveau titre' } })

    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'nouveau-titre' }),
      }),
    )
  })

  it('arrondit le prix à 2 décimales', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.update.mockResolvedValueOnce(makeProduct() as never)

    await callPUT({ body: { price: 9.999 } })

    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 10 }),
      }),
    )
  })

  it('ne re-check pas la catégorie si elle ne change pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.update.mockResolvedValueOnce(makeProduct() as never)

    await callPUT({ body: { title: 'Autre titre' } })

    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
  })

  it('re-check la catégorie si elle change', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: 2 } as never)
    prismaMock.product.update.mockResolvedValueOnce(makeProduct() as never)

    await callPUT({ body: { categoryId: 2 } })

    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      select: { id: true },
    })
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callPUT({
      adminHeader: null,
      body: { title: 'X' },
    })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id n’est pas un entier positif', async () => {
    for (const badId of ['abc', '-1', '0', '1.5']) {
      const { status } = await callPUT({ id: badId, body: { title: 'X' } })
      expect(status).toBe(400)
    }
  })

  it('renvoie 404 si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPUT({ body: { title: 'X' } })

    expect(status).toBe(404)
    expect(json).toEqual({ success: false, message: 'Produit non trouvé' })
  })

  it('renvoie 400 si le corps est un tableau', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status } = await callPUT({ body: [1, 2, 3] })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le titre est trop court', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callPUT({ body: { title: 'A' } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le titre doit faire entre 2 et 200 caractères',
    })
  })

  it('renvoie 400 si le titre dépasse 200 caractères', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status } = await callPUT({ body: { title: 'a'.repeat(201) } })

    expect(status).toBe(400)
  })

  it('renvoie 400 si la description est trop courte', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status } = await callPUT({ body: { description: 'ok' } })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le prix est négatif', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callPUT({ body: { price: -1 } })

    expect(status).toBe(400)
    expect(json).toEqual({ success: false, message: 'Prix invalide' })
  })

  it('renvoie 400 si le prix est un booléen', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status } = await callPUT({ body: { price: true } })

    expect(status).toBe(400)
  })

  it('renvoie 400 si categoryId vaut 0', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callPUT({ body: { categoryId: 0 } })

    expect(status).toBe(400)
    expect(json).toEqual({ success: false, message: 'Catégorie invalide' })
  })

  it('renvoie 400 si stockStatus est fourni mais invalide', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callPUT({
      body: { stockStatus: 'peut-etre' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Statut de stock invalide',
    })
  })

  it('renvoie 404 si la nouvelle catégorie n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.category.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPUT({ body: { categoryId: 999 } })

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Catégorie non trouvée',
    })
  })

  it('renvoie 400 si le nouveau titre génère un slug vide', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status } = await callPUT({ body: { title: '###' } })

    expect(status).toBe(400)
  })

  it('renvoie 409 en cas de conflit unique sur le slug', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.update.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`slug`)'),
    )

    const { status, json } = await callPUT({ body: { title: 'Autre' } })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Un produit avec ce slug existe déjà.',
    })
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPUT({ body: { title: 'X' } })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API modification produit:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callPUT({ body: { title: 'X' } })

    expect(status).toBe(500)
  })

  it('renvoie 400 si le corps n’est pas du JSON', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callPUT({ rawBody: '{pas du json' })

    expect(status).toBe(400)
    expect(json).toEqual({
        success: false,
        message: 'Corps de requête invalide',
    })
    expect(prismaMock.product.update).not.toHaveBeenCalled()
    })
})

describe('DELETE /api/admin/products/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('supprime un produit', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct() as never)
    prismaMock.product.delete.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callDELETE()

    expect(status).toBe(200)
    expect(json).toEqual({
      success: true,
      message: `Produit "${VALID_TITLE}" supprimé avec succès`,
    })
    expect(prismaMock.product.delete).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
    })
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status } = await callDELETE({ adminHeader: null })

    expect(status).toBe(401)
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id est invalide', async () => {
    for (const badId of ['abc', '-1', '0']) {
      const { status } = await callDELETE({ id: badId })
      expect(status).toBe(400)
    }
  })

  it('renvoie 404 si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callDELETE()

    expect(status).toBe(404)
    expect(json).toEqual({ success: false, message: 'Produit non trouvé' })
    expect(prismaMock.product.delete).not.toHaveBeenCalled()
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API suppression produit:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
        'Erreur API suppression produit:',
        'boom',
    )
    })
})

describe('GET /api/admin/products/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('renvoie le produit avec sa catégorie', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({
      ...makeProduct(),
      category: { id: VALID_CATEGORY_ID, name: 'Tapis' },
    } as never)

    const { status, json } = await callGET()

    expect(status).toBe(200)
    expect(json).toMatchObject({ success: true })

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
      include: {
        category: { select: { id: true, name: true } },
      },
    })
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status } = await callGET({ adminHeader: null })

    expect(status).toBe(401)
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id est invalide', async () => {
    for (const badId of ['abc', '-1', '0', '1.5']) {
      const { status } = await callGET({ id: badId })
      expect(status).toBe(400)
    }
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 404 si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callGET()

    expect(status).toBe(404)
    expect(json).toEqual({ success: false, message: 'Produit non trouvé' })
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callGET()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur GET produit:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callGET()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
        'Erreur GET produit:',
        'boom',
    )
    })
})