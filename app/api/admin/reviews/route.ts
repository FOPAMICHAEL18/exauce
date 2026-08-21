//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { PrismaClient } from "@prisma/client/edge"; //edge doit etre ajouter pour que prisma puisse s'adapter a next 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";;

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GET = async (request: NextRequest): Promise<Response> => {
    try {
        //Recuperer l'admin depuis la propriete ajoutee par le middleware 
        const adminHeader = request.headers.get('x-admin-data')
        const admin = adminHeader ? JSON.parse(adminHeader) : null
        if (!admin) {
            return Response.json({
                success: false,
                message: "Non autoriser"
            }, {status: 401})
        }

        const url = new URL(request.url) //Transformation de l'url en objet pour pouvoir lire les parametre facilement
        const productId = url.searchParams.get('productId')
        const status = url.searchParams.get('status')

        //Construction des filtres 
        const where: any = {}

        if (productId) {
            const productNumber = parseInt(productId)
            if (!isNaN(productNumber)) {
                where.productId = productNumber
            }
        }
        if (status && (status === 'published' || status === 'hidden')) {
            where.status = status
        }

        //recuperer les avis
        const reviews = await prisma.review.findMany({
            where: where,
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return Response.json(reviews)
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur GET reviews:', error.message)
        }
        else {
            console.log('Erreur GET reviews', error)
        }

        return new Response('Erreur serveur GET reviews', {status: 500})
        
    }
}

export {GET}