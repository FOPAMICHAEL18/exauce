import { render, screen, cleanup, within } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import Testimonials from './Testimonials'

const mockTestimonials = [
  {
    id: 1,
    author: 'Alice Martin',
    rating: 5,
    comment: 'Excellent service, livraison rapide.',
    createdAt: new Date('2026-09-15'),
  },
  {
    id: 2,
    author: 'Bob Dupont',
    rating: 3,
    comment: 'Bon rapport qualité-prix.',
    createdAt: new Date('2026-09-10'),
  },
]

afterEach(() => {
  cleanup()
})

describe('Testimonials', () => {
  // 1. SEO
  it('affiche le titre h2 de la section', () => {
    render(<Testimonials testimonials={mockTestimonials} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /derniers avis clients/i })
    ).toBeInTheDocument()
  })

  // 2. Contrat — auteur et commentaire rendus
  it('affiche auteur et commentaire pour chaque avis', () => {
    render(<Testimonials testimonials={mockTestimonials} />)
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText(/excellent service/i)).toBeInTheDocument()
    expect(screen.getByText('Bob Dupont')).toBeInTheDocument()
    expect(screen.getByText(/bon rapport qualité-prix/i)).toBeInTheDocument()
  })

  // 3. 🎯 LOGIQUE des étoiles — vrai bug à protéger
  it('affiche autant d\'étoiles remplies que la note', () => {
    render(<Testimonials testimonials={mockTestimonials} />)

    // Alice (5/5) → 5 étoiles remplies
    const aliceCard = screen.getByText('Alice Martin').closest('article')!
    const aliceStars = aliceCard.querySelectorAll('svg.fill-\\[\\#D97706\\]')
    // Fallback robuste si la classe ne matche pas :
    const aliceFilled = Array.from(aliceCard.querySelectorAll('svg')).filter(
      (s) => s.classList.contains('fill-[#D97706]')
    )
    expect(aliceFilled).toHaveLength(5)

    // Bob (3/5) → 3 étoiles remplies
    const bobCard = screen.getByText('Bob Dupont').closest('article')!
    const bobFilled = Array.from(bobCard.querySelectorAll('svg')).filter(
      (s) => s.classList.contains('fill-[#D97706]')
    )
    expect(bobFilled).toHaveLength(3)
  })

  // 4. 🎯 Branche limite — rating hors bornes
  it('borne les notes hors plage (0 → 0 étoiles, 6 → 5 étoiles)', () => {
    const outOfRange = [
      { ...mockTestimonials[0], id: 1, rating: 0, author: 'Zero' },
      { ...mockTestimonials[0], id: 2, rating: 6, author: 'Six' },
    ]
    render(<Testimonials testimonials={outOfRange} />)

    const zeroCard = screen.getByText('Zero').closest('article')!
    const zeroFilled = Array.from(zeroCard.querySelectorAll('svg')).filter(
      (s) => s.classList.contains('fill-[#D97706]')
    )
    expect(zeroFilled).toHaveLength(0)

    const sixCard = screen.getByText('Six').closest('article')!
    const sixFilled = Array.from(sixCard.querySelectorAll('svg')).filter(
      (s) => s.classList.contains('fill-[#D97706]')
    )
    expect(sixFilled).toHaveLength(5)
  })

  // 5. 🎯 BUG UX — empty state manquant
  it("affiche un message quand il n'y a aucun avis", () => {
    render(<Testimonials testimonials={[]} />)
    expect(screen.getByText(/aucun avis pour le moment/i)).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })
})