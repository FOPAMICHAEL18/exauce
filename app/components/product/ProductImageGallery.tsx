'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
    images: { url: string }[]
    title: string
}

const ProductImageGallery = ({ images, title }: ProductGalleryProps) => {
    const [selectedImage, setSelectedImage] = useState(0)
    const galleryImages = images.length > 0 ? images : [{ url: '/placeholder.jpg' }]
    console.log(galleryImages.length)

    return (
        <div className="space-y-4">
            <div className="relative h-95 md:h-112.5 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                {galleryImages && galleryImages.length > 0 ? (
                    <Image
                        src={galleryImages[selectedImage].url}
                        alt={title}
                        fill
                        priority
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <span className="text-xs text-gray-400 font-medium px-4 text-center">
                        Photo produit — {title}
                    </span>
                )}
            </div>
            {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {galleryImages.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`relative h-20 w-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                                selectedImage === index 
                                    ? 'border-[#0A1730] ring-2 ring-[#0A1730]/10' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <Image 
                                src={img.url} 
                                alt={`${title} ${index + 1}`} 
                                fill 
                                className="object-cover" 
                            />
                            
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ProductImageGallery