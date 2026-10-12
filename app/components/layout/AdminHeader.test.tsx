// app/components/layout/AdminHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminHeader from './AdminHeader'
import { useAuth } from '@/app/contexts/AuthContext'

// Mock logout isolé pour pouvoir l'asserter
const mockLogout = vi.fn()

// Mock de next/navigation : usePathname doit être mockable par test
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}))

// Mock du Context AuthContext (le nouveau chemin)
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Import après le mock pour avoir la version mockée
import * as navigation from 'next/navigation'

function mockAuth(
  overrides: Partial<ReturnType<typeof useAuth>> = {},
): void {
  vi.mocked(useAuth).mockReturnValue({
    admin: { id: 1, email: 'admin@test.com', name: 'Admin' },
    isAuthenticated: true,
    loading: false,
    isSubmitting: false,
    login: vi.fn(),
    logout: mockLogout,
    ...overrides,
  })
}

describe('AdminHeader Component', () => {
  const mockOnMenuToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Par défaut, l'utilisateur est connecté
    mockAuth()
  })

  it('affiche le titre dynamique pour la modification d’un produit (/admin/products/123/edit)', () => {
    vi.mocked(navigation.usePathname).mockReturnValue(
      '/admin/products/123/edit',
    )

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Modifier le produit' }),
    ).toBeInTheDocument()
  })

  it('affiche le titre dynamique pour la modification d’une catégorie (/admin/categories/456/edit)', () => {
    vi.mocked(navigation.usePathname).mockReturnValue(
      '/admin/categories/456/edit',
    )

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Modifier la categorie',
      }),
    ).toBeInTheDocument()
  })

  it('affiche les titres statiques selon les routes connues', () => {
    const routesWithTitles = [
      { path: '/admin/dashboard', expectedTitle: 'Tableau de bord' },
      { path: '/admin/products', expectedTitle: 'Produits' },
      { path: '/admin/products/new', expectedTitle: 'Creer un produits' },
      { path: '/admin/categories', expectedTitle: 'Gestion des catégories' },
      {
        path: '/admin/categories/new',
        expectedTitle: "Creation d'une catégories",
      },
      { path: '/admin/reviews', expectedTitle: 'Commentaires' },
      { path: '/admin/contact', expectedTitle: 'Coordonnées' },
      { path: '/admin/profil', expectedTitle: "Profil de l'utilisateur" },
    ]

    routesWithTitles.forEach(({ path, expectedTitle }) => {
      vi.mocked(navigation.usePathname).mockReturnValue(path)

      const { unmount } = render(
        <AdminHeader onMenuToggle={mockOnMenuToggle} />,
      )

      expect(
        screen.getByRole('heading', { level: 1, name: expectedTitle }),
      ).toBeInTheDocument()
      unmount()
    })
  })

  it('affiche le titre par défaut "Administration" pour une route inconnue', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/admin/unknown-route')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Administration' }),
    ).toBeInTheDocument()
  })

  it('appelle la fonction onMenuToggle lors du clic sur le bouton menu mobile', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/admin/dashboard')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i })
    fireEvent.click(menuButton)

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1)
  })

  it('appelle la fonction logout lors du clic sur le bouton déconnexion', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/admin/dashboard')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    const logoutButton = screen.getByRole('button', { name: /déconnexion/i })
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('rend le lien pour ajouter un produit avec l’attribut href correct', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/admin/dashboard')

    render(<AdminHeader onMenuToggle={mockOnMenuToggle} />)

    const addProductLink = screen.getByRole('link', {
      name: /ajouter un produit/i,
    })
    expect(addProductLink).toHaveAttribute('href', '/Admin/Products/New')
  })
})