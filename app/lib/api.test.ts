// app/lib/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiCall } from './api'

const originalLocation = window.location

const setupLocation = (pathname = '/some-page') => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      ...originalLocation,
      origin: 'http://localhost:3000',
      pathname,
      href: 'http://localhost:3000' + pathname,
    },
  })
}

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      ...originalLocation,
      origin: 'http://localhost:3000',
      pathname: '/x',
      href: 'http://localhost:3000/x',
    },
  })
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: originalLocation,
  })
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('apiCall', () => {
  // ===== Succès =====
  it('retourne success:true et data en 200 avec data', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: 1 } }))
    const res = await apiCall<{ id: number }>('/api/x')
    expect(res.success).toBe(true)
    expect(res.data).toEqual({ id: 1 })
  })

  it("retourne l'objet entier si pas de clé data", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ success: true, foo: 'bar' }))
    const res = await apiCall('/api/x')
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ success: true, foo: 'bar' })
  })

  // ===== Headers =====
  it('ajoute Authorization si token présent', async () => {
    localStorage.setItem('adminToken', 'abc')
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ success: true }))
    await apiCall('/api/x')
    const call = (global.fetch as any).mock.calls[0]
    expect(call[1].headers.Authorization).toBe('Bearer abc')
  })

  it("n'ajoute pas Authorization sans token", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ success: true }))
    await apiCall('/api/x')
    const call = (global.fetch as any).mock.calls[0]
    expect(call[1].headers.Authorization).toBeUndefined()
  })

  // ===== 401 =====
  it('redirige vers /Admin/Login sur 401', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, message: 'Non autorisé' }, 401)
    )
    const res = await apiCall('/api/protected')
    expect(res.success).toBe(false)
    expect(res.message).toMatch(/session a expiré/i)
    expect(window.location.href).toBe('/Admin/Login')
  })

  it('ne redirige pas si déjà sur /Admin/Login', async () => {
    setupLocation('/Admin/Login')
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 401))
    await apiCall('/api/x')
    expect(window.location.href).toBe('http://localhost:3000/Admin/Login')
  })

  // ===== data.success === false en 200 =====
  it('traite data.success:false même en HTTP 200', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, message: 'Refusé' })
    )
    const res = await apiCall('/api/x')
    expect(res.success).toBe(false)
    expect(res.message).toBe('Refusé')
  })

  it('utilise data.error en fallback de data.message', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, error: 'Bad request' })
    )
    const res = await apiCall('/api/x')
    expect(res.message).toBe('Bad request')
  })

  it('utilise le message par défaut si ni message ni error', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ success: false }))
    const res = await apiCall('/api/x')
    expect(res.message).toBe('Une erreur serveur est survenue.')
  })

  // ===== Réseau =====
  it('retourne une erreur de connexion si fetch throw', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('boom'))
    const res = await apiCall('/api/x')
    expect(res.success).toBe(false)
    expect(res.message).toBe('Erreur de connexion au serveur')
  })

  it('gère un body non-JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('not-json', { status: 500 }))
    const res = await apiCall('/api/x')
    expect(res.success).toBe(false)
  })
})