import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import ContactHours from './ContactHours'

afterEach(() => {
  cleanup()
})

describe('ContactHours', () => {
  // ===== Rendu de base =====
  it('affiche toujours le titre "Horaires d\'ouverture"', () => {
    render(<ContactHours hours="Lun-Ven : 9h-18h" />)
    expect(screen.getByText(/horaires d'ouverture/i)).toBeInTheDocument()
  })

  it('affiche les horaires fournis', () => {
    render(<ContactHours hours="Lun-Ven : 9h-18h" />)
    expect(screen.getByText('Lun-Ven : 9h-18h')).toBeInTheDocument()
  })

  // ===== Multi-lignes =====
  it('préserve les retours à la ligne (whitespace-pre-line)', () => {
    const multiLine = 'Lun-Ven : 9h-18h\nSam : 10h-14h\nDim : Fermé'
    render(<ContactHours hours={multiLine} />)

    const paragraph = screen.getByText(/Lun-Ven/)
    expect(paragraph).toHaveTextContent('Lun-Ven : 9h-18h')
    expect(paragraph).toHaveTextContent('Sam : 10h-14h')
    expect(paragraph).toHaveTextContent('Dim : Fermé')
    // Le contenu est sur une seule balise <p>, les sauts viennent du CSS
    expect(paragraph.tagName).toBe('P')
  })

  // ===== Empty states =====
  it('affiche un message si hours est null', () => {
    render(<ContactHours hours={null} />)
    expect(screen.getByText(/horaires non communiqués/i)).toBeInTheDocument()
  })

  it('affiche un message si hours est une chaîne vide', () => {
    render(<ContactHours hours="" />)
    expect(screen.getByText(/horaires non communiqués/i)).toBeInTheDocument()
  })

  it('affiche un message si hours ne contient que des espaces', () => {
    render(<ContactHours hours={"   \n   "} />)
    expect(screen.getByText(/horaires non communiqués/i)).toBeInTheDocument()
  })

  it("n'affiche PAS les horaires vides dans le paragraphe principal", () => {
    render(<ContactHours hours={null} />)
    // Il ne doit y avoir QUE le paragraphe de fallback
    const paragraphs = screen.getAllByText(/./, { selector: 'p' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toHaveTextContent(/horaires non communiqués/i)
  })

  // ===== Trim =====
  it('trim les espaces superflus autour des horaires', () => {
    render(<ContactHours hours="   Lun-Ven : 9h-18h   " />)
    const paragraph = screen.getByText(/Lun-Ven/)
    expect(paragraph).toHaveTextContent('Lun-Ven : 9h-18h')
    expect(paragraph.textContent?.startsWith(' ')).toBe(false)
    expect(paragraph.textContent?.endsWith(' ')).toBe(false)
  })

  // ===== A11y =====
  it('marque l\'icône Clock comme décorative (aria-hidden)', () => {
    const { container } = render(<ContactHours hours="Lun-Ven : 9h-18h" />)
    const clockSvg = container.querySelector('svg')
    expect(clockSvg).toHaveAttribute('aria-hidden', 'true')
  })

  it('lie le titre au conteneur via aria-labelledby', () => {
    const { container } = render(<ContactHours hours="Lun-Ven : 9h-18h" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveAttribute('aria-labelledby', 'contact-hours-title')

    const title = container.querySelector('#contact-hours-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent(/horaires d'ouverture/i)
  })

  // ===== Sémantique =====
  it('utilise une balise <h3> pour le titre', () => {
    render(<ContactHours hours="Lun-Ven : 9h-18h" />)
    expect(
      screen.getByRole('heading', { level: 3, name: /horaires d'ouverture/i })
    ).toBeInTheDocument()
  })
})