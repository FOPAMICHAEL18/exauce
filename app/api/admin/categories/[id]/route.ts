import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateSlug } from '@/app/lib/utils'

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

    const { id } = await params  // ⚠️ await obligatoire
    const categoryId = parseInt(id, 10)

    if (Number.isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Id de catégorie non valide' },
        { status: 400 }
      )
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Catégorie non trouvée' },
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

    const name = typeof body.name === 'string' ? body.name.trim() : existingCategory.name

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Le nom est requis' },
        { status: 400 }
      )
    }

    // Slug régénéré UNIQUEMENT si le nom change
    let slug = existingCategory.slug
    if (name !== existingCategory.name) {
      slug = generateSlug(name)
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug },
    })

    return NextResponse.json({
      success: true,
      message: 'Catégorie modifiée avec succès',
      data: updated,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Ce nom de catégorie existe déjà.' },
        { status: 409 }
      )
    }

    console.error(
      'Erreur API modification catégorie:',
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
    const categoryId = parseInt(id, 10)

    if (Number.isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Id de catégorie non valide' },
        { status: 400 }
      )
    }

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { product: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    // 🔒 Protection : refuse la suppression si des produits y sont liés
    if (existing._count.product > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Impossible : ${existing._count.product} produit(s) utilisent cette catégorie.`,
        },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id: categoryId } })

    return NextResponse.json({
      success: true,
      message: `Catégorie "${existing.name}" supprimée avec succès`,
    })
  } catch (error) {
    console.error(
      'Erreur API suppression catégorie:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { PUT, DELETE }