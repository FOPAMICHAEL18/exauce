import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { validateAuthor } from '@/app/lib/validators'
import { generateSlug } from '@/app/lib/utils'

// Longueur max du nom, alignée sur la colonne VarChar(100) en base.
const NAME_MAX_LENGTH = 100

const POST = async (request: NextRequest): Promise<NextResponse> => {
  // La vérification admin est centralisée dans requireAdmin : un seul
  // point à maintenir, testé indépendamment dans admin-auth.test.ts.
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    // Lecture du body. On accepte uniquement du JSON valide et un objet
    // "plat" : ni null, ni tableau, ni primitive.
    const body = (await request.json().catch(() => null)) as unknown

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const data = body as Record<string, unknown>
    const name = typeof data.name === 'string' ? data.name.trim() : ''

    // Validation : longueur min (validateur existant) puis longueur max
    // (contrainte base) pour éviter un 500 PostgreSQL.
    if (!validateAuthor(name)) {
      return NextResponse.json(
        { success: false, message: 'Le nom doit faire au moins 2 caractères' },
        { status: 400 }
      )
    }

    if (name.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Le nom ne doit pas dépasser ${NAME_MAX_LENGTH} caractères`,
        },
        { status: 400 }
      )
    }

    // Génération du slug. Un nom qui ne contient que des caractères
    // spéciaux produit un slug vide : on refuse explicitement plutôt
    // que de créer une catégorie inutilisable.
    const baseSlug = generateSlug(name)

    if (baseSlug.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Le nom contient trop de caractères spéciaux pour générer un slug',
        },
        { status: 400 }
      )
    }

    // Vérification des doublons (nom OU slug).
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

    // Création. On ne renvoie que les champs utiles au client.
    const category = await prisma.category.create({
      data: { name, slug: baseSlug },
      select: { id: true, name: true, slug: true, createdAt: true },
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
    // Race condition : deux requêtes simultanées ont créé la même
    // catégorie entre le findFirst et le create.
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