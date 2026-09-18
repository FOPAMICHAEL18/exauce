import { render, screen, waitFor, cleanup, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminProductTable from './AdminProductTable'

// --- Mocks next/navigation (utilisés par AdminProductTable ET DeleteModal) ---
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => '/Admin/Products',
}))

// --- Mock apiCall ---
const mockApiCall = vi.fn()
vi.mock('@/app/lib/api', () => ({
  apiCall: (...args: unknown[]) => mockApiCall(...args),
}))

// ⚠️ PAS de mock de DeleteModal → on teste l'intégration réelle

const defaultProducts = [
  {
    id: 1,
    title: 'Chaise bois',
    price: 12000,
    slug: 'chaise-bois',
    stockStatus: 'disponible',
    category: { name: 'Mobilier' },
  },
  {
    id: 2,
    title: 'Table chêne',
    price: 25000,
    slug: 'table-chene',
    stockStatus: 'rupture',
    category: { name: 'Mobilier' },
  },
]

const defaultProps = {
  products: defaultProducts,
  currentSearch: '',
  currentCategory: '',
  currentStatus: '',
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
// RENDU
// =========================================================================
describe('AdminProductTable — rendu', () => {
  it('affiche "Aucun produit trouvé" si la liste est vide', () => {
    render(<AdminProductTable {...defaultProps} products={[]} />)
    expect(screen.getByText(/aucun produit trouvé/i)).toBeInTheDocument()
  })

  it('affiche tous les produits avec catégorie et statut', () => {
    render(<AdminProductTable {...defaultProps} />)
    expect(screen.getByText('Chaise bois')).toBeInTheDocument()
    expect(screen.getByText('Table chêne')).toBeInTheDocument()
    expect(screen.getAllByText('Mobilier')).toHaveLength(2)
    expect(screen.getByText('Publié')).toBeInTheDocument()
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
  })

  it('affiche un lien Modifier par produit avec le bon href', () => {
    render(<AdminProductTable {...defaultProps} />)
    const editLinks = screen.getAllByRole('link', { name: /modifier/i })
    expect(editLinks).toHaveLength(2)
    expect(editLinks[0]).toHaveAttribute('href', '/Admin/Products/1/Edit')
    expect(editLinks[1]).toHaveAttribute('href', '/Admin/Products/2/Edit')
  })

  it('affiche "Sans catégorie" si category est null', () => {
    const products = [
      { ...defaultProducts[0], category: null as unknown as { name: string } },
    ]
    render(<AdminProductTable {...defaultProps} products={products} />)
    expect(screen.getByText('Sans catégorie')).toBeInTheDocument()
  })
})

// =========================================================================
// PAGINATION
// =========================================================================
describe('AdminProductTable — pagination', () => {
  it("n'affiche pas la pagination si totalPages === 1", () => {
    render(<AdminProductTable {...defaultProps} totalPages={1} />)
    expect(
      screen.queryByRole('navigation', { name: /pagination/i })
    ).not.toBeInTheDocument()
  })

  it('affiche la pagination si totalPages > 1', () => {
    render(<AdminProductTable {...defaultProps} totalPages={3} />)
    expect(
      screen.getByRole('navigation', { name: /pagination/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
  })

  it('désactive "Page précédente" sur la première page', () => {
    render(<AdminProductTable {...defaultProps} currentPage={1} />)
    expect(screen.getByLabelText(/page précédente/i)).toBeDisabled()
  })

  it('désactive "Page suivante" sur la dernière page', () => {
    render(<AdminProductTable {...defaultProps} currentPage={3} totalPages={3} />)
    expect(screen.getByLabelText(/page suivante/i)).toBeDisabled()
  })

  it('navigue vers la page suivante au clic', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/page suivante/i))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?page=2')
  })

  it("conserve les filtres dans l'URL au changement de page", async () => {
    const user = userEvent.setup()
    render(
      <AdminProductTable
        {...defaultProps}
        currentSearch="chaise"
        currentCategory="mobilier"
        currentStatus="disponible"
      />
    )
    await user.click(screen.getByLabelText(/page suivante/i))
    expect(mockPush).toHaveBeenCalledWith(
      '/Admin/Products?search=chaise&category=mobilier&status=disponible&page=2'
    )
  })

  it("trim le search dans l'URL", async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} currentSearch="  chaise  " />)
    await user.click(screen.getByLabelText(/page suivante/i))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?search=chaise&page=2')
  })

  it("n'appelle pas router.push si on clique sur la page courante", async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} currentPage={1} />)
    await user.click(screen.getByRole('button', { name: 'Page 1' }))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('marque la page courante avec aria-current', () => {
    render(<AdminProductTable {...defaultProps} currentPage={2} />)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('truncate la pagination quand totalPages > 7', () => {
    render(<AdminProductTable {...defaultProps} currentPage={10} totalPages={20} />)
    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 9' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 11' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 5' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 15' })).not.toBeInTheDocument()
  })

  it('affiche un spinner sur la page cliquée pendant le chargement', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    const page2 = screen.getByRole('button', { name: 'Page 2' })
    expect(page2.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it("reset le spinner quand la nouvelle page arrive (useEffect)", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AdminProductTable {...defaultProps} currentPage={1} totalPages={3} />
    )

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(
      screen.getByRole('button', { name: 'Page 2' }).querySelector('.animate-spin')
    ).toBeInTheDocument()

    rerender(<AdminProductTable {...defaultProps} currentPage={2} totalPages={3} />)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Page 2' }).querySelector('.animate-spin')
      ).not.toBeInTheDocument()
    )
  })
})

