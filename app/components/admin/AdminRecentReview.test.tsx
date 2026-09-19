// app/components/admin/AdminRecentReview.test.tsx
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import {
  AdminRecentReview,
  clampRating,
  formatReviewDate,
} from './AdminRecentReview'

const mockReview = {
  id: 1,
  author: 'Alice Martin',
  email: 'alice@test.com',
  rating: 4,
  comment: 'Super produit',
  status: 'published',
  product: { title: 'Chaise bois' },
  createdAt: new Date('2026-09-15T10:00:00Z'),
}

afterEach(() => {
  cleanup()
})

// =========================================================================
// LOGIQUE PURE — clampRating
// =========================================================================
describe('clampRating', () => {
  it('retourne la note si elle est entre 0 et 5', () => {
    expect(clampRating(0)).toBe(0)
    expect(clampRating(3)).toBe(3)
    expect(clampRating(5)).toBe(5)
  })

  it('clamp les notes supérieures à 5', () => {
    expect(clampRating(6)).toBe(5)
    expect(clampRating(100)).toBe(5)
  })

  it('clamp les notes négatives à 0', () => {
    expect(clampRating(-1)).toBe(0)
    expect(clampRating(-100)).toBe(0)
  })

  it('arrondit les décimales', () => {
    expect(clampRating(3.4)).toBe(3)
    expect(clampRating(3.6)).toBe(4)
  })

  it('retourne 0 pour NaN ou Infinity', () => {
    expect(clampRating(NaN)).toBe(0)
    expect(clampRating(Infinity)).toBe(0)
  })
})

// =========================================================================
// LOGIQUE PURE — formatReviewDate
// =========================================================================
describe('formatReviewDate', () => {
  it('formate une date valide en français', () => {
    const result = formatReviewDate(new Date('2026-09-15T10:00:00Z'))
    expect(result).toMatch(/sept/)
    expect(result).toContain('2026')
  })

  it('retourne un tiret pour une date invalide', () => {
    expect(formatReviewDate(new Date('invalid'))).toBe('—')
    expect(formatReviewDate('not-a-date')).toBe('—')
  })
})

// =========================================================================
// RENDU
// =========================================================================
describe('AdminRecentReview — rendu', () => {
  it('affiche le message vide si aucune review', () => {
    render(<AdminRecentReview recentReviews={[]} />)
    expect(screen.getByText(/aucun avis récent/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('affiche les informations d\'une review', () => {
    render(<AdminRecentReview recentReviews={[mockReview]} />)
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('Chaise bois')).toBeInTheDocument()
    expect(screen.getByText(/sept/)).toBeInTheDocument()
  })
})

// =========================================================================
// 🎯 BUGS RÉELS — Robustesse aux données corrompues
// =========================================================================
describe('AdminRecentReview — robustesse', () => {
  // 🐛 Bug #1 : Rating > 5 → RangeError
  it('ne crash PAS si rating = 6 (clamp à 5)', () => {
    const corrupted = { ...mockReview, rating: 6 }
    expect(() =>
      render(<AdminRecentReview recentReviews={[corrupted]} />)
    ).not.toThrow()

    // L'étoile doit être clippée à 5
    expect(screen.getByLabelText('Note : 5 sur 5')).toBeInTheDocument()
  })

  // 🐛 Bug #1 bis : Rating négatif → RangeError
  it('ne crash PAS si rating = -1 (clamp à 0)', () => {
    const corrupted = { ...mockReview, rating: -1 }
    expect(() =>
      render(<AdminRecentReview recentReviews={[corrupted]} />)
    ).not.toThrow()

    expect(screen.getByLabelText('Note : 0 sur 5')).toBeInTheDocument()
  })

  // 🐛 Bug #2 : product null
  it('affiche "Produit supprimé" si product est null', () => {
    const orphan = { ...mockReview, product: null }
    render(<AdminRecentReview recentReviews={[orphan]} />)

    expect(screen.getByText('Produit supprimé')).toBeInTheDocument()
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
  })

  // 🐛 Bug #6 : date invalide
  it('affiche un tiret si la date est invalide', () => {
    const corrupted = { ...mockReview, createdAt: 'not-a-date' as unknown as Date }
    render(<AdminRecentReview recentReviews={[corrupted]} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})