import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ProductCard from './ProductCard'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

const baseProduct = {
  id: 1,
  title: 'Chaise bois',
  slug: 'chaise-bois',
  price: 12000,
  image: [{ url: 'https://example.com/chaise.jpg' }],
  category: { name: 'Mobilier' },
}

afterEach(() => {
  cleanup()
})

describe('ProductCard', () => {
  // 1. 🎯 CONTRAT BUSINESS — le lien de navigation
  it('génère le bon href vers /Catalogue/:slug', () => {
    render(<ProductCard product={baseProduct} />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/Catalogue/chaise-bois'
    )
  })

  // 2. Contrat — titre + prix affichés
  it('affiche le titre et le prix formaté', () => {
    render(<ProductCard product={baseProduct} />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Chaise bois')
    expect(screen.getByText('12000 FCFA')).toBeInTheDocument()
  })

  // 3. 🎯 Branche — catégorie présente
  it('affiche la catégorie quand elle est fournie', () => {
    render(<ProductCard product={baseProduct} />)
    expect(screen.getByText('Mobilier')).toBeInTheDocument()
  })

  // 4. 🎯 Branche — catégorie absente
  it('affiche "GÉNÉRAL" quand la catégorie est absente', () => {
    render(<ProductCard product={{ ...baseProduct, category: undefined }} />)
    expect(screen.getByText('GÉNÉRAL')).toBeInTheDocument()
  })

  // 5. 🎯 Branche — image présente
  it('affiche l\'image quand elle est fournie', () => {
    render(<ProductCard product={baseProduct} />)
    const img = screen.getByRole('img', { name: /chaise bois/i })
    expect(img).toHaveAttribute('src', 'https://example.com/chaise.jpg')
  })

  // 6. 🎯 Branche — image absente
  it('affiche un placeholder quand l\'image est absente', () => {
    render(<ProductCard product={{ ...baseProduct, image: [] }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/photo produit — chaise bois/i)).toBeInTheDocument()
  })

  // 7. 🎯 Branche limite — image undefined
  it('affiche le placeholder si image est undefined', () => {
    render(<ProductCard product={{ ...baseProduct, image: undefined }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/photo produit/i)).toBeInTheDocument()
  })

  // 8. Prix correctement formaté pour différents montants
  it('formate les prix avec le bon séparateur', () => {
    const { rerender } = render(<ProductCard product={baseProduct} />)
    expect(screen.getByText('12000 FCFA')).toBeInTheDocument()

    rerender(<ProductCard product={{ ...baseProduct, price: 999.99 }} />)
    expect(screen.getByText('1000 FCFA')).toBeInTheDocument()
  })
})