// app/components/admin/AdminProfilForm.test.tsx
import {
  render,
  screen,
  cleanup,
  waitFor,
  act,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminProfileForm, {
  validatePasswordChange,
} from './AdminProfileForm'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockRefresh = vi.fn()
const mockUpdateProfile = vi.fn()
const mockUseProfile = vi.fn()

vi.mock('@/app/hooks/useProfile', () => ({
  useProfile: () => mockUseProfile(),
}))

const defaultProfile = {
  id: 1,
  email: 'admin@test.com',
  name: 'Ouelou',
  surname: 'Jean',
}

const defaultHookValue = {
  data: defaultProfile,
  loading: false,
  error: null,
  success: false,
  updateProfile: mockUpdateProfile,
  refresh: mockRefresh,
}

beforeEach(() => {
  mockPush.mockReset()
  mockRefresh.mockReset()
  mockUpdateProfile.mockReset()
  mockUseProfile.mockReturnValue(defaultHookValue)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const submitBtn = () =>
  screen.getByRole('button', { name: /enregistrer|enregistrement/i })

// =========================================================================
// LOGIQUE PURE — validatePasswordChange
// =========================================================================
describe('validatePasswordChange', () => {
  it("accepte si aucun champ mot de passe n'est rempli", () => {
    expect(
      validatePasswordChange({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    ).toEqual({ ok: true })
  })

  it('rejette si seul currentPassword est rempli (bug fix)', () => {
    expect(
      validatePasswordChange({
        currentPassword: 'oldpass',
        newPassword: '',
        confirmPassword: '',
      })
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/nouveau mot de passe/i),
    })
  })

  it('rejette si newPassword sans currentPassword', () => {
    expect(
      validatePasswordChange({
        currentPassword: '',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      })
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/mot de passe actuel/i),
    })
  })

  it('rejette si newPassword !== confirmPassword', () => {
    expect(
      validatePasswordChange({
        currentPassword: 'old',
        newPassword: 'newpass123',
        confirmPassword: 'different',
      })
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/ne correspondent pas/i),
    })
  })

  it('rejette si newPassword trop court', () => {
    expect(
      validatePasswordChange({
        currentPassword: 'old',
        newPassword: 'abc',
        confirmPassword: 'abc',
      })
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/6 caractères/i),
    })
  })

  it('accepte un changement complet valide', () => {
    expect(
      validatePasswordChange({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      })
    ).toEqual({ ok: true })
  })
})

