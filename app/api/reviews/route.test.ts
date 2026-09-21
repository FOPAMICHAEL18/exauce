import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prismaMock } from '@/app/test/mocks/prisma'
import { POST } from './route'

// On remplace le client Prisma réel par le mock profond pour éviter
// toute connexion à la base pendant les tests.
vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

// On ne mocke PAS les validateurs : ce sont des fonctions pures, on
// veut tester leur intégration réelle avec la route.

const PRODUCT_ID = 1
const VALID_AUTHOR = 'Jean Dupont'
const VALID_EMAIL = 'jean@example.com'
const VALID_COMMENT = 'Excellent produit, je recommande !'
const VALID_RATING = 5

// Forme possible de la réponse JSON de la route.
type SuccessWithData = {
  success: true
  data: {
    id: number
    author: string
    rating: number
    comment: string
    createdAt: string
  }
}

type SuccessMessage = {
  success: true
  message: string
}

type ErrorResponse = {
  success: false
  message: string
}

type ReviewResponse = SuccessWithData | SuccessMessage | ErrorResponse

// Construit une requête avec un corps JSON valide.
function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Construit une requête avec un corps JSON cassé.
function createInvalidJsonRequest(): Request {
  return new Request('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{pas du json',
  })
}

// Appelle la route et renvoie { status, json } typés.
async function callPOST(body: unknown): Promise<{
  status: number
  json: ReviewResponse
}> {
  const response = await POST(createRequest(body))
  return {
    status: response.status,
    json: (await response.json()) as ReviewResponse,
  }
}

