import { Star, User } from 'lucide-react'

export interface Testimonial {
  id: number
  author: string
  rating: number
  comment: string
  createdAt: Date
}

interface TestimonialsProps {
  testimonials: Testimonial[]
}

const clampRating = (rating: number): number =>
  Math.max(0, Math.min(5, Math.round(rating)))

const Testimonials = ({ testimonials }: TestimonialsProps) => {
  const isEmpty = testimonials.length === 0

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-widest text-[#1B5E38] uppercase block">
            TÉMOIGNAGES
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A1730] mt-1">
            Derniers avis clients
          </h2>
        </div>

        {isEmpty ? (
          <p className="text-gray-400 text-center py-8">
            Aucun avis pour le moment. Soyez le premier à en laisser un !
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => {
              const safeRating = clampRating(testimonial.rating)
              return (
                <article
                  key={testimonial.id}
                  className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between items-start"
                >
                  <div className="w-full">
                    <div
                      className="flex items-center space-x-1 mb-4"
                      aria-label={`Note : ${safeRating} sur 5`}
                    >
                      {[...Array(5)].map((_, index) => {
                        const isFilled = index < safeRating
                        return (
                          <Star
                            key={index}
                            className={`w-4 h-4 ${
                              isFilled
                                ? 'fill-[#D97706] text-[#D97706]'
                                : 'text-[#D97706]'
                            }`}
                            aria-hidden="true"
                          />
                        )
                      })}
                    </div>
                    <p className="text-sm italic text-[#0A1730] leading-relaxed mb-6">
                      &ldquo;{testimonial.comment}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-bold text-[#0A1730] leading-snug">
                      {testimonial.author}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Testimonials