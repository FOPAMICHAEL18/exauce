"use client"
import {useRouter} from 'next/navigation'
import {usePathname} from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import Link from 'next/link'
import { Menu, Plus, LogOut } from 'lucide-react'

interface HeaderProps {
    onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: HeaderProps) {
    const pathname= usePathname()
    const {logout} = useAuth()

    // 1. Normalisation en minuscules pour éviter les bugs de casse
    const currentPath = pathname.toLowerCase()

    // 2. Détection dynamique pour l'édition de produit avec ID
    const getTitle = (): string => {
        // Vérifie si le chemin correspond au pattern /admin/products/[id]/edit
        if (/\/admin\/products\/[^/]+\/edit/.test(currentPath)) {
            return 'Modifier le produit'
        }
        if (/\/admin\/categories\/[^/]+\/edit/.test(currentPath)) {
            return 'Modifier la categorie'
        }

        const staticTitles: Record<string, string> = {
            '/admin/dashboard': 'Tableau de bord',
            '/admin/products': 'Produits',
            '/admin/products/new': 'Creer un produits',
            '/admin/categories': 'Gestion des catégories',
            '/admin/categories/new': "Creation d'une catégories",
            '/admin/reviews': 'Commentaires',
            '/admin/contact': 'Coordonnées',
            "/admin/profil": "Profil de l'utilisateur"
        }

        return staticTitles[currentPath] || 'Administration'
    }



    return (
        <header className='bg-white border-b border-gray-200 px-4 md:px-6 py-3.5 flex justify-between items-center gap-4 shrink-0'>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onMenuToggle}
                    className='lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
                    aria-label="Ouvrir le menu"
                >
                    <Menu size={22} />
                </button>
                <h1 className='text-2xl font-bold text-gray-800'>
                    {getTitle()}
                </h1>
            </div>
                
            <div className='flex items-center gap-2'>
                <Link 
                    href='/Admin/Products/New' 
                    className='text-sm bg-[#0A1730] text-white! px-3 py-2 md:px-4 md:py-2.5 rounded-lg hover:bg-[#0A1730]/90 transition-all flex items-center gap-1.5 font-medium shadow-sm'
                >
                    <Plus size={18} />
                    <span className='hidden sm:inline'>Ajouter un produit</span>
                </Link>
                <button 
                    onClick={logout} 
                    className='text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 p-2 md:px-3 md:py-2.5 rounded-lg transition-colors flex items-center gap-2 border border-gray-200'
                    title="Déconnexion"
                >
                    <LogOut size={18} />
                    <span className='hidden sm:inline'>Déconnexion</span>
                </button>
            </div>
        </header>
    )
} 