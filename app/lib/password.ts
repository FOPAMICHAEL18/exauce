import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex,hexToBytes, randomBytes } from '@noble/hashes/utils.js';

/* v8 ignore next */
const SCRYPT_PARAMS = { N: Number(process.env.SCRYPT_N ?? 2 ** 14), r: 8, p: 1, dkLen: 64 }

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, SCRYPT_PARAMS)
  return `scrypt$${bytesToHex(salt)}$${bytesToHex(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  try {
    const salt = hexToBytes(parts[1])
    const expected = hexToBytes(parts[2])

    const candidate = await scryptAsync(password, salt, SCRYPT_PARAMS)

    if (candidate.length !== expected.length) return false

    // Comparaison à temps constant
    let diff = 0
    for (let i = 0; i < candidate.length; i++) {
      diff |= candidate[i] ^ expected[i]
    }
    return diff === 0
  } catch {
    // hexToBytes a throw sur un hex invalide → on considère ça comme
    // un hash corrompu, pas comme une erreur à propager.
    return false
  }
}