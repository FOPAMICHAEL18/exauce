//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import  jwt  from 'jsonwebtoken'

//Renvoit une valeur string ou undefined
const JWT_SECRET = process.env.JWT_SECRET

// Empeche le JWT_SECRET de renvoyer une valeur undefined pour que typescript ne me derange plus 
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET est manquant dans les variables d'environnement")
}

const proxy = (request: NextRequest): NextResponse => {
    console.log("middleware", request.url)
    //Recupere le chemin de la requete
    const path = request.nextUrl.pathname
    //Si c'est la route du login on laisse passer sans token 
    if (path === '/api/admin/login') {
        console.log('🔓 Login public: acces autorise')
        return NextResponse.next()
    }
    // Recupere le token depuis l'en-tete Authorization
    const authHeader = request.headers.get('authorization')
    //Verifier qu'il est present et bien formater
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({
            success: false,
            message: "Token manquant ou invalide"
        }, {status: 401})
    }
    //Extraire le token sans le bearer
    const token = authHeader.split(' ')[1]

    try {
        //Verifier et decoder le token
        const decoded = jwt.verify(token, JWT_SECRET)

        // Copier une instance de header vu que celle de nextRequest est immuable
        const  requestHeader = new Headers(request.headers)
        //copier decode transformer en chaine dans le header car il ne prends que les chaines
        requestHeader.set('x-admin-data', JSON.stringify(decoded))
        
        
        //Continuer vers la route
        return NextResponse.next({
            request: {
                headers: requestHeader
            }
        })
    }
     catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur middleware:', error.message)
        }
        else {
            console.log('Erreur middleware', error)
        }

        return NextResponse.json({
            success: false,
            message: "Token invalide ou expire"
        }, {status: 401})
    }
}

const config = {
    matcher: '/api/admin/:path*',
}

export {proxy, config}