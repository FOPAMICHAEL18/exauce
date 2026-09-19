'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquareText, Trash2, Edit, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from 'lucide-react'
import { apiCall } from '@/app/lib/api'
import { buildPageList } from '@/app/lib/utils'
import { DeleteModal } from '../ui/Modal/DeleteModal'

interface CategoryRow {
  id: number
  name: string
  slug: string
  product: { title: string }[]
  _count: { product: number }
}

interface AdminCategoryTableProps {
  currentPage: number
  totalPages: number
  categories: CategoryRow[]
}

const AdminCategoryTable = ({ currentPage, totalPages, categories }: AdminCategoryTableProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [loadingPage, setLoadingPage] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 🔧 Reset UNIQUEMENT quand la nouvelle page arrive
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

  const openDeleteModal = (id: number, name: string) => {
    setError(null)
    setCategoryToDelete({ id, name })
  }

  const closeDeleteModal = () => setCategoryToDelete(null)

  // 🎯 Id passé directement — plus de garde morte
  const confirmDelete = async (id: number) => {
    setDeletingId(id)
    closeDeleteModal()

    try {
      const response = await apiCall<{ id: number }>(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        startTransition(() => router.refresh())
      } else {
        setError(response.message || 'Erreur lors de la suppression de la catégorie.')
      }
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setDeletingId(null)
    }
  }

  const pageItems = buildPageList(currentPage, totalPages)

  return (
    <div className="space-y-4 relative">
      {/* Bandeau d'erreur */}
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

      {categoryToDelete && (
        <DeleteModal
          elementToDelete={categoryToDelete.name}
          closeDeleteModal={closeDeleteModal}
          confirmDelete={() => confirmDelete(categoryToDelete.id)}
        />
      )}

      <div
        className="bg-white rounded-lg border border-gray-200 overflow-hidden relative flex flex-col py-16 px-10 gap-3"
        aria-busy={isLoading || isPending}
      >
        <h2 className="font-bold text-xl">Catégories existantes</h2>

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

        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="font-medium">Aucune catégorie trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3.5 font-semibold">NOM</th>
                  <th className="px-4 py-3.5 font-semibold">PRODUITS</th>
                  <th className="px-4 py-3.5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                          <MessageSquareText className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <Link
                          href={`/Admin/Categories/${category.id}/Edit`}
                          className="hover:underline text-gray-800 font-medium line-clamp-1"
                        >
                          {category.name}
                        </Link>
                      </div>
                    </td>
                    <td className="text-gray-600 px-4 py-3">
                      {category._count.product || 0}
                    </td>
                    <td className="text-right px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/Admin/Categories/${category.id}/Edit`}
                          className="p-1.5 text-gray-500"
                          aria-label={`Modifier ${category.name}`}
                        >
                          <Edit className="w-4 h-4 hover:text-blue-600" aria-hidden="true" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(category.id, category.name)}
                          disabled={deletingId === category.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Supprimer ${category.name}`}
                        >
                          {deletingId === category.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" aria-hidden="true" />
                          ) : (
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1 pt-2"
          aria-label="Pagination des catégories"
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" aria-hidden="true" />
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

export default AdminCategoryTable