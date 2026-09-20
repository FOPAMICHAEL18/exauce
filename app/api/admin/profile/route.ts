import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'

const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const user = await prisma.admin.findUnique({
      where: { id: admin.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error(
      'Erreur GET /api/admin/profile:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

const PUT = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const adminHeader = request.headers.get('x-admin-data')
    const admin = adminHeader ? JSON.parse(adminHeader) : null
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const surname = typeof body.surname === 'string' ? body.surname.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: admin.adminId },
    })

    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {}
    if (name) update.name = name
    if (surname) update.surname = surname
    if (email) update.email = email

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        existingAdmin.passwordHash  // ⚠️ passwordHash, pas password
      )

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, message: 'Mot de passe actuel incorrect' },
          { status: 400 }
        )
      }

      update.passwordHash = await bcrypt.hash(newPassword, 10)  // ⚠️ passwordHash
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Aucune modification détectée' },
        { status: 400 }
      )
    }

    const updated = await prisma.admin.update({
      where: { id: admin.adminId },
      data: update,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé.' },
        { status: 409 }
      )
    }

    console.error(
      'Erreur PUT /api/admin/profile:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { GET, PUT }