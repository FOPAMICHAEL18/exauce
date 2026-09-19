'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@/app/lib/api'
import { Loader2 } from 'lucide-react'

interface InitialData {
  id?: number
  name: string
}

interface AdminCategoryFormProps {
  initialData?: InitialData
}

interface CategoryResponse {
  id: number
  name: string
  slug: string
}

const REDIRECT_DELAY_MS = 1500
const SUCCESS_HIDE_MS = 3000

const AdminCategoryForm = ({ initialData }: AdminCategoryFormProps) => {
  const router = useRouter()
  const isEditing = !!initialData

  const [name, setName] = useState(initialData?.name || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 🔒 Évite les redirections multiples / après unmount
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-hide du message de succès après 3s
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(false), SUCCESS_HIDE_MS)
    return () => clearTimeout(timer)
  }, [success])

  // 🎯 Cleanup du timer de redirection si le composant unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `/api/admin/categories/${initialData!.id}`
        : '/api/admin/categories'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await apiCall<CategoryResponse>(url, {
        method,
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.success) {
        setError(response.message || 'Une erreur est survenue.')
        return
      }

      setSuccess(true)

      if (!isEditing) {
        redirectTimerRef.current = setTimeout(() => {
          router.push('/Admin/Categories')
        }, REDIRECT_DELAY_MS)
      }
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // 🎯 Annule toute redirection en attente
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    router.push('/Admin/Categories')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl mx-auto space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-sm"
        >
          Catégorie {isEditing ? 'mise à jour' : 'créée'} avec succès !
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-gray-800">
          {isEditing ? 'Éditer la catégorie' : 'Nouvelle catégorie'}
        </h2>

        <div className="space-y-1.5">
          <label htmlFor="category-name" className="text-xs font-semibold text-gray-700">
            Nom de la catégorie
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la catégorie"
            disabled={isSubmitting}
            required
            className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800 disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#11293C] hover:bg-[#0A1730] text-white py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{isEditing ? 'Mettre à jour' : 'Créer la catégorie'}</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </div>
    </form>
  )
}

export default AdminCategoryForm