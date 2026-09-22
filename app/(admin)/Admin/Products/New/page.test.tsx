import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { prismaMock } from '@/app/test/mocks/prisma'
import NewProduct from './page'
import AdminProductForm from '@/app/components/admin/AdminProductForm'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('@/app/components/admin/AdminProductForm', () => ({
  default: vi.fn(() => null),
}))

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

function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
}

async function renderPage(): Promise<void> {
  const jsx = await NewProduct()
  render(jsx)
}

describe('Page Admin/Products/New', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('fetch les catégories triées par name asc', async () => {
    prismaMock.category.findMany.mockResolvedValueOnce([] as never)

    await renderPage()

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    })
  })

  it('passe les catégories à AdminProductForm', async () => {
    const categories = [
      makeCategory({ id: 1, name: 'Tapis' }),
      makeCategory({ id: 2, name: 'Miroirs' }),
    ]
    prismaMock.category.findMany.mockResolvedValueOnce(categories as never)

    await renderPage()

    const props = firstProps<{ categories: typeof categories }>(
      vi.mocked(AdminProductForm),
    )
    expect(props.categories).toEqual(categories)
  })

  it('remonte l’erreur si Prisma plante', async () => {
    prismaMock.category.findMany.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage()).rejects.toThrow('DB down')
  })
})