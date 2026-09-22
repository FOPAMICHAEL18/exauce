import { prisma } from "@/app/lib/prisma";
import { Prisma, StockStatus } from "@prisma/client";
import AdminProductFilters from "@/app/components/admin/AdminProductFilters";
import AdminProductTable from "@/app/components/admin/AdminProductTable";
import StatCard from "@/app/components/ui/Card/StatCard";

interface ProductsProps {
    searchParams: Promise<{
        search?: string,
        category?: string,
        status?: string,
        page?: string
    }>
}

export const PRODUCTS_PER_PAGE = 8

// Parse la page. Si invalide (vide, "abc", négative), on retombe sur 1.
function parsePage(raw: string | undefined): number {
    if (!raw) return 1
    const n = parseInt(raw, 10)
    if (!Number.isSafeInteger(n) || n < 1) return 1
    return n
}

// Parse l'id de catégorie. Renvoie null si invalide (vide, "abc", "12abc", 0).
function parseCategoryId(raw: string | undefined): number | null {
    if (!raw) return null
    if (!/^\d+$/.test(raw)) return null
    const n = Number(raw)
    if (!Number.isSafeInteger(n) || n <= 0) return null
    return n
}

// Vérifie que le statut est bien dans l'enum StockStatus.
function parseStockStatus(raw: string | undefined): StockStatus | null {
    if (raw === StockStatus.disponible || raw === StockStatus.rupture) {
        return raw
    }
    return null
}

const Products = async ({ searchParams }: ProductsProps) => {
    const resolvedParams = await searchParams
    const search = resolvedParams.search || ''
    const category = resolvedParams.category || ''
    const status = resolvedParams.status || ''
    const currentPage = parsePage(resolvedParams.page)

    const where: Prisma.ProductWhereInput = {}

    if (search) {
        where.title = { contains: search, mode: 'insensitive' }
    }

    const categoryId = parseCategoryId(category)
    if (categoryId !== null) {
        where.categoryId = categoryId
    }

    const stockStatus = parseStockStatus(status)
    if (stockStatus !== null) {
        where.stockStatus = stockStatus
    }

    const [productsFromDb, categories, filteredCount, publishedCount, totalCount] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
            take: PRODUCTS_PER_PAGE
        }),
        prisma.category.findMany({
            orderBy: { name: 'asc' }
        }),
        prisma.product.count({ where }),
        prisma.product.count({ where: { stockStatus: 'disponible' } }),
        prisma.product.count()
    ])

    const totalPages = Math.ceil(filteredCount / PRODUCTS_PER_PAGE)

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