import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { validateEmail } from '@/app/lib/validators'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET est manquant dans les variables d'environnement")
}

// Limites alignées sur le schéma.
const EMAIL_MAX_LENGTH = 255
const PASSWORD_MAX_LENGTH = 128
const PASSWORD_MIN_LENGTH = 1

// Hash leurre utilisé pour égaliser le temps de réponse quand l’admin
// n’existe pas. Généré une seule fois au chargement du module.
const DUMMY_HASH = bcrypt.hashSync('__dummy_password__', 10)

const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = (await request.json().catch(() => null)) as unknown

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>

    const email =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : ''
    const password = typeof data.password === 'string' ? data.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 },
      )
    }

    if (email.length > EMAIL_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `L'email ne doit pas dépasser ${EMAIL_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Le mot de passe doit faire entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caractères`,
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

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    })

    // Message identique pour email inconnu ET mauvais mot de passe :
    // on empêche l’énumération d’emails.
    const INVALID_CREDENTIALS_MESSAGE = 'Email ou mot de passe incorrect'

    if (!admin) {
      // Comparaison factice pour égaliser le temps de réponse avec le
      // cas « admin existe mais mauvais mot de passe ».
      await bcrypt.compare(password, DUMMY_HASH)
      return NextResponse.json(
        { success: false, message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 },
      )
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 },
      )
    }

    // ⚠️ Le payload DOIT avoir la clé `id` et `email` pour matcher
    //    `AdminData` et `isAdminPayload` du middleware. Sinon, chaque
    //    requête suivante sera rejetée en 401.
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '24h' },
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      },
    })
  } catch (error) {
    console.error(
      'Erreur API login:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { POST }