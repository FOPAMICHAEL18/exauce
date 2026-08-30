//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { prisma } from "@/app/lib/prisma"; 

const PUT = async (request:NextRequest, {params}: {params: Promise<{id: string}>}): Promise<Response> => {
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

        //Recuperation de la l'id de l'avis
        const {id} = await params
        const reviewId = parseInt(id, 10)

        if (isNaN(reviewId)) {
            return Response.json({
                success: false,
                message: "Id de l'avis non valide"
            }, {status: 400}) // Requete incorrecte
        }
        //Verification de si l'avis existe 
        const existingReview = await prisma.review.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!existingReview) {
            return Response.json({
                success: false,
                message: "Avis non trouver"
            }, {status: 404}) // ressource demander introuvable
        }

        // 4. Inversion automatique du statut (Bascule / Toggle)
        const newStatus = existingReview.status === 'published' ? 'hidden' : 'published';
        
        const updateReview = await prisma.review.update({
            where: {id: reviewId},
            data: {
                status: newStatus
            }
        })

        return Response.json({
            success: true,
            message: `Status de l'avis mis a jour : ${newStatus}`,
            review: updateReview
        }, {status: 200})
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log("Erreur API modification du status de l'avis:", error.message)
        }
        else {
            console.log("Erreur inconnu API modification du tatus de l'avis:", error)
        }

        return Response.json({
            success: false,
            message: "Erreur serveur modification du tatus de l'avis"
        })
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

        //Recuperation de la l'id de l'avis
        const {id} = params
        const reviewId = parseInt(id, 10)

        if (isNaN(reviewId)) {
            return Response.json({
                success: false,
                message: "Id de l'avis non valide"
            }, {status: 400}) // Requete incorrecte
        }
        //Verification de si l'avis existe 
        const existingReview = await prisma.review.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!existingReview) {
            return Response.json({
                success: false,
                message: "Avis non trouver"
            }, {status: 404}) // ressource demander introuvable
        }
        

        
        //Suppression de l'avis
        await prisma.review.delete({
            where: {id: reviewId},
        })

        return Response.json({
            success: true,
            message: `Produit ${existingReview.author} supprimer avec succes`,
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log("Erreur API suppression de l'avis:", error.message)
        }
        else {
            console.log("Erreur inconnu API suppression de l'avis:", error)
        }

        return Response.json({
            success: false,
            message: "Erreur serveur suppression de l'avis"
        }, {status: 500})
    }
}

export {PUT, DELETE}