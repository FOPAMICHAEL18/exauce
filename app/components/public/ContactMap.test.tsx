import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ContactMap, { buildMapSrc } from './ContactMap'


// =========================================================================
// RENDU
// =========================================================================
describe('ContactMap — rendu', () => {
  it('affiche une iframe', () => {
    render(<ContactMap latitude={4.0483} longitude={9.7043} address="Rue Test" />)
    expect(screen.getByTitle(/localisation de la boutique/i)).toBeInTheDocument()
  })

  it("l'iframe a le bon src (avec coordonnées)", () => {
    render(<ContactMap latitude={4.0483} longitude={9.7043} address="Rue Test" />)
    const iframe = screen.getByTitle(/localisation de la boutique/i)
    expect(iframe).toHaveAttribute(
      'src',
      'https://maps.google.com/maps?q=4.0483,9.7043&z=15&output=embed'
    )
  })

  it("l'iframe a le bon src (fallback adresse)", () => {
    render(<ContactMap latitude={null} longitude={null} address="Rue Test" />)
    const iframe = screen.getByTitle(/localisation de la boutique/i)
    expect(iframe).toHaveAttribute(
      'src',
      'https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed'
    )
  })

  it("l'iframe est en lazy loading", () => {
    render(<ContactMap latitude={4.0483} longitude={9.7043} address="Rue Test" />)
    const iframe = screen.getByTitle(/localisation de la boutique/i)
    expect(iframe).toHaveAttribute('loading', 'lazy')
  })

  it("l'iframe n'a pas de border", () => {
    render(<ContactMap latitude={4.0483} longitude={9.7043} address="Rue Test" />)
    const iframe = screen.getByTitle(/localisation de la boutique/i)
    expect(iframe).toHaveClass('border-0')
  })

  // ===== Props optionnelles =====
  it('fonctionne sans latitude ni longitude (props undefined)', () => {
    render(<ContactMap address="Rue Test" />)
    const iframe = screen.getByTitle(/localisation de la boutique/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('Rue%20Test'))
  })

  it("affiche le fallback monde si rien n'est fourni", () => {
    render(<ContactMap address="" />)
    const iframe = screen.getByTitle(/localisation de la boutique/i)
    expect(iframe).toHaveAttribute(
      'src',
      'https://maps.google.com/maps?q=0,0&z=2&output=embed'
    )
  })
})