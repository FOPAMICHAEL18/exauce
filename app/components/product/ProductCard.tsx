import Link from "next/link"
import Image from 'next/image'
import { formatPrice } from "@/app/lib/utils"

interface ProductCardProps {
    product: {
        id: number
        title: string
        slug: string
        price: number
        image?: { url: string }[]
        category?: { name: string }
    }
}

const ProductCard = ({product} : ProductCardProps) => {
    return (
        <Link
            href={`/Catalogue/${product.slug}`}
            className="group bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-lg transition-all duration-300 hover:z-10 will-change-transform"
        >
            {/* 1. Zone Image : Hauteur strictement bloquée à 200px */}
            <div className="relative w-full h-50 shrink-0 bg-[#EAEFF2] flex items-center justify-center overflow-hidden">
                {product.image && product.image.length > 0 ? (
                    <Image
                        src={product.image[0].url}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <span className="text-xs text-gray-400 font-medium px-4 text-center">
                        Photo produit — {product.title}
                    </span>
                )}
            </div>

            {/* 2. Zone Contenu Texte */}
            <div className="p-4 flex flex-col justify-between grow">
                <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#1B5E38] uppercase tracking-wider block">
                        {product.category?.name || "GÉNÉRAL"}
                    </span>
                    <h3 className="text-base font-bold text-[#0A1730] line-clamp-1">
                        {product.title}
                    </h3>
                </div>

                <div className="mt-3">
                    <span className="text-lg font-bold text-[#0A1730] block">
                        {formatPrice(product.price)} 
                    </span>
                </div>
            </div>
        </Link>
    )
}

export default ProductCard