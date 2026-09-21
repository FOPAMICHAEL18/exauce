import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/app/test/mocks/prisma'
import { PUT, GET } from './route'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

const ADMIN_HEADER = JSON.stringify({ id: 1, email: 'admin@test.com' })

const VALID_ADDRESS = '12 rue des Fleurs, Douala'
const VALID_PHONE = '+237 600 000 000'
const VALID_EMAIL = 'contact@example.com'

type ContactData = {
  id: number
  address: string
  phone: string
  whatsapp: string | null
  email: string
  hours: string | null
  socials: string | null
  latitude: number | null
  longitude: number | null
  updatedAt: string
}

type SuccessContact = { success: true; message?: string; data: ContactData }
type ErrorResponse = { success: false; message: string }
type ApiResponse = SuccessContact | ErrorResponse

function createRequest(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
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

  return new NextRequest('http://localhost/api/admin/contact', {
    method: 'PUT',
    headers,
    body,
  })
}

async function callPUT(options: {
  body?: unknown
  adminHeader?: string | null
  rawBody?: string
} = {}): Promise<{ status: number; json: ApiResponse }> {
  const response = await PUT(createRequest(options))
  return {
    status: response.status,
    json: (await response.json()) as ApiResponse,
  }
}

function makeContact(overrides: Partial<{
  id: number
  address: string
  phone: string
  email: string
  whatsapp: string | null
  hours: string | null
  socials: string | null
  latitude: number | null
  longitude: number | null
  updatedAt: Date
}> = {}) {
  return {
    id: 1,
    address: VALID_ADDRESS,
    phone: VALID_PHONE,
    whatsapp: null,
    email: VALID_EMAIL,
    hours: null,
    socials: null,
    latitude: null,
    longitude: null,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

const SELECT_CONTACT = {
  id: true,
  address: true,
  phone: true,
  whatsapp: true,
  email: true,
  hours: true,
  socials: true,
  latitude: true,
  longitude: true,
  updatedAt: true,
} as const

const VALID_BODY = {
  address: VALID_ADDRESS,
  phone: VALID_PHONE,
  email: VALID_EMAIL,
}

describe('PUT /api/admin/contact', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('met à jour un contact existant', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(
      makeContact({ address: 'Ancienne', phone: '000' }) as never,
    )
    prismaMock.contact.update.mockResolvedValueOnce(makeContact() as never)

    const { status, json } = await callPUT({ body: VALID_BODY })

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    if (!json.success) throw new Error('devrait réussir')
    expect(json.data.address).toBe(VALID_ADDRESS)
    expect(json.data.phone).toBe(VALID_PHONE)
    expect(json.data.email).toBe(VALID_EMAIL)

    expect(prismaMock.contact.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        address: VALID_ADDRESS,
        phone: VALID_PHONE,
        email: VALID_EMAIL,
        whatsapp: null,
        hours: null,
        socials: null,
        latitude: null,
        longitude: null,
      },
      select: SELECT_CONTACT,
    })
    expect(prismaMock.contact.create).not.toHaveBeenCalled()
  })

  it('crée un contact si aucun n’existe', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null)
    prismaMock.contact.create.mockResolvedValueOnce(makeContact() as never)

    const { status, json } = await callPUT({ body: VALID_BODY })

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(prismaMock.contact.create).toHaveBeenCalledWith({
      data: {
        address: VALID_ADDRESS,
        phone: VALID_PHONE,
        email: VALID_EMAIL,
        whatsapp: null,
        hours: null,
        socials: null,
        latitude: null,
        longitude: null,
      },
      select: SELECT_CONTACT,
    })
    expect(prismaMock.contact.update).not.toHaveBeenCalled()
  })

  it('trim les chaînes', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null)
    prismaMock.contact.create.mockResolvedValueOnce(makeContact() as never)

    await callPUT({
      body: {
        address: '  12 rue  ',
        phone: '  +237  ',
        email: '  a@b.com  ',
      },
    })

    expect(prismaMock.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          address: '12 rue',
          phone: '+237',
          email: 'a@b.com',
        }),
      }),
    )
  })

  it('convertit les chaînes vides optionnelles en null', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null)
    prismaMock.contact.create.mockResolvedValueOnce(makeContact() as never)

    await callPUT({
      body: {
        ...VALID_BODY,
        whatsapp: '',
        hours: '   ',
        socials: '',
      },
    })

    expect(prismaMock.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          whatsapp: null,
          hours: null,
          socials: null,
        }),
      }),
    )
  })

  it('accepte des coordonnées numériques valides', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null)
    prismaMock.contact.create.mockResolvedValueOnce(makeContact() as never)

    await callPUT({
      body: { ...VALID_BODY, latitude: 4.05, longitude: 9.7 },
    })

    expect(prismaMock.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ latitude: 4.05, longitude: 9.7 }),
      }),
    )
  })

  it('accepte des coordonnées en chaîne numérique', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null)
    prismaMock.contact.create.mockResolvedValueOnce(makeContact() as never)

    await callPUT({
      body: { ...VALID_BODY, latitude: '4.05', longitude: '-9.7' },
    })

    expect(prismaMock.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ latitude: 4.05, longitude: -9.7 }),
      }),
    )
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const { status, json } = await callPUT({
      adminHeader: null,
      body: VALID_BODY,
    })

    expect(status).toBe(401)
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.contact.findFirst).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le corps est un tableau', async () => {
    const { status } = await callPUT({ body: [1, 2, 3] })

    expect(status).toBe(400)
    expect(prismaMock.contact.findFirst).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le corps n’est pas du JSON', async () => {
    const { status, json } = await callPUT({ rawBody: '{pas du json' })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Corps de requête invalide',
    })
  })

  it('renvoie 400 si l’adresse est vide', async () => {
    const { status, json } = await callPUT({
      body: { ...VALID_BODY, address: '   ' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse et téléphone sont requis.',
    })
  })

  it('renvoie 400 si le téléphone est vide', async () => {
    const { status, json } = await callPUT({
      body: { ...VALID_BODY, phone: '' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse et téléphone sont requis.',
    })
  })

  it('renvoie 400 si l’email est invalide', async () => {
    const { status, json } = await callPUT({
      body: { ...VALID_BODY, email: 'pas-un-email' },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Adresse email invalide.',
    })
  })

  it('renvoie 400 si l’email est vide', async () => {
    const { status } = await callPUT({
      body: { ...VALID_BODY, email: '' },
    })

    expect(status).toBe(400)
  })

  it('renvoie 400 si le téléphone dépasse 30 caractères', async () => {
    const { status, json } = await callPUT({
      body: { ...VALID_BODY, phone: '1'.repeat(31) },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le téléphone ne doit pas dépasser 30 caractères',
    })
  })

  it('renvoie 400 si le WhatsApp dépasse 30 caractères', async () => {
    const { status, json } = await callPUT({
      body: { ...VALID_BODY, whatsapp: '1'.repeat(31) },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: 'Le WhatsApp ne doit pas dépasser 30 caractères',
    })
  })

  it('renvoie 400 si l’email dépasse 255 caractères', async () => {
    const longEmail = `${'a'.repeat(250)}@x.com`
    const { status, json } = await callPUT({
      body: { ...VALID_BODY, email: longEmail },
    })

    expect(status).toBe(400)
    expect(json).toEqual({
      success: false,
      message: "L'email ne doit pas dépasser 255 caractères",
    })
  })

  it('ignore les coordonnées hors bornes (utilise le fallback)', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(
      makeContact({ latitude: 5, longitude: 5 }) as never,
    )
    prismaMock.contact.update.mockResolvedValueOnce(makeContact() as never)

    await callPUT({
      body: { ...VALID_BODY, latitude: 999, longitude: -999 },
    })

    expect(prismaMock.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ latitude: 5, longitude: 5 }),
      }),
    )
  })

  it('ignore une coordonnée non numérique (utilise le fallback)', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(
      makeContact({ latitude: 4, longitude: null }) as never,
    )
    prismaMock.contact.update.mockResolvedValueOnce(makeContact() as never)

    await callPUT({
      body: { ...VALID_BODY, latitude: 'pas un nombre', longitude: '12abc' },
    })

    expect(prismaMock.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ latitude: 4, longitude: null }),
      }),
    )
  })

  it('conserve les valeurs existantes si le champ est absent du body', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(
      makeContact({
        address: 'Rue existante',
        phone: '111',
        email: 'old@x.com',
        whatsapp: 'wa-old',
      }) as never,
    )
    prismaMock.contact.update.mockResolvedValueOnce(makeContact() as never)

    await callPUT({ body: {} })

    expect(prismaMock.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          address: 'Rue existante',
          phone: '111',
          email: 'old@x.com',
          whatsapp: 'wa-old',
        }),
      }),
    )
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.contact.findFirst.mockRejectedValueOnce(new Error('DB down'))

    const { status } = await callPUT({ body: VALID_BODY })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API contact PUT:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.contact.findFirst.mockRejectedValueOnce('boom')

    const { status } = await callPUT({ body: VALID_BODY })

    expect(status).toBe(500)
    expect(console.error).toHaveBeenCalledWith('Erreur API contact PUT:', 'boom')
  })
})

