import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { apiCall } from '@/app/lib/api'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/app/lib/api', () => ({
  apiCall: vi.fn(),
}))

// Wrapper qui enveloppe le hook dans le provider.
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

function makeValidToken(payload: { id: number; email: string; name: string }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

const MOCK_ADMIN = { id: 1, email: 'admin@test.com', name: 'Admin' }

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('restauration au montage', () => {
    it('initialise à non-authentifié si aucun token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.admin).toBeNull()
    })

    it('restaure la session si token valide', async () => {
      localStorage.setItem('adminToken', makeValidToken(MOCK_ADMIN))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.admin).toEqual(MOCK_ADMIN)
    })

    it('nettoie le token corrompu', async () => {
      localStorage.setItem('adminToken', 'token-corrompu')

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('adminToken')).toBeNull()
    })
  })

  describe('login', () => {
    it('met à jour l’état et stocke le token', async () => {
      vi.mocked(apiCall).mockResolvedValueOnce({
        success: true,
        data: {
          token: makeValidToken(MOCK_ADMIN),
          admin: MOCK_ADMIN,
        },
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))

      let loginResult: { success: boolean; message?: string } | undefined
      await act(async () => {
        loginResult = await result.current.login('admin@test.com', 'pwd')
      })

      expect(loginResult).toEqual({ success: true })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.admin).toEqual(MOCK_ADMIN)
      expect(localStorage.getItem('adminToken')).toBeTruthy()
    })

    it('renvoie un échec si l’API refuse', async () => {
      vi.mocked(apiCall).mockResolvedValueOnce({
        success: false,
        message: 'Identifiants incorrects',
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))

      let loginResult: { success: boolean; message?: string } | undefined
      await act(async () => {
        loginResult = await result.current.login('admin@test.com', 'mauvais')
      })

      expect(loginResult?.success).toBe(false)
      expect(loginResult?.message).toBe('Identifiants incorrects')
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('renvoie un échec si la réponse n’a pas de data', async () => {
      vi.mocked(apiCall).mockResolvedValueOnce({ success: true })

      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))

      let loginResult: { success: boolean; message?: string } | undefined
      await act(async () => {
        loginResult = await result.current.login('admin@test.com', 'pwd')
      })

      expect(loginResult?.success).toBe(false)
    })

    it('renvoie un message d’erreur si apiCall throw', async () => {
        vi.mocked(apiCall).mockRejectedValueOnce(new Error('Network down'))

        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.loading).toBe(false))

        let loginResult: { success: boolean; message?: string } | undefined
        await act(async () => {
            loginResult = await result.current.login('a@b.com', 'pwd')
        })

        expect(loginResult?.success).toBe(false)
        expect(loginResult?.message).toBe('Erreur de connexion au serveur')
        expect(result.current.isSubmitting).toBe(false)
        expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('efface le token, reset l’état et redirige', async () => {
      localStorage.setItem('adminToken', makeValidToken(MOCK_ADMIN))

      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.admin).toBeNull()
      expect(localStorage.getItem('adminToken')).toBeNull()
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login')
    })
  })

  describe('erreur de contexte manquant', () => {
    it('lance une erreur si useAuth est utilisé hors du provider', () => {
      // On ne wrappe PAS avec AuthProvider
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth doit être utilisé dans <AuthProvider>',
      )
    })
  })
})