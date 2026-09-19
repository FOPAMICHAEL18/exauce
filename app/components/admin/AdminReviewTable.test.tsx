// app/components/admin/AdminReviewTable.test.tsx
import {
  render,
  screen,
  waitFor,
  cleanup,
  act,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminReviewTable, { clampRating } from './AdminReviewTable'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => '/Admin/Reviews',
}))

const mockApiCall = vi.fn()
vi.mock('@/app/lib/api', () => ({
  apiCall: (...args: unknown[]) => mockApiCall(...args),
}))

const defaultReviews = [
  {
    id: 1,
    author: 'Alice Martin',
    email: 'alice@test.com',
    rating: 5,
    comment: 'Excellent produit !',
    status: 'published',
    product: { title: 'Chaise bois' },
  },
  {
    id: 2,
    author: 'Bob Dupont',
    email: 'bob@test.com',
    rating: 3,
    comment: 'Bon rapport qualité-prix.',
    status: 'pending',
    product: { title: 'Table chêne' },
  },
]

const defaultProps = {
  reviews: defaultReviews,
  currentPage: 1,
  totalPages: 3,
}

beforeEach(() => {
  mockPush.mockReset()
  mockRefresh.mockReset()
  mockApiCall.mockReset()
})

afterEach(() => {
  cleanup()
})

// =========================================================================
// LOGIQUE PURE — clampRating
// =========================================================================
describe('clampRating', () => {
  it('retourne la note si entre 0 et 5', () => {
    expect(clampRating(0)).toBe(0)
    expect(clampRating(3)).toBe(3)
    expect(clampRating(5)).toBe(5)
  })

  it('clamp les notes > 5', () => {
    expect(clampRating(6)).toBe(5)
    expect(clampRating(100)).toBe(5)
  })

  it('clamp les notes négatives à 0', () => {
    expect(clampRating(-1)).toBe(0)
    expect(clampRating(-100)).toBe(0)
  })

  it('arrondit les décimales', () => {
    expect(clampRating(3.4)).toBe(3)
    expect(clampRating(3.6)).toBe(4)
  })

  it('retourne 0 pour NaN ou Infinity', () => {
    expect(clampRating(NaN)).toBe(0)
    expect(clampRating(Infinity)).toBe(0)
  })
})

// =========================================================================
// RENDU
// =========================================================================
describe('AdminReviewTable — rendu', () => {
  it('affiche "Aucun avis trouvé" si vide', () => {
    render(<AdminReviewTable {...defaultProps} reviews={[]} />)
    expect(screen.getByText(/aucun avis trouvé/i)).toBeInTheDocument()
  })

  it('affiche tous les avis', () => {
    render(<AdminReviewTable {...defaultProps} />)
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('Bob Dupont')).toBeInTheDocument()
    expect(screen.getByText('Chaise bois')).toBeInTheDocument()
    expect(screen.getByText('Table chêne')).toBeInTheDocument()
  })

  it('affiche les statuts Publié / En attente', () => {
    render(<AdminReviewTable {...defaultProps} />)
    expect(screen.getByText('Publié')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('affiche le bon nombre d\'étoiles remplies', () => {
    render(<AdminReviewTable {...defaultProps} />)
    expect(screen.getByLabelText('Note : 5 sur 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Note : 3 sur 5')).toBeInTheDocument()
  })
})

// =========================================================================
// 🎯 ROBUSTESSE — Bugs crash identifiés
// =========================================================================
describe('AdminReviewTable — robustesse', () => {
  // 🐛 Bug #1 : rating > 5 → RangeError
  it('ne crash PAS si rating = 6', () => {
    const corrupted = [{ ...defaultReviews[0], rating: 6 }]
    expect(() =>
      render(<AdminReviewTable {...defaultProps} reviews={corrupted} />)
    ).not.toThrow()
    expect(screen.getByLabelText('Note : 5 sur 5')).toBeInTheDocument()
  })

  // 🐛 Bug #2 : rating négatif → RangeError
  it('ne crash PAS si rating = -1', () => {
    const corrupted = [{ ...defaultReviews[0], rating: -1 }]
    expect(() =>
      render(<AdminReviewTable {...defaultProps} reviews={corrupted} />)
    ).not.toThrow()
    expect(screen.getByLabelText('Note : 0 sur 5')).toBeInTheDocument()
  })

  // 🐛 Bug #3 : product null
  it('affiche "Produit supprimé" si product est null', () => {
    const orphan = [{ ...defaultReviews[0], product: null }]
    render(<AdminReviewTable {...defaultProps} reviews={orphan} />)
    expect(screen.getByText('Produit supprimé')).toBeInTheDocument()
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
  })
})

// =========================================================================
// PAGINATION
// =========================================================================
describe('AdminReviewTable — pagination', () => {
  it("n'affiche pas la pagination si totalPages = 1", () => {
    render(<AdminReviewTable {...defaultProps} totalPages={1} />)
    expect(
      screen.queryByRole('navigation', { name: /pagination/i })
    ).not.toBeInTheDocument()
  })

  it('affiche les boutons de pagination', () => {
    render(<AdminReviewTable {...defaultProps} totalPages={3} />)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
  })

  it('désactive précédent sur la première page', () => {
    render(<AdminReviewTable {...defaultProps} currentPage={1} />)
    expect(screen.getByLabelText(/page précédente/i)).toBeDisabled()
  })

  it('désactive suivant sur la dernière page', () => {
    render(
      <AdminReviewTable {...defaultProps} currentPage={3} totalPages={3} />
    )
    expect(screen.getByLabelText(/page suivante/i)).toBeDisabled()
  })

  it('navigue vers la page suivante', async () => {
    const user = userEvent.setup()
    render(<AdminReviewTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/page suivante/i))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Reviews?page=2')
  })

  it('navigue vers la page précédente', async () => {
    const user = userEvent.setup()
    render(<AdminReviewTable {...defaultProps} currentPage={2} />)
    await user.click(screen.getByLabelText(/page précédente/i))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Reviews?page=1')
  })

  it('marque la page courante avec aria-current', () => {
    render(<AdminReviewTable {...defaultProps} currentPage={2} />)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('truncate la pagination quand totalPages > 7', () => {
    render(
      <AdminReviewTable
        {...defaultProps}
        currentPage={10}
        totalPages={20}
      />
    )
    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Page 5' })
    ).not.toBeInTheDocument()
  })

  it('affiche le message de chargement sur la page cliquée', async () => {
    const user = userEvent.setup()
    render(<AdminReviewTable {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      /chargement de la page 2/i
    )
  })

  it('reset le chargement quand la nouvelle page arrive', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AdminReviewTable {...defaultProps} currentPage={1} totalPages={3} />
    )

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(
      <AdminReviewTable {...defaultProps} currentPage={2} totalPages={3} />
    )

    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    )
  })

  it("n'appelle pas push si on clique sur la page courante", async () => {
    const user = userEvent.setup()
    render(<AdminReviewTable {...defaultProps} currentPage={1} />)

    // Le bouton "Page 1" est cliquable (pas disabled)
    await user.click(screen.getByRole('button', { name: 'Page 1' }))

    // Mais push ne doit PAS être appelé
    expect(mockPush).not.toHaveBeenCalled()
    })
})

