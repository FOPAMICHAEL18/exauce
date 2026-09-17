"use client"
import Navlink from "../../components/ui/Navlink";
import { LayoutDashboard, Package, Folders, MessageSquareText, ContactRound, UserRoundPen, X } from 'lucide-react';

const menuItems = [
    {href: '/Admin/Dashboard', icon: <LayoutDashboard size={24} />, label: 'Tableau de bord'},
    {href: '/Admin/Products', icon: <Package size={24} />, label: 'Produits'},
    {href: '/Admin/Categories', icon: <Folders size={24} />, label: 'Categories'},
    {href: '/Admin/Reviews', icon: <MessageSquareText size={24} />, label: 'Commentaires'},
    {href: '/Admin/Contact', icon: <ContactRound size={24} />, label: 'Coordonnees'},
    {href: '/Admin/Profil', icon: <UserRoundPen size={24} />, label: 'Profil'}
]

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <aside
            className={`
                fixed inset-y-0 lg:static top-0 left-0 z-50 h-full w-64 bg-[#0A1730] text-white flex flex-col
                transition-transform duration-300 ease-in-out shrink-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
        >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xl font-bold tracking-wide">exauce</span>
                <button 
                    onClick={onClose} 
                    className="lg:hidden p-1 text-gray-400 hover:text-white rounded-md"
                    aria-label="Fermer le menu"
                >
                    <X size={20} />
                </button>
            </div>
            <nav className="flex-1 space-y-1 pt-4">
                {
                    menuItems.map((item, index) => (
                        <Navlink
                            href={item.href} 
                            key={index} 
                            onClick={onClose}
                            activeClassName="text-white bg-white/10 border-l-4 border-emerald-500 font-medium" 
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all text-gray-300 hover:bg-white/5 hover:text-white" 
                            exact={false}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Navlink>
                    ))
                }
            </nav>
        </aside>
    )
} 


