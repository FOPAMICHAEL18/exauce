import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/app/test/mocks/prisma'
import { GET, PUT } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

// Import après le mock pour récupérer la version mockée.
import bcrypt from 'bcryptjs'

const ADMIN_ID = 42
// Le JWT signé par le login a maintenant la clé `id` (pas `adminId`).
const ADMIN_HEADER = JSON.stringify({ id: ADMIN_ID, email: 'admin@test.com' })

const VALID_NAME = 'Jean'
const VALID_SURNAME = 'Dupont'
const VALID_EMAIL = 'jean@test.com'

type AdminData = {
  id: number
  name: string
  surname: string
  email: string
}

type SuccessResponse = { success: true; data: AdminData }
type ErrorResponse = { success: false; message: string }
type ApiResponse = SuccessResponse | ErrorResponse

function createRequest(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
  method?: 'GET' | 'PUT'
} = {}): NextRequest {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  if (options.adminHeader === null) {
    // pas de header
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

  return new NextRequest('http://localhost/api/admin/profile', {
    method: options.method ?? 'GET',
    headers,
    body,
  })
}

async function callGET(options: {
  adminHeader?: string | null
} = {}): Promise<{ status: number; json: ApiResponse }> {
  const response = await GET(createRequest({ ...options, method: 'GET' }))
  return { status: response.status, json: (await response.json()) as ApiResponse }
}

async function callPUT(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
} = {}): Promise<{ status: number; json: ApiResponse }> {
  const response = await PUT(createRequest({ ...options, method: 'PUT' }))
  return { status: response.status, json: (await response.json()) as ApiResponse }
}

// Représente l'admin tel que Prisma le renverrait sans `select`.
function makeAdmin(overrides: Partial<{
  id: number
  name: string
  surname: string
  email: string
  passwordHash: string
}> = {}) {
  return {
    id: ADMIN_ID,
    name: VALID_NAME,
    surname: VALID_SURNAME,
    email: VALID_EMAIL,
    passwordHash: '$2a$10$hash',
    ...overrides,
  }
}

// Version restreinte au `select` de la route.
function makeSelectedAdmin(overrides: Partial<AdminData> = {}): AdminData {
  return {
    id: ADMIN_ID,
    name: VALID_NAME,
    surname: VALID_SURNAME,
    email: VALID_EMAIL,
    ...overrides,
  }
}

describe('GET /api/admin/profile', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('renvoie le profil admin', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(
      makeSelectedAdmin() as never,
    )

    const { status, json } = await callGET()

    expect(status).toBe(200)
    expect(json).toEqual({ success: true, data: makeSelectedAdmin() })

    expect(prismaMock.admin.findUnique).toHaveBeenCalledWith({
      where: { id: ADMIN_ID },
      select: { id: true, email: true, name: true, surname: true },
    })
  })

  it('utilise `id` du JWT (pas `adminId`)', async () => {
    // Test critique : le payload JWT contient `id`, pas `adminId`.
    prismaMock.admin.findUnique.mockResolvedValueOnce(
      makeSelectedAdmin() as never,
    )

    await callGET()

    const call = prismaMock.admin.findUnique.mock.calls[0]?.[0]
    expect(call?.where).toEqual({ id: ADMIN_ID })
    expect(call?.where).not.toHaveProperty('adminId')
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callGET({ adminHeader: null })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.admin.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 404 si l’admin n’existe plus', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callGET()

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Administrateur non trouvé',
    })
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.admin.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callGET()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur GET /api/admin/profile:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.admin.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callGET()

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur GET /api/admin/profile:',
      'boom',
    )
  })
})

