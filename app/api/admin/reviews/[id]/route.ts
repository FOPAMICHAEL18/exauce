import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

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
    const reviewId = parseInt(id, 10)

    if (Number.isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: "Id de l'avis non valide" },
        { status: 400 }
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
      return NextResponse.json(
        { success: false, message: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    const newStatus = existingReview.status === 'published' ? 'hidden' : 'published'

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      message: `Statut de l'avis mis à jour : ${newStatus}`,
      data: updated,
    })
  } catch (error) {
    console.error(
      "Erreur API modification statut avis:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }  // ⚠️ Status manquait
    )
  }
}

const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ⚠️ Promise
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

    const { id } = await params  // ⚠️ await
    const reviewId = parseInt(id, 10)

    if (Number.isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: "Id de l'avis non valide" },
        { status: 400 }
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
      return NextResponse.json(
        { success: false, message: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    await prisma.review.delete({ where: { id: reviewId } })

    return NextResponse.json({
      success: true,
      message: `Avis de ${existingReview.author} supprimé avec succès`,  // ⚠️ Avis, pas Produit
    })
  } catch (error) {
    console.error(
      "Erreur API suppression avis:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { PUT, DELETE }