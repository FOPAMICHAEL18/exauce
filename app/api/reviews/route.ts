import { prisma } from "@/app/lib/prisma"; 

const POST = async (request: Request): Promise<Response> => {
    try {
        // On lit le corps de la requete envoye en JSON par le frontend
        const body = (await request.json()) as Record<string, unknown>   // Veut dire que body est un objet donc les cles somt des chaines de caracteres et les valeurs peuvent etre n'importe quoi
        if (!body || typeof body !== 'object') {
            return Response.json({
                success: false,
                error: "donnees invalides"
            }, {status: 400})
        }

        const author = typeof body.author === 'string' ? body.author : ''
        const email = typeof body.email === 'string' ? body.email : ''
        const rating = typeof body.rating === 'string' ? body.rating : ''
        const comment = typeof body.comment === 'string' ? body.comment : ''
        const productId = typeof body.productId === 'string' ? body.productId : ''
        const honeypot = typeof body.honeypot === 'string' ? body.honeypot : ''

        //ANTY-SPAM verification du honeypot
        if (honeypot && honeypot.length > 0) {
            return Response.json({
                success: true,
                message: "Avis enregistre"
            })
        }

        //Validation des champs obligatoire
        if (!author || author.trim().length < 2) {
            return Response.json({
                success: false,
                error: "Le nom doit faire au moins 2 caracteres."
            }, {status: 400})
        }

        
        if (!comment || comment.trim().length < 5) {
            return Response.json({
                success: false,
                error: "Le commentaire doit faire au moins 5 caracteres."
            }, {status: 400})
        }

        const ratingNumber = parseInt(rating, 10)
        if (isNaN(ratingNumber) || ratingNumber < 1) {
            return Response.json({
                success: false,
                error: "La note doit comprendre entre 1 a 5 etoiles."
            }, {status: 400})
        }

        const productIdNumber = parseInt(productId, 10)
        if (isNaN(productIdNumber) || productIdNumber < 1) {
            return Response.json({
                success: false,
                error: "Id de produit non valide"
            }, {status: 400})
        }

        //On enregistre l'avis dans la base de donnees
        const newReview = await prisma.review.create({
            data: {
                author: author.trim(),
                email: email?.trim(),   // si email vide on met null
                rating: ratingNumber,
                comment: comment.trim(),
                productId: productIdNumber,
                status: "published"
            }
        })

        return Response.json({
            success: true,
            message: "Merci pour votre avis",
            review: newReview
        })

    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API review', error.message)
        }
        else {
            console.log('Erreur inconnu API review', error)
        }

        return Response.json({
            success: false,
            error: "Erreur interne du serveur",
        }, {status: 500})
    }
}

const GET = async (request: Request): Promise<Response> => {
    try {
        const url = new URL (request.url)
        const productId = url.searchParams.get("productId")

        if (!productId) {
            return Response.json("Le parametre productId est requis", {status: 400})
        }

        const productIdNumber = parseInt(productId, 10)
        if (isNaN(productIdNumber)) {
            return Response.json("Le productId doti etre un nombre", {status: 400})
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
        return Response.json(reviews)
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API reviews GET:', error.message)
        }
        else {
            console.log('Erreur inconnu API reviews GET', error)
        }

        return new Response('Erreur serveur', {status: 500})
    }
}

export {POST, GET}