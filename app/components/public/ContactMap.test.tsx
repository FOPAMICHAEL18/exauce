import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ContactMap, { buildMapSrc } from './ContactMap'

// =========================================================================
// LOGIQUE — buildMapSrc
// =========================================================================
describe('buildMapSrc', () => {
  // ===== Avec coordonnées =====
  it('utilise les coordonnées quand les deux sont fournies', () => {
    const url = buildMapSrc(4.0483, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=4.0483,9.7043&z=15&output=embed')
  })

  it('utilise les coordonnées même quand latitude = 0', () => {
    // 🎯 Le bug principal : 0 est falsy, on doit quand même prendre les coordonnées
    const url = buildMapSrc(0, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=0,9.7043&z=15&output=embed')
  })

  it('utilise les coordonnées même quand longitude = 0', () => {
    const url = buildMapSrc(4.0483, 0, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=4.0483,0&z=15&output=embed')
  })

  it('utilise les coordonnées même quand les deux valent 0', () => {
    const url = buildMapSrc(0, 0, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=0,0&z=15&output=embed')
  })

  it('accepte des coordonnées négatives', () => {
    const url = buildMapSrc(-33.8688, 151.2093, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=-33.8688,151.2093&z=15&output=embed')
  })

  // ===== Fallback adresse =====
  it("utilise l'adresse quand latitude est null", () => {
    const url = buildMapSrc(null, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it("utilise l'adresse quand longitude est null", () => {
    const url = buildMapSrc(4.0483, null, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it("utilise l'adresse quand les deux sont undefined", () => {
    const url = buildMapSrc(undefined, undefined, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it("encode l'adresse avec caractères spéciaux", () => {
    const url = buildMapSrc(null, null, 'Rue de l\'Église & Cie, Douala')
    expect(url).toContain(encodeURIComponent("Rue de l'Église & Cie, Douala"))
    expect(url).not.toContain(' ')
    expect(url).not.toContain('&Cie')
  })

  it("trim l'adresse avant encodage", () => {
    const url = buildMapSrc(null, null, '   Rue Test   ')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  // ===== Fallback ultime =====
  it("fallback sur (0,0) si adresse vide", () => {
    const url = buildMapSrc(null, null, '')
    expect(url).toBe('https://maps.google.com/maps?q=0,0&z=2&output=embed')
  })

  it("fallback sur (0,0) si adresse ne contient que des espaces", () => {
    const url = buildMapSrc(null, null, '   \n   ')
    expect(url).toBe('https://maps.google.com/maps?q=0,0&z=2&output=embed')
  })

  it('rejette NaN comme coordonnée', () => {
    const url = buildMapSrc(NaN, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it('rejette Infinity comme coordonnée', () => {
    const url = buildMapSrc(Infinity, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })
})

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