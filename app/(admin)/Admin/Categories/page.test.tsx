import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { prismaMock } from '@/app/test/mocks/prisma'
import Categories from './page'
import StatCard from '@/app/components/ui/Card/StatCard'
import AdminCategoryTable from '@/app/components/admin/AdminCategoryTable'

// On mocke Prisma pour ne pas toucher la base.
vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

// On mocke les enfants pour capturer leurs props. Chacun renvoie null
// car on ne veut pas tester leur rendu ici.
vi.mock('@/app/components/ui/Card/StatCard', () => ({
  default: vi.fn(() => null),
}))

vi.mock('@/app/components/admin/AdminCategoryTable', () => ({
  default: vi.fn(() => null),
}))

// next/link est déjà aliasé dans vitest.config.ts vers un mock.

const PRODUCTS_PER_PAGE = 8

// Représente une catégorie telle que Prisma la retourne avec le include.
function makeCategory(overrides: Partial<{
  id: number
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
  productCount: number
}> = {}) {
  const {
    productCount = 0,
    createdAt = new Date('2024-01-01T00:00:00Z'),
    updatedAt = new Date('2024-01-01T00:00:00Z'),
    ...rest
  } = overrides

  return {
    id: 1,
    name: 'Tapis',
    slug: 'tapis',
    createdAt,
    updatedAt,
    product: [],
    _count: { product: productCount },
    ...rest,
  }
}

// Wrapper typé : construit la prop `searchParams` attendue par le composant.
function makeProps(page?: string): {
  searchParams: Promise<{ page?: string }>
} {
  return {
    searchParams: Promise.resolve(page === undefined ? {} : { page }),
  }
}

// Appelle le composant async, récupère le JSX, et le rend avec RTL
// pour que les enfants mockés soient effectivement appelés.
async function renderPage(page?: string): Promise<void> {
  const jsx = await Categories(makeProps(page))
  render(jsx)
}

// Récupère les props passées au premier appel d'AdminCategoryTable.
function getTableProps() {
  const call = vi.mocked(AdminCategoryTable).mock.calls[0]
  if (!call) throw new Error('AdminCategoryTable n’a pas été rendu')
  return call[0]
}

// Récupère les props passées au premier appel de StatCard.
function getStatCardProps() {
  const call = vi.mocked(StatCard).mock.calls[0]
  if (!call) throw new Error('StatCard n’a pas été rendu')
  return call[0]
}

describe('Page Admin/Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    // Par défaut : aucune catégorie. Chaque test surcharge si besoin.
    prismaMock.category.findMany.mockResolvedValue([] as never)
    prismaMock.category.count.mockResolvedValue(0)
  })

  it('appelle Prisma avec skip=0 et take=8 pour la page par défaut', async () => {
    await renderPage()

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: PRODUCTS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
      }),
    )
    expect(prismaMock.category.count).toHaveBeenCalledTimes(1)
  })

  it('calcule skip correctement pour page=2', async () => {
    await renderPage('2')

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: PRODUCTS_PER_PAGE,
        take: PRODUCTS_PER_PAGE,
      }),
    )
  })

  it('calcule skip correctement pour page=3', async () => {
    await renderPage('3')

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: PRODUCTS_PER_PAGE * 2 }),
    )
  })

  it('retombe sur page=1 pour page=abc', async () => {
    await renderPage('abc')

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    )
    expect(getTableProps().currentPage).toBe(1)
  })

  it('retombe sur page=1 pour page=-5', async () => {
    await renderPage('-5')

    expect(getTableProps().currentPage).toBe(1)
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    )
  })

  it('retombe sur page=1 pour page=0', async () => {
    await renderPage('0')

    expect(getTableProps().currentPage).toBe(1)
  })

  it('parse page=1.5 comme page=1 (parseInt)', async () => {
    await renderPage('1.5')

    expect(getTableProps().currentPage).toBe(1)
  })

  it('propage currentPage à AdminCategoryTable', async () => {
    await renderPage('4')

    expect(getTableProps().currentPage).toBe(4)
  })

  it('calcule totalPages=0 quand aucune catégorie', async () => {
    prismaMock.category.count.mockResolvedValueOnce(0)

    await renderPage()

    expect(getTableProps().totalPages).toBe(0)
  })

  it('calcule totalPages=1 pour exactement 8 catégories', async () => {
    prismaMock.category.count.mockResolvedValueOnce(8)

    await renderPage()

    expect(getTableProps().totalPages).toBe(1)
  })

  it('calcule totalPages=2 pour 9 catégories', async () => {
    prismaMock.category.count.mockResolvedValueOnce(9)

    await renderPage()

    expect(getTableProps().totalPages).toBe(2)
  })

  it('calcule totalPages=3 pour 21 catégories', async () => {
    prismaMock.category.count.mockResolvedValueOnce(21)

    await renderPage()

    expect(getTableProps().totalPages).toBe(3)
  })

  it('propage les catégories retournées par Prisma', async () => {
    const categories = [
      makeCategory({ id: 1, name: 'Tapis', slug: 'tapis' }),
      makeCategory({ id: 2, name: 'Miroirs', slug: 'miroirs' }),
    ]
    prismaMock.category.findMany.mockResolvedValueOnce(categories as never)
    prismaMock.category.count.mockResolvedValueOnce(2)

    await renderPage()

    expect(getTableProps().categories).toEqual(categories)
  })

  it('passe le totalCount au StatCard', async () => {
    prismaMock.category.count.mockResolvedValueOnce(42)

    await renderPage()

    expect(getStatCardProps()).toEqual({
      statName: 'TOTAL',
      statValue: 42,
    })
  })

    it('exécute findMany et count en parallèle (Promise.all)', async () => {
    // Les deux requêtes doivent être lancées avant que l’autre ne résolve.
    const order: string[] = []

    prismaMock.category.findMany.mockImplementationOnce((async () => {
        order.push('findMany-start')
        await new Promise((r) => setTimeout(r, 10))
        order.push('findMany-end')
        return []
    }) as never)

    prismaMock.category.count.mockImplementationOnce((async () => {
        order.push('count-start')
        await new Promise((r) => setTimeout(r, 5))
        order.push('count-end')
        return 0
    }) as never)

    await renderPage()

    // Les deux "start" doivent apparaître avant tout "end".
    const findManyStart = order.indexOf('findMany-start')
    const countStart = order.indexOf('count-start')
    const findManyEnd = order.indexOf('findMany-end')
    const countEnd = order.indexOf('count-end')

    expect(findManyStart).toBeLessThan(findManyEnd)
    expect(countStart).toBeLessThan(countEnd)
    // Si c’était séquentiel : findMany-end avant count-start.
    expect(findManyEnd).toBeGreaterThan(countStart)
    })

  it('rend AdminCategoryTable et StatCard une seule fois', async () => {
    await renderPage()

    expect(vi.mocked(AdminCategoryTable)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(StatCard)).toHaveBeenCalledTimes(1)
  })
})