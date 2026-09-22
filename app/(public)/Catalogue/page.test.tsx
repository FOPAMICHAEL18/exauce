import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Prisma, StockStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import { getCatCont } from '@/app/lib/data'
import Catalogue from './page'
import ProductFilter from '@/app/components/product/ProductFilter'
import ProductGrid from '@/app/components/product/ProductGrid'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('@/app/lib/data', () => ({
  getCatCont: vi.fn(),
}))

vi.mock('@/app/components/product/ProductFilter', () => ({
  default: vi.fn(() => null),
}))

vi.mock('@/app/components/product/ProductGrid', () => ({
  default: vi.fn(() => null),
}))

const PRODUCTS_PER_PAGE = 8

function makeCategory(overrides: Partial<{
  id: number
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: 1,
    name: 'Tapis',
    slug: 'tapis',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeProduct(overrides: Partial<{
  id: number
  title: string
  slug: string
  description: string
  price: Prisma.Decimal
  stockStatus: StockStatus
  categoryId: number
  views: number
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: 1,
    title: 'Tapis',
    slug: 'tapis',
    description: 'Un tapis',
    price: new Prisma.Decimal('99.99'),
    stockStatus: StockStatus.disponible,
    categoryId: 1,
    views: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    category: makeCategory(),
    image: [],
    ...overrides,
  }
}

function makeProps(params: {
  search?: string
  categorie?: string
  status?: string
  price?: string
  page?: string
} = {}): { searchParams: Promise<typeof params> } {
  return { searchParams: Promise.resolve(params) }
}

async function renderPage(params: {
  search?: string
  categorie?: string
  status?: string
  price?: string
  page?: string
} = {}): Promise<void> {
  const jsx = await Catalogue(makeProps(params))
  render(jsx)
}

function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
}

function mockDefaults(overrides: {
  categories?: ReturnType<typeof makeCategory>[]
  products?: ReturnType<typeof makeProduct>[]
  filteredCount?: number
} = {}) {
  vi.mocked(getCatCont).mockReset()   // ← ajout
  vi.mocked(getCatCont).mockResolvedValueOnce([
    overrides.categories ?? [],
    null,
  ] as never)

  prismaMock.product.findMany.mockReset()
  prismaMock.product.count.mockReset()

  prismaMock.product.findMany.mockResolvedValueOnce(
    (overrides.products ?? []) as never,
  )
  prismaMock.product.count.mockResolvedValueOnce(overrides.filteredCount ?? 0)
}

describe('Page Catalogue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockDefaults()
  })

  // ----------------------------------------------------------------
  // Parsing de page
  // ----------------------------------------------------------------

  it('utilise skip=0 par défaut', async () => {
    await renderPage()
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: PRODUCTS_PER_PAGE }),
    )
  })

  it('calcule skip correctement pour page=2', async () => {
    await renderPage({ page: '2' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: PRODUCTS_PER_PAGE }),
    )
  })

  it('calcule skip correctement pour page=3', async () => {
    await renderPage({ page: '3' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: PRODUCTS_PER_PAGE * 2 }),
    )
  })

  it('retombe sur page=1 pour page=abc', async () => {
    await renderPage({ page: 'abc' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    )
    expect(firstProps<{ currentPage: number }>(vi.mocked(ProductGrid)).currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=-5', async () => {
    await renderPage({ page: '-5' })
    expect(firstProps<{ currentPage: number }>(vi.mocked(ProductGrid)).currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=0', async () => {
    await renderPage({ page: '0' })
    expect(firstProps<{ currentPage: number }>(vi.mocked(ProductGrid)).currentPage).toBe(1)
  })

  // ----------------------------------------------------------------
  // Filtres
  // ----------------------------------------------------------------

  it('n’applique aucun filtre par défaut', async () => {
    await renderPage()
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('applique le filtre search en mode insensitive', async () => {
    await renderPage({ search: 'tapis' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { title: { contains: 'tapis', mode: 'insensitive' } },
      }),
    )
  })

  it('trim la recherche et la limite à 100 caractères', async () => {
    const longSearch = 'a'.repeat(200)
    await renderPage({ search: `  ${longSearch}  ` })

    const call = prismaMock.product.findMany.mock.calls[0]?.[0] as
      | { where?: { title?: { contains?: string } } }
      | undefined
    const contains = call?.where?.title?.contains
    expect(contains).toHaveLength(100)
  })

  it('applique le filtre categorie par slug', async () => {
    await renderPage({ categorie: 'tapis' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: { slug: 'tapis' } },
      }),
    )
  })

  it('applique le filtre stockStatus valide', async () => {
    await renderPage({ status: StockStatus.rupture })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stockStatus: StockStatus.rupture },
      }),
    )
  })

  it('ignore un stockStatus invalide', async () => {
    await renderPage({ status: 'peu-importe' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  // ----------------------------------------------------------------
  // Filtre prix
  // ----------------------------------------------------------------

  it('applique une plage de prix "50-100"', async () => {
    await renderPage({ price: '50-100' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { price: { gte: 50, lte: 100 } } }),
    )
  })

  it('applique un prix minimum "50-"', async () => {
    await renderPage({ price: '50-' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { price: { gte: 50 } } }),
    )
  })

  it('applique un prix maximum "-100"', async () => {
    await renderPage({ price: '-100' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { price: { lte: 100 } } }),
    )
  })

  it('applique un prix unique "50" comme minimum', async () => {
    await renderPage({ price: '50' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { price: { gte: 50 } } }),
    )
  })

  it('ignore un prix non numérique "abc"', async () => {
    await renderPage({ price: 'abc' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('ignore un prix "50-abc" (max invalide)', async () => {
    await renderPage({ price: '50-abc' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { price: { gte: 50 } } }),
    )
  })

  it('ignore un prix "abc-100" (min invalide)', async () => {
    await renderPage({ price: 'abc-100' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { price: { lte: 100 } } }),
    )
  })

  it('ignore un prix "100-50" (min > max)', async () => {
    await renderPage({ price: '100-50' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  // ----------------------------------------------------------------
  // Combinaison de filtres
  // ----------------------------------------------------------------

  it('combine search + categorie + status + price', async () => {
    await renderPage({
      search: 'tapis',
      categorie: 'tapis',
      status: StockStatus.disponible,
      price: '50-100',
    })

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          title: { contains: 'tapis', mode: 'insensitive' },
          category: { slug: 'tapis' },
          stockStatus: StockStatus.disponible,
          price: { gte: 50, lte: 100 },
        },
      }),
    )
  })

  // ----------------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------------

  it('calcule totalPages=0 quand aucun produit', async () => {
    mockDefaults({ filteredCount: 0 })
    await renderPage()
    expect(firstProps<{ totalPages: number }>(vi.mocked(ProductGrid)).totalPages).toBe(0)
  })

  it('calcule totalPages=1 pour 8 produits', async () => {
    mockDefaults({ filteredCount: 8 })
    await renderPage()
    expect(firstProps<{ totalPages: number }>(vi.mocked(ProductGrid)).totalPages).toBe(1)
  })

  it('calcule totalPages=2 pour 9 produits', async () => {
    mockDefaults({ filteredCount: 9 })
    await renderPage()
    expect(firstProps<{ totalPages: number }>(vi.mocked(ProductGrid)).totalPages).toBe(2)
  })

  it('propage filteredCount à ProductGrid', async () => {
    mockDefaults({ filteredCount: 42 })
    await renderPage()
    expect(firstProps<{ filteredCount: number }>(vi.mocked(ProductGrid)).filteredCount).toBe(42)
  })

  // ----------------------------------------------------------------
  // Conversion Decimal → number
  // ----------------------------------------------------------------

  it('convertit le prix Decimal en number', async () => {
    mockDefaults({
      products: [makeProduct({ price: new Prisma.Decimal('42.5') })],
    })
    await renderPage()

    const props = firstProps<{ products: { price: number }[] }>(vi.mocked(ProductGrid))
    expect(props.products[0]?.price).toBe(42.5)
    expect(typeof props.products[0]?.price).toBe('number')
  })

  // ----------------------------------------------------------------
  // Prop des catégories
  // ----------------------------------------------------------------

  it('propage les catégories à ProductFilter', async () => {
    const categories = [makeCategory({ id: 1, name: 'Tapis' })]
    mockDefaults({ categories })

    await renderPage()

    const props = firstProps<{ categories: typeof categories }>(vi.mocked(ProductFilter))
    expect(props.categories).toEqual(categories)
  })

  // ----------------------------------------------------------------
  // Erreurs
  // ----------------------------------------------------------------

  it('exécute findMany et count en parallèle', async () => {
    await renderPage()
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.count).toHaveBeenCalledTimes(1)
  })

  it('remonte l’erreur si Prisma plante', async () => {
    prismaMock.product.findMany.mockReset()
    prismaMock.product.findMany.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage()).rejects.toThrow('DB down')
  })

})