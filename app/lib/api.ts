//Si je precise T (ApiResponse<LoginResponse>) typescript va typer data correctement sinon va lui attribuer le type any
//Le symbole & est un type d'intersection en TypeScript. Il indique à TypeScript : "Le résultat contient success et message, PLUS toutes les propriétés contenues dans T directement collées à la racine".
interface ApiResponse<T = any> {
    success: boolean,
    message?: string,
    data?: T,
}

// Cette fonction est appelée quand on reçoit une erreur 401.
// Elle supprime le token et redirige vers la page de login.
const  handleUnauthorized = () => {
  // On supprime le token local
  localStorage.removeItem('adminToken');
  
  // Si on est dans le navigateur, on redirige vers login
  // On vérifie qu'on n'est pas déjà sur la page de login pour éviter une boucle infinie
    // On vérifie qu'on est bien dans le navigateur et qu'on n'est pas déjà sur la page de login.
  // window.location.pathname.includes('/admin/login') évite une boucle de redirection infinie.
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/Admin/Login')) {
    window.location.href = '/Admin/Login';
  }
}

// <T = any> la fonction de retour dependra de ce que je vais passer en T
const apiCall = async <T = unknown>(
    endpoint: string, //URL de l'api
    options: RequestInit = {} //Les options de fetch (method, headers, body) si je ne passe rien ca retourne un objet vide
): Promise<ApiResponse<T>> => {
    try {
        const url = `${endpoint}`
        // 1. On récupère le token stocké au niveau du navigateur
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const headers = {
            'content-Type': 'application/json',
            ...options.headers, //... parce que dans un objet tu ne peux pas coller un objet brut tu dois soit l'ecraser soit le fusionner 
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        } 

        const response = await fetch(url, {...options, headers})
        const data = await response.json() as Record<string, any>

        if (!response.ok) { //response.ok esr false si le code HTTP est 400, 401, 404, 500 etc...

            // === CAS SPÉCIAL : 401 (Token invalide ou expiré) ===
            // Si le serveur renvoie 401, on déclenche la redirection automatique.
            if (response.status === 401) {
                // On appelle handleUnauthorized pour supprimer le token et rediriger.
                handleUnauthorized();
                // On renvoie une réponse avec un message explicite.
                return {
                success: false,
                message: 'Votre session a expiré. Veuillez vous reconnecter.',
                };
            }
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