interface RecentReviewData {
    id: number,
    author: string,
    email: string,
    rating: number,
    comment: string,
    status: string,
    product: {
        title: string
    },
    createdAt: Date
}

interface AdminRecentReviewProps {
    recentReviews: RecentReviewData[]
}

const AdminRecentReview = ({recentReviews} : AdminRecentReviewProps) => {
    return (
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 '>
            <h2 className='text-lg font-semibold mb-4 text-gray-700'>Activite recente</h2>
            {
                recentReviews.length === 0 ? (
                    <p className='text-gray-400 text-sm'>Aucun avis recent</p>
                ) : (
                    <ul className='spaye-y-3'>
                        {recentReviews.map((review) => (
                            <li key={review.id} className='flex justify-between items-start border-b border-gray-200 pb-3 pt-3 last:border-0 last:pb-0'>
                                <div>
                                    <p className='text-sm font-medium text-gray-800'>{review.author}</p>
                                    <p className='text-xs text-gray-500'>{review.product.title}</p>
                                    <p className='text-xs text-gray-400'>
                                        {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <span className='text-yellow-500 text-sm'>
                                    {'★'.repeat(review.rating)}
                                    {'☆'.repeat(5 - review.rating)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )
            }
        </div>
    )
}

export {AdminRecentReview}