// =========================================================================
// RENDU
// =========================================================================
describe('AdminProfileForm — rendu', () => {
  it('affiche les champs du profil', () => {
    render(<AdminProfileForm />)
    expect(screen.getByLabelText(/nom \/ pseudo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('affiche les champs de mot de passe', () => {
    render(<AdminProfileForm />)
    expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^nouveau mot de passe$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument()
  })

  it('affiche le skeleton pendant le loading', () => {
    mockUseProfile.mockReturnValue({ ...defaultHookValue, loading: true })
    const { container } = render(<AdminProfileForm />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByLabelText(/nom \/ pseudo/i)).not.toBeInTheDocument()
  })

  it('pré-remplit les champs avec les données du hook', () => {
    render(<AdminProfileForm />)
    expect(screen.getByLabelText(/nom \/ pseudo/i)).toHaveValue('Ouelou')
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('Jean')
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('admin@test.com')
  })

  // 🎯 NOUVEAU — couvre 74-77 (fallbacks `|| ''`)
  it('utilise des valeurs vides si les champs de data sont absents', () => {
    mockUseProfile.mockReturnValue({
      ...defaultHookValue,
      data: {
        id: 1,
        email: null,
        name: null,
        surname: null,
      },
    })
    render(<AdminProfileForm />)

    expect(screen.getByLabelText(/nom \/ pseudo/i)).toHaveValue('')
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('')
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('')
  })

  it("ne plante pas si data est null", () => {
    mockUseProfile.mockReturnValue({
        ...defaultHookValue,
        data: null,
    })
    render(<AdminProfileForm />)

    expect(screen.getByLabelText(/nom \/ pseudo/i)).toHaveValue('')
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('')
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('')
    })
})

// =========================================================================
// SOUMISSION — MODIFICATIONS TEXTE
// =========================================================================
describe('AdminProfileForm — modifications texte', () => {
  it('envoie le payload avec les champs texte modifiés', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/nom \/ pseudo/i))
    await user.type(screen.getByLabelText(/nom \/ pseudo/i), 'NouveauNom')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'NouveauNom',
        surname: 'Jean',
        email: 'admin@test.com',
      })
    )
  })

  it('envoie le payload avec le prénom modifié', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/prénom/i))
    await user.type(screen.getByLabelText(/prénom/i), 'Marie')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Ouelou',
        surname: 'Marie',
        email: 'admin@test.com',
      })
    )
  })

  it('trim les champs avant envoi', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/nom \/ pseudo/i))
    await user.type(screen.getByLabelText(/nom \/ pseudo/i), '  Nouveau  ')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nouveau' })
      )
    )
  })

  it('affiche une erreur si aucune modification', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /aucune modification/i
    )
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })
  it("envoie le payload avec l'email modifié", async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/e-mail/i))
    await user.type(screen.getByLabelText(/e-mail/i), 'nouveau@test.com')
    await user.click(submitBtn())

    await waitFor(() =>
        expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Ouelou',
        surname: 'Jean',
        email: 'nouveau@test.com',
        })
    )
    })
})

// =========================================================================
// SOUMISSION — MOT DE PASSE
// =========================================================================
describe('AdminProfileForm — mot de passe', () => {
  it('envoie les mots de passe si changement', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.type(screen.getByLabelText(/mot de passe actuel/i), 'oldpass')
    await user.type(screen.getByLabelText(/^nouveau mot de passe$/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirmer/i), 'newpass123')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Ouelou',
        surname: 'Jean',
        email: 'admin@test.com',
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      })
    )
  })

  it('rejette si seul le currentPassword est rempli', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.type(screen.getByLabelText(/mot de passe actuel/i), 'oldpass')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /nouveau mot de passe/i
    )
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('rejette si newPassword !== confirmPassword', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.type(screen.getByLabelText(/mot de passe actuel/i), 'old')
    await user.type(screen.getByLabelText(/^nouveau mot de passe$/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirmer/i), 'different')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /ne correspondent pas/i
    )
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('rejette si newPassword trop court', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.type(screen.getByLabelText(/mot de passe actuel/i), 'old')
    await user.type(screen.getByLabelText(/^nouveau mot de passe$/i), 'abc')
    await user.type(screen.getByLabelText(/confirmer/i), 'abc')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/6 caractères/i)
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('rejette si newPassword sans currentPassword', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.type(screen.getByLabelText(/^nouveau mot de passe$/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirmer/i), 'newpass123')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /mot de passe actuel/i
    )
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('vide les champs password après succès', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    mockRefresh.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.type(screen.getByLabelText(/mot de passe actuel/i), 'old')
    await user.type(screen.getByLabelText(/^nouveau mot de passe$/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirmer/i), 'newpass123')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(screen.getByLabelText(/mot de passe actuel/i)).toHaveValue('')
    )
    expect(screen.getByLabelText(/^nouveau mot de passe$/i)).toHaveValue('')
    expect(screen.getByLabelText(/confirmer/i)).toHaveValue('')
  })
})

// =========================================================================
// VALIDATION EMAIL
// =========================================================================
describe('AdminProfileForm — validation email', () => {
  it('rejette un email invalide', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/e-mail/i))
    await user.type(screen.getByLabelText(/e-mail/i), 'pas-un-email')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/email invalide/i)
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  // 🎯 NOUVEAU — couvre la branche court-circuit de `trimmedEmail &&`
  it('accepte un email vide (champ optionnel)', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/e-mail/i))
    await user.clear(screen.getByLabelText(/nom \/ pseudo/i))
    await user.type(screen.getByLabelText(/nom \/ pseudo/i), 'Nouveau')
    await user.click(submitBtn())

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled())
  })
})

