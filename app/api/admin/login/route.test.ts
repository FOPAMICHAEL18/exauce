import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { verifyPassword } from '@/app/lib/password'
import { signToken } from '@/app/lib/jwt'
import { prismaMock } from '@/app/test/mocks/prisma'
import { POST } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('@/app/lib/password', () => ({
  verifyPassword: vi.fn(),
}))

vi.mock('@/app/lib/jwt', () => ({
  signToken: vi.fn(),
}))

const VALID_EMAIL = 'admin@test.com'
const VALID_PASSWORD = 'motdepasse123'
const ADMIN_ID = 42

type SuccessResponse = {
  success: true
  data: {
    token: string
    admin: { id: number; email: string; name: string }
  }
}
type ErrorResponse = { success: false; message: string }
type LoginResponse = SuccessResponse | ErrorResponse

function createRequest(body: unknown, rawBody?: string): Request {
  return new Request('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody !== undefined ? rawBody : JSON.stringify(body),
  })
}

async function callPOST(
  body: unknown,
  rawBody?: string,
): Promise<{ status: number; json: LoginResponse }> {
  const response = await POST(createRequest(body, rawBody))
  return {
    status: response.status,
    json: (await response.json()) as LoginResponse,
  }
}

function makeAdmin(overrides: Partial<{
  id: number
  email: string
  name: string
  passwordHash: string
}> = {}) {
  return {
    id: ADMIN_ID,
    email: VALID_EMAIL,
    name: 'Admin',
    passwordHash: 'scrypt$fake$fake',
    ...overrides,
  }
}

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(signToken).mockResolvedValue('fake.jwt.token')
  })

  it('connecte un admin avec des identifiants valides', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(true)

    const { status, json } = await callPOST({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })

    expect(status).toBe(200)
    expect(json).toEqual({
      success: true,
      data: {
        token: 'fake.jwt.token',
        admin: { id: ADMIN_ID, email: VALID_EMAIL, name: 'Admin' },
      },
    })

    expect(prismaMock.admin.findUnique).toHaveBeenCalledWith({
      where: { email: VALID_EMAIL },
      select: { id: true, email: true, name: true, passwordHash: true },
    })

    expect(verifyPassword).toHaveBeenCalledWith(VALID_PASSWORD, 'scrypt$fake$fake')
    expect(signToken).toHaveBeenCalledWith({ id: ADMIN_ID, email: VALID_EMAIL })
  })

  it('signe un JWT avec la clé `id` (pas `adminId`)', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(true)

    await callPOST({ email: VALID_EMAIL, password: VALID_PASSWORD })

    const call = vi.mocked(signToken).mock.calls[0]?.[0]
    expect(call).toHaveProperty('id', ADMIN_ID)
    expect(call).not.toHaveProperty('adminId')
  })

  it('normalise l’email (trim + lowercase)', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(true)

    await callPOST({ email: '  ADMIN@TEST.COM  ', password: VALID_PASSWORD })

    expect(prismaMock.admin.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: VALID_EMAIL } }),
    )
  })

  it('ne modifie PAS le mot de passe (pas de trim)', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(true)

    await callPOST({ email: VALID_EMAIL, password: '  motdepasse  ' })

    expect(verifyPassword).toHaveBeenCalledWith('  motdepasse  ', 'scrypt$fake$fake')
  })

  it('renvoie 400 si le corps n’est pas du JSON', async () => {
    const { status, json } = await callPOST(null, '{pas du json')

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('renvoie 400 si le corps est null', async () => {
    const { status } = await callPOST(null, 'null')
    expect(status).toBe(400)
  })

  it('renvoie 400 si le corps est un tableau', async () => {
    const { status } = await callPOST([1, 2, 3])

    expect(status).toBe(400)
    expect(prismaMock.admin.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si email est absent', async () => {
    const { status, json } = await callPOST({ password: VALID_PASSWORD })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Email et mot de passe requis',
    })
  })

  it('renvoie 400 si password est absent', async () => {
    const { status } = await callPOST({ email: VALID_EMAIL })
    expect(status).toBe(400)
  })

  it('renvoie 400 si email est une chaîne vide', async () => {
    const { status } = await callPOST({ email: '', password: VALID_PASSWORD })
    expect(status).toBe(400)
  })

  it('renvoie 400 si password est une chaîne vide', async () => {
    const { status } = await callPOST({ email: VALID_EMAIL, password: '' })
    expect(status).toBe(400)
  })

  it('renvoie 400 si email n’est pas une chaîne', async () => {
    const { status } = await callPOST({ email: 123, password: VALID_PASSWORD })
    expect(status).toBe(400)
  })

  it('renvoie 400 si email dépasse 255 caractères', async () => {
    const longEmail = `${'a'.repeat(250)}@x.com`
    const { status, json } = await callPOST({
      email: longEmail,
      password: VALID_PASSWORD,
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: "L'email ne doit pas dépasser 255 caractères",
    })
  })

  it('renvoie 400 si password dépasse 128 caractères', async () => {
    const { status, json } = await callPOST({
      email: VALID_EMAIL,
      password: 'a'.repeat(129),
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le mot de passe doit faire entre 1 et 128 caractères',
    })
  })

  it('renvoie 400 si email est mal formé', async () => {
    const { status, json } = await callPOST({
      email: 'pas-un-email',
      password: VALID_PASSWORD,
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse email invalide',
    })
    expect(prismaMock.admin.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 401 si l’email est inconnu', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(null)
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)

    const { status, json } = await callPOST({
      email: 'inconnu@test.com',
      password: VALID_PASSWORD,
    })

    expect(status).toBe(401)
    expect(json).toEqual({
      success: false,
      message: 'Email ou mot de passe incorrect',
    })
  })

  it('fait un verifyPassword factice si l’admin n’existe pas (anti timing)', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(null)
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)

    await callPOST({ email: 'inconnu@test.com', password: VALID_PASSWORD })

    expect(verifyPassword).toHaveBeenCalledTimes(1)
    const [, hash] = vi.mocked(verifyPassword).mock.calls[0] ?? []
    expect(hash).toMatch(/^scrypt\$/)
  })

  it('renvoie 401 si le mot de passe est incorrect', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)

    const { status, json } = await callPOST({
      email: VALID_EMAIL,
      password: 'mauvais',
    })

    expect(status).toBe(401)
    expect(json).toEqual({
      success: false,
      message: 'Email ou mot de passe incorrect',
    })
    expect(signToken).not.toHaveBeenCalled()
  })

  it('renvoie exactement le même message pour email inconnu et mauvais mdp', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(null)
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)
    const r1 = await callPOST({ email: 'x@test.com', password: 'a' })

    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)
    const r2 = await callPOST({ email: VALID_EMAIL, password: 'a' })

    expect(r1.status).toBe(r2.status)
    expect(r1.json).toEqual(r2.json)
  })

  it('ne renvoie jamais le passwordHash au client', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockResolvedValueOnce(true)

    const { json } = await callPOST({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })

    expect(json).not.toHaveProperty('data.admin.passwordHash')
    expect(JSON.stringify(json)).not.toContain('passwordHash')
    expect(JSON.stringify(json)).not.toContain('scrypt$fake$fake')
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.admin.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPOST({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith('Erreur API login:', 'DB down')
  })

  it('renvoie 500 si verifyPassword plante', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(verifyPassword).mockRejectedValueOnce(new Error('scrypt failed'))

    const { status } = await callPOST({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API login:',
      'scrypt failed',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.admin.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callPOST({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith('Erreur API login:', 'boom')
  })
})

describe('POST /api/admin/login — sans JWT_SECRET', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('JWT_SECRET', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lance une erreur au chargement si JWT_SECRET est absent', async () => {
    await expect(() => import('./route')).rejects.toThrow(
      "JWT_SECRET est manquant dans les variables d'environnement",
    )
  })
})