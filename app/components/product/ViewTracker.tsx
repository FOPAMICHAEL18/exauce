// Ce composant utilise "useEffect" de react pour executer du code au montage du composant
// On place cette directive en tout premier
"use client"

import { useEffect } from "react"

const ViewTracker = ({slug}: {slug : string}) => {

    useEffect(() => {
        fetch('/api/Product/${slug}/view', {method: 'POST'}) 
    }, [slug])  

    return null
}

export default ViewTracker

//on importe le composant a la fin de la div