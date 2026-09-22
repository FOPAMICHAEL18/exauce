'use client'

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

const handleUnauthorized = () => {
  localStorage.removeItem('adminToken')
  if (!window.location.pathname.includes('/Admin/Login')) {
    window.location.href = '/Admin/Login'
  }
}

export const apiCall = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('adminToken')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(endpoint, { ...options, headers })
    const data = (await response.json().catch(() => ({}))) as Record<string, any>

    if (!response.ok || data.success === false) {
      if (response.status === 401) {
        const isLoginEndpoint = endpoint.includes('/api/admin/login')

        if (response.status === 401 && !isLoginEndpoint) {
          handleUnauthorized()
          return {
            success: false,
            message: 'Votre session a expiré. Veuillez vous reconnecter.',
          }
        }
      }

      return {
        success: false,
        message: data.message || data.error || 'Une erreur serveur est survenue.',
      }
    }

    return {
      success: true,
      data: data.data !== undefined ? (data.data as T) : (data as T),
      message: data.message,
    }
  } catch {
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
    }
  }
}