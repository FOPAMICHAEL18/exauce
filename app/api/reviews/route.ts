import { prisma } from "@/app/lib/prisma"
import { ReviewStatus } from "@prisma/client"
import { parseNumberField } from "@/app/lib/utils"
import {
  validateAuthor, validateComment, validateEmail,
  validateProductId, validateRating,
} from "@/app/lib/validators"

// Latence aléatoire : le bot ne peut pas distinguer le faux succès d'un vrai.
const fakeDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400))

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => null)) as unknown

    // On refuse tout ce qui n'est pas un objet JSON "plat".
    // Array.isArray(body) est nécessaire car typeof [] === 'object'.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        { success: false, message: "Données invalides." },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>

    const author   = typeof data.author   === 'string' ? data.author.trim()   : ''
    const email    = typeof data.email    === 'string' ? data.email.trim()    : ''
    const comment  = typeof data.comment  === 'string' ? data.comment.trim()  : ''
    const honeypot = typeof data.honeypot === 'string' ? data.honeypot.trim() : ''

    // On n'accepte QUE de vrais nombres côté JSON, ou des chaînes
    // numériques non vides. Fini le Number(true) === 1 ou Number([]) === 0.
    const ratingNumber    = parseNumberField(data.rating)
    const productIdNumber = parseNumberField(data.productId)

    // 🍯 HONEYPOT : faux succès, rien n'est écrit en base
    if (honeypot.length > 0) {
      await fakeDelay()
      return Response.json(
        { success: true, message: "Avis enregistré." },
        { status: 201 },
      )
    }

    // Validations
    if (!validateAuthor(author)) {
      return Response.json(
        { success: false, message: "Le nom doit faire au moins 2 caractères." },
        { status: 400 },
      )
    }

    if (!validateEmail(email)) {
      return Response.json(
        { success: false, message: "Adresse email invalide." },
        { status: 400 },
      )
    }

    if (!validateComment(comment)) {
      return Response.json(
        { success: false, message: "Le commentaire doit faire au moins 5 caractères." },
        { status: 400 },
      )
    }

    if (!validateRating(ratingNumber)) {
      return Response.json(
        { success: false, message: "La note doit être comprise entre 1 et 5 étoiles." },
        { status: 400 },
      )
    }

    if (!validateProductId(productIdNumber)) {
      return Response.json(
        { success: false, message: "Identifiant de produit non valide." },
        { status: 400 },
      )
    }

    // Évite une FK violation (500) si le produit n'existe pas.
    const productExists = await prisma.product.findUnique({
      where: { id: productIdNumber },
      select: { id: true },
    })
    if (!productExists) {
      return Response.json(
        { success: false, message: "Produit introuvable." },
        { status: 404 },
      )
    }

    const newReview = await prisma.review.create({
      data: {
        author,
        email,
        rating: ratingNumber,
        comment,
        productId: productIdNumber,
        // On utilise l'enum Prisma plutôt qu'une string en dur :
        // si l'enum évolue, TypeScript nous le signalera.
        status: ReviewStatus.published,
      },
      select: {
        id: true,
        author: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })

    return Response.json({ success: true, data: newReview }, { status: 201 })
  } catch (error) {
    console.error(
      'Erreur API review POST:',
      error instanceof Error ? error.message : error,
    )
    return Response.json(
      { success: false, message: "Erreur interne du serveur." },
      { status: 500 },
    )
  }
}


