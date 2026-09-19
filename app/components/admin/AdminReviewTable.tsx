'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import {
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { apiCall } from '@/app/lib/api'
import { buildPageList } from '@/app/lib/utils'
import { DeleteModal } from '../ui/Modal/DeleteModal'

interface ProductData {
  title: string
}

interface ReviewData {
  id: number
  author: string
  email: string
  rating: number
  comment: string
  status: string
  product: ProductData | null // 🎯 nullable
}

interface AdminReviewTableProps {
  reviews: ReviewData[]
  totalPages: number
  currentPage: number
}

// 🎯 Clamp rating pour éviter RangeError
export const clampRating = (rating: number): number => {
  if (!Number.isFinite(rating)) return 0
  return Math.max(0, Math.min(5, Math.round(rating)))
}

const AdminReviewTable = ({
  reviews,
  totalPages,
  currentPage,
}: AdminReviewTableProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [loadingPage, setLoadingPage] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [modifyId, setModifyId] = useState<number | null>(null)
  const [reviewToDelete, setReviewToDelete] = useState<{
    id: number
    author: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 🔧 Reset loadingPage UNIQUEMENT quand la nouvelle page arrive
  useEffect(() => {
    if (loadingPage !== null && currentPage === loadingPage) {
      setLoadingPage(null)
    }
  }, [currentPage, loadingPage])

  const isLoading = loadingPage !== null

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

    setLoadingPage(newPage)
    const params = new URLSearchParams()
    params.set('page', newPage.toString())

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const openDeleteModal = (id: number, author: string) => {
    setError(null)
    setReviewToDelete({ id, author })
  }

  const closeDeleteModal = () => setReviewToDelete(null)

  const confirmDelete = async (id: number) => {
    setDeletingId(id)
    closeDeleteModal()

    try {
      const response = await apiCall<{ id: number }>(
        `/api/admin/reviews/${id}`,
        { method: 'DELETE' }
      )
      if (response.success) {
        startTransition(() => router.refresh())
      } else {
        setError(response.message || 'Erreur lors de la suppression.')
      }
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleModify = async (id: number) => {
    setModifyId(id)
    setError(null)

    try {
      const response = await apiCall<{ id: number }>(
        `/api/admin/reviews/${id}`,
        { method: 'PUT' }
      )
      if (response.success) {
        startTransition(() => router.refresh())
      } else {
        setError(response.message || 'Erreur lors du changement de statut.')
      }
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setModifyId(null)
    }
  }

  const pageItems = buildPageList(currentPage, totalPages)

  return (
    <div className="space-y-4 relative">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-red-100"
            aria-label="Fermer le message d'erreur"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {reviewToDelete && (
        <DeleteModal
          elementToDelete={reviewToDelete.author}
          closeDeleteModal={closeDeleteModal}
          confirmDelete={() => confirmDelete(reviewToDelete.id)}
        />
      )}

      <div
        className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative"
        aria-busy={isLoading || isPending}
      >
        {isLoading && (
          <div
            role="status"
            className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all"
          >
            <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Chargement de la page {loadingPage}...</span>
            </div>
          </div>
        )}

        {isPending && !isLoading && (
          <div
            role="status"
            className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all"
          >
            <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Mise à jour en cours...</span>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="font-medium">Aucun avis trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3.5 font-semibold">AUTEUR</th>
                  <th className="px-4 py-3.5 font-semibold">PRODUIT</th>
                  <th className="px-4 py-3.5 font-semibold">NOTE</th>
                  <th className="px-4 py-3.5 font-semibold">COMMENTAIRE</th>
                  <th className="px-4 py-3.5 font-semibold text-center">STATUT</th>
                  <th className="px-4 py-3.5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => {
                  const rating = clampRating(review.rating)
                  const isBusy = modifyId === review.id || deletingId === review.id
                  return (
                    <tr
                      key={review.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {review.author}
                      </td>
                      <td className="text-gray-600 px-4 py-3">
                        {review.product?.title ?? 'Produit supprimé'}
                      </td>
                      <td className="font-medium text-gray-900 px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-[#0A1730] text-sm"
                          aria-label={`Note : ${rating} sur 5`}
                        >
                          {'★'.repeat(rating)}
                          {'☆'.repeat(5 - rating)}
                        </span>
                      </td>
                      <td className="text-gray-600 px-4 py-3 max-w-xs">
                        <p className="line-clamp-2 leading-snug">
                          {review.comment}
                        </p>
                      </td>
                      <td className="text-center px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            review.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {review.status === 'published'
                            ? 'Publié'
                            : 'En attente'}
                        </span>
                      </td>
                      <td className="text-right px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleModify(review.id)}
                            disabled={isBusy}
                            className="p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                            aria-label={
                              review.status === 'published'
                                ? `Masquer l'avis de ${review.author}`
                                : `Publier l'avis de ${review.author}`
                            }
                          >
                            {modifyId === review.id ? (
                              <Loader2
                                className="w-4 h-4 animate-spin text-blue-600"
                                aria-hidden="true"
                              />
                            ) : review.status === 'published' ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>

                          <button
                            onClick={() => openDeleteModal(review.id, review.author)}
                            disabled={isBusy}
                            className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
                            aria-label={`Supprimer l'avis de ${review.author}`}
                          >
                            {deletingId === review.id ? (
                              <Loader2
                                className="w-4 h-4 animate-spin text-red-600"
                                aria-hidden="true"
                              />
                            ) : (
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1 pt-2"
          aria-label="Pagination des avis"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          {pageItems.map((item, idx) =>
            item === '…' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-400 text-xs"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                onClick={() => handlePageChange(item)}
                disabled={isLoading}
                aria-label={`Page ${item}`}
                aria-current={currentPage === item ? 'page' : undefined}
                className={`px-3 py-1.5 border rounded-md text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                  currentPage === item
                    ? 'border-[#0A1730] bg-[#0A1730] text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {loadingPage === item ? (
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin mx-auto"
                    aria-hidden="true"
                  />
                ) : (
                  item
                )}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}

export default AdminReviewTable