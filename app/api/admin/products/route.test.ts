import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma, StockStatus } from '@prisma/client'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/app/test/mocks/prisma'
import { POST } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })

const VALID_TITLE = 'Tapis Berbère'
const VALID_SLUG = 'tapis-berbere'
const VALID_DESCRIPTION = 'Un très beau tapis fait main.'
const VALID_PRICE = 99.99
const VALID_CATEGORY_ID = 1
const VALID_STOCK = StockStatus.disponible

type SuccessResponse = {
  success: true
  message: string
  data: {
    id: number
    title: string
    slug: string
    description: string
    price: string // Decimal sérialisé en string par JSON
    stockStatus: string
    categoryId: number
    views: number
    createdAt: string
  }
}

type ErrorResponse = { success: false; message: string }
type ProductResponse = SuccessResponse | ErrorResponse

function createRequest(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
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

  return new NextRequest('http://localhost/api/admin/products', {
    method: 'POST',
    headers,
    body,
  })
}

async function callPOST(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
} = {}): Promise<{ status: number; json: ProductResponse }> {
  const response = await POST(createRequest(options))
  return {
    status: response.status,
    json: (await response.json()) as ProductResponse,
  }
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
}> = {}) {
  return {
    id: 1,
    title: VALID_TITLE,
    slug: VALID_SLUG,
    description: VALID_DESCRIPTION,
    price: new Prisma.Decimal(VALID_PRICE),
    stockStatus: VALID_STOCK,
    categoryId: VALID_CATEGORY_ID,
    views: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

const SELECT_PRODUCT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  stockStatus: true,
  categoryId: true,
  views: true,
  createdAt: true,
} as const

const VALID_BODY = {
  title: VALID_TITLE,
  description: VALID_DESCRIPTION,
  price: VALID_PRICE,
  categoryId: VALID_CATEGORY_ID,
  stockStatus: VALID_STOCK,
}

describe('POST /api/admin/products', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('crée un produit valide', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockResolvedValueOnce(makeProduct() as never)

    const { status, json } = await callPOST({ body: VALID_BODY })

    expect(status).toBe(201)
    expect(json.success).toBe(true)
    if (!json.success) throw new Error('devrait réussir')

    expect(json.data.title).toBe(VALID_TITLE)
    expect(json.data.slug).toBe(VALID_SLUG)
    expect(json.data.categoryId).toBe(VALID_CATEGORY_ID)

    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
      where: { id: VALID_CATEGORY_ID },
      select: { id: true },
    })
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { slug: VALID_SLUG },
      select: { id: true },
    })
    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: {
        title: VALID_TITLE,
        slug: VALID_SLUG,
        description: VALID_DESCRIPTION,
        price: VALID_PRICE,
        stockStatus: VALID_STOCK,
        categoryId: VALID_CATEGORY_ID,
      },
      select: SELECT_PRODUCT,
    })
  })

  it('trim le titre et la description', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockResolvedValueOnce(makeProduct() as never)

    await callPOST({
      body: { ...VALID_BODY, title: '  Tapis  ', description: '  Description  ' },
    })

    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Tapis',
          slug: 'tapis',
          description: 'Description',
        }),
      }),
    )
  })

  it('arrondit le prix à 2 décimales', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockResolvedValueOnce(makeProduct() as never)

    await callPOST({ body: { ...VALID_BODY, price: 9.999 } })

    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 10 }),
      }),
    )
  })

  it('accepte un prix en chaîne numérique', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockResolvedValueOnce(makeProduct() as never)

    await callPOST({ body: { ...VALID_BODY, price: '42.5' } })

    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 42.5 }),
      }),
    )
  })

  it('accepte un categoryId en chaîne numérique', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: 5 } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockResolvedValueOnce(makeProduct() as never)

    await callPOST({ body: { ...VALID_BODY, categoryId: '5' } })

    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true },
    })
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callPOST({
      adminHeader: null,
      body: VALID_BODY,
    })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le corps est un tableau', async () => {
    const { status } = await callPOST({ body: [1, 2, 3] })

    expect(status).toBe(400)
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le corps n’est pas du JSON', async () => {
    const { status, json } = await callPOST({ rawBody: '{pas du json' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('renvoie 400 si le titre est trop court', async () => {
    const { status, json } = await callPOST({ body: { ...VALID_BODY, title: 'A' } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le titre doit faire entre 2 et 200 caractères',
    })
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le titre dépasse 200 caractères', async () => {
    const { status, json } = await callPOST({
      body: { ...VALID_BODY, title: 'a'.repeat(201) },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le titre doit faire entre 2 et 200 caractères',
    })
  })

  it('renvoie 400 si la description est trop courte', async () => {
    const { status } = await callPOST({
      body: { ...VALID_BODY, description: 'ok' },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si la description dépasse 5000 caractères', async () => {
    const { status } = await callPOST({
      body: { ...VALID_BODY, description: 'a'.repeat(5001) },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le prix est négatif', async () => {
    const { status, json } = await callPOST({ body: { ...VALID_BODY, price: -1 } })

    expect(status).toBe(400)
    expect(json).toEqual({ success: false, message: 'Prix invalide' })
  })

  it('renvoie 400 si le prix dépasse la limite Decimal(10,2)', async () => {
    const { status } = await callPOST({
      body: { ...VALID_BODY, price: 100_000_000 },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le prix est un booléen (piège Number(true))', async () => {
    const { status } = await callPOST({ body: { ...VALID_BODY, price: true } })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le prix est absent', async () => {
    const body = { ...VALID_BODY } as Record<string, unknown>
    delete body.price

    const { status } = await callPOST({ body })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le prix est une chaîne non numérique', async () => {
    const { status } = await callPOST({
      body: { ...VALID_BODY, price: 'abc' },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si categoryId vaut 0', async () => {
    const { status, json } = await callPOST({
      body: { ...VALID_BODY, categoryId: 0 },
    })

    expect(status).toBe(400)
    expect(json).toEqual({ success: false, message: 'Catégorie invalide' })
  })

  it('renvoie 400 si categoryId n’est pas entier', async () => {
    const { status } = await callPOST({
      body: { ...VALID_BODY, categoryId: 1.5 },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si stockStatus est inconnu', async () => {
    const { status, json } = await callPOST({
      body: { ...VALID_BODY, stockStatus: 'peut-etre' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Statut de stock invalide',
    })
  })

  it('renvoie 400 si stockStatus est absent', async () => {
    const { status } = await callPOST({
      body: { ...VALID_BODY, stockStatus: undefined },
    })

    expect(status).toBe(400)
  })

  it('accepte StockStatus.rupture', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockResolvedValueOnce(
      makeProduct({ stockStatus: StockStatus.rupture }) as never,
    )

    const { status } = await callPOST({
      body: { ...VALID_BODY, stockStatus: StockStatus.rupture },
    })

    expect(status).toBe(201)
  })

  it('renvoie 404 si la catégorie n’existe pas', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPOST({ body: VALID_BODY })

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Catégorie non trouvée',
    })
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le slug généré est vide', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)

    const { status, json } = await callPOST({
      body: { ...VALID_BODY, title: '###' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message:
        'Le titre contient trop de caractères spéciaux pour générer un slug',
    })
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 409 si le slug existe déjà', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 99 } as never)

    const { status, json } = await callPOST({ body: VALID_BODY })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Un produit avec ce nom existe déjà.',
    })
    expect(prismaMock.product.create).not.toHaveBeenCalled()
  })

  it('renvoie 409 en race condition (Unique constraint failed)', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: VALID_CATEGORY_ID } as never)
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    prismaMock.product.create.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`slug`)'),
    )

    const { status, json } = await callPOST({ body: VALID_BODY })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Un produit avec ce nom existe déjà.',
    })
    expect(console.error).not.toHaveBeenCalled()
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.category.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status, json } = await callPOST({ body: VALID_BODY })

    expect(status).toBe(500)
    expect(json).toEqual({
      success: false,
      message: 'Erreur interne du serveur',
    })
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API admin/products POST:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.category.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callPOST({ body: VALID_BODY })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API admin/products POST:',
      'boom',
    )
  })

  it('renvoie 400 si le titre n’est pas une chaîne', async () => {
    const { status, json } = await callPOST({
        body: { ...VALID_BODY, title: 42 },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
        success: false,
        message: 'Le titre doit faire entre 2 et 200 caractères',
    })
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
    })

    it('renvoie 400 si la description n’est pas une chaîne', async () => {
    const { status, json } = await callPOST({
        body: { ...VALID_BODY, description: true },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
        success: false,
        message: 'La description doit faire entre 5 et 5000 caractères',
    })
    })
})