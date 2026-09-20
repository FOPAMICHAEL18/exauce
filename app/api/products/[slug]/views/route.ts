import { prisma } from '@/app/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> => {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const cookieStore = await cookies()
    let sessionId = cookieStore.get('sessionId')?.value

    if (!sessionId) {
      sessionId = crypto.randomUUID()
      cookieStore.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      })
    }

    const existingView = await prisma.view.findUnique({
      where: {
        sessionId_productId: { sessionId, productId: product.id },
      },
      select: { id: true },
    })

    if (existingView) {
      return NextResponse.json({ success: true, alreadyViewed: true })
    }

    // Transaction : si l'un échoue, l'autre rollback
    await prisma.$transaction([
      prisma.view.create({
        data: { sessionId, productId: product.id },
      }),
      prisma.product.update({
        where: { id: product.id },
        data: { views: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    // Race condition : deux requêtes simultanées de la même session
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json({ success: true, alreadyViewed: true })
    }

    console.error(
      'Erreur tracking vue:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { POST }