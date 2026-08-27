import { prisma } from "@/app/lib/prisma"; 
import AdminProductFilters from "@/app/components/admin/AdminProductFilters";
import AdminProductTable from "@/app/components/admin/AdminProductTable";
import StatCard from "@/app/components/ui/Card/statCard";

interface ProductsProps {
    searchParams: Promise<{
        search?: string,
        category?: string,
        status?: string,
        page?: string
    }>
}

const PRODUCTS_PER_PAGE = 8 //Définit une constante. On affichera au maximum 8 produits par page.

const Products = async ({ searchParams }: ProductsProps) => {
    const resolvedParams = await searchParams  //Dans Next.js 15, searchParams est une promesse (Promise) contenant les valeurs de l'URL (ex: ?search=clavier&page=2).
    const search = resolvedParams.search || ''
    const category = resolvedParams.category || ''
    const status = resolvedParams.status || ''
    const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10)) //Convertit le paramètre page de l'URL (qui est du texte) en nombre entier (base 10). Math.max(1, ...) garantit qu'on ne puisse jamais avoir une page inférieure à 1 (si l'utilisateur tape ?page=-5 dans l'URL, ça force à 1).

    const where: any = {}

    if (search) {
        where.title = { contains: search, mode: 'insensitive' } //Recherche le texte saisi dans le titre sans tenir compte des majuscules/minuscules.
    }

    if (category) {
        where.categoryId = parseInt(category, 10)
    }

    if (status) {
        where.stockStatus = status
    }

    // Récupération simultanée avec calcul du Skip pour Prisma
    const [productsFromDb, categories, filteredCount, publishedCount, totalCount] = await Promise.all([   //C'est une optimisation clé. Au lieu de faire les requêtes à la base de données les unes après les autres (ce qui prendrait beaucoup de temps), Promise.all exécute les 5 requêtes en parallèle sur la base de données.
        prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * PRODUCTS_PER_PAGE, //C'est le moteur de la pagination. Si nous sommes à la page 1 : (1 - 1) * 8 = 0 (on ne saute aucun produit). Si nous sommes à la page 2 : (2 - 1) * 8 = 8 (on saute les 8 premiers produits pour prendre les 8 suivants).
            take: PRODUCTS_PER_PAGE //Demande à Prisma de ne récupérer que 8 produits.
        }),
        prisma.category.findMany({
            orderBy: { name: 'asc' }
        }),
        prisma.product.count({ where }), // Total d'éléments filtrés
        prisma.product.count({ where: { stockStatus: 'disponible' } }),
        prisma.product.count()
    ])

    const totalPages = Math.ceil(filteredCount / PRODUCTS_PER_PAGE) //Calcule le nombre total de pages. Math.ceil arrondit à l'entier supérieur (ex: 21 produits / 8 par page = 2.625, ce qui donne 3 pages).

    const formattedProducts = productsFromDb.map((product) => ({
        ...product,
        price: Number(product.price),
    }))

    return (
        <div className="space-y-6 px-20 py-4">
            <AdminProductFilters 
                search={search}
                category={category}
                status={status}
                categories={categories}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard statName='TOTAL' statValue={totalCount}/>
                <StatCard statName='PUBLIES' statValue={publishedCount}/>
            </div>

            <AdminProductTable 
                currentSearch={search}
                currentCategory={category}
                currentStatus={status}
                currentPage={currentPage}
                totalPages={totalPages}
                products={formattedProducts}
            />
        </div>
    )
}

export default Products