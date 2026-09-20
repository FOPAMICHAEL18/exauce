import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateSlug } from '@/app/lib/utils'
import { StockStatus } from '@prisma/client'

const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const productId = parseInt(id, 10)

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: 'Id de produit non valide' },
        { status: 400 }
      )
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const title = typeof body.title === 'string' ? body.title.trim() : existingProduct.title
    const description = typeof body.description === 'string' ? body.description.trim() : existingProduct.description
    const price = Number(body.price)
    const categoryId = Number(body.categoryId)

    // 🎯 Validation stricte de stockStatus
    const rawStockStatus = typeof body.stockStatus === 'string' ? body.stockStatus : ''
    const stockStatus: StockStatus =
    rawStockStatus === StockStatus.disponible || rawStockStatus === StockStatus.rupture
        ? (rawStockStatus as StockStatus)
        : existingProduct.stockStatus



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

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    // Slug régénéré uniquement si le titre change
    const slug = title !== existingProduct.title ? generateSlug(title) : existingProduct.slug

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        slug,
        description,
        price,
        stockStatus,
        categoryId,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Un produit avec ce slug existe déjà.' },
        { status: 409 }
      )
    }

    console.error(
      'Erreur API modification produit:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const productId = parseInt(id, 10)

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: 'Id de produit non valide' },
        { status: 400 }
      )
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    await prisma.product.delete({ where: { id: productId } })

    return NextResponse.json({
      success: true,
      message: `Produit "${existingProduct.title}" supprimé avec succès`,
    })
  } catch (error) {
    console.error(
      'Erreur API suppression produit:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const productId = parseInt(id, 10)

    // 🐛 BUG CORRIGÉ : avant, pas de check isNaN → Prisma recevait NaN
    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: 'Id de produit non valide' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error(
      'Erreur GET produit:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { PUT, DELETE, GET }