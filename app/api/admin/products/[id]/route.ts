import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { generateSlug, parseNumberField } from '@/app/lib/utils'
import { StockStatus } from '@prisma/client'

const TITLE_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 5000
const PRICE_MAX = 99_999_999.99
const PRICE_MIN = 0

// Parse un id de route. Refuse "12abc", " 12 ", "-5", "1.5", "".
function parseRouteId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

// Vérifie qu'un stockStatus fourni est valide. Renvoie "absent" si le
// champ n’est pas dans le body, "invalid" si fourni mais invalide.
function parseStockStatus(
  value: unknown,
): { kind: 'absent' } | { kind: 'valid'; value: StockStatus } | { kind: 'invalid' } {
  if (value === undefined) return { kind: 'absent' }
  if (typeof value === 'string' && (value === StockStatus.disponible || value === StockStatus.rupture)) {
    return { kind: 'valid', value: value as StockStatus }
  }
  return { kind: 'invalid' }
}

const SELECT_PRODUCT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  stockStatus: true,
  categoryId: true,
  views: true,
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
    const productId = parseRouteId(id)

    if (productId === null) {
      return NextResponse.json(
        { success: false, message: 'Id de produit non valide' },
        { status: 400 },
      )
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
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

    // Mise à jour partielle : tout champ absent du body conserve la
    // valeur existante.
    const title =
      typeof data.title === 'string' ? data.title.trim() : existingProduct.title
    const description =
      typeof data.description === 'string'
        ? data.description.trim()
        : existingProduct.description

    if (title.length < 2 || title.length > TITLE_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Le titre doit faire entre 2 et ${TITLE_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (description.length < 5 || description.length > DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `La description doit faire entre 5 et ${DESCRIPTION_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    // Prix : si absent, on garde l’existant.
    const price =
      data.price === undefined
        ? Number(existingProduct.price)
        : parseNumberField(data.price)

    if (!Number.isFinite(price) || price < PRICE_MIN || price > PRICE_MAX) {
      return NextResponse.json(
        { success: false, message: 'Prix invalide' },
        { status: 400 },
      )
    }

    const roundedPrice = Math.round(price * 100) / 100

    // Catégorie : si absente, on garde l’existant.
    const categoryId =
      data.categoryId === undefined
        ? existingProduct.categoryId
        : parseNumberField(data.categoryId)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { success: false, message: 'Catégorie invalide' },
        { status: 400 },
      )
    }

    // Stock : absent → on garde ; fourni invalide → 400 (pas de
    // fallback silencieux).
    const stockResult = parseStockStatus(data.stockStatus)

    if (stockResult.kind === 'invalid') {
      return NextResponse.json(
        { success: false, message: 'Statut de stock invalide' },
        { status: 400 },
      )
    }

    const stockStatus =
      stockResult.kind === 'valid'
        ? stockResult.value
        : existingProduct.stockStatus

    // Vérifie que la catégorie cible existe (seulement si elle change).
    if (categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      })

      if (!category) {
        return NextResponse.json(
          { success: false, message: 'Catégorie non trouvée' },
          { status: 404 },
        )
      }
    }

    // Slug régénéré uniquement si le titre change.
    let slug = existingProduct.slug

    if (title !== existingProduct.title) {
      const generated = generateSlug(title)

      if (generated.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Le titre contient trop de caractères spéciaux pour générer un slug',
          },
          { status: 400 },
        )
      }

      slug = generated
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        slug,
        description,
        price: roundedPrice,
        stockStatus,
        categoryId,
      },
      select: SELECT_PRODUCT,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Un produit avec ce slug existe déjà.' },
        { status: 409 },
      )
    }

    console.error(
      'Erreur API modification produit:',
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
    const productId = parseRouteId(id)

    if (productId === null) {
      return NextResponse.json(
        { success: false, message: 'Id de produit non valide' },
        { status: 400 },
      )
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 },
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
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id } = await params
    const productId = parseRouteId(id)

    if (productId === null) {
      return NextResponse.json(
        { success: false, message: 'Id de produit non valide' },
        { status: 400 },
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
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error(
      'Erreur GET produit:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { PUT, DELETE, GET }