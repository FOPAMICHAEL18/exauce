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
  // Handlers GET (pour /api/contact ET /api/admin/contact)
  http.get('*/api/contact', () => HttpResponse.json(contactData)),
  http.get('*/api/admin/contact', () => HttpResponse.json(contactData)),

  // Handlers PUT (pour la mise à jour)
  http.put('*/api/admin/contact', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      message: 'Coordonnées mises à jour',
      data: { ...contactData, ...(body as object) },
    })
  }),

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

  http.post('*/api/admin/login', async ({ request }) => {
    const body = (await request.json()) as any

    if (body.email === 'admin@boutique.fr' && body.password === 'admin123') {
      return HttpResponse.json({
        success: true,
        token: 'fake-jwt-token',
        admin: { id: 1, email: 'admin@boutique.fr', name: 'Admin' },
      })
    }

    return HttpResponse.json(
      { success: false, message: 'Identifiants incorrects' },
      { status: 401 }
    )
  }),

  // Handler pour /api/admin/login
    http.post('*/api/admin/login', async ({ request }) => {
        const body = (await request.json()) as { email?: string; password?: string };

        // Simule une connexion réussie
        if (body.email === 'admin@example.com' && body.password === 'password123') {
        // Un JWT factice structuré (header.payload.signature)
        // payload base64 de : {"adminId":1,"email":"admin@example.com","name":"Admin Test"}
        const mockToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJhbGRpbmRJZCI6IDEsCiAgImVtYWlsIjogImFkbWluQGV4YW1wbGUuY29tIiwKICAibmFtZSI6ICJBZG1pbiBUZXN0Igp9.signature';

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
        });
        }

        // Simule des identifiants incorrects
        return HttpResponse.json(
        {
            success: false,
            message: 'Identifiants incorrects',
        },
        { status: 400 }
        );
    }),
]

export { handlers }