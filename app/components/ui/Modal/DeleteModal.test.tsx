import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DeleteModal } from './DeleteModal'

// 🎯 Mock fonction mutable — pattern bulletproof
const mockUsePathname = vi.fn<() => string>(() => '/Admin/Products')

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

const mockClose = vi.fn()
const mockConfirm = vi.fn()

beforeEach(() => {
  mockClose.mockReset()
  mockConfirm.mockReset()
  mockUsePathname.mockReturnValue('/Admin/Products')
})

afterEach(() => {
  cleanup()
})

const setup = (elementToDelete = 'Chaise bois') =>
  render(
    <DeleteModal
      elementToDelete={elementToDelete}
      closeDeleteModal={mockClose}
      confirmDelete={mockConfirm}
    />
  )

// =========================================================================
// CONTEXTE PAR PATHNAME
// =========================================================================
describe('DeleteModal — contexte par pathname', () => {
  it('affiche le contexte Produit sur /Admin/Products', () => {
    mockUsePathname.mockReturnValue('/Admin/Products')
    setup()
    expect(screen.getByText('Supprimer ce produit ?')).toBeInTheDocument()
    expect(screen.getByText(/vouloir supprimer le produit/i)).toBeInTheDocument()
  })

  it('affiche le contexte Produit sur une sous-route (ex: /Edit)', () => {
    mockUsePathname.mockReturnValue('/Admin/Products/123/Edit')
    setup()
    expect(screen.getByText('Supprimer ce produit ?')).toBeInTheDocument()
  })

  it('affiche le contexte Catégorie sur /Admin/Categories', () => {
    mockUsePathname.mockReturnValue('/Admin/Categories')
    setup()
    expect(screen.getByText('Supprimer cette catégorie ?')).toBeInTheDocument()
  })

  it('affiche le contexte Avis sur /Admin/Reviews', () => {
    mockUsePathname.mockReturnValue('/Admin/Reviews')
    setup()
    expect(screen.getByText('Supprimer ce commentaire ?')).toBeInTheDocument()
  })

  it('affiche le fallback sur un pathname inconnu', () => {
    mockUsePathname.mockReturnValue('/Admin/Unknown')
    setup()
    expect(screen.getByText('Supprimer cet élément ?')).toBeInTheDocument()
  })
})

// =========================================================================
// RENDU
// =========================================================================
describe('DeleteModal — rendu', () => {
  it("affiche le nom de l'élément à supprimer", () => {
    setup('Table chêne')
    expect(screen.getByText(/table chêne/i)).toBeInTheDocument()
  })

  it('a le rôle dialog + aria-modal', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-title')
  })

  it('affiche les 3 boutons (X, Annuler, Supprimer)', () => {
    setup()
    expect(screen.getByLabelText(/fermer la modale/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /oui, supprimer/i })).toBeInTheDocument()
  })
})

// =========================================================================
// INTERACTIONS
// =========================================================================
describe('DeleteModal — interactions', () => {
  it('appelle closeDeleteModal au clic sur X', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText(/fermer la modale/i))
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockConfirm).not.toHaveBeenCalled()
  })

  it('appelle closeDeleteModal au clic sur Annuler', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /annuler/i }))
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockConfirm).not.toHaveBeenCalled()
  })

  it('appelle confirmDelete au clic sur "Oui, supprimer"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /oui, supprimer/i }))
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('appelle closeDeleteModal sur Escape', async () => {
    const user = userEvent.setup()
    setup()
    await user.keyboard('{Escape}')
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  // 🎯 NOUVEAU : couvre la branche else de `if (e.key === 'Escape')`
  it("ne ferme PAS la modale sur une autre touche qu'Escape", async () => {
    const user = userEvent.setup()
    setup()
    // 🎯 'a' n'active pas les boutons → teste vraiment la branche `e.key !== 'Escape'`
    await user.keyboard('a')
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('appelle closeDeleteModal au clic sur le backdrop', async () => {
    const user = userEvent.setup()
    setup()
    const dialog = screen.getByRole('dialog')
    await user.click(dialog.parentElement as HTMLElement)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('ne ferme PAS la modale au clic dans le contenu', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Supprimer ce produit ?'))
    expect(mockClose).not.toHaveBeenCalled()
  })
})

// =========================================================================
// A11Y
// =========================================================================
describe('DeleteModal — accessibilité', () => {
  it('focus le bouton Annuler au mount', async () => {
    setup()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /annuler/i })).toHaveFocus()
    )
  })

  it("nettoie l'écouteur Escape au démontage", () => {
    const { unmount } = setup()
    unmount()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(mockClose).not.toHaveBeenCalled()
  })
})