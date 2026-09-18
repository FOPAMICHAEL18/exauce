import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/app/lib/utils'

interface Product {
  id: number
  title: string
  price: number
  slug: string
  category: { name: string } | null
  image?: { url: string }[]
}

interface ProductHighlightProps {
  products: Product[]
}

const ProductHighlight = ({ products }: ProductHighlightProps) => {
  const isEmpty = products.length === 0

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-widest text-[#1B5E38] uppercase">
            SÉLECTION
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A1730] mt-1">
            Produits mis en avant
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Un aperçu de quelques-uns de nos produits
          </p>
        </div>

        {isEmpty ? (
          <p className="text-gray-400 text-center py-8">
            Aucun produit disponible pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const hasImage = product.image && product.image.length > 0
              return (
                <Link
                  key={product.id}
                  href={`/Products/${product.slug}`}
                  className="group bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-lg transition-all duration-300 hover:z-10 will-change-transform"
                >
                  <div className="relative w-full h-50 shrink-0 bg-[#EAEFF2] flex items-center justify-center overflow-hidden">
                    {hasImage ? (
                      <Image
                        src={product.image![0].url}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium px-4 text-center">
                        Photo produit — {product.title}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col justify-between grow">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#1B5E38] uppercase tracking-wider block">
                        {product.category?.name || 'GÉNÉRAL'}
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
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductHighlight