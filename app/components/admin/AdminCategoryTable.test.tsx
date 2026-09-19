// app/components/admin/AdminCategoryTable.test.tsx
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
import AdminCategoryTable from './AdminCategoryTable'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => '/Admin/Categories',
}))

const mockApiCall = vi.fn()
vi.mock('@/app/lib/api', () => ({
  apiCall: (...args: unknown[]) => mockApiCall(...args),
}))

// =========================================================================
// FIXTURES
// =========================================================================
const defaultCategories = [
  {
    id: 1,
    name: 'Mobilier',
    slug: 'mobilier',
    product: [{ title: 'Chaise' }, { title: 'Table' }],
    _count: { product: 2 },
  },
  {
    id: 2,
    name: 'Éclairage',
    slug: 'eclairage',
    product: [{ title: 'Lampe' }],
    _count: { product: 1 },
  },
]

const defaultProps = {
  categories: defaultCategories,
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
describe('AdminCategoryTable — rendu', () => {
  it('affiche "Aucune catégorie trouvée" si la liste est vide', () => {
    render(<AdminCategoryTable {...defaultProps} categories={[]} />)
    expect(screen.getByText(/aucune catégorie trouvée/i)).toBeInTheDocument()
  })

  it('affiche le titre "Catégories existantes"', () => {
    render(<AdminCategoryTable {...defaultProps} />)
    expect(
      screen.getByRole('heading', { name: /catégories existantes/i })
    ).toBeInTheDocument()
  })

  it('affiche toutes les catégories', () => {
    render(<AdminCategoryTable {...defaultProps} />)
    expect(screen.getByText('Mobilier')).toBeInTheDocument()
    expect(screen.getByText('Éclairage')).toBeInTheDocument()
  })

  it('affiche le nombre de produits par catégorie', () => {
    render(<AdminCategoryTable {...defaultProps} />)

    const mobilierRow = screen.getByRole('link', { name: 'Mobilier' }).closest('tr')
    expect(mobilierRow).not.toBeNull()
    expect(within(mobilierRow!).getByText('2')).toBeInTheDocument()

    const eclairageRow = screen.getByRole('link', { name: 'Éclairage' }).closest('tr')
    expect(eclairageRow).not.toBeNull()
    expect(within(eclairageRow!).getByText('1')).toBeInTheDocument()
    })

  it('affiche 0 si _count.product est undefined', () => {
    const cats = [
        { ...defaultCategories[0], _count: {} as { product: number } },
    ]
    render(<AdminCategoryTable {...defaultProps} categories={cats} />)

    const row = screen.getByRole('link', { name: 'Mobilier' }).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getByText('0')).toBeInTheDocument()
    })

  it('génère un lien Modifier par catégorie', () => {
    render(<AdminCategoryTable {...defaultProps} />)
    const editLinks = screen.getAllByRole('link', { name: /modifier/i })
    expect(editLinks).toHaveLength(2)
    expect(editLinks[0]).toHaveAttribute('href', '/Admin/Categories/1/Edit')
    expect(editLinks[1]).toHaveAttribute('href', '/Admin/Categories/2/Edit')
  })
})

