import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdminSidebar from './AdminSidebar'

// Mock du composant Navlink si nécessaire pour éviter les dépendances externes
vi.mock('../../components/ui/Navlink', () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('AdminSidebar Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  it('affiche le logo et l’ensemble des éléments du menu', () => {
        render(<AdminSidebar {...defaultProps} />);

        expect(screen.getByText('exauce')).toBeInTheDocument();
        expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
        expect(screen.getByText('Produits')).toBeInTheDocument();
        expect(screen.getByText(/Catégories|Categories/i)).toBeInTheDocument();
        expect(screen.getByText('Commentaires')).toBeInTheDocument();
        expect(screen.getByText(/Coordonnées|Coordonnees/i)).toBeInTheDocument();
        expect(screen.getByText('Profil')).toBeInTheDocument();
    })

  it('appelle onClose lors du clic sur le bouton de fermeture mobile', () => {
    const handleClose = vi.fn()
    render(<AdminSidebar isOpen={true} onClose={handleClose} />)

    const closeButton = screen.getByRole('button', { name: /fermer le menu/i })
    fireEvent.click(closeButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('applique les classes CSS de fermeture mobile lorsque isOpen est false', () => {
        render(<AdminSidebar isOpen={false} onClose={vi.fn()} />)

        // Cible l'élément aside de la sidebar
        const sidebar = screen.getByRole('complementary', { hidden: true }) || screen.getByText('exauce').closest('aside')

        // Vérifie la classe CSS responsable du masquage sur mobile
        expect(sidebar).toHaveClass('-translate-x-full')
    })
})