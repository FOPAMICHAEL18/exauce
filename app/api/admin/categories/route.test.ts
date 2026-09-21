import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { prismaMock } from '@/app/test/mocks/prisma'
import { POST } from './route'

// On remplace le client Prisma par le mock profond pour ne pas toucher
// à la base pendant les tests.
vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const VALID_NAME = 'Tapis'
const VALID_SLUG = 'tapis'
const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })

// Forme possible des réponses de la route.
type SuccessResponse = {
  success: true
  message: string
  data: {
    id: number
    name: string
    slug: string
    createdAt: string
  }
}

type ErrorResponse = {
  success: false
  message: string
}

type CategoryResponse = SuccessResponse | ErrorResponse

// Construit une NextRequest avec un body JSON et/ou un header admin.
// Par défaut, on fournit un admin valide pour ne pas polluer chaque test.
function createRequest(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
} = {}): NextRequest {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  if (options.adminHeader === null) {
    // Pas de header admin du tout.
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

  return new NextRequest('http://localhost/api/admin/categories', {
    method: 'POST',
    headers,
    body,
  })
}

// Appelle la route et renvoie { status, json } typés.
async function callPOST(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
} = {}): Promise<{ status: number; json: CategoryResponse }> {
  const response = await POST(createRequest(options))
  return {
    status: response.status,
    json: (await response.json()) as CategoryResponse,
  }
}

