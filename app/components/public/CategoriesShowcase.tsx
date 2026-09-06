"use client"

import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoriesShowcaseProps {
  categories: Category[];
}

const CategoriesShowcase = ({ categories }: CategoriesShowcaseProps) => {
    return (
        <section className='py-16 bg-gray-100'>
            <div className="container mx-auto px-4">
                <div className="mb-10">
                    <span className="text-xs font-semibold tracking-widest text-[#1B5E38] uppercase">
                        CATEGORIES
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0A1730] mt-1">
                        Parcourir nos catégories
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Découvrez nos différentes catégories de produits
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/Catalogue?categorie=${category.slug}`}
                            className="group bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-lg transition-all duration-300 hover:z-10 will-change-transform"
                        >
                            <div className="relative w-full h-50 shrink-0 bg-[#EAEFF2] flex items-center justify-center overflow-hidden">
                                <span className="text-xs text-gray-400 font-medium px-4 text-center">
                                    {category.name}
                                </span>
                            </div>
                            <div className="p-4 bg-white flex items-center justify-between border-t border-gray-50">
                                <h3 className="text-base font-bold text-[#0A1730] group-hover:text-[#1B5E38] transition-colors">
                                {category.name}
                                </h3>
                                <span className="text-xs font-semibold text-[#1B5E38] group-hover:translate-x-1 transition-transform">
                                Voir &rarr;
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
                {categories.length === 0 && (
                    <p className="text-gray-400 text-center">Aucune catégorie disponible.</p>
                )}
            </div>
        </section>
    )
}

export default CategoriesShowcase