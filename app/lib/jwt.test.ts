import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import { signToken, verifyToken } from './jwt'

const ADMIN = { id: 42, email: 'admin@test.com' }

// Helper pour créer un token avec un payload arbitraire (y compris
// des payloads invalides) en utilisant la même clé que le code de prod.
async function makeToken(
  payload: Record<string, unknown>,
  options: { expiresIn?: number; iat?: number } = {},
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )

  let builder = new SignJWT(payload).setProtectedHeader({ alg: 'HS256' })

  if (options.iat !== undefined) {
    builder = builder.setIssuedAt(options.iat)
  }

  if (options.expiresIn !== undefined) {
    builder = builder.setExpirationTime(options.expiresIn)
  } else {
    builder = builder.setExpirationTime('1h')
  }

  return builder.sign(key)
}

describe('jwt', () => {
  describe('signToken', () => {
    it('produit un JWT à 3 segments', async () => {
      const token = await signToken(ADMIN)
      expect(token.split('.')).toHaveLength(3)
    })

    it('produit un token différent à chaque appel (iat change)', async () => {
      const token1 = await signToken(ADMIN)
      const token2 = await signToken(ADMIN)

      expect(token1).toBeTruthy()
      expect(token2).toBeTruthy()
    })

    it('encode bien id et email dans le payload', async () => {
      const token = await signToken(ADMIN)
      const payload = await verifyToken(token)

      expect(payload).toEqual(ADMIN)
    })
  })

  describe('verifyToken', () => {
    it('renvoie le payload pour un token valide', async () => {
      const token = await signToken(ADMIN)
      const payload = await verifyToken(token)

      expect(payload).toEqual({ id: 42, email: 'admin@test.com' })
    })

    it('renvoie null pour un token malformé', async () => {
      expect(await verifyToken('pas-un-jwt')).toBeNull()
      expect(await verifyToken('a.b')).toBeNull()
      expect(await verifyToken('')).toBeNull()
    })

    it('renvoie null pour une signature invalide', async () => {
      const token = await signToken(ADMIN)
      const parts = token.split('.')
      const tampered = `${parts[0]}.${parts[1]}.signature-bidon`

      expect(await verifyToken(tampered)).toBeNull()
    })

    it('renvoie null pour un payload altéré', async () => {
      const token = await signToken(ADMIN)
      const parts = token.split('.')

      const fakePayload = Buffer.from(
        JSON.stringify({ id: 999, email: 'hacker@evil.com' }),
      )
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

      const tampered = `${parts[0]}.${fakePayload}.${parts[2]}`

      expect(await verifyToken(tampered)).toBeNull()
    })

    it('renvoie null si le payload ne contient pas id', async () => {
      const token = await makeToken({ email: 'x@test.com' })
      expect(await verifyToken(token)).toBeNull()
    })

    it('renvoie null si id n’est pas un number', async () => {
      const token = await makeToken({ id: '1', email: 'x@test.com' })
      expect(await verifyToken(token)).toBeNull()
    })

    it('renvoie null si email est manquant', async () => {
      const token = await makeToken({ id: 1 })
      expect(await verifyToken(token)).toBeNull()
    })

    it('renvoie null si email n’est pas une string', async () => {
      const token = await makeToken({ id: 1, email: 42 })
      expect(await verifyToken(token)).toBeNull()
    })

    it('renvoie null si le token est expiré', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = await makeToken(ADMIN, {
        iat: now - 7200,     // il y a 2h
        expiresIn: now - 3600, // expiré il y a 1h
      })

      expect(await verifyToken(token)).toBeNull()
    })

    it('accepte un payload avec des champs supplémentaires (iat, exp)', async () => {
      const token = await signToken(ADMIN)
      const payload = await verifyToken(token)

      expect(payload).toEqual({ id: 42, email: 'admin@test.com' })
      expect(payload).not.toHaveProperty('iat')
      expect(payload).not.toHaveProperty('exp')
    })
  })

  describe('jwt — sans JWT_SECRET', () => {
    beforeEach(() => {
      vi.resetModules()
      vi.stubEnv('JWT_SECRET', '')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('lance une erreur au chargement si JWT_SECRET est absent', async () => {
      await expect(() => import('./jwt')).rejects.toThrow(
        "JWT_SECRET est manquant dans les variables d'environnement",
      )
    })
  })
})