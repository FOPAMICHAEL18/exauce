import { prisma } from "@/app/lib/prisma"
import {
  validateAuthor, validateComment, validateEmail,
  validateProductId, validateRating,
} from "@/app/lib/validators"

// Latence aléatoire : le bot ne peut pas distinguer le faux succès d'un vrai
const fakeDelay = () => new Promise((r) => setTimeout(r, 300 + Math.random() * 400))

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

    if (!body || typeof body !== 'object') {
      return Response.json({ success: false, message: "Données invalides." }, { status: 400 })
    }

    const author   = typeof body.author   === 'string' ? body.author.trim()   : ''
    const email    = typeof body.email    === 'string' ? body.email.trim()    : ''
    const comment  = typeof body.comment  === 'string' ? body.comment.trim()  : ''
    const honeypot = typeof body.honeypot === 'string' ? body.honeypot.trim() : ''

    const ratingNumber    = Number(body.rating)
    const productIdNumber = Number(body.productId)

    // 🍯 HONEYPOT : faux succès, rien n'est écrit en base
    if (honeypot.length > 0) {
      await fakeDelay()
      return Response.json({ success: true, message: "Avis enregistré." }, { status: 201 })
    }

    // Validations
    if (!validateAuthor(author))
      return Response.json({ success: false, message: "Le nom doit faire au moins 2 caractères." }, { status: 400 })

    if (email.length > 0 && !validateEmail(email))
      return Response.json({ success: false, message: "Adresse email invalide." }, { status: 400 })

    if (!validateComment(comment))
      return Response.json({ success: false, message: "Le commentaire doit faire au moins 5 caractères." }, { status: 400 })

    if (!validateRating(ratingNumber))
      return Response.json({ success: false, message: "La note doit être comprise entre 1 et 5 étoiles." }, { status: 400 })

    if (!validateProductId(productIdNumber))
      return Response.json({ success: false, message: "Identifiant de produit non valide." }, { status: 400 })

    // Évite une FK violation (500) si le produit n'existe pas
    const productExists = await prisma.product.findUnique({
      where: { id: productIdNumber },
      select: { id: true },
    })
    if (!productExists)
      return Response.json({ success: false, message: "Produit introuvable." }, { status: 404 })

    const newReview = await prisma.review.create({
      data: {
        author,
        email: email,
        rating: ratingNumber,
        comment,
        productId: productIdNumber,
        status: "published",
      },
      select: { id: true, author: true, rating: true, comment: true, createdAt: true },
    })

    return Response.json({ success: true, data: newReview }, { status: 201 })
  } catch (error) {
    console.error('Erreur API review POST:', error instanceof Error ? error.message : error)
    return Response.json({ success: false, message: "Erreur interne du serveur." }, { status: 500 })
  }
}


export const GET = async (request: Request): Promise<Response> => {
    try {
        const url = new URL(request.url)
        const productId = url.searchParams.get("productId")

        if (!productId) {
            return Response.json({
                success: false,
                message: "Le paramètre productId est requis."
            }, { status: 400 })
        }

        const productIdNumber = parseInt(productId, 10)
        if (!validateProductId(productIdNumber)) {
            return Response.json({
                success: false,
                message: "Le productId doit être un nombre valide."
            }, { status: 400 })
        }

        const reviews = await prisma.review.findMany({
            where: {
                productId: productIdNumber,
                status: "published"
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                author: true,
                rating: true,
                comment: true,
                createdAt: true,
            }
        })

        return Response.json({
            success: true,
            data: reviews
        })

    } catch (error) {
        console.error('Erreur API reviews GET:', error instanceof Error ? error.message : error)
        return Response.json({
            success: false,
            message: "Erreur lors de la récupération des avis."
        }, { status: 500 })
    }
}