// app/api/contact/route.ts
import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

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
      'Erreur API contact:',
      error instanceof Error ? error.message : error
    )

    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export { GET }