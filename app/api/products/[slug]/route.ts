import { PrismaClient } from "@prisma/client/edge"; //edge doit etre ajouter pour que prisma puisse s'adapter a next 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GET = async(request: Request, {params}: {params: {slug: string}}): Promise<Response> => {
    try {
        const {slug} = params

        const product = await prisma.product.findUnique({
            where: {slug},
            include: {
                category: true,
                image: {
                    orderBy: {order: 'asc'}
                },
                review: {
                    where: {status: 'published'},
                    orderBy: {createdAt: 'desc'}
                }
            }
        })

        if (!product) {
            return new Response('Produit non trouve', {status: 404})
        }
        return Response.json(product)
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