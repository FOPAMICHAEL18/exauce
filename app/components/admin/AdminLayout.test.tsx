// app/components/admin/AdminLayout.test.tsx
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import AdminLayout from './AdminLayout'
import userEvent from '@testing-library/user-event'

const mockPush = vi.fn()
let mockPathname = '/Admin/Dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))

// Mock des enfants du layout.
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

// JWT valide décodable par la logique de vérification de AdminLayout.
const mockHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
const mockPayload = btoa(
  JSON.stringify({ id: 1, email: 'admin@test.com', name: 'Admin' }),
)
const mockValidToken = `${mockHeader}.${mockPayload}.signature`

const ProtectedChild = () => (
  <div data-testid="admin-content">Contenu admin protégé</div>
)
const LoginChild = () => (
  <div data-testid="login-content">Formulaire de connexion</div>
)

beforeEach(() => {
  mockPush.mockReset()
  mockPathname = '/Admin/Dashboard'
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

// =========================================================================
// SÉCURITÉ — Pas de flash de contenu admin pendant le chargement
// =========================================================================
describe('AdminLayout — sécurité : loading', () => {
  it("n'expose JAMAIS le contenu admin pendant le chargement de l'auth", () => {
    // On utilise renderToString pour capturer le PREMIER rendu, avant que
    // les useEffect ne s'exécutent. C'est ce que voit l'utilisateur
    // pendant un instant avant que l'auth soit vérifiée.
    localStorage.setItem('adminToken', mockValidToken)

    const html = renderToString(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    // 🔒 Aucun contenu admin ne doit apparaître dans le HTML initial.
    expect(html).not.toContain('admin-content')
    expect(html).not.toContain('admin-sidebar')
    expect(html).not.toContain('admin-header')

    // Un indicateur de chargement est visible.
    expect(html).toContain('role="status"')
    expect(html).toContain('Chargement')
  })
})

// =========================================================================
// SÉCURITÉ — Accès non authentifié
// =========================================================================
describe('AdminLayout — sécurité : non authentifié', () => {
  it('ne rend JAMAIS le contenu admin sans authentification', async () => {
    // Pas de token → isAuthenticated restera false.
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() => {
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
      expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
    })
  })

  it('redirige vers /Admin/Login', async () => {
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
})

// =========================================================================
// SÉCURITÉ — Page /Admin/Login
// =========================================================================
describe('AdminLayout — page login', () => {
  it('affiche le formulaire de login sans layout admin', async () => {
    mockPathname = '/Admin/Login'
    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('login-content')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })

  it('ne déclenche AUCUNE redirection si déjà sur /Admin/Login', async () => {
    mockPathname = '/Admin/Login'
    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('login-content')).toBeInTheDocument(),
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('ne rend pas la sidebar/header admin même avec un token valide', async () => {
    localStorage.setItem('adminToken', mockValidToken)
    mockPathname = '/Admin/Login'
    render(
      <AdminLayout>
        <LoginChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('login-content')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument()
  })
})

// =========================================================================
// Authentifié — accès légitime
// =========================================================================
describe('AdminLayout — authentifié', () => {
  it('affiche le contenu admin avec la sidebar et le header', async () => {
    localStorage.setItem('adminToken', mockValidToken)
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
  })

  it('ne déclenche aucune redirection', async () => {
    localStorage.setItem('adminToken', mockValidToken)
    mockPathname = '/Admin/Dashboard'
    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument(),
    )
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// =========================================================================
// SÉCURITÉ — Session expirée en cours de navigation
// =========================================================================
describe('AdminLayout — sécurité : session expirée', () => {
  it('retire le contenu admin et redirige si le token disparaît', async () => {
    // 1. Utilisateur authentifié.
    localStorage.setItem('adminToken', mockValidToken)
    mockPathname = '/Admin/Dashboard'
    const { rerender } = render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument(),
    )

    // 2. Simule une navigation qui déclenche la re-vérification : on
    // retire le token et on change le pathname pour re-déclencher l'effet.
    localStorage.removeItem('adminToken')
    mockPathname = '/Admin/Dashboard?refresh=1'
    rerender(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    // 🔒 Le contenu admin doit disparaître et la redirection se faire.
    await waitFor(() =>
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument(),
    )
    expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login'),
    )
  })
})

// =========================================================================
// TOGGLE SIDEBAR
// =========================================================================
describe('AdminLayout — toggle sidebar', () => {
  const renderAuthenticated = () => {
    localStorage.setItem('adminToken', mockValidToken)
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

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument(),
    )

    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('header-menu-toggle'))

    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()
  })

  it("ferme la sidebar au clic sur l'overlay", async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument(),
    )

    await user.click(screen.getByTestId('header-menu-toggle'))
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()

    await user.click(screen.getByTestId('sidebar-overlay'))
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
  })

  it('ferme la sidebar au clic sur le bouton Fermer de la sidebar', async () => {
    const user = userEvent.setup()
    renderAuthenticated()

    await waitFor(() =>
      expect(screen.getByTestId('admin-content')).toBeInTheDocument(),
    )

    await user.click(screen.getByTestId('header-menu-toggle'))
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()

    await user.click(screen.getByTestId('sidebar-close'))
    expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
  })
})

describe('AdminLayout — sécurité : token corrompu', () => {
  it('nettoie le token corrompu et redirige vers /Admin/Login', async () => {
    // Un token qui n'a pas la forme d'un JWT (pas de 2e segment).
    localStorage.setItem('adminToken', 'corrompu')
    mockPathname = '/Admin/Dashboard'

    render(
      <AdminLayout>
        <ProtectedChild />
      </AdminLayout>,
    )

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Login'),
    )
    expect(localStorage.getItem('adminToken')).toBeNull()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('nettoie un token dont le payload n’a pas d’id numérique', async () => {
    // Payload JSON valide, mais id manquant : la vérification doit échouer.
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ email: 'x@test.com' }))
    localStorage.setItem('adminToken', `${header}.${payload}.signature`)
    mockPathname = '/Admin/Dashboard'

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
})