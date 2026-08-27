//Si je precise T (ApiResponse<LoginResponse>) typescript va typer data correctement sinon va lui attribuer le type any
//Le symbole & est un type d'intersection en TypeScript. Il indique à TypeScript : "Le résultat contient success et message, PLUS toutes les propriétés contenues dans T directement collées à la racine".
interface ApiResponse<T = any> {
    success: boolean,
    message?: string,
    data?: T,
}

// <T = any> la fonction de retour dependra de ce que je vais passer en T
const apiCall = async <T = unknown>(
    endpoint: string, //URL de l'api
    options: RequestInit = {} //Les options de fetch (method, headers, body) si je ne passe rien ca retourne un objet vide
): Promise<ApiResponse<T>> => {
    try {
        const url = `${endpoint}`
        const headers = {
            'content-Type': 'application/json',
            ...options.headers //... parce que dans un objet tu ne peux pas coller un objet brut tu dois soit l'ecraser soit le fusionner 
        } 

        const response = await fetch(url, {...options, headers})
        const data = await response.json() as Record<string, any>

        if (!response.ok) { //response.ok esr false si le code HTTP est 400, 401, 404, 500 etc...
            return {
                success: false,
                message: data.error || data.message || 'Erreur serveur'
            }
        }

        return {
            success: true,
            data: data as T
        }
    } catch (error) {
        return {
            success: false,
            message:'Erreur de connexion au serveur'
        }
    }
}

export {apiCall}