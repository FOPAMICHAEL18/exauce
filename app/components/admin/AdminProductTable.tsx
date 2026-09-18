'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import {
  Package, Trash2, Edit, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, X,
} from 'lucide-react'
import { DeleteModal } from '../ui/Modal/DeleteModal'
import { apiCall } from '@/app/lib/api'
import { formatPrice } from '@/app/lib/utils'

interface ProductRow {
  id: number
  title: string
  price: number
  slug: string
  stockStatus: string
  category: { name: string }
}

interface AdminProductTableProps {
  products: ProductRow[]
  currentSearch: string
  currentCategory: string
  currentStatus: string
  currentPage: number
  totalPages: number
}

// 🔧 Truncate la pagination : 1 … 4 5 6 … 20
const buildPageList = (current: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)

  return pages
}

const AdminProductTable = ({
  products,
  currentSearch,
  currentCategory,
  currentStatus,
  currentPage,
  totalPages,
}: AdminProductTableProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [loadingPage, setLoadingPage] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [productToDelete, setProductToDelete] = useState<{ id: number; title: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 🔧 Reset UNIQUEMENT quand la nouvelle page arrive réellement
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
    if (currentSearch.trim()) params.set('search', currentSearch.trim())
    if (currentCategory) params.set('category', currentCategory)
    if (currentStatus) params.set('status', currentStatus)
    params.set('page', newPage.toString())

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const openDeleteModal = (id: number, title: string) => {
    setError(null)
    setProductToDelete({ id, title })
  }

  const closeDeleteModal = () => setProductToDelete(null)

  const confirmDelete = async () => {
    if (!productToDelete) return
    const { id } = productToDelete
    setDeletingId(id)
    closeDeleteModal()

    try {
      const response = await apiCall<{ id: number }>(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        startTransition(() => router.refresh())
      } else {
        // 🔧 On garde le message de l'API (au lieu d'un alert générique)
        setError(response.message || 'Erreur lors de la suppression du produit.')
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
      {/* Bandeau d'erreur (remplace alert) */}
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

      {productToDelete && (
        <DeleteModal
          elementToDelete={productToDelete.title}
          closeDeleteModal={closeDeleteModal}
          confirmDelete={confirmDelete}
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
              <span>Chargement de la page {loadingPage ?? currentPage}...</span>
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

        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="font-medium">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3.5 font-semibold">PRODUIT</th>
                  <th className="px-4 py-3.5 font-semibold">CATÉGORIE</th>
                  <th className="px-4 py-3.5 font-semibold">PRIX</th>
                  <th className="px-4 py-3.5 font-semibold text-center">STATUT</th>
                  <th className="px-4 py-3.5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                          <Package className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <Link
                          href={`/Admin/Products/${product.id}/Edit`}
                          className="hover:underline text-gray-800 font-medium line-clamp-1"
                        >
                          {product.title}
                        </Link>
                      </div>
                    </td>
                    <td className="text-gray-600 px-4 py-3">
                      {product.category?.name || 'Sans catégorie'}
                    </td>
                    <td className="font-medium text-gray-900 px-4 py-3 whitespace-nowrap">
                      {formatPrice(product.price)}
                    </td>
                    <td className="text-center px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stockStatus === 'disponible'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {product.stockStatus === 'disponible' ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/Admin/Products/${product.id}/Edit`}
                          className="p-1.5 text-gray-500"
                          aria-label={`Modifier ${product.title}`}
                        >
                          <Edit className="w-4 h-4 hover:text-blue-600" aria-hidden="true" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(product.id, product.title)}
                          disabled={deletingId === product.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Supprimer ${product.title}`}
                        >
                          {deletingId === product.id ? (
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
          aria-label="Pagination des produits"
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

export default AdminProductTable