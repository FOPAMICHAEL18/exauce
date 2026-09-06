'use client'
import Link from "next/link"
import { useState } from "react"
import Navlink from "../ui/Navlink"
import { Menu, X } from 'lucide-react';


const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const navItems = [
        { href: '/', label: 'Accueil' },
        { href: '/catalogue', label: 'Catalogue' },
        { href: '/comment-ca-marche', label: 'Comment ça marche' },
        { href: '/avis-clients', label: 'Avis clients' },
        { href: '/a-propos', label: 'À propos' },
    ]

    return (
        <header className="bg-white">
            <div className="container mx-auto p-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-amber-700">
                    exauce
                </Link>
                <nav className="hidden md:flex gap-6">
                    {navItems.map((item, index) => (
                        <Navlink key={index} href={item.href} exact={false} activeClassName="text-[#0A1730] font-semibold after:w-full " className="relative py-2 text-gray-600 hover:text-[#0A1730] after:absolute after:bottom-0 after:left-0 after:h-0.75 after:w-0 after:bg-[#0A1730] after:rounded-full hover:after:w-full after:transition-all after:duration-300 after:ease-in-out">
                            {item.label}
                        </Navlink>
                    ))}
                </nav>
                <Link href="/Admin/Login" className="hidden md:block  bg-[#0A1730] text-white px-4 py-2 rounded hover:opacity-80 transition-colors">
                    <span className="text-white">Espace vendeur</span>
                </Link>
                <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X/> : <Menu/>}
                </button>
            </div>
        </header>
    )
}

export default Header