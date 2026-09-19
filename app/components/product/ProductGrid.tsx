'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState, useTransition, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import { buildPageList } from '@/app/lib/utils'

interface Product {
  id: number
  title: string
  price: number
  slug: string
  image?: { url: string }[]
  stockStatus: string
  category: { name: string }
}

interface ProductGridProps {
  products: Product[]
  filteredCount: number
  totalPages: number
  currentPage: number
}

const SEARCH_DEBOUNCE_MS = 300

const ProductGrid = ({
  products,
  filteredCount,
  totalPages,
  currentPage,
}: ProductGridProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loadingPage, setLoadingPage] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')

  // 🔒 Évite le reset du champ search à chaque render
  const initialRender = useRef(true)

  // 🔧 Sync URL → input (back/forward navigateur)
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    setSearchTerm(searchParams.get('search') || '')
  }, [searchParams])

  // 🔧 Reset loadingPage UNIQUEMENT quand la nouvelle page arrive
  useEffect(() => {
    if (loadingPage !== null && currentPage === loadingPage) {
      setLoadingPage(null)
    }
  }, [currentPage, loadingPage])

  const isLoading = loadingPage !== null

  // 🎯 Debounce : pousse l'URL 300ms après la dernière frappe
  useEffect(() => {
    const currentTerm = searchParams.get('search') || ''
    if (searchTerm.trim() === currentTerm) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = searchTerm.trim()
      if (trimmed) params.set('search', trimmed)
      else params.delete('search')
      params.set('page', '1')
      startTransition(() => {
        router.push(`/Catalogue?${params.toString()}`)
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const changePage = (page: number) => {
    setLoadingPage(page)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    startTransition(() => {
      router.push(`/Catalogue?${params.toString()}`)
    })
  }

  const pageItems = buildPageList(currentPage, totalPages)

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
        <p className="text-sm font-medium text-gray-500" role="status">
          <span className="text-[#0A1730] font-bold">{filteredCount}</span>{' '}
          résultat(s) trouvé(s)
        </p>

        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Rechercher un produit"
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1B5E38]"
          />
          {isPending && (
            <div
              className="absolute right-3 text-gray-400 top-1/2 -translate-y-1/2"
              role="status"
              aria-label="Recherche en cours"
            >
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
          <p className="text-gray-500">
            Aucun produit ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1 pt-2"
          aria-label="Pagination des produits"
        >
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            aria-label="Page précédente"
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
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
                onClick={() => changePage(item)}
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
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            aria-label="Page suivante"
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}

export default ProductGrid