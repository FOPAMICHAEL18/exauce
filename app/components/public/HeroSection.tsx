import Link from 'next/link'
import Image from 'next/image'

const HeroSection = () => {
  return (
    <section className="bg-[#0A1730] text-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
          <div className="space-y-6">
            <span className="text-xs md:text-sm font-semibold tracking-widest text-gray-400 uppercase">
              ARRIVAGES DIRECTS DE CHINE &amp; TURQUIE
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Produits &amp; articles de qualité, sélectionnés à la source
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl">
              Explorez notre catalogue de marchandises importées. Des articles
              tendance, durables et au meilleur prix grossiste/détail, expédiés
              directement depuis nos partenaires en Chine et en Turquie.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/Catalogue"
                className="px-6 py-3 bg-[#1B5E38] hover:bg-[#154a2c] text-white text-sm font-semibold rounded-md transition-all shadow-sm"
              >
                Explorez le catalogue
              </Link>
              <Link
                href="/Contact"
                className="text-sm font-semibold rounded-md px-6 py-3 border border-white/40 hover:border-white transition-all shadow-sm"
              >
                Nous contacter
              </Link>
            </div>
          </div>

          {/* 🎯 h-100 conservé (valide en v4) */}
          <div className="relative w-full h-80 sm:h-100 rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop"
              alt="Catalogue de produits importés de Chine et Turquie"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              className="object-cover"
              priority
            />
            {/* 🎯 bg-linear-to-t conservé (valide en v4) */}
            <div className="absolute inset-0 bg-linear-to-t from-[#0A1730]/60 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection