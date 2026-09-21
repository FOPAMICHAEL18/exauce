import { NextResponse } from 'next/server'

// Forme minimale attendue dans le payload JWT pour considérer qu’on
// a affaire à un admin.
export type AdminData = {
  id: number
  email: string
}

// Parse et valide le contenu du header `x-admin-data`.
// Renvoie null si absent, malformé, ou s’il ne contient pas id + email.
export function parseAdminHeader(rawHeader: string | null): AdminData | null {
  if (!rawHeader) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(rawHeader)
  } catch {
    return null
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    return null
  }

  const { id, email } = parsed as Record<string, unknown>

  if (typeof id !== 'number' || typeof email !== 'string') {
    return null
  }

  return { id, email }
}

// Récupère l’admin depuis les headers de la requête.
// Renvoie null si non authentifié.
export function getAdminFromRequest(request: Request): AdminData | null {
  return parseAdminHeader(request.headers.get('x-admin-data'))
}

// Résultat d’un requireAdmin : soit on a l’admin, soit une réponse
// prête à renvoyer au client.
export type RequireAdminResult =
  | { ok: true; admin: AdminData }
  | { ok: false; response: NextResponse }

// Helper pratique pour les routes : renvoie directement la réponse 401
// à retourner au client si l’admin n’est pas valide.
export function requireAdmin(request: Request): RequireAdminResult {
  const admin = getAdminFromRequest(request)

  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 },
      ),
    }
  }

  return { ok: true, admin }
}