// =========================================================================
// PAGINATION
// =========================================================================
describe('AdminCategoryTable — pagination', () => {
  it("n'affiche pas la pagination si totalPages === 1", () => {
    render(<AdminCategoryTable {...defaultProps} totalPages={1} />)
    expect(
      screen.queryByRole('navigation', { name: /pagination/i })
    ).not.toBeInTheDocument()
  })

  it('affiche les boutons de pagination si totalPages > 1', () => {
    render(<AdminCategoryTable {...defaultProps} totalPages={3} />)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
  })

  it('désactive précédent sur la première page', () => {
    render(<AdminCategoryTable {...defaultProps} currentPage={1} />)
    expect(screen.getByLabelText(/page précédente/i)).toBeDisabled()
  })

  it('désactive suivant sur la dernière page', () => {
    render(
      <AdminCategoryTable {...defaultProps} currentPage={3} totalPages={3} />
    )
    expect(screen.getByLabelText(/page suivante/i)).toBeDisabled()
  })

  it('navigue vers la page suivante', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/page suivante/i))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Categories?page=2')
  })

  it('navigue vers la page précédente', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} currentPage={2} />)
    await user.click(screen.getByLabelText(/page précédente/i))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Categories?page=1')
  })

  it("n'appelle pas push si on clique sur la page courante", async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} currentPage={1} />)
    await user.click(screen.getByRole('button', { name: 'Page 1' }))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('marque la page courante avec aria-current', () => {
    render(<AdminCategoryTable {...defaultProps} currentPage={2} />)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('truncate la pagination quand totalPages > 7', () => {
    render(
      <AdminCategoryTable {...defaultProps} currentPage={10} totalPages={20} />
    )
    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Page 5' })
    ).not.toBeInTheDocument()
  })

  // ✅ CORRIGÉ : on vérifie le message de chargement (role=status), pas la classe CSS
  it('affiche le message de chargement sur la page cliquée', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      /chargement de la page 2/i
    )
  })

  // ✅ CORRIGÉ : on vérifie la disparition du role=status, pas de la classe
  it('reset le chargement quand la nouvelle page arrive', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AdminCategoryTable {...defaultProps} currentPage={1} totalPages={3} />
    )

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(
      <AdminCategoryTable {...defaultProps} currentPage={2} totalPages={3} />
    )

    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    )
  })
})

// =========================================================================
// SUPPRESSION
// =========================================================================
describe('AdminCategoryTable — suppression', () => {
  it('ouvre la modale au clic sur la corbeille', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer mobilier/i))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByText(/supprimer cette catégorie/i)
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/mobilier/i)).toBeInTheDocument()
  })

  it('ferme la modale au clic sur Annuler', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /annuler/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockApiCall).not.toHaveBeenCalled()
  })

  it('ferme la modale sur Escape', async () => {
    const user = userEvent.setup()
    render(<AdminCategoryTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('appelle DELETE puis router.refresh() en cas de succès', async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: true, data: { id: 1 } })
    render(<AdminCategoryTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    await waitFor(() =>
      expect(mockApiCall).toHaveBeenCalledWith('/api/admin/categories/1', {
        method: 'DELETE',
      })
    )
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it("affiche le message d'erreur de l'API en cas d'échec", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({
      success: false,
      message: 'Catégorie utilisée par des produits',
    })
    render(<AdminCategoryTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /catégorie utilisée par des produits/i
    )
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("affiche un fallback si l'API échoue sans message", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false })
    render(<AdminCategoryTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /erreur lors de la suppression de la catégorie/i
    )
  })

  it('affiche une erreur réseau si apiCall throw', async () => {
    const user = userEvent.setup()
    mockApiCall.mockRejectedValueOnce(new Error('boom'))
    render(<AdminCategoryTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /erreur de connexion/i
    )
  })

  it("permet de fermer manuellement l'erreur", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({ success: false, message: 'Oups' })
    render(<AdminCategoryTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))
    await screen.findByRole('alert')

    await user.click(screen.getByLabelText(/fermer le message d'erreur/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("efface l'erreur précédente à l'ouverture d'une nouvelle modale", async () => {
    const user = userEvent.setup()
    mockApiCall.mockResolvedValueOnce({
      success: false,
      message: 'Erreur précédente',
    })
    render(<AdminCategoryTable {...defaultProps} />)

    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))
    await screen.findByRole('alert')

    await user.click(screen.getByLabelText(/supprimer éclairage/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // ✅ CORRIGÉ : on vérifie uniquement le disabled (comportement)
  it("désactive le bouton supprimer pendant l'appel API", async () => {
    const user = userEvent.setup()
    let resolveApi!: (v: { success: boolean; data?: { id: number } }) => void
    mockApiCall.mockReturnValueOnce(
      new Promise((r) => {
        resolveApi = r
      })
    )

    render(<AdminCategoryTable {...defaultProps} />)
    await user.click(screen.getByLabelText(/supprimer mobilier/i))
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))

    const btn = screen.getByLabelText(/supprimer mobilier/i)
    expect(btn).toBeDisabled()
    // Le label reste accessible même pendant le chargement
    expect(btn).toHaveAttribute('aria-label', 'Supprimer Mobilier')

    // Résout dans act() pour éviter le warning
    await act(async () => {
      resolveApi({ success: true, data: { id: 1 } })
    })
  })
})