import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { type AdminData } from '@/app/lib/admin-auth'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET est manquant dans les variables d'environnement")
}

// Vérifie que le payload décodé a bien la forme AdminData.
// JSON.parse du header ne suffit pas : n’importe quel JSON passe.
function isAdminPayload(value: unknown): value is AdminData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const { id, email } = value as Record<string, unknown>
  return typeof id === 'number' && typeof email === 'string'
}

const proxy = (request: NextRequest): NextResponse => {
  const path = request.nextUrl.pathname

  // Route publique : login.
  if (path === '/api/admin/login') {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Token manquant ou invalide' },
      { status: 401 },
    )
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Token manquant ou invalide' },
      { status: 401 },
    )
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    // On refuse tout payload qui n’a pas la forme AdminData.
    if (!isAdminPayload(decoded)) {
      return NextResponse.json(
        { success: false, message: 'Token invalide ou expiré' },
        { status: 401 },
      )
    }

    // On clone les headers pour pouvoir les modifier (ceux de
    // NextRequest sont immuables).
    const requestHeaders = new Headers(request.headers)

    // Sécurité : on supprime tout header client avant de poser le nôtre.
    // Comme ça, même si le client a envoyé un faux `x-admin-data`, il
    // est écrasé — et on reste protégé si un jour on utilise autre
    // chose que .set().
    requestHeaders.delete('x-admin-data')
    requestHeaders.set('x-admin-data', JSON.stringify(decoded))

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Erreur middleware:', error instanceof Error ? error.message : error)
    }

    return NextResponse.json(
      { success: false, message: 'Token invalide ou expiré' },
      { status: 401 },
    )
  }
}

const config = {
  matcher: '/api/admin/:path*',
}

export { proxy, config }