'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import ProductCard from './ProductCard'

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

const ProductGrid = ({ products, filteredCount, totalPages, currentPage }: ProductGridProps) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loadingPage, setLoadingPage] = useState<number | null>(null)
    const [isPending, startTransition] = useTransition() //C'est un Hook React. Il donne isPending (qui vaut true pendant que la nouvelle page charge sur le serveur) et startTransition (qui permet de lancer la mise à jour sans bloquer l'interface).

    // Reset l'indicateur dès que la nouvelle page s'affiche
    useEffect(() => {
        setLoadingPage(null)
    }, [currentPage, products])

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (term) {
            params.set('search', term)
        } else {
            params.delete('search')
        }
        params.set('page', '1')
        startTransition(() => {
            router.push(`/Catalogue?${params.toString()}`)
        })
    }

    const changePage = (page: number) => {
        setLoadingPage(page)
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        startTransition(() => {
            router.push(`/Catalogue?${params.toString()}`)
        })
    }

    const isLoading = loadingPage !== null

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500">
                    <span className="text-[#0A1730] font-bold">{filteredCount}</span> résultat(s) trouvé(s)
                </p>

                {/* Recherche à la place du tri */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        defaultValue={searchParams.get('search') || ''}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1B5E38]"
                    />
                    {isPending && (
                        <div className="absolute right-3 text-gray-400 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
            {products.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
                    <p className="text-gray-500">Aucun produit ne correspond à votre recherche.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                    <button 
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => changePage(page)}
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
                        onClick={() => changePage(currentPage + 1)}
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

export default ProductGrid