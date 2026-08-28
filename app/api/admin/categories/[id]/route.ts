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
        const categoryId = parseInt(id, 10)

        if (isNaN(categoryId)) {
            return Response.json({
                success: false,
                message: "Id de categorie non valide"
            }, {status: 400}) // Requete incorrecte
        }
        //Verification de si la categorie existe 
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: categoryId
            }
        })
        if (!existingCategory) {
            return Response.json({
                success: false,
                message: "Categorie non trouver"
            }, {status: 404}) // ressource demander introuvable
        }

        //recuperation du body
        const body = (await request.json()) as Record<string, unknown> // Retourne des cles en string qui ont des valeurs unknown
        const name = typeof body.name === 'string' ? body.name : existingCategory.name

        //Validation basique
        if (!name) {
            return Response.json({
                success: false,
                message: "Le nom est requis"
            }, {status: 400})
        }
        
        //Mise a jour 
        let slug = existingCategory.slug
        if (name !== slug) {
            slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g, '') //Enleve tout les accents et remplace les espaces vides pas les tiret (-) et supprime tout ce qui n'est pas lettre, chiffre ou tiret
        }

        const updateCategory = await prisma.category.update({
            where: {id: categoryId},
            data: {
                name: name.trim(),
                slug: slug,
            }
        })

        return Response.json({
            success: true,
            message: 'Categorie modifier avec succes',
            product: updateCategory
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API modification de la categorie:', error.message)
        }
        else {
            console.log('Erreur inconnu API modification de la categorie', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur modification de la categorie'
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
        const categoryId = parseInt(id, 10)

        if (isNaN(categoryId)) {
            return Response.json({
                success: false,
                message: "Id de la categorie non valide"
            }, {status: 400}) // Requete incorrecte
        }
        //Verification de si le produit existe 
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: categoryId
            }
        })
        if (!existingCategory) {
            return Response.json({
                success: false,
                message: "Categorie non trouver"
            }, {status: 404}) // ressource demander introuvable
        }

        

        //Suppression du produit
        await prisma.category.delete({
            where: {id: categoryId},
        })

        return Response.json({
            success: true,
            message: `Produit ${existingCategory.name} supprimer avec succes`,
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API suppression de la categorie:', error.message)
        }
        else {
            console.log('Erreur inconnu API suppression de la categorie', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur suppression de la categorie'
        }, {status: 500})
    }
}

export {PUT, DELETE}