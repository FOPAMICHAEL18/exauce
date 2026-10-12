"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminSidebar from '../layout/AdminSidebar'
import AdminHeader from '../layout/AdminHeader'
import { useAuth } from '@/app/contexts/AuthContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { isAuthenticated, loading } = useAuth()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)


   useEffect(() => {
        if (!loading && !isAuthenticated && pathname !== '/Admin/Login') {
            router.push('/Admin/Login')
        }
    }, [loading, isAuthenticated, pathname, router])

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div
                role="status"
                aria-label="Chargement de l'administration"
                className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1730]'
                />
            </div>
        )
    }

    if (pathname === '/Admin/Login') {
        return <>{children}</>
    }

    if (!isAuthenticated) return null

    return (
        <div className='flex h-screen bg-gray-100 overflow-hidden relative'>
            {isSidebarOpen && (
                <div
                    data-testid="sidebar-overlay"
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