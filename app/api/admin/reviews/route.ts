// app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Prisma, ReviewStatus } from '@prisma/client'

const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const productIdRaw = url.searchParams.get('productId')
    const statusRaw = url.searchParams.get('status')
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20))
    const skip = (page - 1) * limit

    // Construction typée du where
    const where: Prisma.ReviewWhereInput = {}

    if (productIdRaw) {
      const productId = parseInt(productIdRaw, 10)
      if (Number.isInteger(productId) && productId > 0) {
        where.productId = productId
      }
    }

    if (statusRaw === ReviewStatus.published || statusRaw === ReviewStatus.hidden) {
      where.status = statusRaw
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error(
      'Erreur API reviews GET:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { GET }