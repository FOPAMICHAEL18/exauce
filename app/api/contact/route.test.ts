// app/api/contact/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'
import { prismaMock } from '@/app/test/mocks/prisma'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

// Type de la réponse attendue
interface ContactResponse {
  success: boolean
  message?: string
  data?: {
    id: number
    address: string
    phone: string
    email: string
    whatsapp: string | null
    hours: string | null
    socials: string | null
    latitude: number | null
    longitude: number | null
    createdAt: Date
    updatedAt: Date
  }
}

const mockContact = {
  id: 1,
  address: 'Makepe misoke',
  phone: '699043872',
  email: 'contact@boutique.com',
  whatsapp: null,
  hours: null,
  socials: null,
  latitude: null,
  longitude: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('GET /api/contact', () => {
  it('retourne 200 avec les données', async () => {
    prismaMock.contact.findFirst.mockResolvedValue(mockContact)

    const response = await GET()
    expect(response.status).toBe(200)

    const body = (await response.json()) as ContactResponse
    expect(body.success).toBe(true)
    expect(body.data?.address).toBe('Makepe misoke')
  })

  it('retourne 404 si aucun contact', async () => {
    prismaMock.contact.findFirst.mockResolvedValue(null)

    const response = await GET()
    expect(response.status).toBe(404)

    const body = (await response.json()) as ContactResponse
    expect(body.success).toBe(false)
    expect(body.message).toMatch(/coordonnées non trouvées/i)
  })

  it('retourne 500 si Prisma échoue', async () => {
    prismaMock.contact.findFirst.mockRejectedValue(new Error('DB down'))

    const response = await GET()
    expect(response.status).toBe(500)

    const body = (await response.json()) as ContactResponse
    expect(body.success).toBe(false)
  })

  it('retourne 500 si Prisma throw une valeur non-Error', async () => {
    prismaMock.contact.findFirst.mockRejectedValue('boom')

    const response = await GET()
    expect(response.status).toBe(500)
  })

  it('retourne du JSON (Content-Type)', async () => {
    prismaMock.contact.findFirst.mockResolvedValue(mockContact)

    const response = await GET()
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})