describe('PUT /api/admin/profile', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(bcrypt.compare).mockReset()
    vi.mocked(bcrypt.hash).mockReset()
  })

  it('met à jour name uniquement', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    prismaMock.admin.update.mockResolvedValueOnce(
      makeSelectedAdmin({ name: 'Nouveau' }) as never,
    )

    const { status, json } = await callPUT({ body: { name: 'Nouveau' } })

    expect(status).toBe(200)
    expect(json).toEqual({
      success: true,
      data: makeSelectedAdmin({ name: 'Nouveau' }),
    })

    expect(prismaMock.admin.update).toHaveBeenCalledWith({
      where: { id: ADMIN_ID },
      data: { name: 'Nouveau' },
      select: { id: true, name: true, surname: true, email: true },
    })
    // bcrypt ne doit pas être touché pour un simple changement de nom.
    expect(bcrypt.compare).not.toHaveBeenCalled()
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  it('met à jour name + surname + email', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    prismaMock.admin.update.mockResolvedValueOnce(
      makeSelectedAdmin({
        name: 'Marie',
        surname: 'Curie',
        email: 'marie@test.com',
      }) as never,
    )

    const { status } = await callPUT({
      body: { name: 'Marie', surname: 'Curie', email: 'marie@test.com' },
    })

    expect(status).toBe(200)
    expect(prismaMock.admin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Marie',
          surname: 'Curie',
          email: 'marie@test.com',
        },
      }),
    )
  })

  it('change le mot de passe quand currentPassword est correct', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2a$10$newhash' as never)
    prismaMock.admin.update.mockResolvedValueOnce(makeSelectedAdmin() as never)

    const { status } = await callPUT({
      body: {
        currentPassword: 'ancien-mdp',
        newPassword: 'nouveau-mdp-long',
      },
    })

    expect(status).toBe(200)
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'ancien-mdp',
      '$2a$10$hash',
    )
    expect(bcrypt.hash).toHaveBeenCalledWith('nouveau-mdp-long', 10)
    expect(prismaMock.admin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { passwordHash: '$2a$10$newhash' },
      }),
    )
  })

  it('trim name et surname mais PAS les mots de passe', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2a$10$newhash' as never)
    prismaMock.admin.update.mockResolvedValueOnce(makeSelectedAdmin() as never)

    await callPUT({
      body: {
        name: '  Marie  ',
        currentPassword: '  ancien  ',
        newPassword: '  nouveau  ',
      },
    })

    expect(bcrypt.compare).toHaveBeenCalledWith('  ancien  ', '$2a$10$hash')
    expect(bcrypt.hash).toHaveBeenCalledWith('  nouveau  ', 10)
    expect(prismaMock.admin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Marie' }),
      }),
    )
  })

  it('ignore les champs identiques à la valeur existante', async () => {
    // Si on envoie name = name existant, on ne veut pas d’update inutile.
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)

    const { status, json } = await callPUT({ body: { name: VALID_NAME } })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Aucune modification détectée',
    })
    expect(prismaMock.admin.update).not.toHaveBeenCalled()
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status } = await callPUT({
      adminHeader: null,
      body: { name: 'X' },
    })

    expect(status).toBe(401)
    expect(prismaMock.admin.findUnique).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le corps n’est pas du JSON', async () => {
    const { status, json } = await callPUT({ rawBody: '{pas du json' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('renvoie 400 si le corps est un tableau', async () => {
    const { status } = await callPUT({ body: [1, 2, 3] })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le name dépasse 100 caractères', async () => {
    const { status } = await callPUT({ body: { name: 'a'.repeat(101) } })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le surname dépasse 100 caractères', async () => {
    const { status } = await callPUT({ body: { surname: 'a'.repeat(101) } })

    expect(status).toBe(400)
  })

  it('renvoie 400 si l’email est mal formé', async () => {
    const { status, json } = await callPUT({
      body: { email: 'pas-un-email' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse email invalide',
    })
  })

  it('renvoie 400 si l’email dépasse 255 caractères', async () => {
    const { status } = await callPUT({
      body: { email: `${'a'.repeat(250)}@x.com` },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si currentPassword est fourni sans newPassword', async () => {
    const { status, json } = await callPUT({
      body: { currentPassword: 'ancien' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'currentPassword et newPassword doivent être fournis ensemble',
    })
    expect(prismaMock.admin.update).not.toHaveBeenCalled()
  })

  it('renvoie 400 si newPassword est fourni sans currentPassword', async () => {
    const { status } = await callPUT({
      body: { newPassword: 'nouveau-mdp-long' },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le nouveau mot de passe est trop court', async () => {
    const { status, json } = await callPUT({
      body: { currentPassword: 'ancien', newPassword: 'a' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nouveau mot de passe doit faire entre 8 et 128 caractères',
    })
  })

  it('renvoie 400 si le nouveau mot de passe dépasse 128 caractères', async () => {
    const { status } = await callPUT({
      body: { currentPassword: 'ancien', newPassword: 'a'.repeat(129) },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si currentPassword est incorrect', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)

    const { status, json } = await callPUT({
      body: { currentPassword: 'mauvais', newPassword: 'nouveau-mdp-long' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Mot de passe actuel incorrect',
    })
    expect(prismaMock.admin.update).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le nouveau mot de passe est identique à l’actuel', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)

    const { status, json } = await callPUT({
      body: {
        currentPassword: 'meme-mdp',
        newPassword: 'meme-mdp',
      },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le nouveau mot de passe doit être différent de l’actuel',
    })
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  it('renvoie 404 si l’admin n’existe plus', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(null)

    const { status, json } = await callPUT({ body: { name: 'X' } })

    expect(status).toBe(404)
    expect(json).toEqual({
      success: false,
      message: 'Administrateur non trouvé',
    })
  })

  it('renvoie 400 si aucun champ modifié', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)

    const { status, json } = await callPUT({ body: {} })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Aucune modification détectée',
    })
  })

  it('renvoie 409 en cas de conflit unique sur l’email', async () => {
    prismaMock.admin.findUnique.mockResolvedValueOnce(makeAdmin() as never)
    prismaMock.admin.update.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`email`)'),
    )

    const { status, json } = await callPUT({
      body: { email: 'autre@test.com' },
    })

    expect(status).toBe(409)
    expect(json).toEqual({
      success: false,
      message: 'Cet email est déjà utilisé.',
    })
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.admin.findUnique.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPUT({ body: { name: 'X' } })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur PUT /api/admin/profile:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.admin.findUnique.mockRejectedValueOnce('boom')

    const { status } = await callPUT({ body: { name: 'X' } })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur PUT /api/admin/profile:',
      'boom',
    )
  })
})