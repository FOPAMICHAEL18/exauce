//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { prisma } from "@/app/lib/prisma"; 

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
        const name = typeof body.name === 'string' ? body.name : ''

        //Validation basique
        if (!name) {
            return Response.json({
                success: false,
                message: "Le nom est requis"
            }, {status: 400})
        }
        

        //Transformation du nom en format adapter pour le slug  
        const baseSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g, '') //Enleve tout les accents et remplace les espaces vides pas les tiret (-) et supprime tout ce qui n'est pas lettre, chiffre ou tiret

        //Creation du produit 
        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                slug: baseSlug,
            } 
        })

        return Response.json({
                success: true,
                message: "Categorie cree avec succes",
                category
            })
        
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API admin/categories:', error.message)
        }
        else {
            console.log('Erreur inconnu API admin/categories', error)
        }

        return new Response('Erreur admin/categories', {status: 500})
    }
}

export {POST}