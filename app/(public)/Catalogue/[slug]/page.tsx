import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { Phone, MessageCircle, Heart, Star } from 'lucide-react'
import ProductImageGallery from '@/app/components/product/ProductImageGallery'
import ReviewForm from '@/app/components/review/ReviewForm'
import Breadcrumb from '@/app/components/ui/Breadcrumb'
import ViewTracker from '@/app/components/product/ViewTracker'
import { formatPrice } from '@/app/lib/utils'
import { formatDate } from '@/app/lib/utils'

interface ProductDetailPageProps {
    params: Promise<{ slug: string }>
}

const ProductDetailPage = async ({ params }: ProductDetailPageProps) => {
    const { slug } = await params

    console.time("⏱️ Temps de réponse Neon / Prisma")
    const [product, contactInfo] = await Promise.all([
        prisma.product.findUnique({
            where: { slug }, // 👈 Recherche Prisma par slug
            include: {
                category: true,
                review: {
                    orderBy: { createdAt: 'desc' }
                },
                image: true
            }
        }),
        prisma.contact.findFirst()
    ])
    console.timeEnd("⏱️ Temps de réponse Neon / Prisma") 

    if (!product) {
        notFound()
    }

    const whatsappMessage = encodeURIComponent(`Bonjour, je suis intéressé par le produit "${product.title}" sur votre site.`)

    return (
        <div>
            <Breadcrumb items={[
                    { label: 'Catalogue', href: '/Catalogue' },
                    { label: product.title }
                ]} 
            />
            <div className="container mx-auto px-4 space-y-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <ProductImageGallery images={product.image} title={product.title} />
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-[#1B5E38] uppercase tracking-wider">
                                {product.category.name}
                            </span>
                            <h1 className="text-3xl font-bold text-[#0A1730] mt-1">{product.title}</h1>
                            <span className="text-xs text-gray-500 font-medium">({product.review.length} avis)</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-[#0A1730]">{formatPrice(Number(product.price))}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {product.description || "Aucune description fournie pour ce produit."}
                        </p>
                        <div className="py-4 border-y border-gray-200">
                            <span className="block text-xs text-gray-400">Disponibilité</span>
                            <span className="text-sm font-semibold text-[#1B5E38]">
                                {product.stockStatus === 'disponible' ? 'Disponible en atelier' : 'Sur commande'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-2 max-w-md">
                            {contactInfo?.phone && (
                                <a
                                    href={`tel:${contactInfo.phone}`}
                                    className="flex-1 bg-[#0A1730]  py-3.5 px-6 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#112347] transition-colors"
                                >
                                    <Phone size={18} className='text-white' />
                                    <span className='text-white'>Contacter le vendeur</span>
                                </a>
                            )}

                            {contactInfo?.phone && (
                                <a
                                    href={`https://wa.me/${contactInfo.whatsapp?.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-[#25D366] text-white py-3.5 px-6 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
                                >
                                    <MessageCircle size={18} className='text-white'/>
                                    <span className='text-white'>WhatsApp</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <div className='pt-10 border-t border-gray-100 space-y-8'>
                    <h2 className="text-2xl font-bold text-[#0A1730]">
                        Avis & commentaires ({product.review.length})
                    </h2>
                    <div className="space-y-4">
                        {product.review.map((review) => (
                            <div key={review.id} className="p-4 bg-gray-50/50 border-b border-gray-200 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm text-[#0A1730]">{review.author}</span>
                                    <span className="text-xs text-gray-400">
                                        {formatDate(review.createdAt)}
                                    </span>
                                </div>
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill={i < review.rating ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                    <ReviewForm productId={product.id} />
                </div>
            </div>
            <ViewTracker slug={slug} />
        </div>
    )
}

export default ProductDetailPage