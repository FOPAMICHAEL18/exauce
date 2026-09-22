import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { Prisma, ReviewStatus } from '@prisma/client'

// Bornes de pagination.
const PAGE_MIN = 1
const LIMIT_MIN = 1
const LIMIT_MAX = 50
const LIMIT_DEFAULT = 20

const REVIEW_SELECT = {
  id: true,
  author: true,
  rating: true,
  comment: true,
  status: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: { id: true, title: true, slug: true },
  },
} as const

// Parse un entier strictement positif. Renvoie null si invalide.
function parsePositiveInt(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

const GET = async (request: NextRequest): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const url = new URL(request.url)

    const productIdRaw = url.searchParams.get('productId')
    const statusRaw = url.searchParams.get('status')
    const pageRaw = url.searchParams.get('page')
    const limitRaw = url.searchParams.get('limit')

    // productId : si fourni, doit être un entier positif. Sinon → 400.
    let productId: number | undefined
    if (productIdRaw !== null) {
      const parsed = parsePositiveInt(productIdRaw)
      if (parsed === null) {
        return NextResponse.json(
          { success: false, message: 'productId invalide' },
          { status: 400 },
        )
      }
      productId = parsed
    }

    // status : si fourni, doit être dans l'enum. Sinon → 400.
    let status: ReviewStatus | undefined
    if (statusRaw !== null) {
      if (
        statusRaw !== ReviewStatus.published &&
        statusRaw !== ReviewStatus.hidden
      ) {
        return NextResponse.json(
          { success: false, message: 'status invalide' },
          { status: 400 },
        )
      }
      status = statusRaw
    }

    // page : défaut 1.
    let page = PAGE_MIN
    if (pageRaw !== null) {
      const parsed = parsePositiveInt(pageRaw)
      if (parsed === null) {
        return NextResponse.json(
          { success: false, message: 'page invalide' },
          { status: 400 },
        )
      }
      page = Math.max(PAGE_MIN, parsed)
    }

    // limit : défaut 20, capé à 50. Un limit hors bornes est un 400
    // (choix explicite : on préfère dire au client que sa valeur est
    // refusée plutôt que de la modifier silencieusement).
    let limit = LIMIT_DEFAULT
    if (limitRaw !== null) {
      const parsed = parsePositiveInt(limitRaw)
      if (parsed === null || parsed > LIMIT_MAX) {
        return NextResponse.json(
          {
            success: false,
            message: `limit doit être un entier entre ${LIMIT_MIN} et ${LIMIT_MAX}`,
          },
          { status: 400 },
        )
      }
      limit = parsed
    }

    const skip = (page - 1) * limit

    // Construction typée du where.
    const where: Prisma.ReviewWhereInput = {}
    if (productId !== undefined) where.productId = productId
    if (status !== undefined) where.status = status

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        select: REVIEW_SELECT,
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
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { GET }