// =========================================================================
// ÉTAT LOADING
// =========================================================================
describe('AdminProfileForm — loading', () => {
  it("désactive les inputs et le bouton pendant l'envoi", async () => {
    let resolveUpdate!: (v: boolean) => void
    mockUpdateProfile.mockReturnValueOnce(
      new Promise((r) => {
        resolveUpdate = r
      })
    )
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/nom \/ pseudo/i))
    await user.type(screen.getByLabelText(/nom \/ pseudo/i), 'Nouveau')
    await user.click(submitBtn())

    expect(submitBtn()).toBeDisabled()
    expect(screen.getByLabelText(/nom \/ pseudo/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled()

    await act(async () => {
      resolveUpdate(true)
    })
  })
})

// =========================================================================
// FEEDBACK
// =========================================================================
describe('AdminProfileForm — feedback', () => {
  it("affiche l'erreur du hook", () => {
    mockUseProfile.mockReturnValue({
      ...defaultHookValue,
      error: 'Erreur serveur',
    })
    render(<AdminProfileForm />)
    expect(screen.getByRole('alert')).toHaveTextContent(/erreur serveur/i)
  })

  it('affiche le succès du hook', () => {
    mockUseProfile.mockReturnValue({
      ...defaultHookValue,
      success: true,
    })
    render(<AdminProfileForm />)
    expect(screen.getByRole('status')).toHaveTextContent(
      /mis à jour avec succès/i
    )
  })

  it('cache le succès après 3s', async () => {
    vi.useFakeTimers()
    mockUseProfile.mockReturnValue({ ...defaultHookValue, success: true })
    render(<AdminProfileForm />)

    expect(screen.getByRole('status')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  // 🎯 NOUVEAU — couvre la branche TRUE de `if (successTimerRef.current)` (ligne 84)
  it('nettoie le timer précédent si un nouveau succès arrive', async () => {
    vi.useFakeTimers()
    mockUseProfile.mockReturnValue({ ...defaultHookValue, success: true })
    const { rerender } = render(<AdminProfileForm />)

    expect(screen.getByRole('status')).toBeInTheDocument()

    // Désactive le succès — le timer reste actif
    mockUseProfile.mockReturnValue({ ...defaultHookValue, success: false })
    rerender(<AdminProfileForm />)

    // Réactive le succès → branche TRUE de `if (successTimerRef.current)`
    mockUseProfile.mockReturnValue({ ...defaultHookValue, success: true })
    rerender(<AdminProfileForm />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('appelle refresh après un succès', async () => {
    mockUpdateProfile.mockResolvedValueOnce(true)
    mockRefresh.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/nom \/ pseudo/i))
    await user.type(screen.getByLabelText(/nom \/ pseudo/i), 'Nouveau')
    await user.click(submitBtn())

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it("n'appelle pas refresh si updateProfile échoue", async () => {
    mockUpdateProfile.mockResolvedValueOnce(false)
    const user = userEvent.setup()
    render(<AdminProfileForm />)

    await user.clear(screen.getByLabelText(/nom \/ pseudo/i))
    await user.type(screen.getByLabelText(/nom \/ pseudo/i), 'Nouveau')
    await user.click(submitBtn())

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
    })
})

// =========================================================================
// NAVIGATION
// =========================================================================
describe('AdminProfileForm — navigation', () => {
  it('redirige vers /Admin/Dashboard au clic sur Annuler', async () => {
    const user = userEvent.setup()
    render(<AdminProfileForm />)
    await user.click(screen.getByRole('button', { name: /annuler/i }))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Dashboard')
  })
})