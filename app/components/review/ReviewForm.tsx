'use client'

import { useRef, useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { apiCall } from '@/app/lib/api'
import { useRouter } from 'next/navigation'
import { validateEmail } from '@/app/lib/validators'

interface ReviewResponse {
  id: number
  author: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewFormProps {
  productId: number
}

const ReviewForm = ({ productId }: ReviewFormProps) => {
  const router = useRouter()
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [author, setAuthor] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [comment, setComment] = useState<string>('')
  const [honeypot, setHoneypot] = useState<string>('')

  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  // 🔒 Empêche la double-soumission même pendant la fenêtre avant isPending
  const submittingRef = useRef(false)

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setAuthor('')
    setEmail('')
    setComment('')
    setHoneypot('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current) return

    setError(null)
    setSuccess(false)

    // --- Validation client ---
    if (rating < 1 || rating > 5) {
      setError('Veuillez sélectionner une note entre 1 et 5 étoiles.')
      return
    }
    if (author.trim().length < 2) {
      setError('Le nom doit faire au moins 2 caractères.')
      return
    }
    if (comment.trim().length < 5) {
      setError('Le commentaire doit faire au moins 5 caractères.')
      return
    }
    if (email.trim().length > 0 && !validateEmail(email.trim())) {
      setError('Adresse email invalide.')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const response = await apiCall<ReviewResponse>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          author: author.trim(),
          email: email.trim(),
          rating,        // 👈 nombre, plus de String()
          comment: comment.trim(),
          productId,     // 👈 nombre
          honeypot,
        }),
      })

      if (response.success) {
        resetForm()
        setSuccess(true)
        startTransition(() => router.refresh())
      } else {
        setError(response.message || "Une erreur est survenue lors de l'envoi du commentaire.")
      }
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const isBusy = loading || isPending

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-gray-50/70 p-6 md:p-8 rounded-md border border-gray-200 space-y-5"
    >
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Merci pour votre avis !
        </div>
      )}

      {/* Honeypot anti-spam — invisible pour les humains */}
      <input
        type="text"
        name="honeypot"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute left-[-9999px] top-[-9999px]"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />

      <h3 className="text-lg font-bold text-[#0A1730]">Laisser un commentaire</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="author-field" className="block text-sm font-semibold text-gray-700 mb-2">
            Nom <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="author-field"
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Votre nom"
            className="w-full px-4 py-3 bg-white rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E38] focus:ring-2 focus:ring-[#1B5E38]/20"
          />
        </div>
        <div>
          <label htmlFor="email-field" className="block text-sm font-semibold text-gray-700 mb-2">
            Email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="email-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            className="w-full px-4 py-3 bg-white rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E38] focus:ring-2 focus:ring-[#1B5E38]/20"
          />
        </div>
      </div>

      <fieldset className="border-0 p-0 m-0">
        <legend className="block text-sm font-semibold text-gray-700 mb-2">
          Note <span className="text-red-500" aria-hidden="true">*</span>
        </legend>
        <div className="flex gap-1 py-1" role="radiogroup" aria-label="Note sur 5 étoiles">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} étoile${star > 1 ? 's' : ''} sur 5`}
              aria-pressed={rating >= star}
              className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-[#1B5E38] rounded-full"
            >
              <Star size={20} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="comment-field" className="block text-sm font-semibold text-gray-700 mb-2">
          Commentaire <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="comment-field"
          rows={4}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          className="w-full px-4 py-3 bg-white rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E38] focus:ring-2 focus:ring-[#1B5E38]/20"
        />
      </div>

      <button
        type="submit"
        disabled={isBusy}
        className="bg-[#0A1730] text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-[#112347] focus:ring-2 focus:ring-offset-2 focus:ring-[#0A1730] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBusy ? 'Publication en cours...' : 'Publier le commentaire'}
      </button>
    </form>
  )
}

export default ReviewForm