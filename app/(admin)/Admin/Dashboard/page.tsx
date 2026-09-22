import { prisma } from "@/app/lib/prisma"
import StatCard from "@/app/components/ui/Card/StatCard"
import { AdminRecentReview } from "@/app/components/admin/AdminRecentReview"
import { AdminTopProduct } from "@/app/components/admin/AdminTopProduct"

const RECENT_REVIEWS_LIMIT = 5
const TOP_PRODUCTS_LIMIT = 3

const Dashboard = async () => {
    // Toutes les requêtes en parallèle : un seul round-trip au lieu de 6.
    const [
        totalProducts,
        totalReviews,
        pendingReviews,
        avgRatingResult,
        recentReviews,
        topProducts,
    ] = await Promise.all([
        prisma.product.count({ where: { stockStatus: 'disponible' } }),
        prisma.review.count(),
        prisma.review.count({ where: { status: 'hidden' } }),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.review.findMany({
            take: RECENT_REVIEWS_LIMIT,
            orderBy: { createdAt: 'desc' },
            include: { product: { select: { title: true } } },
        }),
        prisma.product.findMany({
            take: TOP_PRODUCTS_LIMIT,
            orderBy: { views: 'desc' },
            include: {
                category: true,
                _count: { select: { review: true } },
            },
            where: { stockStatus: 'disponible' },
        }),
    ])

    // `??` plutôt que `||` : on ne remplace que null/undefined,
    // pas une éventuelle moyenne de 0.
    const avgRating = avgRatingResult._avg.rating ?? 0

    return (
        <div className="space-y-6 px-20 py-4">
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                <StatCard statName='PRODUITS PUBLIES' statValue={totalProducts} />
                <StatCard statName='TOTAL AVIS' statValue={totalReviews} />
                <StatCard statName='AVIS MASQUES' statValue={pendingReviews} />
                <StatCard
                    statName='NOTE MOYENNE'
                    statValue={`${avgRating.toFixed(1)} / 5`}
                />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <AdminRecentReview recentReviews={recentReviews} />
                <AdminTopProduct topProducts={topProducts} />
            </div>
        </div>
    )
}

export default Dashboard