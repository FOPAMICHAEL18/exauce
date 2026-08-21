import { PrismaClient } from "@prisma/client/edge"; //edge doit etre ajouter pour que prisma puisse s'adapter a next 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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