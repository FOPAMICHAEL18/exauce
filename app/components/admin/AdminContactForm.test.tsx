// app/components/admin/AdminContactForm.test.tsx
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminContactForm, { parseGpsInput, parseHours } from './AdminContactForm'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../ui/Map', () => ({
  default: ({ latitude, longitude, address }: {
    latitude: number
    longitude: number
    address: string
  }) => (
    <div data-testid="mock-map">
      Map {latitude},{longitude} - {address}
    </div>
  ),
}))

const mockUpdateContact = vi.fn()
const mockRefresh = vi.fn()
const mockUseContact = vi.fn()

vi.mock('@/app/hooks/useContact', () => ({
  useContact: () => mockUseContact(),
}))

const defaultHookValue = {
  data: null,
  loading: false,
  error: null,
  success: false,
  updateContact: mockUpdateContact,
  refresh: mockRefresh,
}

beforeEach(() => {
  mockPush.mockReset()
  mockUpdateContact.mockReset()
  mockRefresh.mockReset()
  mockUseContact.mockReturnValue(defaultHookValue)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// =========================================================================
// LOGIQUE PURE — parseGpsInput
// =========================================================================
describe('parseGpsInput', () => {
  it('extrait latitude et longitude', () => {
    expect(parseGpsInput('4.0483° N, 9.7043° E')).toEqual({
      latitude: 4.0483,
      longitude: 9.7043,
    })
  })

  it('retourne null, null si vide', () => {
    expect(parseGpsInput('')).toEqual({ latitude: null, longitude: null })
    expect(parseGpsInput('   ')).toEqual({ latitude: null, longitude: null })
  })

  it('retourne null, null si moins de 2 nombres', () => {
    expect(parseGpsInput('Paris')).toEqual({ latitude: null, longitude: null })
    expect(parseGpsInput('123')).toEqual({ latitude: null, longitude: null })
  })

  it('rejette les coordonnées hors bornes', () => {
    expect(parseGpsInput('999, 50')).toEqual({ latitude: null, longitude: null })
    expect(parseGpsInput('45, 999')).toEqual({ latitude: null, longitude: null })
  })

  it('accepte les coordonnées négatives', () => {
    expect(parseGpsInput('-33.8688, 151.2093')).toEqual({
      latitude: -33.8688,
      longitude: 151.2093,
    })
  })
})

// =========================================================================
// LOGIQUE PURE — parseHours
// =========================================================================
describe('parseHours', () => {
  it('retourne les valeurs par défaut si format inconnu', () => {
    expect(parseHours('random')).toEqual({
      weekday: '08:00 – 18:00',
      saturday: '09:00 – 15:00',
      sunday: 'Fermé',
    })
  })

  it('parse un format complet', () => {
    const input =
      'Lundi – Vendredi: 09:00 – 19:00\nSamedi: 10:00 – 14:00\nDimanche: Fermé'
    expect(parseHours(input)).toEqual({
      weekday: '09:00 – 19:00',
      saturday: '10:00 – 14:00',
      sunday: 'Fermé',
    })
  })

  it('parse un format partiel (lundi seulement)', () => {
    const input = 'Lundi – Vendredi: 10:00 – 20:00'
    const result = parseHours(input)
    expect(result.weekday).toBe('10:00 – 20:00')
    expect(result.saturday).toBe('09:00 – 15:00')
  })
})

// =========================================================================
// RENDU
// =========================================================================
describe('AdminContactForm — rendu', () => {
  it('affiche les champs du formulaire', () => {
    render(<AdminContactForm />)
    expect(screen.getByLabelText(/adresse de l'atelier/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/coordonnées gps/i)).toBeInTheDocument()
  })

  it('affiche un skeleton si loading', () => {
    mockUseContact.mockReturnValue({ ...defaultHookValue, loading: true })
    const { container } = render(<AdminContactForm />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByLabelText(/adresse/i)).not.toBeInTheDocument()
  })

  it('pré-remplit les champs avec les données du hook', () => {
    mockUseContact.mockReturnValue({
      ...defaultHookValue,
      data: {
        address: 'Rue Test',
        phone: '+237 699 123 456',
        whatsapp: '+237 699 123 456',
        email: 'test@test.com',
        latitude: 4.0483,
        longitude: 9.7043,
        hours: 'Lundi – Vendredi: 09:00 – 19:00\nSamedi: 10:00 – 14:00',
      },
    })
    render(<AdminContactForm />)

    expect(screen.getByLabelText(/adresse/i)).toHaveValue('Rue Test')
    expect(screen.getByLabelText(/téléphone/i)).toHaveValue('+237 699 123 456')
    expect(screen.getByLabelText(/lundi – vendredi/i)).toHaveValue('09:00 – 19:00')
  })

  it("gère un data sans coordonnées GPS (branche else du useEffect)", () => {
    mockUseContact.mockReturnValue({
      ...defaultHookValue,
      data: {
        address: 'Rue Test',
        phone: '+237 699 123 456',
        whatsapp: '+237 699 123 456',
        email: 'test@test.com',
        latitude: null,
        longitude: null,
        hours: 'Lundi – Vendredi: 09:00 – 19:00',
      },
    })
    render(<AdminContactForm />)

    expect(screen.getByLabelText(/coordonnées gps/i)).toHaveValue('')
    expect(screen.getByText(/carte — location actuelle/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mock-map')).not.toBeInTheDocument()
  })

  // 🎯 NOUVEAU — couvre 88-91 + 103
  it('utilise des valeurs vides si data ne contient pas les champs', () => {
    mockUseContact.mockReturnValue({
      ...defaultHookValue,
      data: {
        address: null,
        phone: null,
        whatsapp: null,
        email: null,
        latitude: null,
        longitude: null,
        hours: null,
      },
    })
    render(<AdminContactForm />)

    expect(screen.getByLabelText(/adresse/i)).toHaveValue('')
    expect(screen.getByLabelText(/téléphone/i)).toHaveValue('')
    expect(screen.getByLabelText(/whatsapp/i)).toHaveValue('')
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('')

    // Horaires → valeurs par défaut conservées
    expect(screen.getByLabelText(/lundi – vendredi/i)).toHaveValue('08:00 – 18:00')
    expect(screen.getByLabelText(/samedi/i)).toHaveValue('09:00 – 15:00')
    expect(screen.getByLabelText(/dimanche/i)).toHaveValue('Fermé')
  })
})

// =========================================================================
// INPUTS
// =========================================================================
describe('AdminContactForm — inputs', () => {
  it('met à jour le champ WhatsApp à la saisie', async () => {
    const user = userEvent.setup()
    render(<AdminContactForm />)

    const whatsappInput = screen.getByLabelText(/whatsapp/i)
    expect(whatsappInput).toHaveValue('')
    await user.type(whatsappInput, '+237 699 999 999')
    expect(whatsappInput).toHaveValue('+237 699 999 999')
  })

  it("met à jour les 3 champs d'horaires à la saisie", async () => {
    const user = userEvent.setup()
    render(<AdminContactForm />)

    const weekdayInput = screen.getByLabelText(/lundi – vendredi/i)
    await user.clear(weekdayInput)
    await user.type(weekdayInput, '07:00 – 20:00')
    expect(weekdayInput).toHaveValue('07:00 – 20:00')

    const saturdayInput = screen.getByLabelText(/samedi/i)
    await user.clear(saturdayInput)
    await user.type(saturdayInput, '08:00 – 16:00')
    expect(saturdayInput).toHaveValue('08:00 – 16:00')

    const sundayInput = screen.getByLabelText(/dimanche/i)
    await user.clear(sundayInput)
    await user.type(sundayInput, '10:00 – 12:00')
    expect(sundayInput).toHaveValue('10:00 – 12:00')
  })
})

// =========================================================================
// GPS
// =========================================================================
describe('AdminContactForm — GPS', () => {
  it('affiche la carte quand GPS valide', async () => {
    const user = userEvent.setup()
    render(<AdminContactForm />)
    await user.type(screen.getByLabelText(/coordonnées gps/i), '4.0483, 9.7043')
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
  })

  it('affiche le placeholder si GPS invalide', async () => {
    const user = userEvent.setup()
    render(<AdminContactForm />)
    await user.type(screen.getByLabelText(/coordonnées gps/i), 'Paris')
    expect(screen.queryByTestId('mock-map')).not.toBeInTheDocument()
    expect(screen.getByText(/carte — location actuelle/i)).toBeInTheDocument()
  })
})

// =========================================================================
// SOUMISSION
// =========================================================================
describe('AdminContactForm — soumission', () => {
  it('envoie le payload formaté à updateContact', async () => {
    mockUpdateContact.mockResolvedValueOnce(true)
    mockRefresh.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AdminContactForm />)

    await user.type(screen.getByLabelText(/adresse/i), 'Rue Test')
    await user.type(screen.getByLabelText(/téléphone/i), '+237 699 123 456')
    await user.type(screen.getByLabelText(/e-mail/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() =>
      expect(mockUpdateContact).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'Rue Test',
          phone: '+237 699 123 456',
          email: 'test@test.com',
          hours: expect.stringContaining('Lundi – Vendredi: 08:00 – 18:00'),
        })
      )
    )
  })

  it('appelle refresh après succès', async () => {
    mockUpdateContact.mockResolvedValueOnce(true)
    mockRefresh.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AdminContactForm />)

    await user.type(screen.getByLabelText(/adresse/i), 'Test')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it("n'appelle pas refresh si échec", async () => {
    mockUpdateContact.mockResolvedValueOnce(false)
    const user = userEvent.setup()
    render(<AdminContactForm />)

    await user.type(screen.getByLabelText(/adresse/i), 'Test')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(mockUpdateContact).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('désactive les inputs pendant la soumission', async () => {
    let resolveUpdate!: (v: boolean) => void
    mockUpdateContact.mockReturnValueOnce(
      new Promise((r) => {
        resolveUpdate = r
      })
    )
    const user = userEvent.setup()
    render(<AdminContactForm />)

    await user.type(screen.getByLabelText(/adresse/i), 'Test')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    expect(screen.getByLabelText(/adresse/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /enregistrement/i })).toBeDisabled()

    await act(async () => {
      resolveUpdate(true)
    })
  })

  it('convertit whatsapp vide en null', async () => {
    mockUpdateContact.mockResolvedValueOnce(true)
    mockRefresh.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AdminContactForm />)

    await user.type(screen.getByLabelText(/adresse/i), 'Rue Test')
    await user.type(screen.getByLabelText(/téléphone/i), '+237 699 123 456')
    await user.type(screen.getByLabelText(/e-mail/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() =>
      expect(mockUpdateContact).toHaveBeenCalledWith(
        expect.objectContaining({ whatsapp: null })
      )
    )
  })
})

// =========================================================================
// FEEDBACK
// =========================================================================
describe('AdminContactForm — feedback', () => {
  it("affiche l'erreur du hook", () => {
    mockUseContact.mockReturnValue({
      ...defaultHookValue,
      error: 'Erreur serveur',
    })
    render(<AdminContactForm />)
    expect(screen.getByRole('alert')).toHaveTextContent(/erreur serveur/i)
  })

  it('affiche le succès du hook', () => {
    mockUseContact.mockReturnValue({
      ...defaultHookValue,
      success: true,
    })
    render(<AdminContactForm />)
    expect(screen.getByRole('status')).toHaveTextContent(/mises à jour avec succès/i)
  })

  it('cache le succès après 3s', async () => {
    vi.useFakeTimers()
    mockUseContact.mockReturnValue({ ...defaultHookValue, success: true })
    render(<AdminContactForm />)

    expect(screen.getByRole('status')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  // 🎯 NOUVEAU — couvre ligne 116
  it('nettoie le timer précédent si un nouveau succès arrive', async () => {
    vi.useFakeTimers()
    mockUseContact.mockReturnValue({ ...defaultHookValue, success: true })
    const { rerender } = render(<AdminContactForm />)

    expect(screen.getByRole('status')).toBeInTheDocument()

    // 1. Désactive le succès → le timer reste actif
    mockUseContact.mockReturnValue({ ...defaultHookValue, success: false })
    rerender(<AdminContactForm />)

    // 2. Nouveau succès → clearTimeout du timer précédent (ligne 116)
    mockUseContact.mockReturnValue({ ...defaultHookValue, success: true })
    rerender(<AdminContactForm />)

    // Nettoyage
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
  })
})

// =========================================================================
// NAVIGATION
// =========================================================================
describe('AdminContactForm — navigation', () => {
  it('redirige vers /Admin/Dashboard au clic sur Annuler', async () => {
    const user = userEvent.setup()
    render(<AdminContactForm />)
    await user.click(screen.getByRole('button', { name: /annuler/i }))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Dashboard')
  })
})