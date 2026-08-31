import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const GET = async (request: NextRequest) : Promise<Response> => {
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

        const user = await prisma.admin.findUnique({
            where: { id: admin.adminId },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                // On ne renvoie PAS le mot de passe
            },
        });

        if (!user) {
            return Response.json(
                { success: false, message: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        return Response.json(user);

    } catch (error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur API GET /api/admin/profile :', error.message)
        }
        else {
            console.log('Erreur inconnu GET /api/admin/profile :', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur serveur GET /api/admin/profile :'
        }, {status: 500})
    }
}

const PUT = async (request: NextRequest) : Promise<Response> => {
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

        //recuperation du body
        const body = (await request.json()) as Record<string, unknown> // Retourne des cles en string qui ont des valeurs unknown
        const name = typeof body.name === 'string' ? body.name : ''
        const surname = typeof body.surname === 'string' ? body.surname : ''
        const email = typeof body.email === 'string' ? body.email : ''
        const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
        const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

        // On vérifie que l'admin existe
        const existingAdmin = await prisma.admin.findUnique({
            where: { id: admin.adminId },
        });

        if (!existingAdmin) {
            return Response.json(
                { success: false, message: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        const update: Record<string, any> = {}
        if(name) update.name = name
        if(surname) update.surname = surname
        if(email) update.email = email

        if (currentPassword && newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, existingAdmin.password)
            if (!isValidPassword) {
                return Response.json(
                    { success: false, message: 'Mot de passe incorrect' },
                    { status: 400 }
                );
            }  
            update.password = await bcrypt.hash(newPassword, 10) 
        }

        // Vérification qu'il y a au moins un champ à mettre à jour
        if (Object.keys(update).length === 0) {
            return Response.json(
                { success: false, message: 'Aucune modification détectée' },
                { status: 400 }
            );
        }

        const updated = await prisma.admin.update({
            where: {id: admin.adminId},
            data: update,
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            }
        })

        return Response.json({
            success: true,
            data: updated
        })
    } catch (error) {
        //On verifie si c'est une erreur javascript
        if (error instanceof Error) {
            console.log('Erreur PUT /api/admin/profile :', error.message)
        }
        else {
            console.log('Erreur inconnu PUT /api/admin/profile :', error)
        }

        return Response.json({
            success: false,
            message: 'Erreur serveur'
        }, {status: 500})
    }
}

export {GET, PUT}