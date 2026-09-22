import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import { Prisma, ReviewStatus, StockStatus } from '@prisma/client'
import { prismaMock } from '@/app/test/mocks/prisma'
import ProductDetailPage from './page'
import ProductImageGallery from '@/app/components/product/ProductImageGallery'
import ReviewForm from '@/app/components/review/ReviewForm'
import ViewTracker from '@/app/components/product/ViewTracker'

vi.mock('@/app/lib/prisma', async () => {
  const { prismaMock } = await import('@/app/test/mocks/prisma')
  return { prisma: prismaMock }
})

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/app/components/product/ProductImageGallery', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/review/ReviewForm', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/product/ViewTracker', () => ({
  default: vi.fn(() => null),
}))

const SLUG = 'tapis-berbere'

type ReviewItem = {
  id: number
  author: string
  email: string
  rating: number
  comment: string
  status: ReviewStatus
  productId: number
  createdAt: Date
  updatedAt: Date
}

type ProductWithIncludes = {
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
  category: {
    id: number
    name: string
    slug: string
    createdAt: Date
    updatedAt: Date
  }
  review: ReviewItem[]
  image: {
    id: number
    url: string
    altText: string | null
    order: number
    productId: number
    createdAt: Date
    updatedAt: Date
  }[]
}

type ContactData = {
  id: number
  address: string
  phone: string
  whatsapp: string | null
  email: string
  hours: string | null
  socials: string | null
  latitude: number | null
  longitude: number | null
  createdAt: Date
  updatedAt: Date
}

function makeReview(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: 1,
    author: 'Jean Dupont',
    email: 'jean@test.com',
    rating: 5,
    comment: 'Excellent produit',
    status: ReviewStatus.published,
    productId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeProduct(overrides: Partial<ProductWithIncludes> = {}): ProductWithIncludes {
  return {
    id: 1,
    title: 'Tapis Berbère',
    slug: SLUG,
    description: 'Un beau tapis',
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
    review: [],
    image: [],
    ...overrides,
  }
}

function makeContact(overrides: Partial<ContactData> = {}): ContactData {
  return {
    id: 1,
    address: 'Douala',
    phone: '+237600000000',
    whatsapp: '+237611111111',
    email: 'contact@test.com',
    hours: null,
    socials: null,
    latitude: null,
    longitude: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeProps(slug: string = SLUG): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) }
}

async function renderPage(slug: string = SLUG): Promise<void> {
  const jsx = await ProductDetailPage(makeProps(slug))
  render(jsx)
}

function firstProps<T>(mockFn: unknown): T {
  const call = (mockFn as { mock: { calls: unknown[][] } }).mock.calls[0]
  if (!call) throw new Error('Composant non rendu')
  return call[0] as T
}

function mockDefaults(overrides: {
  product?: ProductWithIncludes | null
  contact?: ContactData | null
} = {}) {
  prismaMock.product.findUnique.mockReset()
  prismaMock.contact.findFirst.mockReset()

  prismaMock.product.findUnique.mockResolvedValueOnce(
    (overrides.product === undefined ? null : overrides.product) as never,
  )
  prismaMock.contact.findFirst.mockResolvedValueOnce(
    (overrides.contact ?? null) as never,
  )
}

describe('Page ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('fetch le produit par slug avec les bons include/filter/orderBy', async () => {
    mockDefaults({ product: makeProduct() })

    await renderPage()

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { slug: SLUG },
      include: {
        category: true,
        review: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
        },
        image: true,
      },
    })
  })

  it('fetch contact en parallèle', async () => {
    mockDefaults({ product: makeProduct() })

    await renderPage()

    expect(prismaMock.contact.findFirst).toHaveBeenCalledTimes(1)
  })

  it('appelle notFound si le produit n’existe pas', async () => {
    mockDefaults({ product: null })
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(renderPage('inconnu')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('passe les images et le titre à ProductImageGallery', async () => {
    const images = [
      {
        id: 1,
        url: 'http://img.test/1.jpg',
        altText: 'photo',
        order: 0,
        productId: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]
    mockDefaults({ product: makeProduct({ image: images }) })

    await renderPage()

    const props = firstProps<{ images: typeof images; title: string }>(
      vi.mocked(ProductImageGallery),
    )
    expect(props.images).toEqual(images)
    expect(props.title).toBe('Tapis Berbère')
  })

  it('passe productId à ReviewForm', async () => {
    mockDefaults({ product: makeProduct({ id: 42 }) })

    await renderPage()

    const props = firstProps<{ productId: number }>(vi.mocked(ReviewForm))
    expect(props.productId).toBe(42)
  })

  it('passe slug à ViewTracker', async () => {
    mockDefaults({ product: makeProduct() })

    await renderPage()

    const props = firstProps<{ slug: string }>(vi.mocked(ViewTracker))
    expect(props.slug).toBe(SLUG)
  })

  it('affiche "Disponible en atelier" si stockStatus=disponible', async () => {
    mockDefaults({
      product: makeProduct({ stockStatus: StockStatus.disponible }),
    })

    await renderPage()

    expect(screen.getByText('Disponible en atelier')).toBeInTheDocument()
  })

  it('affiche "Sur commande" si stockStatus=rupture', async () => {
    mockDefaults({
      product: makeProduct({ stockStatus: StockStatus.rupture }),
    })

    await renderPage()

    expect(screen.getByText('Sur commande')).toBeInTheDocument()
  })

  it('affiche le nombre d’avis', async () => {
    mockDefaults({
      product: makeProduct({
        review: [makeReview({ id: 1 }), makeReview({ id: 2 })],
      }),
    })

    await renderPage()

    expect(screen.getByText('(2 avis)')).toBeInTheDocument()
  })

  it('affiche le texte par défaut si description vide', async () => {
    mockDefaults({ product: makeProduct({ description: '' }) })

    await renderPage()

    expect(
      screen.getByText('Aucune description fournie pour ce produit.'),
    ).toBeInTheDocument()
  })

  it('affiche le bouton tel si phone est présent', async () => {
    mockDefaults({
      product: makeProduct(),
      contact: makeContact({ phone: '+237600000000' }),
    })

    await renderPage()

    expect(screen.getByText('Contacter le vendeur')).toBeInTheDocument()
  })

  it('affiche le bouton WhatsApp si whatsapp est présent', async () => {
    mockDefaults({
      product: makeProduct(),
      contact: makeContact({ whatsapp: '+237611111111' }),
    })

    await renderPage()

    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
  })

  it('n’affiche pas le bouton WhatsApp si whatsapp est null', async () => {
    mockDefaults({
      product: makeProduct(),
      contact: makeContact({ whatsapp: null }),
    })

    await renderPage()

    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
  })

  it('n’affiche ni bouton tel ni WhatsApp si contact est null', async () => {
    mockDefaults({ product: makeProduct(), contact: null })

    await renderPage()

    expect(screen.queryByText('Contacter le vendeur')).not.toBeInTheDocument()
    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
  })

  it('affiche les avis publiés', async () => {
    mockDefaults({
      product: makeProduct({
        review: [
          makeReview({ id: 1, author: 'Alice' }),
          makeReview({ id: 2, author: 'Bob' }),
        ],
      }),
    })

    await renderPage()

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('remonte l’erreur si Prisma plante', async () => {
    prismaMock.product.findUnique.mockReset()
    prismaMock.product.findUnique.mockRejectedValueOnce(new Error('DB down'))
    prismaMock.contact.findFirst.mockReset()
    prismaMock.contact.findFirst.mockResolvedValueOnce(null as never)

    await expect(renderPage()).rejects.toThrow('DB down')
  })
})