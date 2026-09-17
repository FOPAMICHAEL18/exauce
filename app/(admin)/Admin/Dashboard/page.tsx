import { prisma } from "@/app/lib/prisma"
import StatCard from "@/app/components/ui/Card/StatCard"
import { AdminRecentReview } from "@/app/components/admin/AdminRecentReview"
import { AdminTopProduct } from "@/app/components/admin/AdminTopProduct"

const Dashboard = async () => {
    //On compte les produits dontle stockStatus est disponible
    const totalProducts = await prisma.product.count({
        where: {stockStatus: 'disponible'}
    })

    //On compte tous les avis, quel que soit leur status 
    const totalReviews = await prisma.review.count()

    //On compte tous les avis en attente
    const pendingReviews = await prisma.review.count({
        where: {status: 'hidden'}
    })

    //On donne la moyenne des avis 
    const avgRatingResult = await prisma.review.aggregate({
        _avg: {rating: true} //rating: true on demande la moyenne de la colonne rating
    }) //Ce que ca retourne: {_avg: {rating: 4.5}} un objet avec la moyenne

    //Si aucun avis n'existe
    const avgRating = avgRatingResult._avg.rating || 0

    //On recupere les 5 derniers avis recu 
    const recentReviews = await prisma.review.findMany({
        take: 5, // On prends les 5 premiers 
        orderBy: {createdAt: 'desc'},
        include: {
            product: {
                select: {title: true}
            }
        }
    })

    //Produit les plus consultes 
    const topProducts = await prisma.product.findMany({
        take: 3,
        orderBy: {
            views: "desc"  
        },
        include: {
            category:true, // Pour afficher la categorie
            _count: {
                select: {review: true} // compte les avis pour chaque produit
            }
        },
        where: {stockStatus: 'disponible'}
    })

    return (
        //Conteneur principal: espacement vertical entre les sections.
        <div className="space-y-6 px-20 py-4">
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                <StatCard statName='PRODUITS PUBLIES' statValue={totalProducts}/>
                <StatCard statName='TOTAL AVIS' statValue={totalReviews}/>
                <StatCard statName='AVIS MASQUES' statValue={pendingReviews}/>
                <StatCard statName='NOTE MOYENNE' statValue={`${avgRating.toFixed(1)} / 5`}/>
                {/* On appelle la methode toFixed(1) pour arrondir a une decimal    */}
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <AdminRecentReview recentReviews={recentReviews} />
                <AdminTopProduct topProducts={topProducts} />
            </div>
        </div>
    )
}

export default Dashboard
