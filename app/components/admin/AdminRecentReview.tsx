interface RecentReviewData {
  id: number
  author: string
  email: string
  rating: number
  comment: string
  status: string
  product: { title: string } | null  // 🎯 nullable
  createdAt: Date
}

interface AdminRecentReviewProps {
  recentReviews: RecentReviewData[]
}

// 🎯 Clamp rating entre 0 et 5 — logique pure, testable
export const clampRating = (rating: number): number => {
  if (!Number.isFinite(rating)) return 0
  return Math.max(0, Math.min(5, Math.round(rating)))
}

// 🎯 Formater la date de façon safe
export const formatReviewDate = (date: Date | string): string => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const AdminRecentReview = ({ recentReviews }: AdminRecentReviewProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        Activité récente
      </h2>
      {recentReviews.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun avis récent</p>
      ) : (
        <ul className="space-y-3">
          {recentReviews.map((review) => {
            const rating = clampRating(review.rating)
            return (
              <li
                key={review.id}
                className="flex justify-between items-start border-b border-gray-200 pb-3 pt-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {review.author}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.product?.title ?? 'Produit supprimé'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatReviewDate(review.createdAt)}
                  </p>
                </div>
                <span
                  className="text-yellow-500 text-sm"
                  aria-label={`Note : ${rating} sur 5`}
                >
                  {'★'.repeat(rating)}
                  {'☆'.repeat(5 - rating)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { AdminRecentReview }