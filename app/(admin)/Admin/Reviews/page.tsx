import { prisma } from "@/app/lib/prisma";
import StatCard from "@/app/components/ui/Card/StatCard";
import AdminReviewTable from "@/app/components/admin/AdminReviewTable";

interface ReviewsProps {
    searchParams: Promise<{
        page?: string
    }>
}

const REVIEWS_PER_PAGE = 8

// Parse la page. Si invalide (vide, "abc", négative, 0), on retombe sur 1.
function parsePage(raw: string | undefined): number {
    if (!raw) return 1
    const n = parseInt(raw, 10)
    if (!Number.isSafeInteger(n) || n < 1) return 1
    return n
}

const Reviews = async ({ searchParams }: ReviewsProps) => {
    const resolvedParams = await searchParams
    const currentPage = parsePage(resolvedParams.page)

    const [totalReviews, pendingReviews, avgRatingResult, reviews] = await Promise.all([
        prisma.review.count(),
        prisma.review.count({
            where: { status: 'hidden' },
        }),
        prisma.review.aggregate({
            _avg: { rating: true },
        }),
        prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: { title: true },
                },
            },
            skip: (currentPage - 1) * REVIEWS_PER_PAGE,
            take: REVIEWS_PER_PAGE,
        }),
    ])

    const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE)
    const avgRating = avgRatingResult._avg.rating ?? 0

    return (
        <div className="space-y-6 px-20 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard statName="TOTAL COMMENTAIRES" statValue={totalReviews} />
                <StatCard statName="EN ATTENTE DE MODERATION" statValue={pendingReviews} />
                <StatCard statName="NOTE MOYENNE" statValue={`${avgRating.toFixed(1)} / 5`} />
            </div>
            <AdminReviewTable
                reviews={reviews}
                totalPages={totalPages}
                currentPage={currentPage}
            />
        </div>
    )
}

export default Reviews