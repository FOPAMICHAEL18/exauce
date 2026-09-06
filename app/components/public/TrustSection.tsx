"use client"

import { CheckCircle2, Globe2, ShieldCheck, Truck } from 'lucide-react'

interface Feature {
  id: number;
  icon: React.ReactNode; //Type TypeScript autorisant l'injection directe d'un composant JSX (l'icône Lucide) comme propriété d'objet.
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    id: 1,
    icon: <Globe2 className="w-5 h-5 text-[#1B5E38]" />,
    title: "Import direct & Qualité",
    description: "Articles soigneusement sélectionnés auprès de nos fournisseurs certifiés en Chine et en Turquie.",
  },
  {
    id: 2,
    icon: <Truck className="w-5 h-5 text-[#1B5E38]" />,
    title: "Stock disponible & Livraison",
    description: "Produits déjà dédouanés et prêts à être expédiés rapidement chez vous.",
  },
  {
    id: 3,
    icon: <ShieldCheck className="w-5 h-5 text-[#1B5E38]" />,
    title: "Conformité garantie",
    description: "Chaque marchandise est inspectée à la réception avant mise en rayon pour éviter toute mauvaise surprise.",
  },
  {
    id: 4,
    icon: <CheckCircle2 className="w-5 h-5 text-[#1B5E38]" />,
    title: "Paiement & Service client",
    description: "Un suivi de commande transparent et une équipe réactive pour répondre à toutes vos questions.",
  }
]

const TrustSection = () => {
    return (
        <section className="bg-white py-16">
            <div className="container mx-auto px-4">
                <div className="mb-12">
                    <span className="text-xs font-semibold tracking-widest text-[#1B5E38] uppercase">
                        CONFIANCE
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0A1730] mt-1">
                        Pourquoi nous choisir
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => (
                        <div key={feature.id} className="flex flex-col items-start">
                        
                        {/* Badge Icône avec fond vert d'eau léger */}
                        <div className="w-10 h-10 rounded-lg bg-[#1B5E38]/10 flex items-center justify-center mb-4">
                            {feature.icon}
                        </div>

                        {/* Titre & Description */}
                        <h3 className="text-base font-bold text-[#0A1730] mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {feature.description}
                        </p>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default TrustSection