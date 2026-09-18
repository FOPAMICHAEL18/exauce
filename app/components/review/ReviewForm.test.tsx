// ReviewForm.test.tsx
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import ReviewForm from '@/app/components/review/ReviewForm'
import { handlers } from '../../test/mocks/handlers'
import { apiCall } from '@/app/lib/api'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh, push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(),
  }),
}))

vi.mock('@/app/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/app/lib/api')>('@/app/lib/api')
  return { ...actual, apiCall: vi.fn(actual.apiCall) }
})

const server = setupServer(...handlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); cleanup(); vi.clearAllMocks() })
afterAll(() => server.close())

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^nom/i), 'Jean Dupont')
  await user.type(screen.getByLabelText(/email/i), 'jean@test.com')
  await user.type(screen.getByLabelText(/commentaire/i), 'Excellent produit !')
  await user.click(screen.getByLabelText(/3 étoiles sur 5/i))
}

const submit = () => screen.getByRole('button', { name: /publier/i })

describe('ReviewForm', () => {
  // --- Rendu ---
  it('affiche tous les champs obligatoires', () => {
    render(<ReviewForm productId={1} />)
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/commentaire/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /étoile/i })).toHaveLength(5)
  })

  it('le champ honeypot est masqué et non focusable', () => {
    render(<ReviewForm productId={1} />)
    const h = document.querySelector('input[name="honeypot"]') as HTMLInputElement
    expect(h).toHaveAttribute('aria-hidden', 'true')
    expect(h).toHaveAttribute('tabindex', '-1')
    expect(h).toHaveAttribute('autocomplete', 'off')
  })

  // --- Validation client ---
  it('erreur si aucune note sélectionnée', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await user.type(screen.getByLabelText(/^nom/i), 'Jean Dupont')
    await user.type(screen.getByLabelText(/commentaire/i), 'Bon produit')
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/note entre 1 et 5/i)
  })

  it('erreur si nom trop court', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await user.type(screen.getByLabelText(/^nom/i), 'J')
    await user.type(screen.getByLabelText(/commentaire/i), 'Bon produit')
    await user.click(screen.getByLabelText(/3 étoiles sur 5/i))
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/nom doit faire au moins 2/i)
  })

  it('erreur si commentaire trop court', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await user.type(screen.getByLabelText(/^nom/i), 'Jean Dupont')
    await user.type(screen.getByLabelText(/commentaire/i), 'ok')
    await user.click(screen.getByLabelText(/3 étoiles sur 5/i))
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/commentaire doit faire au moins 5/i)
  })

  it('erreur si email invalide', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await user.type(screen.getByLabelText(/^nom/i), 'Jean Dupont')
    await user.type(screen.getByLabelText(/email/i), 'pas-un-email')
    await user.type(screen.getByLabelText(/commentaire/i), 'Excellent produit')
    await user.click(screen.getByLabelText(/3 étoiles sur 5/i))
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/email invalide/i)
  })

  // --- Succès ---
  it('envoie et affiche le message de succès', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={42} />)
    await fillValidForm(user)
    await user.click(submit())
    expect(await screen.findByRole('status')).toHaveTextContent(/merci pour votre avis/i)
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it('réinitialise le formulaire après succès', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await fillValidForm(user)
    await user.click(submit())
    await screen.findByRole('status')
    expect((screen.getByLabelText(/^nom/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/commentaire/i) as HTMLTextAreaElement).value).toBe('')
  })

  // --- Erreurs API ---
  it("affiche le message d'erreur de l'API", async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await user.type(screen.getByLabelText(/^nom/i), 'TriggerError')
    await user.type(screen.getByLabelText(/commentaire/i), 'Peu importe le contenu')
    await user.click(screen.getByLabelText(/3 étoiles sur 5/i))
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/erreur personnalisée/i)
  })

  it("affiche un message par défaut si l'API n'en fournit pas", async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)
    await user.type(screen.getByLabelText(/^nom/i), 'NoMessageError')
    await user.type(screen.getByLabelText(/commentaire/i), 'Peu importe le contenu')
    await user.click(screen.getByLabelText(/3 étoiles sur 5/i))
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/une erreur serveur est survenue/i)
  })

  it('affiche une erreur réseau si le serveur ne répond pas', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/reviews', () => HttpResponse.error()))
    render(<ReviewForm productId={1} />)
    await fillValidForm(user)
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/erreur de connexion au serveur/i)
  })

  // --- Honeypot ---
  it('honeypot rempli → faux succès (aucune écriture)', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)

    await fillValidForm(user)
    const honeypot = document.querySelector('input[name="honeypot"]') as HTMLInputElement
    await user.type(honeypot, 'spam-bot')

    await user.click(submit())

    expect(await screen.findByRole('status')).toHaveTextContent(/merci pour votre avis/i)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  // --- Interactions étoiles ---
  it('met à jour la note au survol puis au clic', async () => {
    const user = userEvent.setup()
    render(<ReviewForm productId={1} />)

    const star4 = screen.getByLabelText(/4 étoiles sur 5/i)
    const star2 = screen.getByLabelText(/2 étoiles sur 5/i)

    await user.hover(star4)
    expect(star4.querySelector('svg')).toHaveAttribute('fill', 'currentColor')
    await user.unhover(star4)

    await user.click(star2)
    expect(star2).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText(/5 étoiles sur 5/i)).toHaveAttribute('aria-pressed', 'false')
  })

  // --- Bouton désactivé ---
  it("désactive le bouton pendant l'envoi", async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/reviews', async () => {
        await new Promise((r) => setTimeout(r, 150))
        return HttpResponse.json({ success: true, data: { id: 1 } }, { status: 201 })
      })
    )
    render(<ReviewForm productId={1} />)
    await fillValidForm(user)
    await user.click(submit())

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /publication en cours/i })).toBeDisabled()
    )
  })

  // --- Double soumission ---
  it('ignore une seconde soumission immédiate', async () => {
    const user = userEvent.setup()
    let calls = 0

    server.use(
      http.post('/api/reviews', async () => {
        calls++
        await new Promise((r) => setTimeout(r, 150))
        return HttpResponse.json({ success: true, data: { id: 1 } }, { status: 201 })
      })
    )

    render(<ReviewForm productId={1} />)
    await fillValidForm(user)

    // 🎯 fireEvent.submit déclenche React onSubmit de manière synchrone.
    // Les 2e et 3e appels rencontrent submittingRef.current === true → early return.
    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)
    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(calls).toBe(1))
  })
})

describe('ReviewForm (fallback message)', () => {
  it("affiche le fallback de ReviewForm si apiCall retourne sans message", async () => {
    const user = userEvent.setup()
    // On mock apiCall pour qu'il renvoie success:false SANS message
    ;(apiCall as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      // message volontairement absent
    })

    render(<ReviewForm productId={1} />)
    await fillValidForm(user)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /une erreur est survenue lors de l'envoi du commentaire/i
    )
  })
})