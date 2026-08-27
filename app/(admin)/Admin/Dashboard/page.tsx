import { prisma } from "@/app/lib/prisma"; 
import StatCard from "@/app/components/ui/Card/statCard";

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
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 '>
                    <h2 className='text-lg font-semibold mb-4 text-gray-700'>Produit les plus consultes</h2>
                    {topProducts.length === 0 ? (
                        <p className='text-gray-400 text-sm'>Aucun produit disponible.</p>
                    ) : (
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left text-gray-500 border-b border-gray-200'>
                                    <th className='pb-2 font-medium'>Produit</th>
                                    <th className='pb-2 font-medium'>Categorie</th>
                                    <th className='pb-2 font-medium text-center'>Avis</th>
                                    <th className='pb-2 font-medium text-right'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    topProducts.map((product) => (
                                        <tr key={product.id} className='border-b border-gray-100 last:border-0'>
                                            <td className='py-2 font-medium text-gray-800'>{product.title}</td>
                                            <td className='py-2 text-gray-500'>{product.category.name}</td>
                                            <td className='py-2 text-center text-gray-500'>{product._count.review}</td>
                                            <td className='py-2 text-right'>
                                                <span className='text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full'>Publie</span>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
