import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { ReviewStatus } from '@prisma/client'

// Parse un id de route. Refuse "12abc", " 12 ", "-5", "1.5", "".
function parseRouteId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

// Select restreint : on ne renvoie pas l'email du reviewer (PII).
const REVIEW_SELECT = {
  id: true,
  author: true,
  rating: true,
  comment: true,
  status: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
} as const

const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id } = await params
    const reviewId = parseRouteId(id)

    if (reviewId === null) {
      return NextResponse.json(
        { success: false, message: "Id de l'avis non valide" },
        { status: 400 },
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, status: true },
    })

    if (!existingReview) {
      return NextResponse.json(
        { success: false, message: 'Avis non trouvé' },
        { status: 404 },
      )
    }

    // Toggle volontaire : on bascule entre les deux seuls statuts
    // existants dans l'enum. Si un troisième statut est ajouté un jour,
    // il faudra passer à une API qui prend le statut cible en body.
    const newStatus =
      existingReview.status === ReviewStatus.published
        ? ReviewStatus.hidden
        : ReviewStatus.published

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
      select: REVIEW_SELECT,
    })

    return NextResponse.json({
      success: true,
      message: 'Statut mis à jour',
      data: updated,
    })
  } catch (error) {
    console.error(
      'Erreur API modification statut avis:',
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
  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id } = await params
    const reviewId = parseRouteId(id)

    if (reviewId === null) {
      return NextResponse.json(
        { success: false, message: "Id de l'avis non valide" },
        { status: 400 },
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, author: true },
    })

    if (!existingReview) {
      return NextResponse.json(
        { success: false, message: 'Avis non trouvé' },
        { status: 404 },
      )
    }

    // On catch P2025 : si l'avis a été supprimé entre le findUnique
    // et le delete (race), on renvoie 404 au lieu d'un 500 trompeur.
    try {
      await prisma.review.delete({ where: { id: reviewId } })
    } catch (deleteError) {
      if (
        deleteError instanceof Error &&
        'code' in deleteError &&
        (deleteError as { code?: string }).code === 'P2025'
      ) {
        return NextResponse.json(
          { success: false, message: 'Avis non trouvé' },
          { status: 404 },
        )
      }
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: `Avis de ${existingReview.author} supprimé avec succès`,
    })
  } catch (error) {
    console.error(
      'Erreur API suppression avis:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { PUT, DELETE }