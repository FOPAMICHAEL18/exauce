"use client"
import Navlink from "../../components/ui/Navlink";
import { LayoutDashboard, Package, Folders, MessageSquareText, ContactRound, Settings } from 'lucide-react';

const menuItems = [
    {href: '/Admin/Dashboard', icon: <LayoutDashboard size={24} />, label: 'Tableau de bord'},
    {href: '/Admin/Products', icon: <Package size={24} />, label: 'Produits'},
    {href: '/Admin/Categories', icon: <Folders size={24} />, label: 'Categories'},
    {href: '/Admin/Reviews', icon: <MessageSquareText size={24} />, label: 'Commentaires'},
    {href: '/Admin/Contact', icon: <ContactRound size={24} />, label: 'Coordonnees'},
    {href: '/Admin/Settings', icon: <Settings size={24} />, label: 'Parametres'}
]

export default function AdminSidebar() {
    return (
        <aside className="w-64 bg-[#0A1730] text-white flex flex-col h-full">
            <div className="p-4 text-xl font-bold border-b border-gray-700 flex items-center gap-2" >
                exauce
            </div>
            <nav className="flex-1 space-y-1 pt-4">
                {
                    menuItems.map((item, index) => (
                        <Navlink href={item.href} key={index} activeClassName="text-white border-r-3 border-emerald-800 bg-white/10" className="flex items-center gap-3 px-4 py-2  transition-opacity text-gray-800 hover:bg-white/10" exact={false}>
                            {item.icon}
                            {item.label}
                        </Navlink>
                    ))
                }
            </nav>
        </aside>
    )
} 


