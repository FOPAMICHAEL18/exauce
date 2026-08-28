'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquareText, Trash2, Edit, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiCall } from '@/app/lib/api'

interface CategoriesDataProps {
    id: number
    name: string
    slug: string
    product: {
        title: string
    }[]
    _count: {
        product: number
    }
}

interface AdminCategoryTableProps {
    currentPage: number,
    totalPages: number,
    categories: CategoriesDataProps[]
}

const AdminCategoryTable = ({currentPage, totalPages, categories} : AdminCategoryTableProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()
    const [loadingPage, setLoadingPage] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    // Reset l'indicateur dès que la nouvelle page s'affiche
    useEffect(() => {
        setLoadingPage(null)
    }, [currentPage, categories])

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

        // 1. Retour visuel instantané au clic
        setLoadingPage(newPage)
        
        const params = new URLSearchParams()
        params.set('page', newPage.toString())

        // 2. Navigation Next.js
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    const handleDelete = async (categoryId: number) => {
        if (!confirm('Voulez-vous vraiment supprimer cette categorie ?')) return
        setDeletingId(categoryId)

        try {
            const response = await apiCall<any>(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })
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

    const isLoading = loadingPage !== null

    return (
        <div className='space-y-4 relative'>
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden relative flex flex-col py-16 px-10 gap-3'>
                <h2 className='font-bold text-xl'>Categories existante</h2>
                
                {/* Overlay immédiat au changement de page */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all">
                        <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Chargement de la page {loadingPage ?? currentPage}...</span>
                        </div>
                    </div>
                )}

                {/* Overlay immédiat au changement de page du a la suppression d'un produit*/}
                {isPending !== isLoading  && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30 transition-all">
                        <div className="flex items-center gap-2 bg-[#0A1730] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>suppression de la categorie...</span>
                        </div>
                    </div>
                )}

                {categories.length === 0 ? (
                    <div className='p-8 text-center text-gray-400'>
                        <p className="font-medium">Aucune categorie trouvée</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className='w-full text-sm text-left border-collapse'>
                            <thead>
                                <tr className='text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50'>
                                    <th className='px-4 py-3.5 font-semibold'>NOM</th>
                                    <th className='px-4 py-3.5 font-semibold'>PRODUITS</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.map((category) => (
                                    <tr key={category.id} className='hover:bg-gray-50/80 transition-colors'>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                                    <MessageSquareText className="w-5 h-5" />
                                                </div>
                                                <Link href={`/Admin/Products/${category.id}/Edit`} className='hover:underline text-gray-800 font-medium line-clamp-1'>
                                                    {category.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className='text-gray-600 px-10 py-3 '>{category._count.product || 0}</td>
                                        <td className='text-right px-4 py-3 whitespace-nowrap'>
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/Admin/Categories/${category.id}/Edit`} className="p-1.5 text-gray-500 hover:text-blue-600">
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(category.id)} disabled={deletingId === category.id} className="p-1.5 text-gray-500 hover:text-red-600">
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

export default AdminCategoryTable