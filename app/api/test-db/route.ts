// import { Pool } from "pg";

// test avec pg simple 
// export const GET = async () => {
//     // Pool utilise automatiquement la variable d'environnement DATABASE_URL
//     const pool = new Pool({
//         connectionString: process.env.DATABASE_URL,
//     })

//     try{
//         // On demande simplement l'heure actuelle a PostgreSQL
//         const result = await pool.query('SELECT NOW() as current_time')

//         // On ferme la connexion pour liberer les ressources
//         await pool.end()

//         return Response.json({
//             success: true,
//             message: 'connexion a Neon reussi !',
//             time: result.rows[0].current_time
//         })
//     }
//     catch (error) {
//         // Si ca plante on affiche l'erreur
//         console.error(error)
//         return Response.json({
//             success: false,
//             error: String(error)
//         },
//         {status: 500})
//     }
// } 



import { PrismaClient } from "@prisma/client/edge";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });



export const GET = async () => {

    try{
        // On compte combien d'utilisateurs existent dans la table 
        const userCount = await prisma.user.count()

        // On essaie de creer un utilisateur de test 
        const newUser = await prisma.user.create({
            data: {
                email: 'test-prisma@example.com',
                name: 'Prisma test'
            }
        })

        return Response.json({
            success: true,
            message: 'connexion entre prisma et Neon reussi !',
            userCount: newUser
        })
    }
    catch (error: any) {
        // Si ca plante on affiche l'erreur
        console.error(error)
        return Response.json({
            success: false,
            error: error.message
        },
        {status: 500})
    }
} 

