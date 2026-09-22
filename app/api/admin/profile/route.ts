import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { validateEmail } from '@/app/lib/validators'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Limites alignées sur le schéma Prisma.
const NAME_MAX_LENGTH = 100
const SURNAME_MAX_LENGTH = 100
const EMAIL_MAX_LENGTH = 255
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

const BCRYPT_ROUNDS = 10

const GET = async (request: NextRequest): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const user = await prisma.admin.findUnique({
      where: { id: auth.admin.id },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Administrateur non trouvé' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error(
      'Erreur GET /api/admin/profile:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

const PUT = async (request: NextRequest): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (await request.json().catch(() => null)) as unknown

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>

    const name = typeof data.name === 'string' ? data.name.trim() : undefined
    const surname =
      typeof data.surname === 'string' ? data.surname.trim() : undefined
    const email = typeof data.email === 'string' ? data.email.trim() : undefined
    const currentPassword =
      typeof data.currentPassword === 'string' ? data.currentPassword : undefined
    const newPassword =
      typeof data.newPassword === 'string' ? data.newPassword : undefined

    // Validations de longueur pour les champs fournis.
    if (name !== undefined && (name.length < 1 || name.length > NAME_MAX_LENGTH)) {
      return NextResponse.json(
        {
          success: false,
          message: `Le nom doit faire entre 1 et ${NAME_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (
      surname !== undefined &&
      (surname.length < 1 || surname.length > SURNAME_MAX_LENGTH)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Le prénom doit faire entre 1 et ${SURNAME_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (email !== undefined) {
      if (email.length === 0 || email.length > EMAIL_MAX_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            message: `L'email doit faire entre 1 et ${EMAIL_MAX_LENGTH} caractères`,
          },
          { status: 400 },
        )
      }
      if (!validateEmail(email)) {
        return NextResponse.json(
          { success: false, message: 'Adresse email invalide' },
          { status: 400 },
        )
      }
    }

    // Cas XOR : un seul des deux champs password est fourni.
    const wantsPasswordChange =
      currentPassword !== undefined || newPassword !== undefined
    const hasBothPasswords =
      currentPassword !== undefined && newPassword !== undefined

    if (wantsPasswordChange && !hasBothPasswords) {
      return NextResponse.json(
        {
          success: false,
          message:
            'currentPassword et newPassword doivent être fournis ensemble',
        },
        { status: 400 },
      )
    }

    if (
      newPassword !== undefined &&
      (newPassword.length < PASSWORD_MIN_LENGTH ||
        newPassword.length > PASSWORD_MAX_LENGTH)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Le nouveau mot de passe doit faire entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: auth.admin.id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        passwordHash: true,
      },
    })

    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, message: 'Administrateur non trouvé' },
        { status: 404 },
      )
    }

    const update: Prisma.AdminUpdateInput = {}

    if (name !== undefined && name !== existingAdmin.name) update.name = name
    if (surname !== undefined && surname !== existingAdmin.surname) {
      update.surname = surname
    }
    if (email !== undefined && email !== existingAdmin.email) {
      update.email = email
    }

    // Changement de mot de passe.
    if (currentPassword !== undefined && newPassword !== undefined) {
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        existingAdmin.passwordHash,
      )

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, message: 'Mot de passe actuel incorrect' },
          { status: 400 },
        )
      }

      if (currentPassword === newPassword) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Le nouveau mot de passe doit être différent de l’actuel',
          },
          { status: 400 },
        )
      }

      update.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Aucune modification détectée' },
        { status: 400 },
      )
    }

    const updated = await prisma.admin.update({
      where: { id: auth.admin.id },
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
        { status: 409 },
      )
    }

    console.error(
      'Erreur PUT /api/admin/profile:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { GET, PUT }