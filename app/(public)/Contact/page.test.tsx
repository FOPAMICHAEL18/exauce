import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import Contact from './page'
import { getCatCont } from '@/app/lib/data'
import ContactCard from '@/app/components/ui/Card/ContactCard'
import ContactForm from '@/app/components/public/ContactForm'
import ContactMap from '@/app/components/public/ContactMap'
import ContactHours from '@/app/components/public/ContactHours'

vi.mock('@/app/lib/data', () => ({
  getCatCont: vi.fn(),
}))

// next/link déjà aliasé dans vitest.config.ts.

vi.mock('@/app/components/ui/Card/ContactCard', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/public/ContactForm', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/public/ContactMap', () => ({
  default: vi.fn(() => null),
}))
vi.mock('@/app/components/public/ContactHours', () => ({
  default: vi.fn(() => null),
}))

// Représente l'objet contact tel que la page l'attend.
function makeContact(overrides: Partial<{
  address: string
  phone: string
  whatsapp: string | null
  email: string
  hours: string | null
  latitude: number | null
  longitude: number | null
}> = {}) {
  return {
    address: '12 rue de la Paix, Douala',
    phone: '+237 6 00 00 00 00',
    whatsapp: '+237 6 11 11 11 11',
    email: 'contact@exauce.com',
    hours: 'Lun-Ven 9h-18h',
    latitude: 4.05,
    longitude: 9.7,
    ...overrides,
  }
}

// Récupère les props du ContactCard dont le `title` matche.
function getCardByTitle(title: string) {
  const call = vi
    .mocked(ContactCard)
    .mock.calls.find((c) => c[0].title === title)
  if (!call) throw new Error(`ContactCard "${title}" non rendu`)
  return call[0]
}

async function renderPage() {
  const jsx = await Contact()
  render(jsx)
}

describe('Page Contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('appelle getCatCont une fois', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact(),
    ] as never)

    await renderPage()

    expect(getCatCont).toHaveBeenCalledTimes(1)
  })

  it('rend les 4 ContactCard quand contactInfo est présent', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact(),
    ] as never)

    await renderPage()

    expect(ContactCard).toHaveBeenCalledTimes(4)
    expect(getCardByTitle('Adresse boutique')).toBeDefined()
    expect(getCardByTitle('Téléphone')).toBeDefined()
    expect(getCardByTitle('WhatsApp')).toBeDefined()
    expect(getCardByTitle('E-mail')).toBeDefined()
  })

  it('encode l’adresse pour Google Maps', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ address: '12 rue de l’Église & Cie' }),
    ] as never)

    await renderPage()

    const card = getCardByTitle('Adresse boutique')
    expect(card.href).toBe(
      `https://maps.google.com/?q=${encodeURIComponent('12 rue de l’Église & Cie')}`,
    )
  })

  it('nettoie les espaces du téléphone pour le href tel:', async () => {
    const phone = '+237 6 00 00 00 00'
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ phone }),
    ] as never)

    await renderPage()

    const card = getCardByTitle('Téléphone')
    expect(card.href).toBe(`tel:${phone.replace(/\s+/g, '')}`)
  })

  it('nettoie les caractères non-numériques du WhatsApp', async () => {
    const whatsapp = '+237 6 11 11 11 11'
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ whatsapp }),
    ] as never)

    await renderPage()

    const card = getCardByTitle('WhatsApp')
    expect(card.href).toBe(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)
  })

  it('construit le mailto: sans transformation', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ email: 'contact@exauce.com' }),
    ] as never)

    await renderPage()

    const card = getCardByTitle('E-mail')
    expect(card.href).toBe('mailto:contact@exauce.com')
  })

  it('propage les bonnes props à ContactForm', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ whatsapp: '+237 6 11 11 11 11' }),
    ] as never)

    await renderPage()

    const calls = vi.mocked(ContactForm).mock.calls
    expect(calls[0]?.[0]).toEqual(
      expect.objectContaining({ whatsappNumber: '+237 6 11 11 11 11' }),
    )
  })

  it('propage latitude/longitude/address à ContactMap', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ latitude: 4.05, longitude: 9.7 }),
    ] as never)

    await renderPage()

    const calls = vi.mocked(ContactMap).mock.calls
    expect(calls[0]?.[0]).toEqual(
      expect.objectContaining({
        latitude: 4.05,
        longitude: 9.7,
        address: '12 rue de la Paix, Douala',
      }),
    )
  })

  it('propage hours à ContactHours', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([
      null,
      makeContact({ hours: 'Lun-Ven 9h-18h' }),
    ] as never)

    await renderPage()

    const calls = vi.mocked(ContactHours).mock.calls
    expect(calls[0]?.[0]).toEqual(
      expect.objectContaining({ hours: 'Lun-Ven 9h-18h' }),
    )
  })

  it('ne rend rien (sauf Breadcrumb + titre) si contactInfo est null', async () => {
    vi.mocked(getCatCont).mockResolvedValueOnce([null, null] as never)

    await renderPage()

    expect(ContactCard).not.toHaveBeenCalled()
    expect(ContactForm).not.toHaveBeenCalled()
    expect(ContactMap).not.toHaveBeenCalled()
    expect(ContactHours).not.toHaveBeenCalled()
  })
})