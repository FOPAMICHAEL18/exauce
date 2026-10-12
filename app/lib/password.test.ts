import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  describe('hashPassword', () => {
    it('produit une chaîne au format scrypt$salt$hash', async () => {
      const hash = await hashPassword('monMotDePasse')

      expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
      expect(hash.split('$')).toHaveLength(3)
    })

    it('produit un hash différent à chaque appel (salt aléatoire)', async () => {
      const hash1 = await hashPassword('memeMotDePasse')
      const hash2 = await hashPassword('memeMotDePasse')

      expect(hash1).not.toBe(hash2)
    })

    it('produit un hash de taille cohérente', async () => {
      const hash1 = await hashPassword('a')
      const hash2 = await hashPassword('unMotDePasseBienPlusLong')

      // Le hash scrypt fait toujours 64 octets (= 128 caractères hex)
      const [, salt1, digest1] = hash1.split('$')
      const [, salt2, digest2] = hash2.split('$')

      expect(salt1).toHaveLength(32)   // 16 octets → 32 hex
      expect(salt2).toHaveLength(32)
      expect(digest1).toHaveLength(128) // 64 octets → 128 hex
      expect(digest2).toHaveLength(128)
    })
  })

  describe('verifyPassword', () => {
    it('accepte le bon mot de passe', async () => {
      const hash = await hashPassword('correct')
      const result = await verifyPassword('correct', hash)

      expect(result).toBe(true)
    })

    it('rejette un mauvais mot de passe', async () => {
      const hash = await hashPassword('correct')
      const result = await verifyPassword('incorrect', hash)

      expect(result).toBe(false)
    })

    it('est sensible à la casse', async () => {
      const hash = await hashPassword('MonMotDePasse')
      expect(await verifyPassword('monmotdepasse', hash)).toBe(false)
      expect(await verifyPassword('MONMOTDEPASSE', hash)).toBe(false)
      expect(await verifyPassword('MonMotDePasse', hash)).toBe(true)
    })

    it('rejette un hash malformé (pas de $)', async () => {
      expect(await verifyPassword('x', 'pas-un-hash')).toBe(false)
    })

    it('rejette un hash avec un mauvais préfixe', async () => {
      const hash = await hashPassword('x')
      const malformed = hash.replace('scrypt$', 'bcrypt$')

      expect(await verifyPassword('x', malformed)).toBe(false)
    })

    it('rejette un hash vide', async () => {
      expect(await verifyPassword('x', '')).toBe(false)
    })

    it('rejette un hash avec un segment manquant', async () => {
      expect(await verifyPassword('x', 'scrypt$abc')).toBe(false)
    })

    it('rejette un hash avec un salt invalide', async () => {
      expect(await verifyPassword('x', 'scrypt$ZZZ$abc')).toBe(false)
    })

    it('rejette un hash avec un digest de mauvaise longueur', async () => {
      // Salt valide (32 hex), mais digest de 32 hex au lieu de 128
      const shortHash = `scrypt$${'a'.repeat(32)}$${'b'.repeat(32)}`
      expect(await verifyPassword('x', shortHash)).toBe(false)
    })

    it('round-trip : hash puis verify sur plusieurs mots de passe', async () => {
      const passwords = [
        'court',
        'un-peu-plus-long',
        'Avec!Des@Caractères#Spéciaux$123',
        'éàüñ',
        'a'.repeat(200),
      ]

      for (const pwd of passwords) {
        const hash = await hashPassword(pwd)
        expect(await verifyPassword(pwd, hash)).toBe(true)
        expect(await verifyPassword(pwd + 'x', hash)).toBe(false)
      }
    })
  })
})