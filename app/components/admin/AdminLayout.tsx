"use client"

import {usePathname, useRouter} from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminSidebar from '../layout/AdminSidebar'
import AdminHeader from '../layout/AdminHeader'
import { useAuth } from '@/app/hooks/useAuth'

export default function AdminLayout({children}: {children: React.ReactNode}) {
    const pathname= usePathname()
    const {loading, isAuthenticated} = useAuth()


    //Ecran de chargement 
    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1730]'></div>
            </div>
        )
    }
    //Si on est sur la page Admin on affiche uniquement la page
    if (pathname === '/Admin/Login') {
        return (
            <>
                {children}
            </>
        )
    }

    //On affiche rien sur lsi l'utilisateur n'est pas authentifier
    if (!isAuthenticated) {
        return null
    }

    //Le layout complet 
    return (
        <div className='flex h-screen bg-gray-100'>  
            <AdminSidebar />
            <div className='flex flex-col flex-1 overflow-hidden'>
                <AdminHeader />
                <main className=''>
                    {children}
                </main>
            </div>
        </div>
    )
}