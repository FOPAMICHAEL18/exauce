import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { prisma } from "@/app/lib/prisma"
import ProductFilter from "@/app/components/product/ProductFilter"
import ProductGrid from "@/app/components/product/ProductGrid"
import Breadcrumb from "@/app/components/ui/Breadcrumb"
import { getCatCont } from "@/app/lib/data"

interface CatalogueProps {
    searchParams: Promise<{
        search?: string,
        categorie?: string,
        status?: string,
        price?: string,
        page?: string
    }>
}

const PRODUCTS_PER_PAGE = 8 //Définit une constante. On affichera au maximum 8 produits par page.

const Catalogue = async ({ searchParams }: CatalogueProps) => {
    const resolvedParams = await searchParams  //Dans Next.js 15, searchParams est une promesse (Promise) contenant les valeurs de l'URL (ex: ?search=clavier&page=2).
    const search = resolvedParams.search || ''
    const categorie = resolvedParams.categorie || ''
    const status = resolvedParams.status || ''
    const price = resolvedParams.price || ''
    const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10)) //Convertit le paramètre page de l'URL (qui est du texte) en nombre entier (base 10). Math.max(1, ...) garantit qu'on ne puisse jamais avoir une page inférieure à 1 (si l'utilisateur tape ?page=-5 dans l'URL, ça force à 1).
    const [categories] = await getCatCont()

    // Construction du filtre where
    const where: any = {}

    // Filtre par recherche textuelle
    if (search) {
        where.title = { contains: search, mode: 'insensitive' } //Recherche le texte saisi dans le titre sans tenir compte des majuscules/minuscules.
    }

    // Filtre par categorie
    if (categorie) {
        where.category = { slug: categorie }
    }

    // Filtre par statut
    if (status) {
        where.stockStatus = status
    }

    // Filtre par prix
    if (price) {
        const [minPrice, maxPrice] = price.split('-').map(Number);
        where.price = {
            gte: minPrice,
            lte: maxPrice
        };
    }

    // Récupération simultanée avec calcul du Skip pour Prisma
    const [productsFromDb, filteredCount] = await Promise.all([   //C'est une optimisation clé. Au lieu de faire les requêtes à la base de données les unes après les autres (ce qui prendrait beaucoup de temps), Promise.all exécute les 5 requêtes en parallèle sur la base de données.
        prisma.product.findMany({
            where,
            include: { category: true, image: true },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * PRODUCTS_PER_PAGE, //C'est le moteur de la pagination. Si nous sommes à la page 1 : (1 - 1) * 8 = 0 (on ne saute aucun produit). Si nous sommes à la page 2 : (2 - 1) * 8 = 8 (on saute les 8 premiers produits pour prendre les 8 suivants).
            take: PRODUCTS_PER_PAGE //Demande à Prisma de ne récupérer que 8 produits.
        }),
        prisma.product.count({ where }), // Total d'éléments filtrés
    ])

    const totalPages = Math.ceil(filteredCount / PRODUCTS_PER_PAGE) //Calcule le nombre total de pages. Math.ceil arrondit à l'entier supérieur (ex: 21 produits / 8 par page = 2.625, ce qui donne 3 pages).
    
    const formattedProducts = productsFromDb.map((product) => ({
        ...product,
        price: Number(product.price),
    }))

    return (
        <div className="">
            <Breadcrumb items={[
                    { label: 'Catalogue'},
                ]} 
            />
            <div className="container mx-auto px-4 space-y-6 py-12">
                <div>
                    <span className="text-xs font-bold text-[#1B5E38] tracking-wider uppercase">Catalogue complet</span>
                    <h1 className="text-3xl font-bold text-[#0A1730] ">Toutes nos offres</h1>
                </div>
                <div className="flex flex-col lg:flex-row gap-8 pt-2">
                    <ProductFilter categories={categories} />
                    <ProductGrid 
                        products={formattedProducts}
                        filteredCount={filteredCount}
                        totalPages={totalPages}
                        currentPage={currentPage}
                    />
                </div>
            </div>
        </div>
    )
}

export default Catalogue