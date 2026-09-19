'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
}

interface AdminProductFiltersProps {
  search: string
  category: string
  status: string
  categories: Category[]
}

const AdminProductFilters = ({
  search: initialSearch,
  category: initialCategory,
  status: initialStatus,
  categories,
}: AdminProductFiltersProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [status, setStatus] = useState(initialStatus)

  const updateURL = (newSearch: string, newCategory: string, newStatus: string) => {
    const params = new URLSearchParams()
    if (newSearch.trim()) params.set('search', newSearch.trim())
    if (newCategory) params.set('category', newCategory)
    if (newStatus) params.set('status', newStatus)
    params.set('page', '1')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    // 🎯 Recherche déclenchée seulement au vidage (Enter géré via onSubmit)
    if (value === '') updateURL('', category, status)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    updateURL(search, value, status)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateURL(search, category, value)
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        updateURL(search, category, status)
      }}
      className={`relative overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-4 items-center transition-opacity duration-200 ${
        isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="md:col-span-2 relative flex items-center">
        <label htmlFor="filter-search" className="sr-only">
          Rechercher un produit
        </label>
        <input
          id="filter-search"
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Rechercher un produit (Entrée)..."
          aria-label="Rechercher un produit"
          className="bg-white block w-full px-3 py-2 pr-9 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0A1730]"
        />
        {isPending && (
          <div
            role="status"
            aria-label="Recherche en cours"
            className="absolute right-3 text-gray-400"
          >
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="filter-category" className="sr-only">
          Catégorie
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          aria-label="Filtrer par catégorie"
          className="bg-white block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0A1730]"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option value={String(cat.id)} key={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-status" className="sr-only">
          Statut
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          aria-label="Filtrer par statut"
          className="bg-white block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0A1730]"
        >
          <option value="">Tous les statuts</option>
          <option value="disponible">Publié</option>
          <option value="rupture">Brouillon</option>
        </select>
      </div>
    </form>
  )
}

export default AdminProductFilters