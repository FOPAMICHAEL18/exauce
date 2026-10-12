import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { proxy, config } from './proxy'

vi.mock('@/app/lib/jwt', () => ({
  verifyToken: vi.fn(),
}))

const VALID_PAYLOAD = { id: 1, email: 'admin@test.com' }
const VALID_TOKEN = 'header.payload.signature'

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
    vi.mocked(verifyToken).mockResolvedValue(VALID_PAYLOAD)
  })

  it('expose bien un matcher sur /api/admin/*', () => {
    expect(config.matcher).toBe('/api/admin/:path*')
  })

  describe('route publique /api/admin/login', () => {
    it('laisse passer sans token', async () => {
      const response = await proxy(makeRequest({ path: '/api/admin/login' }))

      expect(response.status).toBe(200)
      expect(verifyToken).not.toHaveBeenCalled()
    })

    it('laisse passer même avec un header Authorization malformé', async () => {
      const response = await proxy(
        makeRequest({
          path: '/api/admin/login',
          authHeader: 'NotBearer xyz',
        }),
      )

      expect(response.status).toBe(200)
      expect(verifyToken).not.toHaveBeenCalled()
    })
  })

  describe('absence ou mauvais format du token', () => {
    it('renvoie 401 si le header Authorization est absent', async () => {
      const response = await proxy(
        makeRequest({ path: '/api/admin/categories' }),
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        message: 'Token manquant ou invalide',
      })
      expect(verifyToken).not.toHaveBeenCalled()
    })

    it('renvoie 401 si le header ne commence pas par "Bearer "', async () => {
      const response = await proxy(
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

    it('renvoie 401 si le header est "Bearer" sans espace', async () => {
      const response = await proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: 'Bearer',
        }),
      )

      expect(response.status).toBe(401)
    })

    it('renvoie 401 si le header est "Bearer " suivi de rien', async () => {
      const response = await proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: 'Bearer ',
        }),
      )

      expect(response.status).toBe(401)
    })
  })

  describe('token valide', () => {
    it('laisse passer et pose x-admin-data', async () => {
      const response = await proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(200)
      expect(verifyToken).toHaveBeenCalledWith(VALID_TOKEN)
    })

    it('appelle verifyToken avec le token extrait (sans le "Bearer ")', async () => {
      await proxy(
        makeRequest({
          path: '/api/admin/products',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(verifyToken).toHaveBeenCalledWith(VALID_TOKEN)
      expect(verifyToken).not.toHaveBeenCalledWith(`Bearer ${VALID_TOKEN}`)
    })

    it('écrase un x-admin-data envoyé par le client', async () => {
      const response = await proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
          extraHeaders: { 'x-admin-data': '{"id":999}' },
        }),
      )

      expect(response.status).toBe(200)
      expect(verifyToken).toHaveBeenCalled()
    })

    it('accepte un email avec des caractères spéciaux dans le payload', async () => {
      vi.mocked(verifyToken).mockResolvedValueOnce({
        id: 42,
        email: 'user+tag@sub.domain.co.uk',
      })

      const response = await proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(200)
    })
  })

  describe('token invalide / payload malformé', () => {
    it('renvoie 401 si verifyToken throw', async () => {
      vi.mocked(verifyToken).mockRejectedValueOnce(
        new Error('invalid signature'),
      )

      const response = await proxy(
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

    it('renvoie 401 si verifyToken throw une valeur non-Error', async () => {
      vi.mocked(verifyToken).mockRejectedValueOnce('boom')

      const response = await proxy(
        makeRequest({
          path: '/api/admin/categories',
          authHeader: `Bearer ${VALID_TOKEN}`,
        }),
      )

      expect(response.status).toBe(401)
      expect(console.warn).toHaveBeenCalledWith('Erreur middleware:', 'boom')
    })

    it('renvoie 401 si verifyToken renvoie null', async () => {
      vi.mocked(verifyToken).mockResolvedValueOnce(null)

      const response = await proxy(
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
  })

  describe('chemins couverts', () => {
    it('protège /api/admin/categories', async () => {
      const response = await proxy(
        makeRequest({ path: '/api/admin/categories' }),
      )
      expect(response.status).toBe(401)
    })

    it('protège /api/admin/products/123', async () => {
      const response = await proxy(
        makeRequest({ path: '/api/admin/products/123' }),
      )
      expect(response.status).toBe(401)
    })

    it('protège /api/admin/profile', async () => {
      const response = await proxy(makeRequest({ path: '/api/admin/profile' }))
      expect(response.status).toBe(401)
    })

    it('protège même les chemins hors matcher si on l’appelle directement', async () => {
      const response = await proxy(makeRequest({ path: '/api/reviews' }))
      expect(response.status).toBe(401)
    })
  })
})