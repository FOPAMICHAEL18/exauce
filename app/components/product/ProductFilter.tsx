'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { formatPrice } from '@/app/lib/utils'

interface Category {
  id: number
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
}

const DEFAULT_MAX_PRICE = 500_000
const MIN_PRICE = 5_000
const MAX_PRICE = 1_000_000
const DEBOUNCE_MS = 400

// 🎯 Extraite pour testabilité pure
export const parseMaxPrice = (priceParam: string): number => {
  const parts = priceParam.split('-')
  const parsed = parts[1] ? Number(parts[1]) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_PRICE
}

const ProductFilter = ({ categories }: ProductFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategory = searchParams.get('categorie') || ''
  const selectedStatus = searchParams.get('status') || ''
  const currentPrice = searchParams.get('price') || `0-${DEFAULT_MAX_PRICE}`
  const [isPending, startTransition] = useTransition()

  const [maxPrice, setMaxPrice] = useState(() => parseMaxPrice(currentPrice))

  // 🔧 Sync URL → slider (back/forward navigateur)
  useEffect(() => {
    setMaxPrice(parseMaxPrice(currentPrice))
  }, [currentPrice])

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    startTransition(() => {
      router.push(`/Catalogue?${params.toString()}`)
    })
  }

  // 🔧 Debounce : pousse l'URL après 400ms d'inactivité (souris + clavier)
  useEffect(() => {
    if (maxPrice === parseMaxPrice(currentPrice)) return

    const timer = setTimeout(() => {
      updateParam('price', `0-${maxPrice}`)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPrice])

  const handleReset = () => {
    startTransition(() => {
      router.push('/Catalogue')
    })
  }

  return (
    <aside
      className={`w-full lg:w-64 space-y-8 bg-white p-6 rounded-xl border border-gray-100 h-fit transition-opacity ${
        isPending ? 'opacity-70' : 'opacity-100'
      }`}
      aria-busy={isPending}
    >
      {/* Catégories */}
      <fieldset>
        <legend className="font-semibold text-[#0A1730] mb-4">Catégories</legend>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-[#0A1730]">
            <input
              type="radio"
              name="category"
              disabled={isPending}
              checked={selectedCategory === ''}
              onChange={() => updateParam('categorie', null)}
              className="accent-[#1B5E38]"
            />
            <span>Toutes</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-[#0A1730]"
            >
              <input
                type="radio"
                name="category"
                disabled={isPending}
                checked={selectedCategory === cat.slug}
                onChange={() => updateParam('categorie', cat.slug)}
                className="accent-[#1B5E38]"
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Prix */}
      <fieldset>
        <legend className="font-semibold text-[#0A1730] mb-4">
          Prix max (FCFA)
        </legend>
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={MIN_PRICE}
          disabled={isPending}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Prix maximum"
          className="w-full accent-[#1B5E38]"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
          <span>0 FCFA</span>
          <span>{formatPrice(maxPrice)}</span>
        </div>
      </fieldset>

      {/* Disponibilité */}
      <fieldset>
        <legend className="font-semibold text-[#0A1730] mb-4">Disponibilité</legend>
        <div className="space-y-2 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              disabled={isPending}
              checked={selectedStatus === ''}
              onChange={() => updateParam('status', null)}
              className="accent-[#1B5E38]"
            />
            <span>Tous</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              disabled={isPending}
              checked={selectedStatus === 'disponible'}
              onChange={() => updateParam('status', 'disponible')}
              className="accent-[#1B5E38]"
            />
            <span>En stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              disabled={isPending}
              checked={selectedStatus === 'rupture'}
              onChange={() => updateParam('status', 'rupture')}
              className="accent-[#1B5E38]"
            />
            <span>Sur commande</span>
          </label>
        </div>
      </fieldset>

      <button
        onClick={handleReset}
        disabled={isPending}
        className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
      >
        Réinitialiser les filtres
      </button>
    </aside>
  )
}

export { ProductFilter }
export default ProductFilter