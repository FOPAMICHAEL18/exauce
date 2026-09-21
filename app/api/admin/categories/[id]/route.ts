import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { generateSlug } from '@/app/lib/utils'

const NAME_MAX_LENGTH = 100

// Parse un id de route. Refuse tout ce qui n’est pas un entier
// strictement positif : "12abc", " 12 ", "-5", "1.5", "" → null.
function parseCategoryId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  // Vérification admin centralisée, comme dans POST.
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const categoryId = parseCategoryId(id)

    if (categoryId === null) {
      return NextResponse.json(
        { success: false, message: 'Id de catégorie non valide' },
        { status: 400 },
      )
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Catégorie non trouvée' },
        { status: 404 },
      )
    }

    const body = (await request.json().catch(() => null)) as unknown

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>
    const name =
      typeof data.name === 'string'
        ? data.name.trim()
        : existingCategory.name

    if (name.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Le nom est requis' },
        { status: 400 },
      )
    }

    if (name.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Le nom ne doit pas dépasser ${NAME_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    // Slug régénéré uniquement si le nom change.
    let slug = existingCategory.slug

    if (name !== existingCategory.name) {
      const generated = generateSlug(name)

      if (generated.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Le nom contient trop de caractères spéciaux pour générer un slug',
          },
          { status: 400 },
        )
      }

      slug = generated
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug },
      select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
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
        { success: false, message: 'Cette catégorie existe déjà.' },
        { status: 409 },
      )
    }

    console.error(
      'Erreur API modification catégorie:',
      error instanceof Error ? error.message : error,
    )

    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const categoryId = parseCategoryId(id)

    if (categoryId === null) {
      return NextResponse.json(
        { success: false, message: 'Id de catégorie non valide' },
        { status: 400 },
      )
    }

    // On combine la vérification « existe » et le comptage dans une
    // seule requête. La suppression effective est faite dans une
    // transaction qui revérifie le compte pour éviter la race condition.
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { id: categoryId },
        include: { _count: { select: { product: true } } },
      })

      if (!existing) {
        return { ok: false as const, reason: 'NOT_FOUND' as const }
      }

      if (existing._count.product > 0) {
        return {
          ok: false as const,
          reason: 'HAS_PRODUCTS' as const,
          count: existing._count.product,
          name: existing.name,
        }
      }

      // Re-check à l'intérieur de la transaction pour éviter qu'un
      // produit ne soit créé entre le check et le delete.
      const liveCount = await tx.product.count({
        where: { categoryId },
      })

      if (liveCount > 0) {
        return {
          ok: false as const,
          reason: 'HAS_PRODUCTS' as const,
          count: liveCount,
          name: existing.name,
        }
      }

      await tx.category.delete({ where: { id: categoryId } })

      return { ok: true as const, name: existing.name }
    })

    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Catégorie non trouvée' },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: `Impossible : ${result.count} produit(s) utilisent cette catégorie.`,
        },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Catégorie "${result.name}" supprimée avec succès`,
    })
  } catch (error) {
    console.error(
      'Erreur API suppression catégorie:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { PUT, DELETE }