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

const handlers = [
    // Contact Handlers
    http.get('*/api/contact', () => HttpResponse.json(contactData)),
    http.get('*/api/admin/contact', () => HttpResponse.json(contactData)),
    http.put('*/api/admin/contact', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({
        success: true,
        message: 'Coordonnées mises à jour',
        data: { ...contactData, ...(body as object) },
        })
    }),

    // Profile Handlers
    http.get('*/api/admin/profile', () => {
        return HttpResponse.json({
        id: 1,
        email: 'admin@boutique.fr',
        name: 'Administrateur',
        })
    }),
    http.put('*/api/admin/profile', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({
        id: 1,
        ...(body as object),
        })
    }),

    // Login Handler (Version unique consolidée)
    http.post('*/api/admin/login', async ({ request }) => {
        const body = (await request.json()) as { email?: string; password?: string }

        if (body.email === 'admin@example.com' && body.password === 'password123') {
        const mockToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJhbGRpmdIdIjogMSwKICAiZW1haWwiOiAiYWRtaW5AZXhhbXBsZS5jb20iLAogICJuYW1lIjogIkFkbWluIFRlc3QiCn0.signature'

        return HttpResponse.json({
            success: true,
            data: {
            token: mockToken,
            admin: {
                id: 1,
                email: 'admin@example.com',
                name: 'Admin Test',
            },
            },
        })
        }

        return HttpResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
        )
    }),
]

export { handlers }