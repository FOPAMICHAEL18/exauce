// app/components/auth/LoginForm.test.tsx
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LoginForm } from './LoginForm'

// 🎯 Mock de useAuth
const mockLogin = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

beforeEach(() => {
  mockLogin.mockReset()
  mockUseAuth.mockReturnValue({
    login: mockLogin,
    loading: false,
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  })
})

afterEach(() => {
  cleanup()
})

// Helper
const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  email = 'admin@example.com',
  password = 'password123'
) => {
  await user.type(screen.getByLabelText(/adresse e-mail/i), email)
  await user.type(screen.getByLabelText(/mot de passe/i), password)
}

const submit = () => screen.getByRole('button', { name: /se connecter/i })

// =========================================================================
// RENDU
// =========================================================================
describe('LoginForm — rendu', () => {
  it('affiche les champs email, password et le bouton', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(submit()).toBeInTheDocument()
  })

  it("n'affiche aucune erreur au démarrage", () => {
    render(<LoginForm />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// =========================================================================
// VALIDATION CLIENT
// =========================================================================
describe('LoginForm — validation', () => {
  it('affiche une erreur si les deux champs sont vides', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /tous les champs doivent être remplis/i
    )
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('affiche une erreur si seul l\'email est rempli', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'admin@test.com')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /tous les champs doivent être remplis/i
    )
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('affiche une erreur si seul le password est rempli', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/mot de passe/i), 'pass')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /tous les champs doivent être remplis/i
    )
    expect(mockLogin).not.toHaveBeenCalled()
  })
})

// =========================================================================
// SOUMISSION
// =========================================================================
describe('LoginForm — soumission', () => {
  it('appelle login avec email et password trimés', async () => {
    mockLogin.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), '  admin@test.com  ')
    await user.type(screen.getByLabelText(/mot de passe/i), 'pass123')
    await user.click(submit())

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'pass123')
    )
  })

  // 🎯 FIX CRITIQUE — échec sans message → doit afficher le fallback
  it("affiche le message d'erreur de l'API en cas d'échec", async () => {
    mockLogin.mockResolvedValueOnce({ success: false, message: 'Identifiants incorrects' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(/identifiants incorrects/i)
  })

  // 🎯 LE test qui attrape le bug silencieux
  it("affiche un fallback si l'API échoue SANS message", async () => {
    mockLogin.mockResolvedValueOnce({ success: false })   // 👈 pas de message
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /impossible de vous connecter/i
    )
  })

  it("efface l'erreur précédente à chaque nouvelle soumission", async () => {
    mockLogin
      .mockResolvedValueOnce({ success: false, message: 'Première erreur' })
      .mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())
    await screen.findByRole('alert')

    // Nouvelle soumission → l'erreur doit disparaître
    await user.click(submit())
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    )
  })
})

// =========================================================================
// ÉTAT LOADING
// =========================================================================
describe('LoginForm — loading', () => {
  it('désactive le bouton et affiche "Connexion en cours..."', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      loading: true,
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    })
    render(<LoginForm />)

    const button = screen.getByRole('button', { name: /connexion en cours/i })
    expect(button).toBeDisabled()
  })

  it('désactive les inputs pendant le chargement', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      loading: true,
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    })
    render(<LoginForm />)

    expect(screen.getByLabelText(/adresse e-mail/i)).toBeDisabled()
    expect(screen.getByLabelText(/mot de passe/i)).toBeDisabled()
  })
})

// =========================================================================
// A11Y
// =========================================================================
describe('LoginForm — accessibilité', () => {
  it('lie l\'erreur aux champs via aria-describedby', async () => {
    mockLogin.mockResolvedValueOnce({ success: false, message: 'Oups' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())

    const alert = await screen.findByRole('alert')
    const emailInput = screen.getByLabelText(/adresse e-mail/i)
    expect(emailInput).toHaveAttribute('aria-describedby', alert.id)
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  })
})