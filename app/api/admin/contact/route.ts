import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/admin-auth'
import { validateEmail } from '@/app/lib/validators'

// Longueurs max alignées sur le schéma Prisma.
const PHONE_MAX_LENGTH = 30
const WHATSAPP_MAX_LENGTH = 30
const EMAIL_MAX_LENGTH = 255

// Bornes géographiques standards.
const LAT_MIN = -90
const LAT_MAX = 90
const LNG_MIN = -180
const LNG_MAX = 180

// Parse une coordonnée. Accepte un number fini, ou une chaîne
// strictement numérique. Refuse "12abc", "", " 12 " → fallback.
function parseCoord(
  value: unknown,
  fallback: number | null,
  min: number,
  max: number,
): number | null {
  let n: number

  if (typeof value === 'number') {
    n = value
  } else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
    n = Number(value)
  } else {
    return fallback
  }

  if (!Number.isFinite(n) || n < min || n > max) return fallback
  return n
}

const PUT = async (request: NextRequest): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  try {

    const body = (await request.json().catch(() => null)) as unknown

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>

    const existingContact = await prisma.contact.findFirst()

    // Valeurs courantes (existantes ou vides pour une création).
    const current = existingContact ?? {
      address: '',
      phone: '',
      whatsapp: null,
      email: '',
      hours: null,
      socials: null,
      latitude: null,
      longitude: null,
    }

    const address =
      typeof data.address === 'string' ? data.address.trim() : current.address
    const phone =
      typeof data.phone === 'string' ? data.phone.trim() : current.phone
    const email =
      typeof data.email === 'string' ? data.email.trim() : current.email

    // Champs optionnels : '' devient null.
    const whatsapp =
      typeof data.whatsapp === 'string'
        ? data.whatsapp.trim() || null
        : current.whatsapp
    const hours =
      typeof data.hours === 'string' ? data.hours.trim() || null : current.hours
    const socials =
      typeof data.socials === 'string'
        ? data.socials.trim() || null
        : current.socials

    const latitude = parseCoord(
      data.latitude,
      current.latitude,
      LAT_MIN,
      LAT_MAX,
    )
    const longitude = parseCoord(
      data.longitude,
      current.longitude,
      LNG_MIN,
      LNG_MAX,
    )

    // Validations.
    if (!address || !phone) {
      return NextResponse.json(
        { success: false, message: 'Adresse et téléphone sont requis.' },
        { status: 400 },
      )
    }

    if (phone.length > PHONE_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Le téléphone ne doit pas dépasser ${PHONE_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (whatsapp && whatsapp.length > WHATSAPP_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Le WhatsApp ne doit pas dépasser ${WHATSAPP_MAX_LENGTH} caractères`,
        },
        { status: 400 },
      )
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Adresse email invalide.' },
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

    const payload = {
      address,
      phone,
      whatsapp,
      email,
      hours,
      socials,
      latitude,
      longitude,
    }

    // On restreint le select pour rester cohérent avec le POST categories.
    const select = {
      id: true,
      address: true,
      phone: true,
      whatsapp: true,
      email: true,
      hours: true,
      socials: true,
      latitude: true,
      longitude: true,
      updatedAt: true,
    } as const

    const contact = existingContact
      ? await prisma.contact.update({
          where: { id: existingContact.id },
          data: payload,
          select,
        })
      : await prisma.contact.create({ data: payload, select })

    return NextResponse.json({
      success: true,
      message: 'Informations de contact mises à jour avec succès',
      data: contact,
    })
  } catch (error) {
    console.error(
      'Erreur API contact PUT:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

const GET = async (request : NextRequest): Promise<NextResponse> => {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const contact = await prisma.contact.findFirst({
      select: {
        id: true,
        address: true,
        phone: true,
        whatsapp: true,
        email: true,
        hours: true,
        socials: true,
        latitude: true,
        longitude: true,
        updatedAt: true,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Coordonnées non trouvées' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: contact })
  } catch (error) {
    console.error(
      'Erreur API contact GET:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}

export { PUT, GET }