'use client'
import Link from "next/link"
import { useState, useEffect } from "react"
import Navlink from "../ui/Navlink"
import { Menu, X } from 'lucide-react';


const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    const navItems = [
        { href: '/', label: 'Accueil' },
        { href: '/Catalogue', label: 'Catalogue' },
        { href: '/Comment-ca-marche', label: 'Comment ça marche' },
        { href: '/A-propos', label: 'À propos' },
        { href: '/Contact', label: 'Contact' }
    ]

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Si le menu mobile est ouvert, on force la visibilité du header
            if (isMenuOpen) {
                setIsVisible(true)
                return
            }

            // Si l'utilisateur remonte (scroll UP) ou est tout en haut de page (< 10px)
            if (currentScrollY < lastScrollY || currentScrollY < 10) {
                setIsVisible(true)
            } 
            // Si l'utilisateur descend (scroll DOWN) et qu'on a dépassé 50px de hauteur
            else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY, isMenuOpen])

    return (
        <header className={`bg-white border-b border-gray-100 z-50 w-full transition-transform duration-300 ease-in-out sticky top-0 left-0 ${isVisible ? 'translate-y-0' : '-translate-y-full'} lg:relative lg:translate-y-0`}>
            <div className="container mx-auto p-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-amber-700">
                    exauce
                </Link>
                <nav className="hidden lg:flex gap-6">
                    {navItems.map((item, index) => (
                        <Navlink key={index} href={item.href} exact={false} activeClassName="text-[#0A1730] font-semibold after:w-full " className="relative py-2 text-gray-600 hover:text-[#0A1730] after:absolute after:bottom-0 after:left-0 after:h-0.75 after:w-0 after:bg-[#0A1730] after:rounded-full hover:after:w-full after:transition-all after:duration-300 after:ease-in-out">
                            {item.label}
                        </Navlink>
                    ))}
                </nav>
                <Link href="/Admin/Login" className="hidden lg:inline-block bg-[#0A1730] px-4 py-2 rounded-md hover:bg-[#0A1730]/90 transition-colors font-medium text-sm">
                    <span className="text-white">Espace vendeur</span>
                </Link>
                <button className="lg:hidden p-2 text-gray-700 hover:text-[#0A1730] focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div 
                className={`
                    lg:hidden bg-white border-t border-gray-100 overflow-hidden transition-all duration-300 ease-in-out shadow-lg
                    ${isMenuOpen ? 'max-h-96 opacity-100 px-4 pt-2 pb-6' : 'max-h-0 opacity-0 px-4 py-0 border-none'}
                `}
            >
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Navlink 
                            key={item.href} 
                            href={item.href} 
                            exact={false} 
                            activeClassName="text-[#0A1730] font-semibold bg-gray-50" 
                            className="px-3 py-2 rounded-md text-gray-600 hover:text-[#0A1730] hover:bg-gray-50 transition-colors"
                        >
                            {item.label}
                        </Navlink>
                    ))}
                </nav>

                <Link 
                    href="/Admin/Login" 
                    className="block w-full text-center bg-[#0A1730] px-4 py-2.5 rounded-lg hover:bg-[#0A1730]/90 transition-colors font-medium text-sm mt-4"
                >
                    <span className="text-white">Espace vendeur</span>
                </Link>
            </div>
        </header>
    )
}

export default Header