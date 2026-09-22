import { prisma } from "@/app/lib/prisma"
import { Prisma, StockStatus } from "@prisma/client"
import ProductFilter from "@/app/components/product/ProductFilter"
import ProductGrid from "@/app/components/product/ProductGrid"
import Breadcrumb from "@/app/components/ui/Breadcrumb"
import { getCatCont } from "@/app/lib/data"

interface CatalogueProps {
    searchParams: Promise<{
        search?: string
        categorie?: string
        status?: string
        price?: string
        page?: string
    }>
}

const PRODUCTS_PER_PAGE = 8
const SEARCH_MAX_LENGTH = 100

// Parse la page. Si invalide (vide, "abc", négative, 0), on retombe sur 1.
function parsePage(raw: string | undefined): number {
    if (!raw) return 1
    const n = parseInt(raw, 10)
    if (!Number.isSafeInteger(n) || n < 1) return 1
    return n
}

// Vérifie que le statut est bien dans l'enum StockStatus.
function parseStockStatus(raw: string): StockStatus | null {
    if (raw === StockStatus.disponible || raw === StockStatus.rupture) {
        return raw
    }
    return null
}

// Parse une plage de prix. Accepte :
//   "50-100" → { gte: 50, lte: 100 }
//   "50-"    → { gte: 50 }
//   "-100"   → { lte: 100 }
//   "50"     → { gte: 50 }
// Renvoie null si aucun des deux bornes n'est un nombre valide.
function parsePriceRange(raw: string): { gte?: number; lte?: number } | null {
    if (!raw) return null

    const parts = raw.split('-')
    // Cas "50-100" : [50, 100]
    // Cas "50"     : [50]
    // Cas "-100"   : ['', '100'] → min manquant, max valide
    // Cas "50-"    : [50, ''] → min valide, max manquant

    const minRaw = parts[0]
    const maxRaw = parts[1]

    const min = minRaw !== undefined && minRaw !== '' ? Number(minRaw) : null
    const max = maxRaw !== undefined && maxRaw !== '' ? Number(maxRaw) : null

    const validMin = min !== null && Number.isFinite(min) && min >= 0
    const validMax = max !== null && Number.isFinite(max) && max >= 0

    if (!validMin && !validMax) return null

    const range: { gte?: number; lte?: number } = {}
    if (validMin && validMax) {
        if (min! > max!) return null  // plage incohérente → on ignore
            range.gte = min!
            range.lte = max!
    } else if (validMin) {
        range.gte = min!
    } else if (validMax) {
        range.lte = max!
    }
    return range
}

const Catalogue = async ({ searchParams }: CatalogueProps) => {
    const resolvedParams = await searchParams
    const search = (resolvedParams.search || '').trim().slice(0, SEARCH_MAX_LENGTH)
    const categorie = (resolvedParams.categorie || '').trim()
    const status = (resolvedParams.status || '').trim()
    const price = (resolvedParams.price || '').trim()
    const currentPage = parsePage(resolvedParams.page)

    const [categories] = await getCatCont()

    const where: Prisma.ProductWhereInput = {}

    if (search) {
        where.title = { contains: search, mode: 'insensitive' }
    }

    if (categorie) {
        where.category = { slug: categorie }
    }

    const stockStatus = parseStockStatus(status)
    if (stockStatus !== null) {
        where.stockStatus = stockStatus
    }

    const priceRange = parsePriceRange(price)
    if (priceRange !== null) {
        where.price = priceRange
    }

    const [productsFromDb, filteredCount] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { category: true, image: true },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
            take: PRODUCTS_PER_PAGE,
        }),
        prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(filteredCount / PRODUCTS_PER_PAGE)

    const formattedProducts = productsFromDb.map((product) => ({
        ...product,
        price: Number(product.price),
    }))

    return (
        <div className="">
            <Breadcrumb items={[{ label: 'Catalogue' }]} />
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