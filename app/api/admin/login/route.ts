import { prisma } from "@/app/lib/prisma"; 
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET est manquant dans les variables d'environnement")
}


const POST = async (request:Request): Promise<Response> => {
    try {
        //Recuperation de l'enail et du mot de passe
        const body = (await request.json()) as Record<string, unknown> 

        const password = typeof body.password === 'string' ? body.password : ''
        const email = typeof body.email === 'string' ? body.email : ''

        //Validation basique
        if (!email || !password) {
            return Response.json({
                success: false,
                error: "Email et mot de passe requis"
            }, {status: 400})
        }

        //Chercher l'admin dans la base de donnees
        const admin = await prisma.admin.findUnique({
            where : {email}
        })

        if (!admin) {
            return Response.json({
                success: false,
                error: "Email ou mot de passe incorrecte"
            }, {status: 401}) // 401 car unauthorized
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password)
        if (!isPasswordValid) {
            return Response.json({
                success: false,
                error: "Email ou mot de passe incorrecte"
            }, {status: 401})
        }

        const token = jwt.sign(
            {adminId: admin.id, email:admin.email}, // Les donnees qu'on met dans le token
            JWT_SECRET, // La cle secrete pour signer
            {expiresIn: '24h'} // Duree de validite
        )

        return Response.json({
            success: true,
            token: token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            }
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API login:', error.message)
        }
        else {
            console.log('Erreur inconnu API login', error)
        }

        return new Response('Erreur login', {status: 500})
    }
}

export {POST}