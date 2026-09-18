import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import TrustSection, { features } from './TrustSection'

afterEach(() => {
  cleanup()
})

describe('TrustSection', () => {
  // 1. SEO — titre unique de section
  it('affiche le titre h2 de la section', () => {
    render(<TrustSection />)
    expect(
      screen.getByRole('heading', { level: 2, name: /pourquoi nous choisir/i })
    ).toBeInTheDocument()
  })

  // 2. Contrat — chaque feature est rendue avec son titre
  it('rend chaque avantage du tableau avec son titre', () => {
    render(<TrustSection />)
    features.forEach((feature) => {
      expect(
        screen.getByRole('heading', { level: 3, name: feature.title })
      ).toBeInTheDocument()
    })
  })

  // 3. Contrat de données — pas de doublons, pas de trou
  it('expose 4 avantages bien identifiés', () => {
    expect(features).toHaveLength(4)
    const ids = features.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length) // pas de doublon d'id
    features.forEach((f) => {
      expect(f.title.trim().length).toBeGreaterThan(0)
      expect(f.description.trim().length).toBeGreaterThan(0)
    })
  })
})