// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateSlug } from '@/app/lib/utils'
import { StockStatus } from '@prisma/client'

const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const price = Number(body.price)
    const categoryId = Number(body.categoryId)
    const rawStockStatus = typeof body.stockStatus === 'string' ? body.stockStatus : ''

    // Validations
    if (title.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Le titre doit faire au moins 2 caractères' },
        { status: 400 }
      )
    }
    if (description.length < 5) {
      return NextResponse.json(
        { success: false, message: 'La description doit faire au moins 5 caractères' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Prix invalide' },
        { status: 400 }
      )
    }
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { success: false, message: 'Catégorie invalide' },
        { status: 400 }
      )
    }
    if (
      rawStockStatus !== StockStatus.disponible &&
      rawStockStatus !== StockStatus.rupture
    ) {
      return NextResponse.json(
        { success: false, message: 'Statut de stock invalide' },
        { status: 400 }
      )
    }
    const stockStatus = rawStockStatus as StockStatus

    // Vérifier la catégorie
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    })
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    // Générer le slug et vérifier l'unicité
    const slug = generateSlug(title)
    const existingSlug = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'Un produit avec ce nom existe déjà.' },
        { status: 409 }
      )
    }

    // Création
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price,
        stockStatus,
        categoryId,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Produit créé avec succès', data: product },
      { status: 201 }
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Un produit avec ce nom existe déjà.' },
        { status: 409 }
      )
    }

    console.error(
      'Erreur API admin/products POST:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { POST }