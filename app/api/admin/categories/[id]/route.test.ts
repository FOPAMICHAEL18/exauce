import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { prismaMock } from '@/app/test/mocks/prisma'
import { PUT, DELETE } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })
const CATEGORY_ID = 1
const VALID_NAME = 'Tapis'
const VALID_SLUG = 'tapis'

type SuccessUpdate = {
  success: true
  message: string
  data: {
    id: number
    name: string
    slug: string
    createdAt: string
    updatedAt: string
  }
}

type SuccessDelete = {
  success: true
  message: string
}

type ErrorResponse = { success: false; message: string }

type ApiResponse = SuccessUpdate | SuccessDelete | ErrorResponse

function createRequest(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
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

  const body =
    options.rawBody !== undefined
      ? options.rawBody
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined

  return new NextRequest(`http://localhost/api/admin/categories/${CATEGORY_ID}`, {
    method: options.method ?? 'PUT',
    headers,
    body,
  })
}

async function callPUT(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
  id?: string
} = {}): Promise<{ status: number; json: ApiResponse }> {
  const id = options.id ?? String(CATEGORY_ID)
  const response = await PUT(createRequest({ ...options, method: 'PUT' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as ApiResponse }
}

async function callDELETE(options: {
  adminHeader?: string | null
  id?: string
} = {}): Promise<{ status: number; json: ApiResponse }> {
  const id = options.id ?? String(CATEGORY_ID)
  const response = await DELETE(createRequest({ ...options, method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
  return { status: response.status, json: (await response.json()) as ApiResponse }
}

function makeCategory(overrides: Partial<{
  id: number
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: CATEGORY_ID,
    name: VALID_NAME,
    slug: VALID_SLUG,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeCategoryWithCount(
  productCount: number,
  overrides: Partial<{ id: number; name: string; slug: string }> = {},
) {
  return {
    ...makeCategory(overrides),
    _count: { product: productCount },
  }
}

describe('PUT /api/admin/categories/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('modifie le nom et régénère le slug', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)
    prismaMock.category.update.mockResolvedValueOnce(
      makeCategory({ name: 'Tapis Berbère', slug: 'tapis-berbere' }) as never,
    )

    const { status, json } = await callPUT({ body: { name: 'Tapis Berbère' } })

    expect(status).toBe(200)
    expect(json).toEqual({
      success: true,
      message: 'Catégorie modifiée avec succès',
      data: {
        id: CATEGORY_ID,
        name: 'Tapis Berbère',
        slug: 'tapis-berbere',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    })

    expect(prismaMock.category.update).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID },
      data: { name: 'Tapis Berbère', slug: 'tapis-berbere' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })

  it('ne régénère PAS le slug si le nom est identique', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)
    prismaMock.category.update.mockResolvedValueOnce(makeCategory() as never)

    await callPUT({ body: { name: VALID_NAME } })

    expect(prismaMock.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: VALID_NAME, slug: VALID_SLUG },
      }),
    )
  })

  it('trim le nom avant comparaison', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)
    prismaMock.category.update.mockResolvedValueOnce(makeCategory() as never)

    await callPUT({ body: { name: '   Tapis   ' } })

    // Après trim, le nom = "Tapis" = existing.name, donc slug inchangé.
    expect(prismaMock.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: VALID_NAME, slug: VALID_SLUG },
      }),
    )
  })

  it('utilise le nom existant si le body n’a pas de name', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)
    prismaMock.category.update.mockResolvedValueOnce(makeCategory() as never)

    await callPUT({ body: {} })

    expect(prismaMock.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: VALID_NAME, slug: VALID_SLUG },
      }),
    )
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callPUT({
      adminHeader: null,
      body: { name: VALID_NAME },
    })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id n’est pas un entier positif', async () => {
    for (const badId of ['abc', '12abc', '-5', '1.5', '0', '']) {
      const { status } = await callPUT({ id: badId, body: { name: 'X' } })
      expect(status).toBe(400)
    }
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 404 si la catégorie n’existe pas', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPUT({ body: { name: VALID_NAME } })

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Catégorie non trouvée',
    })
  })

  it('renvoie 400 si le corps n’est pas du JSON', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)

    const { status, json } = await callPUT({ rawBody: '{pas du json' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('renvoie 400 si le corps est un tableau', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)

    const { status } = await callPUT({ body: [1, 2, 3] })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le nom trimé est vide', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)

    const { status, json } = await callPUT({ body: { name: '   ' } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom est requis',
    })
  })

  it('renvoie 400 si le nom dépasse 100 caractères', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)

    const { status, json } = await callPUT({ body: { name: 'a'.repeat(101) } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom ne doit pas dépasser 100 caractères',
    })
    expect(prismaMock.category.update).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le nouveau nom génère un slug vide', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)

    const { status, json } = await callPUT({ body: { name: '###' } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message:
        'Le nom contient trop de caractères spéciaux pour générer un slug',
    })
  })

  it('renvoie 409 en cas de conflit unique', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)
    prismaMock.category.update.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`slug`)'),
    )

    const { status, json } = await callPUT({ body: { name: 'Autre' } })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Cette catégorie existe déjà.',
    })
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.category.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPUT({ body: { name: VALID_NAME } })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API modification catégorie:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.category.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callPUT({ body: { name: VALID_NAME } })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API modification catégorie:',
      'boom',
    )
  })
})

