// app/components/admin/AdminCategoryForm.test.tsx
import {
  render,
  screen,
  cleanup,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminCategoryForm from './AdminCategoryForm'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockApiCall = vi.fn()
vi.mock('@/app/lib/api', () => ({
  apiCall: (...args: unknown[]) => mockApiCall(...args),
}))

beforeEach(() => {
  mockPush.mockReset()
  mockApiCall.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// Helpers
const submitBtn = () =>
  screen.getByRole('button', { name: /créer la catégorie|mettre à jour/i })

const nameInput = () => screen.getByLabelText(/nom de la catégorie/i)

// =========================================================================
// RENDU — MODE CRÉATION vs ÉDITION
// =========================================================================
describe('AdminCategoryForm — rendu', () => {
  it('affiche le formulaire de création', () => {
    render(<AdminCategoryForm />)
    expect(
      screen.getByRole('heading', { name: /nouvelle catégorie/i })
    ).toBeInTheDocument()
    expect(submitBtn()).toHaveTextContent(/créer la catégorie/i)
    expect(nameInput()).toHaveValue('')
  })

  it("affiche le formulaire d'édition avec le nom pré-rempli", () => {
    render(<AdminCategoryForm initialData={{ id: 5, name: 'Mobilier' }} />)
    expect(
      screen.getByRole('heading', { name: /éditer la catégorie/i })
    ).toBeInTheDocument()
    expect(submitBtn()).toHaveTextContent(/mettre à jour/i)
    expect(nameInput()).toHaveValue('Mobilier')
  })

  it("n'affiche aucun message au démarrage", () => {
    render(<AdminCategoryForm />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

// =========================================================================
// MODE CRÉATION
// =========================================================================
describe('AdminCategoryForm — création', () => {
  it('envoie POST /api/admin/categories', async () => {
    mockApiCall.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), 'Éclairage')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Éclairage' }),
      })
    )
  })

  it('trim le nom avant envoi', async () => {
    mockApiCall.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), '  Mobilier  ')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({ name: 'Mobilier' }) })
      )
    )
  })

  it('affiche le succès et redirige après 1.5s', async () => {
    vi.useFakeTimers()
    mockApiCall.mockResolvedValueOnce({ success: true })
    render(<AdminCategoryForm />)

    fireEvent.change(nameInput(), { target: { value: 'Éclairage' } })

    await act(async () => {
      fireEvent.click(submitBtn())
    })

    expect(screen.getByRole('status')).toHaveTextContent(/créée avec succès/i)
    expect(mockPush).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    expect(mockPush).toHaveBeenCalledWith('/Admin/Categories')
  })
})

// =========================================================================
// MODE ÉDITION
// =========================================================================
describe('AdminCategoryForm — édition', () => {
  it('envoie PUT /api/admin/categories/:id', async () => {
    mockApiCall.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<AdminCategoryForm initialData={{ id: 5, name: 'Mobilier' }} />)

    await user.clear(nameInput())
    await user.type(nameInput(), 'Mobilier Pro')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/categories/5', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Mobilier Pro' }),
      })
    )
  })

  it("ne redirige PAS automatiquement en mode édition", async () => {
    vi.useFakeTimers()
    mockApiCall.mockResolvedValueOnce({ success: true })
    render(<AdminCategoryForm initialData={{ id: 5, name: 'Mobilier' }} />)

    await act(async () => {
      fireEvent.click(submitBtn())
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      /mise à jour avec succès/i
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
})

// =========================================================================
// ERREURS
// =========================================================================
describe('AdminCategoryForm — erreurs', () => {
  it("affiche le message d'erreur de l'API", async () => {
    mockApiCall.mockResolvedValueOnce({
      success: false,
      message: 'Nom déjà utilisé',
    })
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), 'Mobilier')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /nom déjà utilisé/i
    )
  })

  it("affiche un fallback si l'API échoue sans message", async () => {
    mockApiCall.mockResolvedValueOnce({ success: false })
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), 'Mobilier')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /une erreur est survenue/i
    )
  })

  it('affiche un fallback si apiCall throw', async () => {
    mockApiCall.mockRejectedValueOnce(new Error('boom'))
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), 'Mobilier')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /une erreur inattendue est survenue/i
    )
  })

  it("efface l'erreur à chaque nouvelle soumission", async () => {
    mockApiCall
      .mockResolvedValueOnce({ success: false, message: 'Erreur 1' })
      .mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), 'Mobilier')
    await user.click(submitBtn())
    await screen.findByRole('alert')

    await user.click(submitBtn())
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    )
  })
})

// =========================================================================
// ÉTAT LOADING
// =========================================================================
describe('AdminCategoryForm — loading', () => {
  it('désactive les boutons et inputs pendant la soumission', async () => {
    let resolveApi!: (v: { success: boolean }) => void
    mockApiCall.mockReturnValueOnce(
      new Promise((r) => {
        resolveApi = r
      })
    )
    const user = userEvent.setup()
    render(<AdminCategoryForm />)

    await user.type(nameInput(), 'Mobilier')
    await user.click(submitBtn())

    expect(submitBtn()).toBeDisabled()
    expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled()
    expect(nameInput()).toBeDisabled()
    expect(submitBtn().querySelector('.animate-spin')).toBeInTheDocument()

    // 🎯 Résoudre DANS act() → supprime le warning
    await act(async () => {
      resolveApi({ success: true })
    })
  })
})

// =========================================================================
// ANNULATION
// =========================================================================
describe('AdminCategoryForm — annulation', () => {
  it('redirige vers /Admin/Categories', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryForm />)
    await user.click(screen.getByRole('button', { name: /annuler/i }))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Categories')
  })

  it('annule la redirection différée si on clique sur Annuler avant 1.5s', async () => {
    vi.useFakeTimers()
    mockApiCall.mockResolvedValueOnce({ success: true })
    render(<AdminCategoryForm />)

    fireEvent.change(nameInput(), { target: { value: 'Éclairage' } })

    await act(async () => {
      fireEvent.click(submitBtn())
    })

    expect(screen.getByRole('status')).toBeInTheDocument()

    // Clic sur Annuler AVANT les 1.5s
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(mockPush).toHaveBeenCalledTimes(1)

    // Avance de 2s — le timer de création ne doit PAS refire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(mockPush).toHaveBeenCalledTimes(1)
  })
})

// =========================================================================
// AUTO-HIDE DU SUCCÈS
// =========================================================================
describe('AdminCategoryForm — auto-hide succès', () => {
  it('cache le message de succès après 3s', async () => {
    vi.useFakeTimers()
    mockApiCall.mockResolvedValueOnce({ success: true })
    render(<AdminCategoryForm initialData={{ id: 5, name: 'Mobilier' }} />)

    await act(async () => {
      fireEvent.click(submitBtn())
    })

    expect(screen.getByRole('status')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})