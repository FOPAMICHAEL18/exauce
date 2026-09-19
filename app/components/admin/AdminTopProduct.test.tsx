// app/components/admin/AdminTopProduct.test.tsx
import { render, screen, cleanup, within } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { AdminTopProduct } from './AdminTopProduct'

const mockProducts = [
  {
    id: 1,
    title: 'Chaise bois',
    _count: { review: 12 },
    category: { name: 'Mobilier' },
  },
  {
    id: 2,
    title: 'Lampe design',
    _count: { review: 8 },
    category: { name: 'Éclairage' },
  },
]

afterEach(() => {
  cleanup()
})

describe('AdminTopProduct', () => {
  // 🎯 Test 1 — Branche "vide" du ternaire
  it('affiche le message vide si aucun produit', () => {
    render(<AdminTopProduct topProducts={[]} />)
    expect(screen.getByText(/aucun produit disponible/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  // 🎯 Test 2 — Branche "remplie" du ternaire
  it('affiche le tableau avec les produits', () => {
    render(<AdminTopProduct topProducts={mockProducts} />)

    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(within(table).getByText('Chaise bois')).toBeInTheDocument()
    expect(within(table).getByText('Mobilier')).toBeInTheDocument()
    expect(within(table).getByText('12')).toBeInTheDocument()
  })

  // 🎯 Test 3 — Robustesse category null
  it('affiche "Sans catégorie" si category est null', () => {
    const orphan = [{ ...mockProducts[0], category: null }]
    render(<AdminTopProduct topProducts={orphan} />)
    expect(screen.getByText('Sans catégorie')).toBeInTheDocument()
    expect(screen.getByText('Chaise bois')).toBeInTheDocument()
  })

  // 🎯 Test 4 — Robustesse _count null
  it('affiche 0 si _count est null', () => {
    const corrupted = [{ ...mockProducts[0], _count: null }]
    render(<AdminTopProduct topProducts={corrupted} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})