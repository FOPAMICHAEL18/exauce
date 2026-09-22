import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Prisma, StockStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import Products, { PRODUCTS_PER_PAGE } from './page'
import AdminProductFilters from '@/app/components/admin/AdminProductFilters'
import AdminProductTable from '@/app/components/admin/AdminProductTable'
import StatCard from '@/app/components/ui/Card/StatCard'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('@/app/components/admin/AdminProductFilters', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/admin/AdminProductTable', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/ui/Card/StatCard', () => ({
  default: vi.fn(() => null),
}))

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
    category: {
      id: 1,
      name: 'Tapis',
      slug: 'tapis',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    ...overrides,
  }
}

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

function makeProps(params: {
  search?: string
  category?: string
  status?: string
  page?: string
} = {}): { searchParams: Promise<typeof params> } {
  return { searchParams: Promise.resolve(params) }
}

async function renderPage(params: {
  search?: string
  category?: string
  status?: string
  page?: string
} = {}): Promise<void> {
  const jsx = await Products(makeProps(params))
  render(jsx)
}

// Récupère les props du premier appel d'un composant mocké.
// vi.mocked(Component) indique à TypeScript que c'est bien un mock.
function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
}

function mockDefaults(overrides: {
  products?: ReturnType<typeof makeProduct>[]
  categories?: ReturnType<typeof makeCategory>[]
  filteredCount?: number
  publishedCount?: number
  totalCount?: number
} = {}) {
  prismaMock.product.findMany.mockReset()
  prismaMock.category.findMany.mockReset()
  prismaMock.product.count.mockReset()

  prismaMock.product.findMany.mockResolvedValueOnce(
    (overrides.products ?? []) as never,
  )
  prismaMock.category.findMany.mockResolvedValueOnce(
    (overrides.categories ?? []) as never,
  )
  prismaMock.product.count
    .mockResolvedValueOnce(overrides.filteredCount ?? 0)
    .mockResolvedValueOnce(overrides.publishedCount ?? 0)
    .mockResolvedValueOnce(overrides.totalCount ?? 0)
}

describe('Page Admin Products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockDefaults()
  })

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

  it('retombe sur page=1 pour page=abc', async () => {
    await renderPage({ page: 'abc' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    )
    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminProductTable))
    expect(props.currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=-5', async () => {
    await renderPage({ page: '-5' })
    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminProductTable))
    expect(props.currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=0', async () => {
    await renderPage({ page: '0' })
    const props = firstProps<{ currentPage: number }>(vi.mocked(AdminProductTable))
    expect(props.currentPage).toBe(1)
  })

  it('n’applique aucun filtre quand searchParams est vide', async () => {
    await renderPage()
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
    expect(prismaMock.product.count).toHaveBeenNthCalledWith(1, { where: {} })
  })

  it('applique le filtre search en mode insensitive', async () => {
    await renderPage({ search: 'tapis' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { title: { contains: 'tapis', mode: 'insensitive' } },
      }),
    )
  })

  it('applique le filtre categoryId', async () => {
    await renderPage({ category: '5' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryId: 5 } }),
    )
  })

  it('ignore un categoryId non numérique', async () => {
    await renderPage({ category: 'abc' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('ignore un categoryId qui commence par des chiffres puis des lettres', async () => {
    await renderPage({ category: '12abc' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('ignore un categoryId = 0', async () => {
    await renderPage({ category: '0' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('applique le filtre stockStatus valide', async () => {
    await renderPage({ status: StockStatus.rupture })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stockStatus: StockStatus.rupture } }),
    )
  })

  it('ignore un stockStatus invalide', async () => {
    await renderPage({ status: 'peut-etre' })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('combine search + category + status', async () => {
    await renderPage({ search: 'tapis', category: '3', status: StockStatus.disponible })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          title: { contains: 'tapis', mode: 'insensitive' },
          categoryId: 3,
          stockStatus: StockStatus.disponible,
        },
      }),
    )
  })

  it('calcule totalPages=0 quand aucun produit filtré', async () => {
    mockDefaults({ filteredCount: 0 })
    await renderPage()
    const props = firstProps<{ totalPages: number }>(vi.mocked(AdminProductTable))
    expect(props.totalPages).toBe(0)
  })

  it('calcule totalPages=2 pour 9 produits filtrés', async () => {
    mockDefaults({ filteredCount: 9 })
    await renderPage()
    const props = firstProps<{ totalPages: number }>(vi.mocked(AdminProductTable))
    expect(props.totalPages).toBe(2)
  })

  it('conserve filteredCount pour totalPages même si totalCount est plus grand', async () => {
    mockDefaults({ filteredCount: 3, totalCount: 100 })
    await renderPage()
    const props = firstProps<{ totalPages: number }>(vi.mocked(AdminProductTable))
    expect(props.totalPages).toBe(1)
  })

  it('convertit le prix Decimal en number', async () => {
    mockDefaults({ products: [makeProduct({ price: new Prisma.Decimal('42.5') })] })
    await renderPage()

    const props = firstProps<{
      products: { price: number }[]
    }>(vi.mocked(AdminProductTable))
    expect(props.products[0]?.price).toBe(42.5)
    expect(typeof props.products[0]?.price).toBe('number')
  })

  it('propage currentSearch, currentCategory, currentStatus à AdminProductTable', async () => {
    await renderPage({ search: 'tapis', category: '2', status: StockStatus.rupture })

    const props = firstProps<{
      currentSearch: string
      currentCategory: string
      currentStatus: string
    }>(vi.mocked(AdminProductTable))

    expect(props.currentSearch).toBe('tapis')
    expect(props.currentCategory).toBe('2')
    expect(props.currentStatus).toBe(StockStatus.rupture)
  })

  it('propage les catégories à AdminProductFilters', async () => {
    const categories = [makeCategory({ id: 1, name: 'Tapis' })]
    mockDefaults({ categories })

    await renderPage()

    const props = firstProps<{ categories: typeof categories }>(
      vi.mocked(AdminProductFilters),
    )
    expect(props.categories).toEqual(categories)
  })

  it('passe totalCount et publishedCount aux StatCards', async () => {
    mockDefaults({ totalCount: 42, publishedCount: 30 })

    await renderPage()

    const statCardProps = vi.mocked(StatCard).mock.calls.map((c) => c[0])
    expect(statCardProps).toHaveLength(2)
    expect(statCardProps[0]).toEqual({ statName: 'TOTAL', statValue: 42 })
    expect(statCardProps[1]).toEqual({ statName: 'PUBLIES', statValue: 30 })
  })

  it('exécute les 5 requêtes Prisma en parallèle', async () => {
    await renderPage()

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.category.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.count).toHaveBeenCalledTimes(3)
  })

  it('remonte l’erreur si une requête Prisma plante', async () => {
    prismaMock.product.findMany.mockReset()
    prismaMock.product.findMany.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage()).rejects.toThrow('DB down')
  })
})