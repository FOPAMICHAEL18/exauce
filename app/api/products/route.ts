import { prisma } from "@/app/lib/prisma"; 

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