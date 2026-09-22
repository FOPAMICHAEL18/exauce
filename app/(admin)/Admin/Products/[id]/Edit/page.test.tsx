import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { notFound } from 'next/navigation'
import { prismaMock } from '@/app/test/mocks/prisma'
import EditProductPage from './page'
import AdminProductForm from '@/app/components/admin/AdminProductForm'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/app/components/admin/AdminProductForm', () => ({
  default: vi.fn(() => null),
}))

function makeProps(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

async function renderPage(id: string): Promise<void> {
  const jsx = await EditProductPage(makeProps(id))
  render(jsx)
}

function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
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

describe('Page Admin/Products/[id]/Edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('fetch le produit par son id parsé', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1 } as never)
    prismaMock.category.findMany.mockResolvedValueOnce([] as never)

    await renderPage('1')

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    })
  })

  it('fetch les catégories triées par name asc', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1 } as never)
    prismaMock.category.findMany.mockResolvedValueOnce([] as never)

    await renderPage('1')

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    })
  })

  it('passe categories et productId à AdminProductForm', async () => {
    const categories = [
      makeCategory({ id: 1, name: 'Tapis' }),
      makeCategory({ id: 2, name: 'Miroirs' }),
    ]
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 7 } as never)
    prismaMock.category.findMany.mockResolvedValueOnce(categories as never)

    await renderPage('7')

    const props = firstProps<{
      categories: typeof categories
      productId: number
    }>(vi.mocked(AdminProductForm))

    expect(props.categories).toEqual(categories)
    expect(props.productId).toBe(7)
  })

  it('appelle notFound si l’id n’est pas un entier positif', async () => {
    for (const badId of ['abc', '-1', '0', '1.5', '12abc', '']) {
      vi.mocked(notFound).mockClear()
      prismaMock.product.findUnique.mockClear()
      prismaMock.category.findMany.mockClear()

      vi.mocked(notFound).mockImplementationOnce(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      await expect(renderPage(badId)).rejects.toThrow('NEXT_NOT_FOUND')

      expect(notFound).toHaveBeenCalledTimes(1)
      expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
      expect(AdminProductForm).not.toHaveBeenCalled()
    }
  })

  it('appelle notFound si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(renderPage('999')).rejects.toThrow('NEXT_NOT_FOUND')

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
      select: { id: true },
    })
    expect(prismaMock.category.findMany).not.toHaveBeenCalled()
    expect(AdminProductForm).not.toHaveBeenCalled()
  })

  it('ne rend pas AdminProductForm si le produit n’existe pas', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(renderPage('999')).rejects.toThrow()

    expect(AdminProductForm).not.toHaveBeenCalled()
  })

  it('rend AdminProductForm une seule fois quand tout est valide', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1 } as never)
    prismaMock.category.findMany.mockResolvedValueOnce([] as never)

    await renderPage('1')

    expect(AdminProductForm).toHaveBeenCalledTimes(1)
  })

  it('remonte l’erreur si Prisma plante sur findUnique', async () => {
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage('1')).rejects.toThrow('DB down')
  })

  it('remonte l’erreur si Prisma plante sur category.findMany', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1 } as never)
    prismaMock.category.findMany.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage('1')).rejects.toThrow('DB down')
  })
})