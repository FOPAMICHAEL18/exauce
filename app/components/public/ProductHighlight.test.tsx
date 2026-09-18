import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ProductHighlight from './ProductHighlight'

// Mock next/image → <img> standard (résolution Vite)
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

const mockProducts = [
  {
    id: 1,
    title: 'Chaise bois',
    price: 12000,
    slug: 'chaise-bois',
    category: { name: 'Mobilier' },
    image: [{ url: 'https://example.com/chaise.jpg' }],
  },
  {
    id: 2,
    title: 'Table chêne',
    price: 25000,
    slug: 'table-chene',
    category: null,
    image: [],
  },
]

afterEach(() => {
  cleanup()
})

describe('ProductHighlight', () => {
  // 1. SEO — titre h2 unique
  it('affiche le titre h2 de la section', () => {
    render(<ProductHighlight products={mockProducts} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /produits mis en avant/i })
    ).toBeInTheDocument()
  })

  // 2. Contrat — chaque produit a un lien avec le bon href
  it('génère un lien /Products/:slug par produit', () => {
    render(<ProductHighlight products={mockProducts} />)
    expect(screen.getByRole('link', { name: /chaise bois/i })).toHaveAttribute(
      'href',
      '/Products/chaise-bois'
    )
    expect(screen.getByRole('link', { name: /table chêne/i })).toHaveAttribute(
      'href',
      '/Products/table-chene'
    )
  })

  // 3. Contrat — prix formaté
  it('affiche le prix formaté de chaque produit', () => {
    render(<ProductHighlight products={mockProducts} />)
    expect(screen.getByText('12000 FCFA')).toBeInTheDocument()
    expect(screen.getByText('25000 FCFA')).toBeInTheDocument()
  })

  // 4. 🐛 BUG RÉEL — branche image absente vs présente
  it("affiche un placeholder si l'image est absente, une img sinon", () => {
    render(<ProductHighlight products={mockProducts} />)

    // Chaise a une image → <img>
    const chaiseLink = screen.getByRole('link', { name: /chaise bois/i })
    expect(chaiseLink.querySelector('img')).toBeInTheDocument()

    // Table n'a pas d'image → placeholder text
    const tableLink = screen.getByRole('link', { name: /table chêne/i })
    expect(tableLink.querySelector('img')).not.toBeInTheDocument()
    expect(tableLink).toHaveTextContent(/photo produit — table chêne/i)
  })

  // 5. 🐛 BUG RÉEL — empty state EXCLUSIF (pas de grille)
  it("affiche le message vide à la place de la grille (pas en plus)", () => {
    render(<ProductHighlight products={[]} />)

    // Message visible
    expect(
      screen.getByText(/aucun produit disponible pour le moment/i)
    ).toBeInTheDocument()

    // AUCUN lien produit → la grille n'est pas rendue
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  // 6. Contrat — catégorie fallback si null
  it('affiche "GÉNÉRAL" si le produit n\'a pas de catégorie', () => {
    render(<ProductHighlight products={mockProducts} />)
    expect(screen.getByText('GÉNÉRAL')).toBeInTheDocument()
    expect(screen.getByText('Mobilier')).toBeInTheDocument()
  })
})