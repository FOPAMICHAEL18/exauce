import { prisma } from "@/app/lib/prisma"; 
import {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'

const POST = async (request: NextRequest, {params}: {params: {slug: string}}) : Promise<NextResponse> => {
    try {
        const {slug} = params

        //On recupere le cookie store 
        // cookies() est asynchrone
        const cookieStore = await cookies()
        
        let sessionId = cookieStore.get('sessionId')?.value

        if (!sessionId) {
            //On genere un identifiant unique universel 
            sessionId = crypto.randomUUID()

            //On creer le cookie session_id avec la valeur generee
            //On definit des options pour le rendre securise
            cookieStore.set('sessionId', sessionId, {
                httpOnly: true, // Le cookie n'est pas accessible par javascript cote client 
                secure: process.env.NODE_ENV === 'production', //Uniquement envoye en HTTPS en production
                maxAge: 60*60*24*30, //Duree de vie : 30 jours 
                path: '/', //Le cookie est valable sur tout le site  
            })
        }

        //On cherche le produit dont le slug correspond 
        const product = await prisma.product.findUnique({
            where: {slug}
        })

        //Si le produit n'existe pas, on renvoie une erreur 404 
        if (!product) {
            return NextResponse.json(
                {error: 'Produit non trouve'},
                {status: 404}
            )
        }

        //On cherche un enregistrement dans la table views
        //On utilise la contrainte unique que nous avons definie dans le schema 
        const existingView = await prisma.view.findUnique({
            where: {
                sessionId_productId: {
                    sessionId: sessionId,
                    productId: product.id
                }
            }
        })

        // Si la vue existe déjà, on ne fait rien
        if (existingView) {
        return NextResponse.json({ success: true, alreadyViewed: true });
        }

        // Sinon, on enregistre la vue (sans transaction)
        // On crée l'enregistrement de la vue
        await prisma.view.create({
        data: {
            sessionId,
            productId: product.id,
        },
        });

        // Puis on incrémente le compteur de vues du produit
        await prisma.product.update({
        where: { id: product.id },
        data: { views: { increment: 1 } },
        })

        return NextResponse.json({success: true})
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur lors du tracking des vues:', error)
        }
        else {
            console.log('Erreur inconnu lors du tracking des vues', error)
        }

        // Si l'erreur est une violation de contrainte unique (probablement une course),
        // on considère que la vue a déjà été enregistrée (retour succès)
        if (error instanceof Error && error.message.includes('Unique constraint failed')) {
            return NextResponse.json({ success: true, alreadyViewed: true });
        }

        return NextResponse.json({error: 'Erreur interne du serveur'}, {status: 500})
    }
}

export {POST}