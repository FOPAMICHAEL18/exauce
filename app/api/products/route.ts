import { PrismaClient } from "@prisma/client/edge"; //edge doit etre ajouter pour que prisma puisse s'adapter a next 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

//afficher les produits 
const GET = async (): Promise<Response> => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return Response.json(products)
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur technique:', error.message)
        }
        else {
            console.log('Erreur inconnu', error)
        }

        return new Response('Erreur serveur', {status: 500})
        
    }
}

export {GET}