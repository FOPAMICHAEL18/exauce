// Ce composant utilise "useEffect" de react pour executer du code au montage du composant
// On place cette directive en tout premier
"use client"

import { useEffect } from "react"

const ViewTracker = ({slug}: {slug : string}) => {

    useEffect(() => {
        // On envoie une requête POST à l'API pour incrémenter le compteur de vues
        // L'API est : /api/products/[slug]/views
        fetch(`/api/products/${slug}/views`, {method: 'POST'}).catch(err => console.error('Erreur tracking vue :', err))
    }, [slug])  

    // Le composant ne retourne rien (null) car il est purement fonctionnel
    return null
}

export default ViewTracker

//on importe le composant a la fin de la div