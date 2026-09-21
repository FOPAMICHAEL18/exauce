import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { cookies } from '@/app/test/mocks/next-headers'
import { NextRequest, NextResponse } from 'next/server'
import type {
  MockCookieStore,
  MockRequestCookie,
} from '@/app/test/mocks/next-headers'
import { prismaMock } from '@/app/test/mocks/prisma'
import { POST } from './route'

// On remplace le client Prisma réel par le mock profond pour éviter
// toute connexion à la base pendant les tests.
vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

// Ids et slug cohérents avec le schéma Prisma (Int pour les ids).
const PRODUCT_ID = 1
const SLUG = 'mon-produit'
const SESSION_ID = 'session-123'
const EXISTING_SESSION_ID = 'session-existante'

// Regex pour vérifier qu'un sessionId généré est bien un UUID.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Renvoie un Product complet tel que Prisma le retournerait quand
// on ne met pas de `select`. Évite de répéter les mêmes champs partout.
function makeProduct(overrides: Partial<{
  id: number
  slug: string
  views: number
}> = {}) {
  return {
    id: PRODUCT_ID,
    title: 'Mon produit',
    slug: SLUG,
    description: 'Description du produit',
    price: new Prisma.Decimal('9.99'),
    stockStatus: 'disponible' as const,
    categoryId: 1,
    views: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

// Renvoie une View complète telle que Prisma la retournerait sans `select`.
function makeView(overrides: Partial<{
  id: number
  sessionId: string
  productId: number
}> = {}) {
  return {
    id: 1,
    sessionId: EXISTING_SESSION_ID,
    productId: PRODUCT_ID,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

// Construit un MockCookieStore typé à partir de l'interface du mock
// next-headers. Chaque méthode est un vi.fn pour garder l'inférence stricte.
function createCookieStore(): MockCookieStore {
  return {
    get: vi.fn<MockCookieStore['get']>(),
    set: vi.fn<MockCookieStore['set']>(),
    delete: vi.fn<MockCookieStore['delete']>(),
    has: vi.fn<MockCookieStore['has']>(),
    getAll: vi.fn<MockCookieStore['getAll']>(),
  }
}

// Fabrique une NextRequest minimale pour appeler la route.
function createRequest(slug: string = SLUG): NextRequest {
  return new NextRequest(`http://localhost/api/products/${slug}/view`, {
    method: 'POST',
  })
}

// Wrapper typé : la route attend params comme une Promise.
function callPOST(slug: string = SLUG): Promise<NextResponse> {
  return POST(createRequest(slug), {
    params: Promise.resolve({ slug }),
  })
}

// $transaction est surchargé côté Prisma (array + callback) donc mockDeep
// ne peut pas inférer le tuple de retour. On force la résolution pour
// simuler un succès.
function mockTransactionSuccess(): void {
  prismaMock.$transaction.mockResolvedValueOnce(
    [{ id: 1 }, { id: PRODUCT_ID }] as never,
  )
}

describe('POST /api/products/[slug]/view', () => {
  let cookieStore: MockCookieStore

  // À chaque test : nouveau store de cookies, UUID figé pour rendre les
  // assertions déterministes, et console.error muet.
  beforeEach(() => {
    cookieStore = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(cookieStore)

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      SESSION_ID as ReturnType<Crypto['randomUUID']>,
    )

    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('crée une session et enregistre la première vue', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct())

    // Aucun cookie sessionId côté client : la route doit en générer un.
    cookieStore.get = vi.fn<MockCookieStore['get']>(() => undefined)

    // Aucune vue existante pour cette session + ce produit.
    prismaMock.view.findUnique.mockResolvedValueOnce(null)
    mockTransactionSuccess()

    const response = await callPOST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })

    // Le produit est bien cherché par slug, uniquement pour son id.
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { slug: SLUG },
      select: { id: true },
    })

    // Le cookie de session est lu puis posé avec les bonnes options.
    expect(cookieStore.get).toHaveBeenCalledWith('sessionId')
    expect(cookieStore.set).toHaveBeenCalledWith(
      'sessionId',
      SESSION_ID,
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      }),
    )

    // On vérifie la recherche de vue existante avec la clé composite.
    expect(prismaMock.view.findUnique).toHaveBeenCalledWith({
      where: {
        sessionId_productId: {
          sessionId: SESSION_ID,
          productId: PRODUCT_ID,
        },
      },
      select: { id: true },
    })

    // La transaction doit créer la vue et incrémenter le compteur.
    expect(prismaMock.view.create).toHaveBeenCalledWith({
      data: { sessionId: SESSION_ID, productId: PRODUCT_ID },
    })
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
      data: { views: { increment: 1 } },
    })
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })

  it('réutilise une session existante et enregistre la vue', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct())

    // Le client a déjà un cookie sessionId valide.
    const existing: MockRequestCookie = {
      name: 'sessionId',
      value: EXISTING_SESSION_ID,
    }
    cookieStore.get = vi.fn<MockCookieStore['get']>(() => existing)

    prismaMock.view.findUnique.mockResolvedValueOnce(null)
    mockTransactionSuccess()

    const response = await callPOST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })

    // Pas besoin de re-poser un cookie : la session existe déjà.
    expect(cookieStore.set).not.toHaveBeenCalled()

    // La vue est créée avec la session existante, pas une nouvelle.
    expect(prismaMock.view.create).toHaveBeenCalledWith({
      data: {
        sessionId: EXISTING_SESSION_ID,
        productId: PRODUCT_ID,
      },
    })
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })

  it('retourne 404 si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)

    const response = await callPOST('inconnu')

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Produit non trouvé',
    })

    // On doit s'arrêter avant même de toucher aux cookies ou à la vue.
    expect(cookies).not.toHaveBeenCalled()
    expect(prismaMock.view.findUnique).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(prismaMock.view.create).not.toHaveBeenCalled()
    expect(prismaMock.product.update).not.toHaveBeenCalled()
  })

  it('retourne alreadyViewed si la vue existe déjà', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct())

    cookieStore.get = vi.fn<MockCookieStore['get']>(() => ({
      name: 'sessionId',
      value: EXISTING_SESSION_ID,
    }))

    // Une vue existe déjà pour ce couple session/produit : on renvoie
    // l'objet View complet tel que Prisma le ferait sans `select`.
    prismaMock.view.findUnique.mockResolvedValueOnce(makeView())

    const response = await callPOST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      alreadyViewed: true,
    })

    // Pas de double comptage : la transaction ne doit pas être lancée.
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(prismaMock.view.create).not.toHaveBeenCalled()
    expect(prismaMock.product.update).not.toHaveBeenCalled()
  })

  it('gère la race condition « Unique constraint failed »', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct())

    cookieStore.get = vi.fn<MockCookieStore['get']>(() => ({
      name: 'sessionId',
      value: EXISTING_SESSION_ID,
    }))

    prismaMock.view.findUnique.mockResolvedValueOnce(null)

    // Deux requêtes simultanées : la contrainte unique fait échouer la
    // transaction. La route doit répondre success + alreadyViewed.
    prismaMock.$transaction.mockRejectedValueOnce(
      new Error(
        'Unique constraint failed on the fields: (`sessionId`,`productId`)',
      ),
    )

    const response = await callPOST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      alreadyViewed: true,
    })

    // Ce n'est pas une vraie erreur : rien ne doit être loggé.
    expect(console.error).not.toHaveBeenCalled()
  })

  it('retourne 500 en cas d’erreur interne (Error)', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const response = await callPOST()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Erreur interne du serveur',
    })

    // L'erreur est loggée avec son message, pas l'objet complet.
    expect(console.error).toHaveBeenCalledWith(
      'Erreur tracking vue:',
      'DB down',
    )
  })

  it('retourne 500 pour une erreur non-Error (valeur jetée)', async () => {
    // Cas où on throw une string au lieu d'une Error : la route doit
    // quand même répondre 500 sans crasher sur error.message.
    prismaMock.product.findUnique.mockRejectedValueOnce('boom')

    const response = await callPOST()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Erreur interne du serveur',
    })
    expect(console.error).toHaveBeenCalledWith('Erreur tracking vue:', 'boom')
  })

  it('pose secure:true quand NODE_ENV=production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct())
    cookieStore.get = vi.fn<MockCookieStore['get']>(() => undefined)
    prismaMock.view.findUnique.mockResolvedValueOnce(null)
    mockTransactionSuccess()

    await callPOST()

    // En prod le cookie doit être marqué secure (HTTPS uniquement).
    expect(cookieStore.set).toHaveBeenCalledWith(
      'sessionId',
      SESSION_ID,
      expect.objectContaining({ secure: true }),
    )

    vi.unstubAllEnvs()
  })

  it('le sessionId généré a bien un format UUID', async () => {
    // Ici on retire tous les spies pour tester le vrai randomUUID.
    vi.restoreAllMocks()
    cookieStore = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(cookieStore)

    prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct())
    cookieStore.get = vi.fn<MockCookieStore['get']>(() => undefined)
    prismaMock.view.findUnique.mockResolvedValueOnce(null)
    mockTransactionSuccess()

    await callPOST()

    // On récupère le 2e argument du premier appel à cookieStore.set,
    // c'est-à-dire la valeur du sessionId réellement générée.
    const [, generated] = vi.mocked(cookieStore.set).mock.calls[0] ?? []
    expect(generated).toMatch(UUID_REGEX)
  })
})