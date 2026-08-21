//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { PrismaClient } from "@prisma/client/edge"; //edge doit etre ajouter pour que prisma puisse s'adapter a next 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";;

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const POST = async (request: NextRequest): Promise<Response> => {
    try{
        //Recuperer l'admin depuis la propriete ajoutee par le middleware 
        const adminHeader = request.headers.get('x-admin-data')
        const admin = adminHeader ? JSON.parse(adminHeader) : null
        if (!admin) {
            return Response.json({
                success: false,
                message: "Non autoriser"
            }, {status: 401})
        }

        //recuperation du body
        const body = (await request.json()) as Record<string, unknown> // Retourne des cles en string qui ont des valeurs unknown
        const title = typeof body.title === 'string' ? body.title : ''
        const description = typeof body.description === 'string' ? body.description : ''
        const price = typeof body.price === 'string' ? body.price : ( typeof body.price === 'number' ? String(body.price) : '')
        const stockStatus = typeof body.stockStatus === 'string' ? body.stockStatus : ''
        const categoryId = typeof body.category === 'string' ? body.category : ''

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

        //Transformation du titre en format adapter pour le slug  
        const baseSlug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g, '') //Enleve tout les accents et remplace les espaces vides pas les tiret (-) et supprime tout ce qui n'est pas lettre, chiffre ou tiret

        //Creation du produit 
        const product = await prisma.product.create({
            data: {
                title: title.trim(),
                slug: baseSlug,
                description: description.trim(),
                price: parseFloat(price),
                stockStatus: stockStatus.trim(),
                categoryId: parseInt(categoryId, 10)
            } 
        })

        return Response.json({
                success: true,
                message: "Produit cree avec succes",
                product
            })
        
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API admin/product:', error.message)
        }
        else {
            console.log('Erreur inconnu API admin/product', error)
        }

        return new Response('Erreur admin/product', {status: 500})
    }
}

export {POST}