// Renvoie une Category complète telle que Prisma la retournerait
// quand on ne met pas de `select`.
function makeCategory(overrides: Partial<{
  id: number
  name: string
  slug: string
  createdAt: Date
}> = {}) {
  return {
    id: 1,
    name: VALID_NAME,
    slug: VALID_SLUG,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('POST /api/admin/categories', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('crée une catégorie valide', async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce(null)
    prismaMock.category.create.mockResolvedValueOnce(makeCategory() as never)

    const { status, json } = await callPOST({ body: { name: VALID_NAME } })

    expect(status).toBe(201)
    expect(json).toEqual({
      success: true,
      message: 'Catégorie créée avec succès',
      data: {
        id: 1,
        name: VALID_NAME,
        slug: VALID_SLUG,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    })

    // La recherche de doublon se fait sur le nom OU le slug.
    expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ name: VALID_NAME }, { slug: VALID_SLUG }],
      },
      select: { id: true },
    })

    // La création utilise le nom trimé et le slug généré, et le select
    // ne renvoie que les 4 champs attendus.
    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: { name: VALID_NAME, slug: VALID_SLUG },
      select: { id: true, name: true, slug: true, createdAt: true },
    })
  })

  it('trim le nom avant de chercher et créer', async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce(null)
    prismaMock.category.create.mockResolvedValueOnce(makeCategory() as never)

    await callPOST({ body: { name: '   Tapis   ' } })

    expect(prismaMock.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ name: VALID_NAME }, { slug: VALID_SLUG }] },
      }),
    )
    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: { name: VALID_NAME, slug: VALID_SLUG },
      select: { id: true, name: true, slug: true, createdAt: true },
    })
  })

  it('génère un slug même avec un nom en majuscules', async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce(null)
    prismaMock.category.create.mockResolvedValueOnce(makeCategory() as never)

    await callPOST({ body: { name: 'TAPIS PERSAN' } })

    expect(prismaMock.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ name: 'TAPIS PERSAN' }, { slug: 'tapis-persan' }],
        },
      }),
    )
  })

  // La vérification admin est testée dans admin-auth.test.ts.
  // On garde ici un seul test d'intégration pour vérifier que la route
  // renvoie bien la réponse de requireAdmin sans avoir touché à Prisma.
  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callPOST({
      adminHeader: null,
      body: { name: VALID_NAME },
    })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.category.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.category.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si le corps n’est pas du JSON', async () => {
    const { status, json } = await callPOST({ rawBody: '{pas du json' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('retourne 400 si le corps est null', async () => {
    const { status, json } = await callPOST({ rawBody: 'null' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('retourne 400 si le corps est un tableau', async () => {
    const { status, json } = await callPOST({ body: [1, 2, 3] })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('retourne 400 si le corps est une chaîne simple', async () => {
    const { status, json } = await callPOST({ rawBody: '"bonjour"' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('retourne 400 si le nom est absent', async () => {
    const { status, json } = await callPOST({ body: {} })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom doit faire au moins 2 caractères',
    })
    expect(prismaMock.category.findFirst).not.toHaveBeenCalled()
  })

  it('retourne 400 si le nom est trop court', async () => {
    const { status, json } = await callPOST({ body: { name: 'A' } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom doit faire au moins 2 caractères',
    })
  })

  it('retourne 400 si le nom n’est pas une chaîne', async () => {
    const { status, json } = await callPOST({ body: { name: 123 } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom doit faire au moins 2 caractères',
    })
  })

  it('retourne 400 si le nom dépasse 100 caractères', async () => {
    const longName = 'a'.repeat(101)

    const { status, json } = await callPOST({ body: { name: longName } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom ne doit pas dépasser 100 caractères',
    })
    expect(prismaMock.category.findFirst).not.toHaveBeenCalled()
  })

  it('accepte un nom de exactement 100 caractères', async () => {
    const maxName = 'a'.repeat(100)
    prismaMock.category.findFirst.mockResolvedValueOnce(null)
    prismaMock.category.create.mockResolvedValueOnce(
      makeCategory({ name: maxName }) as never,
    )

    const { status } = await callPOST({ body: { name: maxName } })

    expect(status).toBe(201)
  })

  it('retourne 400 si le slug généré est vide', async () => {
    // "###" passe validateAuthor (3 caractères) mais generateSlug
    // renvoie une chaîne vide une fois les caractères spéciaux retirés.
    const { status, json } = await callPOST({ body: { name: '###' } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message:
        'Le nom contient trop de caractères spéciaux pour générer un slug',
    })
    expect(prismaMock.category.findFirst).not.toHaveBeenCalled()
  })

  it('retourne 409 si une catégorie avec le même nom existe', async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce({ id: 99 } as never)

    const { status, json } = await callPOST({ body: { name: VALID_NAME } })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Cette catégorie existe déjà.',
    })
    expect(prismaMock.category.create).not.toHaveBeenCalled()
  })

  it('retourne 409 si le slug est déjà pris (nom différent)', async () => {
    // "TAPIS" donne le slug "tapis" qui est déjà utilisé par une autre
    // catégorie dont le nom diffère.
    prismaMock.category.findFirst.mockResolvedValueOnce({ id: 42 } as never)

    const { status, json } = await callPOST({ body: { name: 'TAPIS' } })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Cette catégorie existe déjà.',
    })
  })

  it('retourne 409 en race condition (Unique constraint failed)', async () => {
    // Le findFirst passe (aucun doublon visible), mais la création
    // échoue car un autre appel a inséré entre temps.
    prismaMock.category.findFirst.mockResolvedValueOnce(null)
    prismaMock.category.create.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`slug`)'),
    )

    const { status, json } = await callPOST({ body: { name: VALID_NAME } })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Cette catégorie existe déjà.',
    })
    // Ce n’est pas une vraie erreur interne : rien à logguer.
    expect(console.error).not.toHaveBeenCalled()
  })

  it('retourne 500 si Prisma plante', async () => {
    prismaMock.category.findFirst.mockRejectedValueOnce(new Error('DB down'))

    const { status, json } = await callPOST({ body: { name: VALID_NAME } })

    expect(status).toBe(500)
    expect(json).toEqual({
      success: false,
      message: 'Erreur interne du serveur',
    })
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API admin/categories POST:',
      'DB down',
    )
  })

  it('retourne 500 pour une erreur non-Error (valeur jetée)', async () => {
    prismaMock.category.findFirst.mockRejectedValueOnce('boom')

    const { status, json } = await callPOST({ body: { name: VALID_NAME } })

    expect(status).toBe(500)
    expect(json).toEqual({
      success: false,
      message: 'Erreur interne du serveur',
    })
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API admin/categories POST:',
      'boom',
    )
  })

  it('retourne 400 avec un nom ne contenant que des espaces', async () => {
    const { status } = await callPOST({ body: { name: '   ' } })

    expect(status).toBe(400)
    expect(prismaMock.category.findFirst).not.toHaveBeenCalled()
  })
})