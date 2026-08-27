"use client"
import {useRouter} from 'next/navigation'
import {usePathname} from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import Link from 'next/link'

export default function AdminHeader() {
    const pathname= usePathname()
    const {logout} = useAuth()


    const titles: Record<string, string> = {
    '/Admin/Dashboard': 'Tableau de bord',
    '/Admin/Products': 'Produits',
    '/Admin/Categories': 'Catégories',
    '/Admin/Reviews': 'Commentaires',
    '/Admin/Contact': 'Coordonnées',
    '/Admin/Settings': 'Paramètres',
    }

    const value = titles[pathname] || 'Administration'

    return (
        <header className='flex justify-between items-center py-4 px-20'>
            <h1 className='text-2xl font-bold text-gray-800'>
                {value}
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

                
            <button onClick={logout} className='text-sm text-white transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80'>
                <span>Deconnexion</span>
            </button>
        </header>
    )
} 