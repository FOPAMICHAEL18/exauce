// app/api/admin/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { validateEmail } from '@/app/lib/validators'

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

    const existingContact = await prisma.contact.findFirst()

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    // Valeurs courantes (existantes ou vides pour une création)
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

    const address = typeof body.address === 'string' ? body.address.trim() : current.address
    const phone = typeof body.phone === 'string' ? body.phone.trim() : current.phone
    const email = typeof body.email === 'string' ? body.email.trim() : current.email
    const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() || null : current.whatsapp
    const hours = typeof body.hours === 'string' ? body.hours.trim() || null : current.hours
    const socials = typeof body.socials === 'string' ? body.socials.trim() || null : current.socials

    // Latitude / longitude
    const parseCoord = (value: unknown, fallback: number | null): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        if (Number.isFinite(parsed)) return parsed
      }
      return fallback
    }

    const latitude = parseCoord(body.latitude, current.latitude)
    const longitude = parseCoord(body.longitude, current.longitude)

    // Validation
    if (!address || !phone) {
      return NextResponse.json(
        { success: false, message: 'Adresse et téléphone sont requis.' },
        { status: 400 }
      )
    }
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Adresse email invalide.' },
        { status: 400 }
      )
    }

    const data = { address, phone, whatsapp, email, hours, socials, latitude, longitude }

    const contact = existingContact
      ? await prisma.contact.update({ where: { id: existingContact.id }, data })
      : await prisma.contact.create({ data })

    return NextResponse.json({
      success: true,
      message: 'Informations de contact mises à jour avec succès',
      data: contact,
    })
  } catch (error) {
    console.error(
      'Erreur API contact PUT:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

const GET = async (): Promise<NextResponse> => {
  try {
    const contact = await prisma.contact.findFirst()

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Coordonnées non trouvées' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: contact })
  } catch (error) {
    console.error(
      'Erreur API contact GET:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { PUT, GET }