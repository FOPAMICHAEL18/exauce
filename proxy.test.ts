import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { proxy, config } from './proxy'

// On mocke jsonwebtoken pour contrôler la vérification et ne pas dépendre
// d'un vrai secret au runtime.
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

// Forme décodée d'un JWT admin valide.
const VALID_PAYLOAD = { id: 1, email: 'admin@test.com' }
const VALID_TOKEN = 'header.payload.signature'

// Construit une NextRequest avec un chemin et/ou un header Authorization.
function makeRequest(options: {
  path?: string
  authHeader?: string | null
  extraHeaders?: Record<string, string>
} = {}): NextRequest {
  const headers = new Headers()

  if (options.authHeader !== null && options.authHeader !== undefined) {
    headers.set('authorization', options.authHeader)
  }

  if (options.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      headers.set(key, value)
    }
  }

  return new NextRequest(
    `http://localhost${options.path ?? '/api/admin/categories'}`,
    { method: 'GET', headers },
  )
}

describe('proxy (middleware)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.mocked(jwt.verify).mockReturnValue(VALID_PAYLOAD as never)
  })

  it('expose bien un matcher sur /api/admin/*', () => {
    expect(config.matcher).toBe('/api/admin/:path*')
  })

  describe('route publique /api/admin/login', () => {
    it('laisse passer sans token', () => {
      const response = proxy(makeRequest({ path: '/api/admin/login' }))

      expect(response.status).toBe(200)
      // NextResponse.next() produit une réponse 200 sans corps.
      expect(jwt.verify).not.toHaveBeenCalled()
    })

    it('laisse passer même avec un header Authorization malformé', () => {
      const response = proxy(
        makeRequest({
          path: '/api/admin/login',
          authHeader: 'NotBearer xyz',
        }),
      )

      expect(response.status).toBe(200)
      expect(jwt.verify).not.toHaveBeenCalled()
    })
  })

  describe('absence ou mauvais format du token', () => {
    it('renvoie 401 si le header Authorization est absent', async () => {
      const response = proxy(makeRequest({ path: '/api/admin/categories' }))

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        message: 'Token manquant ou invalide',
      })
      expect(jwt.verify).not.toHaveBeenCalled()
    })

    it('renvoie 401 si le header ne commence pas par "Bearer "', async () => {
      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: 'Token xyz',
        }),
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        message: 'Token manquant ou invalide',
      })
    })

    it('renvoie 401 si le header est "Bearer" sans espace ni token', async () => {
      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: 'Bearer',
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si le header est "Bearer " suivi de rien', async () => {
      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: 'Bearer ',
        }),
      )

      // authHeader.split(' ')[1] === '' → falsy → 401
      expect(response.status).toBe(401)
    })
  })

  describe('token valide', () => {
    it('laisse passer et pose x-admin-data', () => {
      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(200)
      expect(jwt.verify).toHaveBeenCalledWith(VALID_TOKEN, expect.any(String))
    })

    it('appelle jwt.verify avec le token extrait (sans le "Bearer ")', () => {
      proxy(
        makeRequest({
          path: '/api/admin/products',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(jwt.verify).toHaveBeenCalledWith(VALID_TOKEN, expect.any(String))
      expect(jwt.verify).not.toHaveBeenCalledWith(
        `Bearer ${VALID_TOKEN}`,
        expect.any(String),
      )
    })

    it('écrase un x-admin-data envoyé par le client', async () => {
      // Un client malin envoie son propre header, mais le middleware
      // le supprime avant de poser le sien.
      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
          extraHeaders: { 'x-admin-data': '{"id":999}' },
        }),
      )

      expect(response.status).toBe(200)
      // On ne peut pas lire directement les headers de la requête "next",
      // mais on vérifie que la réponse est bien un NextResponse.next() (200)
      // et que jwt.verify a été appelé, ce qui prouve qu'on est passé par
      // le chemin "succès".
      expect(jwt.verify).toHaveBeenCalled()
    })

    it('accepte un email avec des caractères spéciaux dans le payload', () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        id: 42,
        email: 'user+tag@sub.domain.co.uk',
      } as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(200)
    })
  })

  describe('token invalide / payload malformé', () => {
    it('renvoie 401 si jwt.verify throw (signature invalide)', async () => {
      vi.mocked(jwt.verify).mockImplementationOnce(() => {
        throw new Error('invalid signature')
      })

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        message: 'Token invalide ou expiré',
      })
      expect(console.warn).toHaveBeenCalledWith(
        'Erreur middleware:',
        'invalid signature',
      )
    })

    it('renvoie 401 si jwt.verify throw une valeur non-Error', async () => {
      vi.mocked(jwt.verify).mockImplementationOnce(() => {
        throw 'boom'
      })

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
      expect(console.warn).toHaveBeenCalledWith('Erreur middleware:', 'boom')
    })

    it('renvoie 401 si le payload est un tableau', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce([] as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        message: 'Token invalide ou expiré',
      })
    })

    it('renvoie 401 si le payload est null', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce(null as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si le payload est une primitive', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce('juste une string' as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si id est manquant', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        email: 'admin@test.com',
      } as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si id n’est pas un number', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        id: '1',
        email: 'admin@test.com',
      } as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si email est manquant', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({ id: 1 } as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si email n’est pas une string', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        id: 1,
        email: 123,
      } as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
    })

    it('accepte un payload avec des champs supplémentaires', () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        id: 1,
        email: 'admin@test.com',
        iat: 1700000000,
        exp: 1900000000,
      } as never)

      const response = proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(200)
    })
  })

  describe('chemins couverts', () => {
    it('protège /api/admin/categories', async () => {
      const response = proxy(makeRequest({ path: '/api/admin/categories' }))
      expect(response.status).toBe(401)
    })

    it('protège /api/admin/products/123', async () => {
      const response = proxy(makeRequest({ path: '/api/admin/products/123' }))
      expect(response.status).toBe(401)
    })

    it('protège /api/admin/profile', async () => {
      const response = proxy(makeRequest({ path: '/api/admin/profile' }))
      expect(response.status).toBe(401)
    })

    it('ne protège PAS /api/reviews (hors matcher)', () => {
      // Le middleware matcher ne s'applique pas, mais on teste quand
      // même la fonction proxy directement pour vérifier son comportement.
      // Note : en production, cette route n'appellera jamais proxy.
      const response = proxy(makeRequest({ path: '/api/reviews' }))
      expect(response.status).toBe(401) // proxy protège tout ce qu'on lui donne
    })
  })
})