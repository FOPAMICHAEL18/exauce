// app/components/admin/AdminLayout.test.tsx
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import AdminLayout from './AdminLayout'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@/app/contexts/AuthContext'

const mockPush = vi.fn()
let mockPathname = '/Admin/Dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../layout/AdminSidebar', () => ({
  default: ({ onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="admin-sidebar">
      Sidebar
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
      <button data-testid="header-menu-toggle" onClick={onMenuToggle}>
        Menu
      </button>
    </div>
  ),
}))

const ProtectedChild = () => (
  <div data-testid="admin-content">Contenu admin protégé</div>
)
const LoginChild = () => (
  <div data-testid="login-content">Formulaire de connexion</div>
)

function mockAuth(
  overrides: Partial<ReturnType<typeof useAuth>> = {},
): void {
  vi.mocked(useAuth).mockReturnValue({
    admin: null,
    isAuthenticated: false,
    loading: false,
    isSubmitting: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  mockPush.mockReset()
  mockPathname = '/Admin/Dashboard'
  mockAuth()
})

afterEach(() => {
  cleanup()
})

// Sécurité : pas de flash de contenu admin pendant le chargement
describe('AdminLayout — sécurité : loading', () => {
  it("n'expose JAMAIS le contenu admin pendant le chargement de l'auth", () => {
    mockAuth({ loading: true, isAuthenticated: true })

    const html = renderToString(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    expect(html).not.toContain('admin-content')
    expect(html).not.toContain('admin-sidebar')
    expect(html).not.toContain('admin-header')

    expect(html).toContain('role="status"')
    expect(html).toContain('Chargement')
  })
})

// Sécurité : accès non authentifié
describe('AdminLayout — sécurité : non authentifié', () => {
  it('ne rend JAMAIS le contenu admin sans authentification', () => {
    mockAuth({ loading: false, isAuthenticated: false })
    mockPathname = '/Admin/Dashboard'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })

  it('redirige vers /Admin/Login', async () => {
    mockAuth({ loading: false, isAuthenticated: false })
    mockPathname = '/Admin/Dashboard'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login'),
    )
  })

  it('redirige même depuis une sous-route profonde', async () => {
    mockAuth({ loading: false, isAuthenticated: false })
    mockPathname = '/Admin/Products/123/Edit'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login'),
    )
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('ne redirige pas tant que loading est true', async () => {
    mockAuth({ loading: true, isAuthenticated: false })
    mockPathname = '/Admin/Dashboard'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// Sécurité : page /Admin/Login
describe('AdminLayout — page login', () => {
  it('affiche le formulaire de login sans layout admin', () => {
    mockAuth({ loading: false, isAuthenticated: false })
    mockPathname = '/Admin/Login'

    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>,
    )

    expect(screen.getByTestId('login-content')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })

  it('ne déclenche AUCUNE redirection si déjà sur /Admin/Login', async () => {
    mockAuth({ loading: false, isAuthenticated: false })
    mockPathname = '/Admin/Login'

    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>,
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('ne rend pas la sidebar/header admin même si isAuthenticated = true', () => {
    mockAuth({ loading: false, isAuthenticated: true })
    mockPathname = '/Admin/Login'

    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>,
    )

    expect(screen.getByTestId('login-content')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })
})

// Authentifié : accès légitime
describe('AdminLayout — authentifié', () => {
  it('affiche le contenu admin avec la sidebar et le header', () => {
    mockAuth({ loading: false, isAuthenticated: true })
    mockPathname = '/Admin/Dashboard'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
  })

  it('ne déclenche aucune redirection', async () => {
    mockAuth({ loading: false, isAuthenticated: true })
    mockPathname = '/Admin/Dashboard'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// Sécurité : session expirée en cours de navigation
describe('AdminLayout — sécurité : session expirée', () => {
  it('retire le contenu admin et redirige si isAuthenticated devient false', async () => {
    // 1. Utilisateur authentifié
    mockAuth({ loading: false, isAuthenticated: true })
    mockPathname = '/Admin/Dashboard'

    const { rerender } = render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()

    // 2. Session expirée : on change le mock et on re-render
    mockAuth({ loading: false, isAuthenticated: false })
    rerender(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login'),
    )
  })
})

// Toggle sidebar
describe('AdminLayout — toggle sidebar', () => {
  const renderAuthenticated = () => {
    mockAuth({ loading: false, isAuthenticated: true })
    mockPathname = '/Admin/Dashboard'
    return render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )
  }

  it('ouvre la sidebar au clic sur le bouton du header', async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('header-menu-toggle'))

    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()
  })

  it("ferme la sidebar au clic sur l'overlay", async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await user.click(screen.getByTestId('header-menu-toggle'))
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()

    await user.click(screen.getByTestId('sidebar-overlay'))
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
  })

  it('ferme la sidebar au clic sur le bouton Fermer de la sidebar', async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await user.click(screen.getByTestId('header-menu-toggle'))
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()

    await user.click(screen.getByTestId('sidebar-close'))
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
  })
})