describe('DELETE /api/admin/categories/[id]', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('supprime une catégorie sans produits liés', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (cb) =>
      // @ts-expect-error — le callback typé de Prisma est plus strict
      // que ce que mockDeep peut inférer ; on simule un `tx` minimal.
      cb({
        category: prismaMock.category,
        product: prismaMock.product,
      }),
    )

    prismaMock.category.findUnique.mockResolvedValueOnce(
      makeCategoryWithCount(0) as never,
    )
    prismaMock.product.count.mockResolvedValueOnce(0)
    prismaMock.category.delete.mockResolvedValueOnce(makeCategory() as never)

    const { status, json } = await callDELETE()

    expect(status).toBe(200)
    expect(json).toEqual({
      success: true,
      message: `Catégorie "${VALID_NAME}" supprimée avec succès`,
    })

    expect(prismaMock.category.delete).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID },
    })
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callDELETE({ adminHeader: null })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('renvoie 400 si l’id n’est pas un entier positif', async () => {
    for (const badId of ['abc', '-1', '0', '']) {
      const { status } = await callDELETE({ id: badId })
      expect(status).toBe(400)
    }
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('renvoie 404 si la catégorie n’existe pas', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (cb) =>
      // @ts-expect-error — même raison que plus haut.
      cb({ category: prismaMock.category, product: prismaMock.product }),
    )
    prismaMock.category.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callDELETE()

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Catégorie non trouvée',
    })
  })

  it('renvoie 409 si des produits sont liés', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (cb) =>
      // @ts-expect-error — même raison.
      cb({ category: prismaMock.category, product: prismaMock.product }),
    )
    prismaMock.category.findUnique.mockResolvedValueOnce(
      makeCategoryWithCount(3) as never,
    )

    const { status, json } = await callDELETE()

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Impossible : 3 produit(s) utilisent cette catégorie.',
    })
    expect(prismaMock.category.delete).not.toHaveBeenCalled()
  })

  it('renvoie 409 si des produits apparaissent entre les deux checks', async () => {
    // La première lecture dit 0, mais le re-check dans la transaction
    // trouve 2 produits (race condition).
    prismaMock.$transaction.mockImplementationOnce(async (cb) =>
      // @ts-expect-error — même raison.
      cb({ category: prismaMock.category, product: prismaMock.product }),
    )
    prismaMock.category.findUnique.mockResolvedValueOnce(
      makeCategoryWithCount(0) as never,
    )
    prismaMock.product.count.mockResolvedValueOnce(2)

    const { status, json } = await callDELETE()

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Impossible : 2 produit(s) utilisent cette catégorie.',
    })
    expect(prismaMock.category.delete).not.toHaveBeenCalled()
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.$transaction.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API suppression catégorie:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.$transaction.mockRejectedValueOnce('boom')

    const { status } = await callDELETE()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API suppression catégorie:',
      'boom',
    )
  })
})