'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@/app/lib/api'

export interface AuthAdmin {
  id: number
  email: string
  name: string
}

interface LoginResponse {
  token: string
  admin: AuthAdmin
}

interface AuthContextValue {
  admin: AuthAdmin | null
  isAuthenticated: boolean
  loading: boolean
  isSubmitting: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthAdmin | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        if (!base64Url) throw new Error('bad token')
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
        const decoded = JSON.parse(atob(padded)) as AuthAdmin
        setAdmin(decoded)
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('adminToken')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true)

    try {
      const response = await apiCall<LoginResponse>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (!response.success || !response.data) {
        return {
          success: false,
          message: response.message || 'Identifiants incorrects.',
        }
      }

      const { token, admin: adminData } = response.data
      localStorage.setItem('adminToken', token)
      setAdmin(adminData)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setAdmin(null)
    setIsAuthenticated(false)
    router.push('/Admin/Login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{ admin, isAuthenticated, loading, isSubmitting, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}