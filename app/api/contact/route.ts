import { prisma } from "@/app/lib/prisma"; 

const GET = async(): Promise<Response> => {
    try {
        //chercher la premiere entree de contact
        const contact = await prisma.contact.findFirst()

        //Si aucune information n'a ete configuree, on renvoie une erreur 404
        if (!contact) {
            return Response.json("Coordonnees non trouvees", {status: 404})
        }

        //On retourne les donnees en JSON
        return Response.json(contact)
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API contact:', error.message)
        }
        else {
            console.log('Erreur inconnu API contact', error)
        }

        return new Response('Erreur serveur', {status: 500})
    }
}

export {GET}