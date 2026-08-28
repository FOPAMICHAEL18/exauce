import { prisma } from "@/app/lib/prisma";
import StatCard from "@/app/components/ui/Card/statCard";
import AdminCategoryTable from "@/app/components/admin/AdminCategoryTable";
import Link from 'next/link'

interface CategoriesProps {
    searchParams: Promise<{
        page?: string
    }>
}

const PRODUCTS_PER_PAGE = 8 //Définit une constante. On affichera au maximum 8 produits par page.

const Categories = async ({searchParams}: CategoriesProps) => {
    const resolvedParams = await searchParams  //Dans Next.js 15, searchParams est une promesse (Promise) contenant les valeurs de l'URL (ex: ?search=clavier&page=2).
    const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10)) //Convertit le paramètre page de l'URL (qui est du texte) en nombre entier (base 10). Math.max(1, ...) garantit qu'on ne puisse jamais avoir une page inférieure à 1 (si l'utilisateur tape ?page=-5 dans l'URL, ça force à 1).

    // Récupération simultanée avec calcul du Skip pour Prisma
    const [categoriesFromDb, totalCount] = await Promise.all([   //C'est une optimisation clé. Au lieu de faire les requêtes à la base de données les unes après les autres (ce qui prendrait beaucoup de temps), Promise.all exécute les 3 requêtes en parallèle sur la base de données.
        prisma.category.findMany({
            include: { 
                product: {select : {title: true}},
                _count: {
                    select: {product: true} // compte les produits pour chaque categorie
                } 
            },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * PRODUCTS_PER_PAGE, //C'est le moteur de la pagination. Si nous sommes à la page 1 : (1 - 1) * 8 = 0 (on ne saute aucun produit). Si nous sommes à la page 2 : (2 - 1) * 8 = 8 (on saute les 8 premiers produits pour prendre les 8 suivants).
            take: PRODUCTS_PER_PAGE //Demande à Prisma de ne récupérer que 8 produits.
        }),
        prisma.category.count()
    ])

    const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE) //Calcule le nombre total de pages. Math.ceil arrondit à l'entier supérieur (ex: 21 categories / 8 par page = 2.625, ce qui donne 3 pages).

    return (
        <div className="space-y-6 px-20 py-4">
    
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard statName='TOTAL' statValue={totalCount}/>
            </div>
    
            <AdminCategoryTable 
                currentPage={currentPage}
                totalPages={totalPages}
                categories = {categoriesFromDb}
            />

            <Link href='/Admin/Categories/New' className='text-sm  transition-colors flex items-center gap-2 bg-[#0A1730] p-3 rounded-md hover:cursor-pointer hover:opacity-80 max-w-44'>
                <span className='text-white'>+ Ajouter une categorie</span>
            </Link>
        </div>
    )
}

export default Categories