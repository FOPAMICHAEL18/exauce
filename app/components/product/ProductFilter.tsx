'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'

interface Category {
    id: number
    name: string
    slug: string
}

interface ProductFiltersProps {
    categories: Category[]
}

const ProductFilter = ({ categories }: ProductFiltersProps) => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const selectedCategory = searchParams.get('categorie') || ''
    const selectedStatus = searchParams.get('status') || ''
    const currentPrice = searchParams.get('price') || '0-500000'
    const [isPending, startTransition] = useTransition() //C'est un Hook React. Il donne isPending (qui vaut true pendant que la nouvelle page charge sur le serveur) et startTransition (qui permet de lancer la mise à jour sans bloquer l'interface).

    const [maxPrice, setMaxPrice] = useState(() => {
        const parts = currentPrice.split('-')
        return parts[1] ? Number(parts[1]) : 500000
    })

    // Met à jour l'URL lors du changement d'un filtre
    const updateParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.set('page', '1') // Réinitialise la page
        startTransition(() => {
            router.push(`/Catalogue?${params.toString()}`)
        })
    }

    const handleReset = () => {
       startTransition(() => {
            router.push('/Catalogue')
        })
    }

    return (
        <aside className={`w-full lg:w-64 space-y-8 bg-white p-6 rounded-xl border border-gray-100 h-fit transition-opacity ${isPending ? 'opacity-70' : 'opacity-100'}`}>
            <div>
                <h3 className="font-semibold text-[#0A1730] mb-4">Catégories</h3>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-[#0A1730]">
                            <input
                                type="radio"
                                name="category"
                                disabled={isPending}
                                checked={selectedCategory === cat.slug}
                                onChange={() => updateParam('categorie', selectedCategory === cat.slug ? null : cat.slug)}
                                className="accent-[#1B5E38]"
                            />
                            <span>{cat.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-[#0A1730] mb-4">Prix max (FCFA)</h3>
                <input
                    type="range"
                    min="5000"
                    max="1000000"
                    step="5000"
                    disabled={isPending}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    onMouseUp={() => updateParam('price', `0-${maxPrice}`)}
                    onTouchEnd={() => updateParam('price', `0-${maxPrice}`)}
                    className="w-full accent-[#1B5E38]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                    <span>0 FCFA</span>
                    <span>{maxPrice.toLocaleString('fr-FR')} FCFA</span>
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-[#0A1730] mb-4">Disponibilité</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedStatus === 'disponible'}
                            onChange={(e) => updateParam('status', e.target.checked ? 'disponible' : null)}
                            className="accent-[#1B5E38] rounded"
                        />
                        <span>En stock</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedStatus === 'rupture'}
                            onChange={(e) => updateParam('status', e.target.checked ? 'rupture' : null)}
                            className="accent-[#1B5E38] rounded"
                        />
                        <span>Sur commande</span>
                    </label>
                </div>
            </div>
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

export default ProductFilter