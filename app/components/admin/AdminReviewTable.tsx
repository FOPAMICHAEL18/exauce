'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiCall } from '@/app/lib/api'

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
  product: ProductData
}

interface AdminReviewTableProps {
  reviews: ReviewData[]
  totalPages: number
  currentPage: number
}

const AdminReviewTable = ({ reviews, totalPages, currentPage }: AdminReviewTableProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [loadingPage, setLoadingPage] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [modifyId, setModifyId] = useState<number | null>(null)

  useEffect(() => {
    setLoadingPage(null)
  }, [currentPage, reviews])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

    setLoadingPage(newPage)
    const params = new URLSearchParams()
    params.set('page', newPage.toString())

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet avis ?')) return
    setDeletingId(reviewId)

    try {
      const response = await apiCall<{ success: boolean }>(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' })
      if (response.success) {
        startTransition(() => {
          router.refresh()
        })
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleModify = async (review: ReviewData) => {
    const actionText = review.status === 'published' ? 'masquer' : 'publier'
    if (!confirm(`Voulez-vous vraiment ${actionText} cet avis ?`)) return
    
    setModifyId(review.id)

    try {
      const response = await apiCall<{ success: boolean }>(`/api/admin/reviews/${review.id}`, { method: 'PUT' })
      if (response.success) {
        startTransition(() => {
          router.refresh()
        })
      } else {
        alert('Erreur lors du changement de statut')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setModifyId(null)
    }
  }

  const isLoading = loadingPage !== null

  return (
    <div className='space-y-4 relative'>
      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative'>
        
        {/* Overlay pour chargement de page */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all">
            <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement de la page {loadingPage ?? currentPage}...</span>
            </div>
          </div>
        )}

        {/* Overlay pour mise à jour de données (suppression ou masquage) */}
        {isPending && !isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all">
            <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mise à jour en cours...</span>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className='p-8 text-center text-gray-400'>
            <p className="font-medium">Aucun avis trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className='w-full text-sm text-left border-collapse'>
              <thead>
                <tr className='text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50/80'>
                  <th className='px-4 py-3.5 font-semibold'>AUTEUR</th>
                  <th className='px-4 py-3.5 font-semibold'>PRODUIT</th>
                  <th className='px-4 py-3.5 font-semibold'>NOTE</th>
                  <th className='px-4 py-3.5 font-semibold'>COMMENTAIRE</th>
                  <th className='px-4 py-3.5 font-semibold text-center'>STATUT</th>
                  <th className='px-4 py-3.5 font-semibold text-right'>ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className='hover:bg-gray-50/80 transition-colors'>
                    <td className="px-4 py-3 font-medium text-gray-900">{review.author}</td>
                    <td className='text-gray-600 px-4 py-3'>{review.product.title}</td>
                    <td className='font-medium text-gray-900 px-4 py-3 whitespace-nowrap'>
                      <span className='text-[#0A1730] text-sm'>
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                    </td>
                    <td className='text-gray-600 px-4 py-3 max-w-xs'>
                      <p className='line-clamp-2 leading-snug'>
                        {review.comment}
                      </p>
                    </td>
                    <td className='text-center px-4 py-3 whitespace-nowrap'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {review.status === 'published' ? 'Publié' : 'En attente'}
                      </span>
                    </td>
                    <td className='text-right px-4 py-3 whitespace-nowrap'>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleModify(review)} 
                          disabled={modifyId === review.id || deletingId === review.id} 
                          className="p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                        >
                          {modifyId === review.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : review.status === 'published' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                        <button 
                          onClick={() => handleDelete(review.id)} 
                          disabled={deletingId === review.id || modifyId === review.id} 
                          className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingId === review.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              className={`px-3 py-1.5 border rounded-md text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                currentPage === page
                  ? 'border-[#0A1730] bg-[#0A1730] text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {loadingPage === page ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : (
                page
              )}
            </button>
          ))}

          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminReviewTable