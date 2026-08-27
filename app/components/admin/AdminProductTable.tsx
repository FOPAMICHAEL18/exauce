'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Package, Trash2, Edit, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface AdminProductTableProps {
    products: {
        id: number
        title: string
        price: number 
        slug: string
        stockStatus: string
        category: {
            name: string
        }
    }[]
    currentSearch: string
    currentCategory: string
    currentStatus: string
    currentPage: number
    totalPages: number
}

const AdminProductTable = ({
    products,
    currentSearch,
    currentCategory,
    currentStatus,
    currentPage,
    totalPages
}: AdminProductTableProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()
    const [loadingPage, setLoadingPage] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    // Reset l'indicateur dès que la nouvelle page s'affiche
    useEffect(() => {
        setLoadingPage(null)
    }, [currentPage, products])

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

        // 1. Retour visuel instantané au clic
        setLoadingPage(newPage)
        
        const params = new URLSearchParams()
        if (currentSearch.trim()) params.set('search', currentSearch.trim())
        if (currentCategory) params.set('category', currentCategory)
        if (currentStatus) params.set('status', currentStatus)
        params.set('page', newPage.toString())

        // 2. Navigation Next.js
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    const handleDelete = async (productId: number) => {
        if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return
        setDeletingId(productId)

        try {
            const response = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
            if (response.ok) {
                router.refresh()
            } else {
                alert('Erreur lors de la suppression')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setDeletingId(null)
        }
    }

    const isLoading = isPending || loadingPage !== null

    return (
        <div className='space-y-4 relative'>
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative'>
                
                {/* Overlay immédiat au changement de page */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all">
                        <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Chargement de la page {loadingPage ?? currentPage}...</span>
                        </div>
                    </div>
                )}

                {products.length === 0 ? (
                    <div className='p-8 text-center text-gray-400'>
                        <p className="font-medium">Aucun produit trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className='w-full text-sm text-left border-collapse'>
                            <thead>
                                <tr className='text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50/80'>
                                    <th className="px-4 py-3.5 w-10 text-center">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#0A1730] focus:ring-0" />
                                    </th>
                                    <th className='px-4 py-3.5 font-semibold'>PRODUIT</th>
                                    <th className='px-4 py-3.5 font-semibold'>CATÉGORIE</th>
                                    <th className='px-4 py-3.5 font-semibold'>PRIX</th>
                                    <th className='px-4 py-3.5 font-semibold text-center'>STATUT</th>
                                    <th className='px-4 py-3.5 font-semibold text-right'>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((product) => (
                                    <tr key={product.id} className='hover:bg-gray-50/80 transition-colors'>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" className="rounded border-gray-300 text-[#0A1730] focus:ring-0" />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <Link href={`/Admin/Products/${product.id}/edit`} className='hover:underline text-gray-800 font-medium line-clamp-1'>
                                                    {product.title}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className='text-gray-600 px-4 py-3'>{product.category?.name || 'Sans catégorie'}</td>
                                        <td className='font-medium text-gray-900 px-4 py-3 whitespace-nowrap'>
                                            {Number(product.price).toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className='text-center px-4 py-3 whitespace-nowrap'>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.stockStatus === 'disponible' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {product.stockStatus === 'disponible' ? 'Publié' : 'Brouillon'}
                                            </span>
                                        </td>
                                        <td className='text-right px-4 py-3 whitespace-nowrap'>
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/Admin/Products/${product.id}/edit`} className="p-1.5 text-gray-500 hover:text-blue-600">
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="p-1.5 text-gray-500 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Pagination Dynamique */}
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

export default AdminProductTable