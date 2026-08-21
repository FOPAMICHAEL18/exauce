//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { PrismaClient } from "@prisma/client/edge"; //edge doit etre ajouter pour que prisma puisse s'adapter a next 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";;

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

        //recuperation du body
        const body = (await request.json()) as Record<string, unknown> // Retourne des cles en string qui ont des valeurs unknown
        const newStatus = typeof body.status === 'string' ? body.status : ''

        //Validation basique
        if (newStatus !== 'published' && newStatus !== 'hidden') {
            return Response.json({
                success: false,
                message: "Le status doit etre published ou hidden"
            }, {status: 400})
        }
        

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
        }, {status: 500})
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
            message: "Erreur serveur modification du tatus de l'avis:"
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
        }, {status: 500})
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