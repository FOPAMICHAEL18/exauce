// app/components/auth/LoginForm.test.tsx
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LoginForm } from './LoginForm'
import { useAuth } from '@/app/contexts/AuthContext'

// Mock du router Next.js (utilisé par LoginForm pour rediriger)
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

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
  mockAuth()
})

afterEach(() => {
  cleanup()
})

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  email = 'admin@example.com',
  password = 'password123',
) => {
  await user.type(screen.getByLabelText(/adresse e-mail/i), email)
  await user.type(screen.getByLabelText(/mot de passe/i), password)
}

const submit = () => screen.getByRole('button', { name: /se connecter/i })

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

describe('LoginForm — validation', () => {
  it('affiche une erreur si les deux champs sont vides', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /tous les champs doivent être remplis/i,
    )
  })

  it("affiche une erreur si seul l'email est rempli", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'admin@test.com')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /tous les champs doivent être remplis/i,
    )
  })

  it('affiche une erreur si seul le password est rempli', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/mot de passe/i), 'pass')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /tous les champs doivent être remplis/i,
    )
  })
})

describe('LoginForm — soumission', () => {
  it('appelle login avec email et password trimés', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce({ success: true })
    mockAuth({ login: mockLogin })

    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), '  admin@test.com  ')
    await user.type(screen.getByLabelText(/mot de passe/i), 'pass123')
    await user.click(submit())

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'pass123'),
    )
  })

  it('redirige vers /Admin/Dashboard après succès', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce({ success: true })
    mockAuth({ login: mockLogin })

    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/Admin/Dashboard'),
    )
  })

  it("affiche le message d'erreur de l'API en cas d'échec", async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce({
      success: false,
      message: 'Identifiants incorrects',
    })
    mockAuth({ login: mockLogin })

    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /identifiants incorrects/i,
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("affiche un fallback si l'API échoue SANS message", async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce({ success: false })
    mockAuth({ login: mockLogin })

    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /impossible de vous connecter/i,
    )
  })

  it("efface l'erreur précédente à chaque nouvelle soumission", async () => {
    const mockLogin = vi
      .fn()
      .mockResolvedValueOnce({ success: false, message: 'Première erreur' })
      .mockResolvedValueOnce({ success: true })
    mockAuth({ login: mockLogin })

    const user = userEvent.setup()
    render(<LoginForm />)

    await fillForm(user)
    await user.click(submit())
    await screen.findByRole('alert')

    await user.click(submit())
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    )
  })
})

describe('LoginForm — loading', () => {
  it('désactive le bouton et affiche "Connexion en cours..."', () => {
    mockAuth({ isSubmitting: true })
    render(<LoginForm />)

    const button = screen.getByRole('button', { name: /connexion en cours/i })
    expect(button).toBeDisabled()
  })

  it('désactive les inputs pendant le chargement', () => {
    mockAuth({ isSubmitting: true })
    render(<LoginForm />)

    expect(screen.getByLabelText(/adresse e-mail/i)).toBeDisabled()
    expect(screen.getByLabelText(/mot de passe/i)).toBeDisabled()
  })
})

describe('LoginForm — accessibilité', () => {
  it("lie l'erreur aux champs via aria-describedby", async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce({
      success: false,
      message: 'Oups',
    })
    mockAuth({ login: mockLogin })

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