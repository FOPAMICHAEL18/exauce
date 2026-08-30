import { prisma } from "@/app/lib/prisma";
import StatCard from "@/app/components/ui/Card/statCard";
import AdminReviewTable from "@/app/components/admin/AdminReviewTable";

interface ProductsProps {
    searchParams: Promise<{
        page?: string
    }>
}

const PRODUCTS_PER_PAGE = 8

const Reviews = async ({searchParams} : ProductsProps) => {
    const resolvedParams = await searchParams
    const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10)) //Convertit le paramètre page de l'URL (qui est du texte) en nombre entier (base 10). Math.max(1, ...) garantit qu'on ne puisse jamais avoir une page inférieure à 1 (si l'utilisateur tape ?page=-5 dans l'URL, ça force à 1).
    const [totalReviews, pendingReviews, avgRatingResult, reviews] = await Promise.all([
        //On compte le total des avis
        prisma.review.count(),
        //On compte les avis en attente 
        prisma.review.count({
            where: {status: 'hidden'}
        }),
        //ON donne la moyenne des avis
        prisma.review.aggregate({
        _avg: {rating: true}
        }),
        //On donne les avis
        prisma.review.findMany({
            orderBy: {createdAt: 'desc'},
            include: {
                product: {
                    select: {title: true}
                }
            },
            skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
            take: PRODUCTS_PER_PAGE
        })
    ])

    const totalPages = Math.ceil(totalReviews / PRODUCTS_PER_PAGE) //Calcule le nombre total de pages. Math.ceil arrondit à l'entier supérieur (ex: 21 produits / 8 par page = 2.625, ce qui donne 3 pages).
    const avgRating = avgRatingResult._avg.rating || 0

    return (
        <div className="space-y-6 px-20 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard statName="TOTAL COMMENTAIRES" statValue={totalReviews} />
                <StatCard statName="EN ATTENTE DE MODERATION" statValue={pendingReviews} />
                <StatCard statName="NOTE MOYENNE" statValue={`${avgRating.toFixed(1)} / 5`} />
            </div>
            <AdminReviewTable reviews={reviews} totalPages={totalPages} currentPage={currentPage}/>
        </div>
    )
}

export default Reviews