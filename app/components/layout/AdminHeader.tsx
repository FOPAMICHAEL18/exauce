"use client"
import {useRouter} from 'next/navigation'
import {usePathname} from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import Link from 'next/link'

export default function AdminHeader() {
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
            '/admin/settings': 'Paramètres',
        }

        return staticTitles[currentPath] || 'Administration'
    }



    return (
        <header className='flex justify-between items-center py-4 px-20'>
            <h1 className='text-2xl font-bold text-gray-800'>
                {getTitle()}
            </h1>

            {/* <div className='flex gap-4'>
                <Link href='/Admin/Products/new' className='text-sm  transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80'>
                    <span className='text-white'>Ajouter un produit</span>
                </Link>
                <Link href='/Admin/Reviews' className='text-sm  transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80'>
                    <span className='text-white'>Gerer les avis</span>
                </Link>
                <Link href='/Admin/Contact' className='text-sm transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80'>
                    <span className='text-white'>Modifier les coordonnees</span> 
                </Link>
            </div> */}

                
            <div className='flex gap-2'>
                <Link href='/Admin/Products/New' className='text-sm  transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80'>
                    <span className='text-white'>+ Ajouter un produit</span>
                </Link>
                <button onClick={logout} className='text-sm text-white transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80'>
                    <span>Deconnexion</span>
                </button>
            </div>
        </header>
    )
} 