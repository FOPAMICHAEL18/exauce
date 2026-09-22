import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { notFound } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import EditCategoryPage from './page'
import AdminCategoryForm from '@/app/components/admin/AdminCategoryForm'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/app/components/admin/AdminCategoryForm', () => ({
  default: vi.fn(() => null),
}))

// Représente une Category complète telle que Prisma la retourne.
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

function makeProps(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

async function renderPage(id: string): Promise<void> {
  const jsx = await EditCategoryPage(makeProps(id))
  render(jsx)
}

describe('Page Admin/Categories/[id]/edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('fetch la catégorie avec l’id parsé', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory() as never)

    await renderPage('1')

    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    })
  })

  it('passe initialData à AdminCategoryForm', async () => {
    const category = makeCategory({ id: 7, name: 'Miroirs', slug: 'miroirs' })
    prismaMock.category.findUnique.mockResolvedValueOnce(category as never)

    await renderPage('7')

    const calls = vi.mocked(AdminCategoryForm).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0]?.[0]).toEqual(
        expect.objectContaining({ initialData: category }),
    )
    })

  it('appelle notFound si l’id n’est pas un entier positif', async () => {
    for (const badId of ['abc', '-1', '0', '1.5', '12abc', '']) {
      vi.mocked(notFound).mockClear()
      prismaMock.category.findUnique.mockClear()

      // notFound() lance une erreur spéciale en production pour
      // interrompre le rendu. On la capture pour ne pas faire planter
      // le test.
      vi.mocked(notFound).mockImplementationOnce(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      await expect(renderPage(badId)).rejects.toThrow('NEXT_NOT_FOUND')

      expect(notFound).toHaveBeenCalledTimes(1)
      expect(prismaMock.category.findUnique).not.toHaveBeenCalled()
    }
  })

  it('appelle notFound si la catégorie n’existe pas', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(renderPage('999')).rejects.toThrow('NEXT_NOT_FOUND')

    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
    })
    expect(notFound).toHaveBeenCalledTimes(1)
    expect(AdminCategoryForm).not.toHaveBeenCalled()
  })

  it('ne rend pas AdminCategoryForm si la catégorie n’existe pas', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(renderPage('999')).rejects.toThrow()

    expect(AdminCategoryForm).not.toHaveBeenCalled()
  })

  it('remonte l’erreur si Prisma plante', async () => {
    prismaMock.category.findUnique.mockRejectedValueOnce(new Error('DB down'))

    await expect(renderPage('1')).rejects.toThrow('DB down')
  })
})