// =========================================================================
// SUPPRESSION (intégration avec le VRAI DeleteModal)
// =========================================================================
describe('AdminProductTable — suppression', () => {
  it('ouvre la modale au clic sur la corbeille', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))

    // ✅ On teste le VRAI contenu du DeleteModal
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Titre spécifique au pathname /Admin/Products
    expect(within(dialog).getByText('Supprimer ce produit ?')).toBeInTheDocument()

    // Le nom de l'élément est présent dans la description
    expect(within(dialog).getByText(/chaise bois/i)).toBeInTheDocument()
  })

  it('affiche les 3 boutons du vrai DeleteModal (X, Annuler, Oui supprimer)', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/fermer la modale/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /annuler/i })).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: /oui, supprimer/i })
    ).toBeInTheDocument()
  })

  it('ferme la modale au clic sur Annuler', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /annuler/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockApiCall).not.toHaveBeenCalled()
  })

  it('ferme la modale au clic sur le bouton X (aria-label "Fermer la modale")', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByLabelText(/fermer la modale/i))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockApiCall).not.toHaveBeenCalled()
  })

  it('ferme la modale sur Escape', async () => {
    const user = userEvent.setup()
    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockApiCall).not.toHaveBeenCalled()
  })

  it('appelle DELETE puis router.refresh() en cas de succès', async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: true, data: { id: 1 } })
    render(<AdminProductTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/products/1', {
        method: 'DELETE',
      })
    )
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    // La modale a été fermée avant l'appel API (closeDeleteModal appelé dans confirmDelete)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("affiche le message de l'API en cas d'échec (success: false)", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({
      success: false,
      message: 'Produit introuvable',
    })
    render(<AdminProductTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/produit introuvable/i)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("affiche un message par défaut si l'API échoue sans message", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false })
    render(<AdminProductTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /erreur lors de la suppression du produit/i
    )
  })

  it('affiche une erreur réseau si apiCall throw', async () => {
    const user = userEvent.setup()
    mockApiCall.mockRejectedValueOnce(new Error('boom'))
    render(<AdminProductTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/erreur de connexion/i)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("permet de fermer manuellement l'erreur", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false, message: 'Oups' })
    render(<AdminProductTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))
    await screen.findByRole('alert')

    await user.click(screen.getByLabelText(/fermer le message d'erreur/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("efface l'erreur précédente à l'ouverture d'une nouvelle modale", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false, message: 'Erreur précédente' })
    render(<AdminProductTable {...defaultProps} />)

    // 1. On déclenche une erreur sur le premier produit
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))
    await screen.findByRole('alert')

    // 2. On ouvre la modale pour l'autre produit → setError(null) doit vider le bandeau
    await user.click(screen.getByLabelText(/supprimer table chêne/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("désactive le bouton supprimer pendant l'appel API", async () => {
    const user = userEvent.setup()
    let resolveApi!: (v: { success: boolean; data?: { id: number } }) => void
    mockApiCall.mockReturnValueOnce(
      new Promise((r) => {
        resolveApi = r
      })
    )

    render(<AdminProductTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer chaise bois/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    const btn = screen.getByLabelText(/supprimer chaise bois/i)
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument()

    await act(async () => {
      resolveApi({ success: true, data: { id: 1 } })
    })
  })
})