import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import {
  parseAdminHeader,
  getAdminFromRequest,
  requireAdmin,
  type AdminData,
} from './admin-auth'

const VALID_ADMIN: AdminData = { id: 1, email: 'admin@test.com' }
const VALID_HEADER = JSON.stringify(VALID_ADMIN)

// Construit une NextRequest avec le header x-admin-data donné.
function makeRequest(headerValue?: string): NextRequest {
  const headers = new Headers()
  if (headerValue !== undefined) {
    headers.set('x-admin-data', headerValue)
  }
  return new NextRequest('http://localhost/api/admin/test', {
    method: 'GET',
    headers,
  })
}

describe('parseAdminHeader', () => {
  it('renvoie null si le header est null', () => {
    expect(parseAdminHeader(null)).toBeNull()
  })

  it('renvoie null si le header est une chaîne vide', () => {
    expect(parseAdminHeader('')).toBeNull()
  })

  it('renvoie null si le JSON est invalide', () => {
    expect(parseAdminHeader('{pas du json')).toBeNull()
  })

  it('renvoie null si le JSON est un tableau', () => {
    expect(parseAdminHeader('[1,2,3]')).toBeNull()
  })

  it('renvoie null si le JSON est une primitive', () => {
    expect(parseAdminHeader('42')).toBeNull()
    expect(parseAdminHeader('"admin"')).toBeNull()
    expect(parseAdminHeader('true')).toBeNull()
  })

  it('renvoie null si id manque', () => {
    expect(parseAdminHeader(JSON.stringify({ email: 'a@b.com' }))).toBeNull()
  })

  it('renvoie null si email manque', () => {
    expect(parseAdminHeader(JSON.stringify({ id: 1 }))).toBeNull()
  })

  it('renvoie null si id n’est pas un number', () => {
    expect(parseAdminHeader(JSON.stringify({ id: '1', email: 'a@b.com' }))).toBeNull()
  })

  it('renvoie null si email n’est pas une string', () => {
    expect(parseAdminHeader(JSON.stringify({ id: 1, email: 42 }))).toBeNull()
  })

  it('renvoie les données valides quand tout est correct', () => {
    expect(parseAdminHeader(VALID_HEADER)).toEqual(VALID_ADMIN)
  })

  it('ignore les champs supplémentaires', () => {
    const header = JSON.stringify({ ...VALID_ADMIN, role: 'super' })
    expect(parseAdminHeader(header)).toEqual(VALID_ADMIN)
  })
})

describe('getAdminFromRequest', () => {
  it('renvoie null si le header est absent', () => {
    expect(getAdminFromRequest(makeRequest())).toBeNull()
  })

  it('renvoie null si le header est malformé', () => {
    expect(getAdminFromRequest(makeRequest('{pas du json'))).toBeNull()
  })

  it('renvoie les données admin quand le header est valide', () => {
    expect(getAdminFromRequest(makeRequest(VALID_HEADER))).toEqual(VALID_ADMIN)
  })
})

describe('requireAdmin', () => {
  it('renvoie ok:false + une réponse 401 si aucun admin', async () => {
    const result = requireAdmin(makeRequest())

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('devrait être ok:false')

    expect(result.response.status).toBe(401)
    await expect(result.response.json()).resolves.toEqual({
      success: false,
      message: 'Non autorisé',
    })
  })

  it('renvoie ok:false si le payload est invalide', () => {
    const result = requireAdmin(makeRequest(JSON.stringify({ id: 1 })))
    expect(result.ok).toBe(false)
  })

  it('renvoie ok:true + admin quand tout est valide', () => {
    const result = requireAdmin(makeRequest(VALID_HEADER))

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('devrait être ok:true')

    expect(result.admin).toEqual(VALID_ADMIN)
  })
})