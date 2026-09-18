import { http, HttpResponse } from 'msw'

const contactData = {
  id: 1,
  address: 'Rue Test, Douala',
  phone: '+237 699 123 456',
  whatsapp: '+237 699 123 456',
  email: 'test@test.com',
  hours: 'Lun-Ven : 9h-18h',
  socials: null,
  latitude: 4.0483,
  longitude: 9.7043,
}

export const handlers = [
  // Contact
  http.get('*/api/contact', () => HttpResponse.json(contactData)),
  http.get('*/api/admin/contact', () => HttpResponse.json(contactData)),
  http.put('*/api/admin/contact', async ({ request }) => {
    const body = (await request.json()) as object
    return HttpResponse.json({
      success: true,
      message: 'Coordonnées mises à jour',
      data: { ...contactData, ...body },
    })
  }),

  // Profile
  http.get('*/api/admin/profile', () =>
    HttpResponse.json({ id: 1, email: 'admin@boutique.fr', name: 'Administrateur' })
  ),
  http.put('*/api/admin/profile', async ({ request }) => {
    const body = (await request.json()) as object
    return HttpResponse.json({ id: 1, ...body })
  }),

  // Login
  http.post('*/api/admin/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === 'admin@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          token: 'mock.jwt.token',
          admin: { id: 1, email: 'admin@example.com', name: 'Admin Test' },
        },
      })
    }
    return HttpResponse.json(
      { success: false, message: 'Identifiants incorrects' },
      { status: 401 }
    )
  }),

  // Reviews POST — cohérent avec l'API réelle
    http.post('/api/reviews', async ({ request }) => {
        let body: any = {}
        try {
            body = await request.json()
        } catch {
            return HttpResponse.json(
            { success: false, message: 'Corps de requête invalide' },
            { status: 400 }
            )
        }

        // 🍯 Honeypot → faux succès
        if (typeof body.honeypot === 'string' && body.honeypot.length > 0) {
            await new Promise((r) => setTimeout(r, 200))
            return HttpResponse.json(
            { success: true, message: 'Avis enregistré.' },
            { status: 201 }
            )
        }

        if (body.author === 'TriggerError') {
            return HttpResponse.json(
            { success: false, message: 'Erreur personnalisée' },
            { status: 400 }
            )
        }

        if (body.author === 'NoMessageError') {
            return HttpResponse.json({ success: false }, { status: 400 })
        }

        return HttpResponse.json(
            {
            success: true,
            message: 'Avis enregistré avec succès',
            data: {
                id: 1,
                author: body.author,
                rating: Number(body.rating),
                comment: body.comment,
                createdAt: new Date().toISOString(),
            },
            },
            { status: 201 }
        )
    }),
]