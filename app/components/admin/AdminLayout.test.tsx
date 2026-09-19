// app/Admin/layout.test.tsx
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminLayout from './AdminLayout'
import userEvent from '@testing-library/user-event'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
let mockPathname = '/Admin/Dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))

// État auth mutable entre les tests
let mockAuthState: { loading: boolean; isAuthenticated: boolean } = {
  loading: false,
  isAuthenticated: false,
}

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

// Mock des enfants du layout (isolé pour éviter les dépendances)
vi.mock('../layout/AdminSidebar', () => ({
  default: ({ onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="admin-sidebar">
      Sidebar
      {/* 🎯 Bouton qui déclenche le vrai onClose */}
      <button data-testid="sidebar-close" onClick={onClose}>
        Fermer
      </button>
    </div>
  ),
}))

vi.mock('../layout/AdminHeader', () => ({
  default: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
    <div data-testid="admin-header">
      Header
      {/* 🎯 Bouton qui déclenche le vrai onMenuToggle */}
      <button data-testid="header-menu-toggle" onClick={onMenuToggle}>
        Menu
      </button>
    </div>
  ),
}))

// Enfants factices
const ProtectedChild = () => (
  <div data-testid="admin-content">Contenu admin protégé</div>
)
const LoginChild = () => (
  <div data-testid="login-content">Formulaire de connexion</div>
)

beforeEach(() => {
  mockPush.mockReset()
  mockPathname = '/Admin/Dashboard'
  mockAuthState = { loading: false, isAuthenticated: false }
})

afterEach(() => {
  cleanup()
})

// =========================================================================
// SÉCURITÉ — Protection contre le flash de contenu admin
// =========================================================================
describe('AdminLayout — sécurité : loading', () => {
  it("n'expose JAMAIS le contenu admin pendant le chargement de l'auth", () => {
    mockAuthState = { loading: true, isAuthenticated: true } // même "authentifié"
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    // 🔒 Aucun contenu admin ne doit fuiter
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()

    // Un indicateur de chargement est visible
    expect(
      screen.getByRole('status', { name: /chargement de l'administration/i })
    ).toBeInTheDocument()
  })
})

// =========================================================================
// SÉCURITÉ — Accès non authentifié
// =========================================================================
describe('AdminLayout — sécurité : non authentifié', () => {
  it('ne rend JAMAIS le contenu admin sans authentification', () => {
    mockAuthState = { loading: false, isAuthenticated: false }
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })

  it('redirige vers /Admin/Login', async () => {
    mockAuthState = { loading: false, isAuthenticated: false }
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login')
    )
  })

  it('redirige même depuis une sous-route profonde', async () => {
    mockAuthState = { loading: false, isAuthenticated: false }
    mockPathname = '/Admin/Products/123/Edit'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login')
    )
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })
})

// =========================================================================
// SÉCURITÉ — Page /Admin/Login
// =========================================================================
describe('AdminLayout — page login', () => {
  it('affiche le formulaire de login sans layout admin', () => {
    mockAuthState = { loading: false, isAuthenticated: false }
    mockPathname = '/Admin/Login'
    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>
    )

    expect(screen.getByTestId('login-content')).toBeInTheDocument()
    // 🔒 Le layout admin ne doit jamais apparaître sur le login
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })

  it('ne déclenche AUCUNE redirection si déjà sur /Admin/Login', async () => {
    mockAuthState = { loading: false, isAuthenticated: false }
    mockPathname = '/Admin/Login'
    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('ne rend pas la sidebar/header admin même si isAuthenticated = true', () => {
    mockAuthState = { loading: false, isAuthenticated: true }
    mockPathname = '/Admin/Login'
    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>
    )

    expect(screen.getByTestId('login-content')).toBeInTheDocument()
    // 🔒 La page login reste "nue" même pour un utilisateur connecté
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })
})

// =========================================================================
// Authentifié — accès légitime
// =========================================================================
describe('AdminLayout — authentifié', () => {
  it('affiche le contenu admin avec la sidebar et le header', async () => {
    mockAuthState = { loading: false, isAuthenticated: true }
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    )
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
  })

  it('ne déclenche aucune redirection', async () => {
    mockAuthState = { loading: false, isAuthenticated: true }
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    )
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// =========================================================================
// SÉCURITÉ — Session expirée en cours de navigation
// =========================================================================
describe('AdminLayout — sécurité : session expirée', () => {
  it('retire le contenu admin et redirige si la session expire', async () => {
    // 1. Utilisateur authentifié
    mockAuthState = { loading: false, isAuthenticated: true }
    mockPathname = '/Admin/Dashboard'
    const { rerender } = render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    )

    // 2. Session expirée
    mockAuthState = { loading: false, isAuthenticated: false }
    rerender(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

    // 🔒 Le contenu admin doit DISPARAÎTRE immédiatement
    await waitFor(() =>
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    )
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()

    // Et la redirection doit être déclenchée
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login')
    )
  })
})

// =========================================================================
// TOGGLE SIDEBAR (overlay + callbacks)
// =========================================================================
describe('AdminLayout — toggle sidebar', () => {
  const renderAuthenticated = () =>
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>
    )

  beforeEach(() => {
    mockAuthState = { loading: false, isAuthenticated: true }
    mockPathname = '/Admin/Dashboard'
  })

  it('ouvre la sidebar au clic sur le bouton du header', async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    )

    // État initial : pas d'overlay
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()

    // 🎯 Clic sur le bouton du header → ouvre la sidebar
    await user.click(screen.getByTestId('header-menu-toggle'))

    // L'overlay doit maintenant apparaître
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()
  })

  it("ferme la sidebar au clic sur l'overlay", async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    )

    // 1. Ouvre la sidebar
    await user.click(screen.getByTestId('header-menu-toggle'))
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()

    // 2. Clic sur l'overlay → ferme la sidebar
    await user.click(screen.getByTestId('sidebar-overlay'))
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
  })

  it('ferme la sidebar au clic sur le bouton Fermer de la sidebar', async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    )

    // 1. Ouvre
    await user.click(screen.getByTestId('header-menu-toggle'))
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()

    // 2. Ferme via la sidebar
    await user.click(screen.getByTestId('sidebar-close'))
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
  })
})