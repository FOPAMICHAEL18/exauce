import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ContactForm from './ContactForm'

let openSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ name: string; phone: string; email: string; message: string }> = {}
) => {
  const data = {
    name: 'Jean Dupont',
    phone: '+237 699 123 456',
    email: '',
    message: 'Je cherche une chaise en bois.',
    ...overrides,
  }
  await user.type(screen.getByLabelText(/nom complet/i), data.name)
  await user.type(screen.getByLabelText(/téléphone/i), data.phone)
  if (data.email) await user.type(screen.getByLabelText(/e-mail/i), data.email)
  await user.type(screen.getByLabelText(/message/i), data.message)
  return data
}

const submitBtn = () => screen.getByRole('button', { name: /envoyer sur whatsapp/i })

const getWhatsAppUrl = (): string => {
  expect(openSpy).toHaveBeenCalledTimes(1)
  return openSpy.mock.calls[0][0] as string
}

const getDecodedText = (url: string): string =>
  decodeURIComponent(url.split('?text=')[1] ?? '')

describe('ContactForm', () => {
  // ===== Rendu =====
  it('affiche tous les champs et le bouton', () => {
    render(<ContactForm whatsappNumber="+237 699 123 456" />)
    expect(screen.getByLabelText(/nom complet/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(submitBtn()).toBeInTheDocument()
  })

  it('affiche les astérisques pour les champs obligatoires', () => {
    render(<ContactForm whatsappNumber="+237 699 123 456" />)
    const form = document.querySelector('form')!
    // 3 champs obligatoires (* visible uniquement si aria-hidden="true")
    const stars = form.querySelectorAll('[aria-hidden="true"].text-red-500')
    expect(stars.length).toBeGreaterThanOrEqual(3)
  })

  // ===== Succès =====
  it('affiche le message de succès après un envoi valide', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user)
    await user.click(submitBtn())

    expect(await screen.findByRole('status')).toHaveTextContent(
      /votre message a été généré/i
    )
  })

  it('ouvre WhatsApp avec une URL bien formée', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user)
    await user.click(submitBtn())

    const url = getWhatsAppUrl()
    expect(url).toMatch(/^https:\/\/wa\.me\/237699123456\?text=/)
  })

  it('nettoie le numéro WhatsApp (retire les espaces et symboles)', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 (699) 123-456" />)

    await fillForm(user)
    await user.click(submitBtn())

    const url = getWhatsAppUrl()
    expect(url).toContain('wa.me/237699123456')
    expect(url).not.toContain('(')
    expect(url).not.toContain('-')
  })

  it('inclut le nom et le message dans le texte WhatsApp', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { name: 'Alice', message: 'Bonjour, question sur un canapé.' })
    await user.click(submitBtn())

    const text = getDecodedText(getWhatsAppUrl())
    expect(text).toContain('Bonjour, je suis Alice')
    expect(text).toContain('Bonjour, question sur un canapé.')
    expect(text).toContain('📍 Contact :')
  })

  it("inclut l'email dans le message s'il est fourni", async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { email: 'alice@example.com' })
    await user.click(submitBtn())

    const text = getDecodedText(getWhatsAppUrl())
    expect(text).toContain('alice@example.com')
  })

  it("n'inclut pas le séparateur | si l'email est vide", async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { email: '' })
    await user.click(submitBtn())

    const text = getDecodedText(getWhatsAppUrl())
    expect(text).not.toContain('|')
  })

  it('trim les espaces autour des champs', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { name: '  Jean  ', message: '  Salut  ' })
    await user.click(submitBtn())

    const text = getDecodedText(getWhatsAppUrl())
    expect(text).toContain('je suis Jean.')
    expect(text).toContain('\nSalut\n')
  })

  // ===== Guard WhatsApp null =====
  it("affiche une erreur si whatsappNumber est null", async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber={null} />)

    await fillForm(user)
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /contact whatsapp n'est pas disponible/i
    )
    expect(openSpy).not.toHaveBeenCalled()
  })

  it("affiche une erreur si whatsappNumber est vide", async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="" />)

    await fillForm(user)
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /contact whatsapp n'est pas disponible/i
    )
    expect(openSpy).not.toHaveBeenCalled()
  })

  // ===== Validation email =====
  it('affiche une erreur si email invalide', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { email: 'pas-un-email' })
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/email invalide/i)
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('accepte un email valide', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { email: 'valid@test.com' })
    await user.click(submitBtn())

    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // ===== Validation téléphone =====
  it('affiche une erreur si téléphone trop court', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { phone: '123' })
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/téléphone invalide/i)
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('accepte un téléphone avec espaces et symboles', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user, { phone: '+237 (699) 12-34-56' })
    await user.click(submitBtn())

    expect(openSpy).toHaveBeenCalledTimes(1)
  })

  // ===== UX erreur =====
  it("efface l'erreur quand l'utilisateur modifie un champ", async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber={null} />)

    await fillForm(user)
    await user.click(submitBtn())
    await screen.findByRole('alert')

    await user.type(screen.getByLabelText(/nom complet/i), 'X')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // ===== Gestion window.open KO =====
  it("affiche une erreur si window.open lève une exception", async () => {
    const user = userEvent.setup()
    openSpy.mockImplementation(() => {
      throw new Error('Popup blocked')
    })
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user)
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /erreur est survenue lors de l'ouverture/i
    )
  })

  // ===== Structure après succès =====
  it('remplace le formulaire par le message de succès (pas de double envoi)', async () => {
    const user = userEvent.setup()
    render(<ContactForm whatsappNumber="+237 699 123 456" />)

    await fillForm(user)
    await user.click(submitBtn())
    await screen.findByRole('status')

    // Le formulaire est démonté → plus de bouton
    expect(screen.queryByRole('button', { name: /envoyer/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/nom complet/i)).not.toBeInTheDocument()
  })
})