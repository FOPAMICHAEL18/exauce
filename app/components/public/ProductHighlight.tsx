"use client"

import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number;
  title: string;
  price: number;
  slug: string;
  category: { name: string };
  images?: { url: string }[];
}

interface ProductHighlightProps {
  products: Product[];
}

const ProductHighlight = ({products} : ProductHighlightProps) => {
    return (
        <section className='py-16 bg-white'>
            <div className="container mx-auto px-4">
                <div className="mb-10">
                    <span className="text-xs font-semibold tracking-widest text-[#1B5E38] uppercase">
                        SÉLECTION
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0A1730] mt-1">
                        Produits mis en avant
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Un exemple de quelque de nos produits
                    </p>
                </div>
                <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/Products/${product.slug}`}
                            className="group bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-lg transition-all duration-300 hover:z-10 will-change-transform"
                        >
                            {/* 1. Zone Image : Hauteur strictement bloquée à 200px */}
                            <div className="relative w-full h-50 shrink-0 bg-[#EAEFF2] flex items-center justify-center overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                <Image
                                    src={product.images[0].url}
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
                                    {product.price.toLocaleString("fr-FR")} FCFA
                                </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                {products.length === 0 && (
                    <p className="text-gray-400 text-center">Aucun produit disponible pour le moment.</p>
                )}
            </div>
        </section>
    )
}

export default ProductHighlight