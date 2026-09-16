'use client'
import Link from 'next/link'
import { Ship, ShieldCheck, Truck, Sparkles, Store, Building2 } from 'lucide-react'
import Breadcrumb from '@/app/components/ui/Breadcrumb'

const AboutPage = () => {
    const values = [
        {
        icon: Ship,
        title: "Sourcing Chine & Turquie",
        description: "Nous sélectionnons minutieusement nos fournisseurs partenaires à Istanbul, Guangzhou et Shenzhen pour vous offrir le meilleur rapport qualité/prix."
        },
        {
        icon: ShieldCheck,
        title: "Qualité & Conformité",
        description: "Chaque article est inspecté avant expédition puis vérifié à la réception dans nos locaux pour garantir zéro défaut."
        },
        {
        icon: Truck,
        title: "Stock Local Réel",
        description: "Aucune mauvaise surprise de douane ou d'attente de fret : tous les articles affichés dans le catalogue sont déjà importés et stockés."
        }
    ]

    const stats = [
        { label: "Provenance des produits", value: "Turquie & Chine" },
        { label: "Disponibilité", value: "Stock 100% Local" },
        { label: "Paiement", value: "À la livraison / En boutique" },
    ]

    return (
        <div className="bg-white">
            <Breadcrumb items={[
                    { label: 'À propos'},
                ]} 
            />
            <div className="container mx-auto px-4 space-y-6 py-12">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <span className="text-xs font-bold text-[#1B5E38] tracking-wider uppercase">
                        À propos de nous
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0A1730]">
                        Votre passerelle directe vers les meilleures tendances d'importation
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        Nous simplifions l'accès aux produits tendances et de qualité fabriqués en Turquie et en Chine. Plus besoin de gérer la logistique ou la douane : nous importons pour vous et mettons tout à votre disposition immédiatement.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="space-y-1 py-2 md:py-0 border-b md:border-b-0 md:border-r last:border-none border-gray-100">
                        <p className="text-lg font-bold text-[#0A1730]">{stat.value}</p>
                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-[#1B5E38] rounded-full text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5" /> Notre Engagement
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A1730]">
                            La qualité internationale, la simplicité locale
                        </h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Que ce soit pour le prêt-à-porter et le textile haut de gamme en provenance de Turquie, ou l'électronique et les nouveautés high-tech de Chine, nous travaillons en direct avec des fabricants réputés.
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Notre rôle est de vous éviter les tracas d'importation, les risques d'incompatibilité et les retards de livraison. Vous parcourez le catalogue, vous choisissez, et vous êtes servi(e).
                        </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-[#0A1730] text-sm flex items-center gap-2">
                            <Store className="w-4 h-4 text-[#1B5E38]" /> Comment commander ?
                        </h3>
                        <ul className="space-y-3 text-xs text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-[#1B5E38]">•</span>
                                <span>Sélectionnez vos articles sur notre catalogue vitrine.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-[#1B5E38]">•</span>
                                <span>Contactez notre équipe via WhatsApp pour valider la disponibilité et réserver.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-[#1B5E38]">•</span>
                                <span>Récupérez en boutique ou faites-vous livrer directement chez vous.</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-bold text-[#0A1730]">Pourquoi nous faire confiance ?</h2>
                        <p className="text-xs text-gray-500">Nos engagements pour garantir la satisfaction de nos clients</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {values.map((item, index) => {
                        const IconComponent = item.icon
                        return (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="w-10 h-10 bg-green-50 text-[#1B5E38] rounded-xl flex items-center justify-center">
                                <IconComponent className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-[#0A1730] text-sm">{item.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                            </div>
                        )
                        })}
                    </div>
                </div>
                <div className="bg-[#0A1730] text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 mt-10">
                    <div className="space-y-1 text-center md:text-left">
                        <h2 className="text-xl font-bold">Envie de découvrir nos derniers arrivages ?</h2>
                        <p className="text-xs text-gray-300">
                        Consultez notre catalogue mis à jour régulièrement avec les nouveautés de Chine et Turquie.
                        </p>
                    </div>
                    <Link 
                        href="/Catalogue" 
                        className="px-6 py-3 bg-[#1B5E38] hover:bg-[#14472A] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                        Voir les produits
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default AboutPage