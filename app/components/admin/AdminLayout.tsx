"use client"

import {usePathname, useRouter} from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminSidebar from '../layout/AdminSidebar'
import AdminHeader from '../layout/AdminHeader'
import { useAuth } from '@/app/hooks/useAuth'

export default function AdminLayout({children}: {children: React.ReactNode}) {
    const pathname= usePathname()
    const router = useRouter()
    const {loading, isAuthenticated} = useAuth()
    const [isMounted, setIsMounted] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    useEffect(() => {
        setIsMounted(true);
    }, [])

    // Redirection propre
    useEffect(() => {
        if (isMounted && !loading && !isAuthenticated && pathname !== '/Admin/Login') {
            router.push('/Admin/Login')
        }
    }, [isMounted, loading, isAuthenticated, pathname, router])


    //Ecran de chargement 
    if (loading || !isMounted) {
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
    if (!isAuthenticated) return null

    //Le layout complet 
    return (
        <div className='flex h-screen bg-gray-100 overflow-hidden relative'>
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}  
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className='flex flex-col flex-1 w-full min-w-0 overflow-hidden'>
                <AdminHeader onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className='flex-1 overflow-y-auto p-4 md:p-6 lg:p-8'>
                    {children}
                </main>
            </div>
        </div>
    )
}