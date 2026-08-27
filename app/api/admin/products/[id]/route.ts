//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { prisma } from "@/app/lib/prisma"; 

const PUT = async (request:NextRequest, {params}: {params: {id: string}}): Promise<Response> => {
    try {
        //Recuperer l'admin depuis la propriete ajoutee par le middleware 
        const adminHeader = request.headers.get('x-admin-data')
        const admin = adminHeader ? JSON.parse(adminHeader) : null
        if (!admin) {
            return Response.json({
                success: false,
                message: "Non autoriser"
            }, {status: 401}) // non autoriser
        }

        //Recuperation de la l'id du produit 
        const {id} = params
        const productId = parseInt(id, 10)

        if (isNaN(productId)) {
            return Response.json({
                success: false,
                message: "Id de produit non valide"
            }, {status: 400}) // Requete incorrecte
        }
        //Verification de si le produit existe 
        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId
            }
        })
        if (!existingProduct) {
            return Response.json({
                success: false,
                message: "Produit non trouver"
            }, {status: 404}) // ressource demander introuvable
        }

        //recuperation du body
        const body = (await request.json()) as Record<string, unknown> // Retourne des cles en string qui ont des valeurs unknown
        const title = typeof body.title === 'string' ? body.title : existingProduct.title
        const description = typeof body.description === 'string' ? body.description : existingProduct.description
        const price = typeof body.price === 'string' ? body.price : ( typeof body.price === 'number' ? String(body.price) : String(existingProduct.price))
        const stockStatus = typeof body.stockStatus === 'string' ? body.stockStatus : existingProduct.stockStatus
        const categoryId = typeof body.categoryId === 'string' ? body.categoryId : String(existingProduct.categoryId)

        //Validation basique
        if (!title ||!description || !price || !categoryId || !stockStatus) {
            return Response.json({
                success: false,
                message: "Titre, description, prix, status et category sont requis"
            }, {status: 400})
        }
        
        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(categoryId, 10)
            }
        })

        if (!category) {
            return Response.json({
                success: false,
                message: "Categorie non trouver"
            }, {status: 400})
        }

        //Mise a jour 
        let slug = existingProduct.slug
        if (title !== slug) {
            slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g, '') //Enleve tout les accents et remplace les espaces vides pas les tiret (-) et supprime tout ce qui n'est pas lettre, chiffre ou tiret
        }

        const updateProduct = await prisma.product.update({
            where: {id: productId},
            data: {
                title: title.trim(),
                slug: slug,
                description: description.trim(),
                price: parseFloat(price),
                stockStatus: stockStatus.trim(),
                categoryId: parseInt(categoryId, 10)
            }
        })

        return Response.json({
            success: true,
            message: 'Produit modifier avec succes',
            product: updateProduct
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API modification du produit:', error.message)
        }
        else {
            console.log('Erreur inconnu API modification du produit', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur modification du produit'
        }, {status: 500})
    }
}


const DELETE = async (request:NextRequest, {params}: {params: {id: string}}): Promise<Response> => {
    try {
        //Recuperer l'admin depuis la propriete ajoutee par le middleware 
        const adminHeader = request.headers.get('x-admin-data')
        const admin = adminHeader ? JSON.parse(adminHeader) : null
        if (!admin) {
            return Response.json({
                success: false,
                message: "Non autoriser"
            }, {status: 401}) // non autoriser
        }

        //Recuperation de la l'id du produit 
        const {id} = params
        const productId = parseInt(id, 10)

        if (isNaN(productId)) {
            return Response.json({
                success: false,
                message: "Id de produit non valide"
            }, {status: 400}) // Requete incorrecte
        }
        //Verification de si le produit existe 
        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId
            }
        })
        if (!existingProduct) {
            return Response.json({
                success: false,
                message: "Produit non trouver"
            }, {status: 404}) // ressource demander introuvable
        }

        

        //Suppression du produit
        await prisma.product.delete({
            where: {id: productId},
        })

        return Response.json({
            success: true,
            message: `Produit ${existingProduct.title} supprimer avec succes`,
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API suppression du produit:', error.message)
        }
        else {
            console.log('Erreur inconnu API suppression du produit', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur suppression du produit'
        }, {status: 500})
    }
}

export {PUT, DELETE}