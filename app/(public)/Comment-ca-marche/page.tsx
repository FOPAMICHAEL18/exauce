'use client'
import { Eye, MessageCircle, Truck, ShoppingBag } from 'lucide-react'
import Breadcrumb from '@/app/components/ui/Breadcrumb'
import { steps } from '@/app/components/public/HowItWorks'
import StepCard from '@/app/components/ui/Card/StepCard'

const highlights = [
    {
      icon: Eye,
      title: "Consultation libre",
      description: "Parcourez tout notre catalogue d'importation sans besoin d'inscrire un compte."
    },
    {
      icon: MessageCircle,
      title: "Échange direct",
      description: "Contactez-nous directement via WhatsApp ou appel pour une réponse rapide."
    },
    {
      icon: Truck,
      title: "Stock local disponible",
      description: "Pas de longs mois d'attente d'expédition internationale : les produits sont déjà reçus et prêts à l'envoi."
    }
]

const HowItWorksPage = () => {
    return (
        <div className='bg-white'>
            <Breadcrumb items={[
                    { label: 'Comment ça marche'},
                ]} 
            />
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col gap-8">
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-[#1B5E38] tracking-wider uppercase">
                            PROCÉDURE
                        </span>
                        <h1 className="text-3xl font-bold text-[#0A1730]">
                            Comment ça marche
                        </h1>
                        <p className="text-gray-500 text-sm">
                            De la découverte de vos articles importés jusqu'à la réception et disponible chez nous, en 3 étapes simples.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step) => (
                            <StepCard step={step} />
                        ))}
                    </div>
                </div>
            </div>
            <div className='bg-gray-100 py-12'>
                <div className="container mx-auto px-4 space-y-10">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-[#1B5E38] tracking-wider uppercase">
                            BON À SAVOIR
                        </span>
                        <h2 className="text-2xl font-bold text-[#0A1730]">
                            Un catalogue vitrine pour simplifier vos achats
                        </h2>
                        <p className="text-gray-500 text-sm max-w-3xl">
                            Notre site vous présente tous nos produits importés disponibles immédiatement en boutique. Aucun paiement bancaire n'est requis sur le site : les échanges et les commandes se font en direct avec notre équipe.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {highlights.map((item, index) => {
                        const IconComponent = item.icon
                        return (
                            <div key={index} className="space-y-3">
                            <div className="w-10 h-10 bg-emerald-100/60 text-[#1B5E38] rounded-xl flex items-center justify-center">
                                <IconComponent className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-[#0A1730] text-sm">
                                {item.title}
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {item.description}
                            </p>
                            </div>
                        )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HowItWorksPage