import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeleteModal } from './DeleteModal'
import * as navigation from 'next/navigation'

// Mock du module next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

describe('DeleteModal Component', () => {
  const mockCloseDeleteModal = vi.fn()
  const mockConfirmDelete = vi.fn()
  const defaultProps = {
    elementToDelete: 'Produit Test',
    closeDeleteModal: mockCloseDeleteModal,
    confirmDelete: mockConfirmDelete,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le texte correspondant à la route /Admin/Products', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/Products')

    render(<DeleteModal {...defaultProps} />)

    expect(screen.getByText('Supprimer ce produit ?')).toBeDefined()
    expect(screen.getByText(/Êtes-vous sûr de vouloir supprimer le produit/i)).toBeDefined()
    expect(screen.getByText('"Produit Test"')).toBeDefined()
  })

  it('affiche le texte correspondant à la route /Admin/Categories', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/Categories')

    render(<DeleteModal {...defaultProps} />)

    expect(screen.getByText('Supprimer cette categorie ?')).toBeDefined()
    expect(screen.getByText(/Êtes-vous sûr de vouloir supprimer la categorie/i)).toBeDefined()
  })

  it('affiche le texte correspondant à la route /Admin/Reviews', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/Reviews')

    render(<DeleteModal {...defaultProps} />)

    expect(screen.getByText('Supprimer ce commentaire ?')).toBeDefined()
    expect(screen.getByText(/Êtes-vous sûr de vouloir supprimer ce commentaire/i)).toBeDefined()
  })

  it('gère le cas d’une route non répertoriée grâce au fallback', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/UnknownRoute')

    render(<DeleteModal {...defaultProps} />)

    expect(screen.getByText('Supprimer cet élément ?')).toBeDefined()
    expect(screen.getByText(/Êtes-vous sûr de vouloir supprimer cet élément/i)).toBeDefined()
  })

  it('appelle closeDeleteModal au clic sur la croix X', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/Products')

    render(<DeleteModal {...defaultProps} />)

    const closeIconButton = screen.getAllByRole('button')[0] // Bouton X
    fireEvent.click(closeIconButton)

    expect(mockCloseDeleteModal).toHaveBeenCalledTimes(1)
  })

  it('appelle closeDeleteModal au clic sur le bouton Annuler', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/Products')

    render(<DeleteModal {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /annuler/i })
    fireEvent.click(cancelButton)

    expect(mockCloseDeleteModal).toHaveBeenCalledTimes(1)
  })

  it('appelle confirmDelete au clic sur le bouton Oui, supprimer', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/Admin/Products')

    render(<DeleteModal {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /oui, supprimer/i })
    fireEvent.click(deleteButton)

    expect(mockConfirmDelete).toHaveBeenCalledTimes(1)
  })
})