// Renvoie un objet Review correspondant exactement au `select` de la
// route : id, author, rating, comment, createdAt.
function makeReview(overrides: Partial<{
  id: number
  author: string
  rating: number
  comment: string
  createdAt: Date
}> = {}) {
  return {
    id: 1,
    author: VALID_AUTHOR,
    rating: VALID_RATING,
    comment: VALID_COMMENT,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

// Construit un corps de requête valide, surchargeable champ par champ.
function makeValidBody(overrides: Record<string, unknown> = {}) {
  return {
    author: VALID_AUTHOR,
    email: VALID_EMAIL,
    comment: VALID_COMMENT,
    rating: VALID_RATING,
    productId: PRODUCT_ID,
    ...overrides,
  }
}

describe('POST /api/reviews', () => {
  // On rend console.error muet pour ne pas polluer la sortie des tests.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('crée un avis valide', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({
      id: PRODUCT_ID,
    } as never)
    prismaMock.review.create.mockResolvedValueOnce(makeReview() as never)

    const { status, json } = await callPOST(makeValidBody())

    expect(status).toBe(201)
    expect(json).toEqual({
      success: true,
      data: {
        ...makeReview(),
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    })

    // Le produit est cherché par son id, uniquement pour vérifier qu'il existe.
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
      select: { id: true },
    })

    // La review est créée avec le bon shape, status forcé à published.
    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: {
        author: VALID_AUTHOR,
        email: VALID_EMAIL,
        rating: VALID_RATING,
        comment: VALID_COMMENT,
        productId: PRODUCT_ID,
        status: 'published',
      },
      select: {
        id: true,
        author: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })
  })

  it('trim les chaînes avant de les envoyer à Prisma', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({
      id: PRODUCT_ID,
    } as never)
    prismaMock.review.create.mockResolvedValueOnce(makeReview() as never)

    await callPOST(
      makeValidBody({
        author: '  Jean Dupont  ',
        email: '  jean@example.com  ',
        comment: '  Excellent produit  ',
      }),
    )

    expect(prismaMock.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          author: 'Jean Dupont',
          email: 'jean@example.com',
          comment: 'Excellent produit',
        }),
      }),
    )
  })

  it('honeypot rempli → faux succès sans toucher à Prisma', async () => {
    // On simule le temps pour ne pas attendre 300-700 ms réels, et on
    // fixe Math.random pour rendre le délai déterministe (300 ms).
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const promise = callPOST(makeValidBody({ honeypot: 'je suis un bot' }))

    // On avance le temps simulé pour terminer le fakeDelay.
    await vi.advanceTimersByTimeAsync(300)

    const { status, json } = await promise

    expect(status).toBe(201)
    expect(json).toEqual({ success: true, message: 'Avis enregistré.' })

    // Rien ne doit être écrit en base.
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
    expect(prismaMock.review.create).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('retourne 400 si le corps n’est pas du JSON valide', async () => {
    const response = await POST(createInvalidJsonRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Données invalides.',
    })
  })

  it('retourne 400 si le corps est null', async () => {
    const { status, json } = await callPOST(null)

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Données invalides.',
    })
  })

  it('retourne 400 si le corps est une chaîne simple', async () => {
    const { status, json } = await callPOST('bonjour')

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Données invalides.',
    })
  })

  it('retourne 400 si le corps est un tableau', async () => {
    const { status, json } = await callPOST([1, 2, 3])

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Données invalides.',
    })
  })

  it('retourne 400 si author trop court', async () => {
    const { status, json } = await callPOST(makeValidBody({ author: 'J' }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom doit faire au moins 2 caractères.',
    })
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('retourne 400 si author est absent', async () => {
    const body = makeValidBody()
    delete (body as Record<string, unknown>).author

    const { status, json } = await callPOST(body)

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nom doit faire au moins 2 caractères.',
    })
  })

  it('retourne 400 si email est vide', async () => {
    const { status, json } = await callPOST(makeValidBody({ email: '' }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse email invalide.',
    })
  })

  it('retourne 400 si email est absent', async () => {
    const body = makeValidBody()
    delete (body as Record<string, unknown>).email

    const { status, json } = await callPOST(body)

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse email invalide.',
    })
  })

  it('retourne 400 si email est invalide', async () => {
    const { status, json } = await callPOST(
      makeValidBody({ email: 'pas-un-email' }),
    )

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse email invalide.',
    })
  })

  it('retourne 400 si commentaire trop court', async () => {
    const { status, json } = await callPOST(makeValidBody({ comment: 'ok' }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le commentaire doit faire au moins 5 caractères.',
    })
  })

  it('retourne 400 si rating vaut 0 (hors bornes)', async () => {
    const { status, json } = await callPOST(makeValidBody({ rating: 0 }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'La note doit être comprise entre 1 et 5 étoiles.',
    })
  })

  it('retourne 400 si rating vaut 6 (hors bornes)', async () => {
    const { status, json } = await callPOST(makeValidBody({ rating: 6 }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'La note doit être comprise entre 1 et 5 étoiles.',
    })
  })

  it('retourne 400 si rating n’est pas un nombre', async () => {
    const { status, json } = await callPOST(
      makeValidBody({ rating: 'pas un nombre' }),
    )

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'La note doit être comprise entre 1 et 5 étoiles.',
    })
  })

  it('retourne 400 si rating est un booléen (piège Number(true)===1)', async () => {
    const { status, json } = await callPOST(makeValidBody({ rating: true }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'La note doit être comprise entre 1 et 5 étoiles.',
    })
  })

  it('retourne 400 si productId vaut 0', async () => {
    const { status, json } = await callPOST(makeValidBody({ productId: 0 }))

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Identifiant de produit non valide.',
    })
  })

  it('retourne 400 si productId n’est pas un nombre', async () => {
    const { status, json } = await callPOST(
      makeValidBody({ productId: 'abc' }),
    )

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Identifiant de produit non valide.',
    })
  })

  it('retourne 404 si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPOST(
      makeValidBody({ productId: 999 }),
    )

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Produit introuvable.',
    })
    // On ne doit jamais tenter de créer la review.
    expect(prismaMock.review.create).not.toHaveBeenCalled()
  })

  it('retourne 500 si Prisma plante', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status, json } = await callPOST(makeValidBody())

    expect(status).toBe(500)
    expect(json).toEqual({
      success: false,
      message: 'Erreur interne du serveur.',
    })
    // L'erreur doit être loggée avec son message, pas l'objet complet.
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API review POST:',
      'DB down',
    )
  })

  it('retourne 500 pour une erreur non-Error (valeur jetée)', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce('boom')

    const { status, json } = await callPOST(makeValidBody())

    expect(status).toBe(500)
    expect(json).toEqual({
      success: false,
      message: 'Erreur interne du serveur.',
    })
    expect(console.error).toHaveBeenCalledWith('Erreur API review POST:', 'boom')
  })
})