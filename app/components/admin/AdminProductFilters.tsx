"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

interface AdminProductFiltersProps {
    search: string
    category: string
    status: string
    categories: {
        id: number
        name: string
        slug: string
    }[]
}

const AdminProductFilters = ({
    search: initialSearch,
    category: initialCategory,
    status: initialStatus,
    categories
}: AdminProductFiltersProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition() //C'est un Hook React. Il donne isPending (qui vaut true pendant que la nouvelle page charge sur le serveur) et startTransition (qui permet de lancer la mise à jour sans bloquer l'interface).

    const [search, setSearch] = useState(initialSearch)
    const [category, setCategory] = useState(initialCategory)
    const [status, setStatus] = useState(initialStatus)

    const updateURL = (newSearch: string, newCategory: string, newStatus: string) => {
        const params = new URLSearchParams()

        if (newSearch.trim()) params.set('search', newSearch.trim())
        if (newCategory) params.set('category', newCategory)
        if (newStatus) params.set('status', newStatus)
        params.set('page', '1') //Quand on filtre, on revient obligatoirement à la page 1. Sinon, si on est à la page 5 et qu'un filtre ne donne que 2 pages de résultats, l'écran afficherait une page vide.

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    return (
        <form 
            onSubmit={(e) => { e.preventDefault(); updateURL(search, category, status); }} 
            className={`relative overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-4 items-center  transition-opacity duration-200 ${isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}
        >

            <div className='md:col-span-2 relative flex items-center'>
                <input 
                    type="search" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder='Rechercher un produit (Entrée)...' 
                    className='bg-white block w-full px-3 py-2 pr-9 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0A1730]' 
                />
                {/* Petit spinner discret directement dans le champ de recherche */}
                {isPending && (
                    <div className="absolute right-3 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                )}
            </div>
            
            <div>
                <select 
                    value={category} 
                    onChange={(e) => { setCategory(e.target.value); updateURL(search, e.target.value, status); }} 
                    className='bg-white block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none  focus:border-[#0A1730]'
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
                <select 
                    value={status} 
                    onChange={(e) => { setStatus(e.target.value); updateURL(search, category, e.target.value); }} 
                    className='bg-white block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none  focus:border-[#0A1730]'
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