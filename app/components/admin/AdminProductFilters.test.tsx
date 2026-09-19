// app/components/admin/AdminProductFilters.test.tsx
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminProductFilters from './AdminProductFilters'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/Admin/Products',
}))

const mockCategories = [
  { id: 1, name: 'Mobilier', slug: 'mobilier' },
  { id: 2, name: 'Éclairage', slug: 'eclairage' },
]

const defaultProps = {
  search: '',
  category: '',
  status: '',
  categories: mockCategories,
}

beforeEach(() => {
  mockPush.mockReset()
})

afterEach(() => {
  cleanup()
})

// =========================================================================
// RENDU
// =========================================================================
describe('AdminProductFilters — rendu', () => {
  it('affiche les 3 champs de filtre', () => {
    render(<AdminProductFilters {...defaultProps} />)
    expect(screen.getByLabelText(/rechercher un produit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/filtrer par catégorie/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/filtrer par statut/i)).toBeInTheDocument()
  })

  it('pré-remplit les champs avec les valeurs initiales', () => {
    render(
      <AdminProductFilters
        {...defaultProps}
        search="chaise"
        category="1"
        status="disponible"
      />
    )
    expect(screen.getByLabelText(/rechercher un produit/i)).toHaveValue('chaise')
    expect(screen.getByLabelText(/filtrer par catégorie/i)).toHaveValue('1')
    expect(screen.getByLabelText(/filtrer par statut/i)).toHaveValue('disponible')
  })

  it('affiche les options de catégories', () => {
    render(<AdminProductFilters {...defaultProps} />)
    expect(screen.getByRole('option', { name: 'Toutes les catégories' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mobilier' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Éclairage' })).toBeInTheDocument()
  })
})

// =========================================================================
// RECHERCHE
// =========================================================================
describe('AdminProductFilters — recherche', () => {
  it('met à jour le state local à la frappe (pas de push)', async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} />)

    await user.type(screen.getByLabelText(/rechercher un produit/i), 'chaise')

    expect(screen.getByLabelText(/rechercher un produit/i)).toHaveValue('chaise')
    // 🎯 Pas de push : la recherche ne déclenche qu'à Enter ou au vidage
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('déclenche le push à la soumission du formulaire (Enter)', async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} />)

    const input = screen.getByLabelText(/rechercher un produit/i)
    await user.type(input, 'chaise{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?search=chaise&page=1')
  })

  it('trim la recherche avant le push', async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} />)

    const input = screen.getByLabelText(/rechercher un produit/i)
    await user.type(input, '  chaise  {Enter}')

    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?search=chaise&page=1')
  })

  it('déclenche immédiatement le push quand la recherche est vidée', async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} search="chaise" />)

    const input = screen.getByLabelText(/rechercher un produit/i)
    await user.clear(input)

    // 🎯 Vider la recherche doit push immédiatement (pas besoin d'Enter)
    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?page=1')
  })
})

// =========================================================================
// CATÉGORIE
// =========================================================================
describe('AdminProductFilters — catégorie', () => {
  it('déclenche le push au changement de catégorie', async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} />)

    await user.selectOptions(screen.getByLabelText(/filtrer par catégorie/i), '1')

    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?category=1&page=1')
  })

  it("préserve la recherche lors du changement de catégorie", async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} search="chaise" />)

    await user.selectOptions(screen.getByLabelText(/filtrer par catégorie/i), '1')

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('search=chaise')
    expect(url).toContain('category=1')
    expect(url).toContain('page=1')
  })

  it("retire le category de l'URL si on revient à 'Toutes'", async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} category="1" />)

    await user.selectOptions(screen.getByLabelText(/filtrer par catégorie/i), '')

    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('category=')
    expect(url).toContain('page=1')
  })
})

// =========================================================================
// STATUT
// =========================================================================
describe('AdminProductFilters — statut', () => {
  it('déclenche le push au changement de statut', async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} />)

    await user.selectOptions(screen.getByLabelText(/filtrer par statut/i), 'disponible')

    expect(mockPush).toHaveBeenCalledWith('/Admin/Products?status=disponible&page=1')
  })

  it("retire le status de l'URL si on revient à 'Tous'", async () => {
    const user = userEvent.setup()
    render(<AdminProductFilters {...defaultProps} status="disponible" />)

    await user.selectOptions(screen.getByLabelText(/filtrer par statut/i), '')

    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('status=')
    expect(url).toContain('page=1')
  })
})