// =========================================================================
// SUPPRESSION
// =========================================================================
describe('AdminReviewTable — suppression', () => {
  it('ouvre la modale au clic sur la corbeille', async () => {
    const user = userEvent.setup()
    render(<AdminReviewTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // 🎯 Cible le titre unique via son rôle heading
    expect(
        within(dialog).getByRole('heading', {
        name: /supprimer ce commentaire/i,
        })
    ).toBeInTheDocument()
    })

  it('ferme la modale au clic sur Annuler', async () => {
    const user = userEvent.setup()
    render(<AdminReviewTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /annuler/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockApiCall).not.toHaveBeenCalled()
  })

  it('appelle DELETE puis refresh en cas de succès', async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: true, data: { id: 1 } })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/reviews/1', {
        method: 'DELETE',
      })
    )
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it("affiche le message d'erreur API en cas d'échec", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({
      success: false,
      message: 'Avis introuvable',
    })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/avis introuvable/i)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("affiche un fallback si l'API échoue sans message", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /erreur lors de la suppression/i
    )
  })

  it('affiche une erreur réseau si apiCall throw', async () => {
    const user = userEvent.setup()
    mockApiCall.mockRejectedValueOnce(new Error('boom'))
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /erreur de connexion/i
    )
  })

  it("permet de fermer manuellement l'erreur", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false, message: 'Oups' })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))
    await screen.findByRole('alert')

    await user.click(screen.getByLabelText(/fermer le message d'erreur/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("désactive le bouton pendant l'appel API", async () => {
    const user = userEvent.setup()
    let resolveApi!: (v: { success: boolean; data?: { id: number } }) => void
    mockApiCall.mockReturnValueOnce(
      new Promise((r) => {
        resolveApi = r
      })
    )
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer l'avis de alice martin/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    const btn = screen.getByLabelText(/supprimer l'avis de alice martin/i)
    expect(btn).toBeDisabled()

    await act(async () => {
      resolveApi({ success: true, data: { id: 1 } })
    })
  })
})

// =========================================================================
// CHANGEMENT DE STATUT
// =========================================================================
describe('AdminReviewTable — statut', () => {
  it('envoie PUT pour publier un avis en attente', async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: true, data: { id: 2 } })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/publier l'avis de bob dupont/i))

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/reviews/2', {
        method: 'PUT',
      })
    )
  })

  it('envoie PUT pour masquer un avis publié', async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: true, data: { id: 1 } })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/masquer l'avis de alice martin/i))

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/reviews/1', {
        method: 'PUT',
      })
    )
  })

  it("affiche le message d'erreur en cas d'échec", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({
      success: false,
      message: 'Statut invalide',
    })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/publier l'avis de bob dupont/i))

    expect(await screen.findByRole('alert')).toHaveTextContent(/statut invalide/i)
  })

  it('appelle refresh après un changement de statut réussi', async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: true, data: { id: 1 } })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/masquer l'avis de alice martin/i))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it("affiche un fallback si l'API échoue sans message (statut)", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false })
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/publier l'avis de bob dupont/i))

    expect(await screen.findByRole('alert')).toHaveTextContent(
        /erreur lors du changement de statut/i
    )
    })

    it("affiche une erreur réseau si apiCall throw (statut)", async () => {
    const user = userEvent.setup()
    mockApiCall.mockRejectedValueOnce(new Error('boom'))
    render(<AdminReviewTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/publier l'avis de bob dupont/i))

    expect(await screen.findByRole('alert')).toHaveTextContent(
        /erreur de connexion/i
    )
    })
})