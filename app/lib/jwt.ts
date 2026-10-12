import { SignJWT, jwtVerify } from 'jose'
import type { AdminData } from './admin-auth'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET est manquant dans les variables d'environnement")
}

// On utilise crypto.subtle.importKey pour obtenir une CryptoKey.
// C'est plus robuste que TextEncoder().encode() car ça évite les
// problèmes de cross-realm entre jsdom (test) et Node natif.
let secretKeyPromise: Promise<CryptoKey> | null = null

function getSecretKey(): Promise<CryptoKey> {
  if (!secretKeyPromise) {
    secretKeyPromise = crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    )
  }
  return secretKeyPromise
}

export async function signToken(payload: AdminData): Promise<string> {
    const key = await getSecretKey()
    return new SignJWT({ id: payload.id, email: payload.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(key)
}

export async function verifyToken(token: string): Promise<AdminData | null> {
  try {
    const key = await getSecretKey()
    const { payload } = await jwtVerify(token, key)
    if (typeof payload.id !== 'number' || typeof payload.email !== 'string') {
      return null
    }
    return { id: payload.id, email: payload.email }
  } catch {
    return null
  }
}