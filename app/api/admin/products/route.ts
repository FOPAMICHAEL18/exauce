import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { generateSlug, parseNumberField } from '@/app/lib/utils'
import { StockStatus } from '@prisma/client'

const TITLE_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 5000
// Decimal(10,2) : 8 chiffres avant la virgule, 2 après.
const PRICE_MAX = 99_999_999.99
const PRICE_MIN = 0

const POST = async (request: NextRequest): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (await request.json().catch(() => null)) as unknown

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>

    const title =
      typeof data.title === 'string' ? data.title.trim() : ''
    const description =
      typeof data.description === 'string' ? data.description.trim() : ''
    const price = parseNumberField(data.price)
    const categoryId = parseNumberField(data.categoryId)
    const rawStockStatus =
      typeof data.stockStatus === 'string' ? data.stockStatus : ''

    if (title.length < 2 || title.length > TITLE_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Le titre doit faire entre 2 et ${TITLE_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (description.length < 5 || description.length > DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `La description doit faire entre 5 et ${DESCRIPTION_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (
      !Number.isFinite(price) ||
      price < PRICE_MIN ||
      price > PRICE_MAX
    ) {
      return NextResponse.json(
        { success: false, message: 'Prix invalide' },
        { status: 400 },
      )
    }

    // On arrondit à 2 décimales pour matcher Decimal(10,2).
    const roundedPrice = Math.round(price * 100) / 100

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { success: false, message: 'Catégorie invalide' },
        { status: 400 },
      )
    }

    if (
      rawStockStatus !== StockStatus.disponible &&
      rawStockStatus !== StockStatus.rupture
    ) {
      return NextResponse.json(
        { success: false, message: 'Statut de stock invalide' },
        { status: 400 },
      )
    }

    const stockStatus = rawStockStatus as StockStatus

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Catégorie non trouvée' },
        { status: 404 },
      )
    }

    const slug = generateSlug(title)

    if (slug.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Le titre contient trop de caractères spéciaux pour générer un slug',
        },
        { status: 400 },
      )
    }

    const existingSlug = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'Un produit avec ce nom existe déjà.' },
        { status: 409 },
      )
    }

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price: roundedPrice,
        stockStatus,
        categoryId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        price: true,
        stockStatus: true,
        categoryId: true,
        views: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Produit créé avec succès', data: product },
      { status: 201 },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Un produit avec ce nom existe déjà.' },
        { status: 409 },
      )
    }

    console.error(
      'Erreur API admin/products POST:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { POST }