//Version ameliorer de request  permetant de renvoyer une reponse et de modifier une requete avant qu'elle n'arrive a la destination finale
import {NextRequest, NextResponse} from 'next/server'
import { prisma } from "@/app/lib/prisma"; 

const PUT = async (request:NextRequest): Promise<Response> => {
    try {
        //Recuperer l'admin depuis la propriete ajoutee par le middleware 
        const adminHeader = request.headers.get('x-admin-data')
        const admin = adminHeader ? JSON.parse(adminHeader) : null
        if (!admin) {
            return Response.json({
                success: false,
                message: "Non autoriser"
            }, {status: 401}) // non autoriser
        }

        //Recuperation du contact
        const existingContact = await prisma.contact.findFirst()

        //Si aucune coordonnees n'existe en base on cree un objet vide pour eviter les erreurs
        const defaults = {
            address: '',
            phone: '',
            email: '',
            hours: null as string | null,
            socials: null as string | null,
            latitude: null as number | null,
            longitude: null as number | null,
        }

        const current = existingContact || defaults

        //recuperation du body
        const body = (await request.json()) as Record<string, unknown> // Retourne des cles en string qui ont des valeurs unknown
        const address = typeof body.address === 'string' ? body.address.trim() : current.address
        const phone = typeof body.phone === 'string' ? body.phone.trim() : current.phone
        const email = typeof body.email === 'string' ? body.email.trim() : current.email
        const hours = typeof body.hours === 'string' ? body.hours.trim() : current.hours
        const socials = typeof body.socials === 'string' ? body.socials.trim() : current.socials

        //Gestion de la latitude et de la longitude
        let latitude = current.latitude
        let longitude = current.longitude

        if (typeof body.latitude === 'number') {
            latitude = body.latitude
        }
        else if (typeof body.latitude === 'string') {
            const parsed = parseFloat(body.latitude as string)
            if(!isNaN(parsed)) latitude = parsed
        }

        if (typeof body.longitude === 'number') {
            longitude = body.longitude
        }
        else if (typeof body.longitude === 'string') {
            const parsed = parseFloat(body.longitude as string)
            if(!isNaN(parsed)) longitude = parsed
        }

        //Validation basique
        if (!address ||!phone || !email ) {
            return Response.json({
                success: false,
                message: "Adresse, telephone et email sont obligatoires pour afficher les coordonnees"
            }, {status: 400})
        }
        


        let updateContact 

        if (existingContact) {
            updateContact = await prisma.contact.update({
                where: {id: existingContact.id},
                data: {
                    address,
                    phone,
                    email,
                    hours,
                    socials,
                    latitude,
                    longitude
                }
            })
        }
        else {
            updateContact = await prisma.contact.create({
                data: {
                    address,
                    phone,
                    email,
                    hours,
                    socials,
                    latitude,
                    longitude
                }
            })
        }
        

        return Response.json({
            success: true,
            message: 'Information de contact mis a jour avec succes',
            product: updateContact
        })
    }
    catch(error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API modification du contact:', error.message)
        }
        else {
            console.log('Erreur inconnu API modification du contact', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur serveur modification du contact'
        }, {status: 500})
    }
}



export {PUT}