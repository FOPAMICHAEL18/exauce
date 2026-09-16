'use client'

import { useState, useTransition } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { apiCall } from '@/app/lib/api'
import { useRouter } from 'next/navigation'

interface ReviewResponse {
  success: boolean;
  message?: string;
  review?: {
    id: number;
    author: string;
    rating: number;
    comment: string;
    createdAt: string;
  };
}

const ReviewForm = ({productId} : { productId: number }) => {
    const router = useRouter()
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [author, setAuthor] = useState('')
    const [email, setEmail] = useState('');             // Email (optionnel)
    const [comment, setComment] = useState('')
    const [honeypot, setHoneypot] = useState('')       // Champ caché pour le honeypot
    const [isPending, startTransition] = useTransition()
    const [loading, setLoading] = useState(false)      // Désactive le bouton pendant l'envoi
    const [error, setError] = useState<string | null>(null)   // Message d'erreur
    const [success, setSuccess] = useState(false)      // Affiche un message de succès

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // On réinitialise les messages précédents
        setError(null)
        setSuccess(false)
        setLoading(true)

        try {
            // 1. Appel API pour envoyer l'avis
            // Le body contient tous les champs du formulaire
            const response = await apiCall<ReviewResponse>('/api/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    author: author.trim(),
                    email: email.trim(),
                    rating: String(rating),
                    comment: comment.trim(),
                    productId: String(productId),
                    honeypot: honeypot,
                }),
            })

            // Gestion de la réponse de l'API
            if (response.success) {
                setRating(0)
                setAuthor('')
                setSuccess(true)
                setEmail('')
                setComment('')
                setHoneypot('')
                setTimeout(() => {
                    router.refresh();
                }, 3000)
            }
            else {
                setError(response.message || 'Une erreur est survenue lors de l\'envoi du commentaire.')
            }
        } catch (error) {
            setError('Une erreur est survenue lors de l\'envoi du commentaire.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50/70 p-6 md:p-8 rounded-md border border-gray-200 space-y-5">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    Merci pour votre avis !
                </div>
            )}

            {/* Ce champ est invisible pour l'utilisateur.
                Il est positionné hors de l'écran (-left-[9999px]) et inaccessible au clavier.
                Si un robot le remplit, la requête est rejetée. */}
            <input
                type="text"
                name="honeypot"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute left-[-9999px] top-[-9999px]"
                aria-hidden="true"
                tabIndex={-1}
            />

            <h3 className="text-lg font-bold text-[#0A1730]">Laisser un commentaire</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom*</label>
                    <input
                        type="text"
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Votre nom"
                        className="w-full px-4 py-3 bg-white rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E38]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Votre email"
                        className="w-full px-4 py-3 bg-white rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E38]"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note*</label>
                <div className="flex gap-1 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                            <Star
                                size={16}
                                fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Commentaire*</label>
                <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre expérience avec ce produit..."
                    className="w-full px-4 py-3 bg-white rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E38]"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="bg-[#0A1730] text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-[#112347] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Publication en cours...' : 'Publier le commentaire'}
            </button>
        </form>
    )
}

export default ReviewForm