"use client"

import { CheckCircle2, Globe2, ShieldCheck, Truck } from 'lucide-react'

interface Feature {
  id: number;
  icon: React.ReactNode;
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