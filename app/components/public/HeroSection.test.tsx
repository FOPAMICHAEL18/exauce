import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import HeroSection from './HeroSection'


afterEach(() => {
  cleanup()
})

describe('HeroSection', () => {
  // ===== Rendu de base =====
  it('affiche le badge "ARRIVAGES DIRECTS"', () => {
    render(<HeroSection />)
    expect(screen.getByText(/arrivages directs de chine/i)).toBeInTheDocument()
  })

  it('affiche le titre principal (h1)', () => {
    render(<HeroSection />)
    expect(
      screen.getByRole('heading', { level: 1, name: /produits & articles de qualité/i })
    ).toBeInTheDocument()
  })

  it('affiche le paragraphe de description', () => {
    render(<HeroSection />)
    expect(screen.getByText(/explorez notre catalogue/i)).toBeInTheDocument()
  })

  // ===== Liens =====
  it('affiche le CTA "Explorez le catalogue"', () => {
    render(<HeroSection />)
    const link = screen.getByRole('link', { name: /explorez le catalogue/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/Catalogue')
  })

  it('affiche le CTA "Nous contacter"', () => {
    render(<HeroSection />)
    const link = screen.getByRole('link', { name: /nous contacter/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/Contact')
  })

  it('affiche exactement 2 liens', () => {
    render(<HeroSection />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  // ===== Image =====
  it("affiche l'image hero avec un alt non vide", () => {
    render(<HeroSection />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt')
    expect(img.getAttribute('alt')?.length).toBeGreaterThan(0)
  })

  it("l'image hero pointe vers Unsplash", () => {
    render(<HeroSection />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toMatch(/images\.unsplash\.com/)
  })

  // ===== Sémantique =====
  it('utilise une balise <section> comme conteneur racine', () => {
    const { container } = render(<HeroSection />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it("n'a qu'un seul h1 (règle SEO)", () => {
    render(<HeroSection />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})