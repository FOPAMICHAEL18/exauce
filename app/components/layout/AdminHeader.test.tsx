import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminHeader from './AdminHeader'
import * as navigation from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'

// Résolution de portée propre avec vi.hoisted()
const { mockLogout } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}))

// Mock du hook avec l'alias et le chemin relatif
vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: null,
    loading: false,
  }),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: null,
    loading: false,
  }),
}))

describe('AdminHeader Component', () => {
  const mockOnMenuToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le titre dynamique pour la modification d’un produit (/admin/products/123/edit)', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/admin/products/123/edit')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Modifier le produit' })).toBeDefined()
  })

  it('affiche le titre dynamique pour la modification d’une catégorie (/admin/categories/456/edit)', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/admin/categories/456/edit')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Modifier la categorie' })).toBeDefined()
  })

  it('affiche les titres statiques selon les routes connues', () => {
    const routesWithTitles = [
      { path: '/admin/dashboard', expectedTitle: 'Tableau de bord' },
      { path: '/admin/products', expectedTitle: 'Produits' },
      { path: '/admin/products/new', expectedTitle: 'Creer un produits' },
      { path: '/admin/categories', expectedTitle: 'Gestion des catégories' },
      { path: '/admin/categories/new', expectedTitle: "Creation d'une catégories" },
      { path: '/admin/reviews', expectedTitle: 'Commentaires' },
      { path: '/admin/contact', expectedTitle: 'Coordonnées' },
      { path: '/admin/profil', expectedTitle: "Profil de l'utilisateur" },
    ]

    routesWithTitles.forEach(({ path, expectedTitle }) => {
      vi.spyOn(navigation, 'usePathname').mockReturnValue(path)

      const { unmount } = render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

      expect(screen.getByRole('heading', { level: 1, name: expectedTitle })).toBeDefined()
      unmount()
    })
  })

  it('affiche le titre par défaut "Administration" pour une route inconnue', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/admin/unknown-route')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Administration' })).toBeDefined()
  })

  it('appelle la fonction onMenuToggle lors du clic sur le bouton menu mobile', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/admin/dashboard')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i })
    fireEvent.click(menuButton)

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1)
  })

  it('appelle la fonction logout lors du clic sur le bouton déconnexion', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/admin/dashboard')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    const logoutButton = screen.getByRole('button', { name: /déconnexion/i })
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('rend le lien pour ajouter un produit avec l’attribut href correct', () => {
    vi.spyOn(navigation, 'usePathname').mockReturnValue('/admin/dashboard')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    const addProductLink = screen.getByRole('link', { name: /ajouter un produit/i })
    expect(addProductLink.getAttribute('href')).toBe('/Admin/Products/New')
  })
})