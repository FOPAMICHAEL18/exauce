"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminSidebar from '../layout/AdminSidebar'
import AdminHeader from '../layout/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Vérifie l'auth à chaque changement de route. C'est ce qui permet
    // à AdminLayout de voir le token que LoginForm vient d'écrire.
    useEffect(() => {
        setIsMounted(true)

        const token = localStorage.getItem('adminToken')

        if (!token) {
            setIsAuthenticated(false)
            return
        }

        try {
            const base64Url = token.split('.')[1]
            if (!base64Url) throw new Error('bad token')
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
            const decoded = JSON.parse(atob(padded)) as { id?: number }
            setIsAuthenticated(typeof decoded.id === 'number')
        } catch {
            localStorage.removeItem('adminToken')
            setIsAuthenticated(false)
        }
    }, [pathname]) // ← LA clé : relance à chaque navigation

    // Redirection
    useEffect(() => {
        if (
            isMounted &&
            isAuthenticated === false &&
            pathname !== '/Admin/Login'
        ) {
            router.push('/Admin/Login')
        }
    }, [isMounted, isAuthenticated, pathname, router])

    // Chargement initial (avant la première vérif)
    if (!isMounted || isAuthenticated === null) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div role="status" aria-label="Chargement de l'administration" className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1730]'></div>
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