describe('GET /api/admin/contact', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('renvoie le contact existant', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(makeContact() as never)

    const response = await GET(createRequest())
    expect(response.status).toBe(200)

    const json = (await response.json()) as ApiResponse
    expect(json.success).toBe(true)
    if (!json.success) throw new Error('devrait réussir')
    expect(json.data.address).toBe(VALID_ADDRESS)

    expect(prismaMock.contact.findFirst).toHaveBeenCalledWith({
      select: SELECT_CONTACT,
    })
  })

  it('renvoie 404 si aucun contact', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null)

    const response = await GET(createRequest())
    expect(response.status).toBe(404)

    const json = (await response.json()) as ApiResponse
    expect(json).toEqual({
      success: false,
      message: 'Coordonnées non trouvées',
    })
  })

  it('renvoie 500 si Prisma plante', async () => {
    prismaMock.contact.findFirst.mockRejectedValueOnce(new Error('DB down'))

    const response = await GET(createRequest())
    expect(response.status).toBe(500)

    const json = (await response.json()) as ApiResponse
    expect(json).toEqual({
      success: false,
      message: 'Erreur interne du serveur',
    })
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API contact GET:',
      'DB down',
    )
  })

  it('renvoie 500 pour une erreur non-Error', async () => {
    prismaMock.contact.findFirst.mockRejectedValueOnce('boom')

    const response = await GET(createRequest())
    expect(response.status).toBe(500)

    const json = (await response.json()) as ApiResponse
    expect(json.success).toBe(false)
    expect(console.error).toHaveBeenCalledWith(
      'Erreur API contact GET:',
      'boom',
    )
  })

  it('renvoie 401 si le header admin est absent', async () => {
    const response = await GET(createRequest({ adminHeader: null }))

    expect(response.status).toBe(401)
    const json = (await response.json()) as ApiResponse
    expect(json).toEqual({ success: false, message: 'Non autorisé' })
    expect(prismaMock.contact.findFirst).not.toHaveBeenCalled()
    })
})