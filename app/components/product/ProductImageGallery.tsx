'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
  images: { url: string }[]
  title: string
}

const ProductImageGallery = ({ images, title }: ProductGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0)

  // 🔧 Reset si les images changent (changement de produit)
  useEffect(() => {
    setSelectedImage(0)
  }, [images])

  const hasImages = images.length > 0
  const galleryImages = hasImages ? images : []
  const safeIndex = hasImages ? Math.min(selectedImage, galleryImages.length - 1) : 0

  return (
    <div className="space-y-4">
      <div className="relative h-95 md:h-112.5 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
        {hasImages ? (
          <Image
            src={galleryImages[safeIndex].url}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
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
              key={img.url}
              type="button"
              onClick={() => setSelectedImage(index)}
              aria-label={`Voir l'image ${index + 1} sur ${galleryImages.length}`}
              aria-current={safeIndex === index ? 'true' : undefined}
              className={`relative h-20 w-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                safeIndex === index
                  ? 'border-[#0A1730] ring-2 ring-[#0A1730]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={img.url}
                alt={`${title} — miniature ${index + 1}`}
                fill
                sizes="80px"
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