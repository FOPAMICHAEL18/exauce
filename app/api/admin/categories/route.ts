import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { validateAuthor } from '@/app/lib/validators'
import { generateSlug } from '@/app/lib/utils'

const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Vérification admin (posé par le middleware)
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Lecture du body
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''

    // Validation
    if (!validateAuthor(name)) {
      return NextResponse.json(
        { success: false, message: 'Le nom doit faire au moins 2 caractères' },
        { status: 400 }
      )
    }

    // Génération du slug
    const baseSlug = generateSlug(name)

    // Vérification des doublons (nom OU slug)
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug: baseSlug }],
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Cette catégorie existe déjà.' },
        { status: 409 }
      )
    }

    // Création
    const category = await prisma.category.create({
      data: { name, slug: baseSlug },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Catégorie créée avec succès',
        data: category,
      },
      { status: 201 }
    )
  } catch (error) {
    // Race condition : deux requêtes simultanées ont créé la même catégorie
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Cette catégorie existe déjà.' },
        { status: 409 }
      )
    }

    console.error(
      'Erreur API admin/categories POST:',
      error instanceof Error ? error.message : error
    )

    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { POST }