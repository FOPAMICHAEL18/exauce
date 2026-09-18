import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import CategoriesShowcase from './CategoriesShowcase'

const mockCategories = [
  { id: 1, name: 'Mobilier', slug: 'mobilier' },
  { id: 2, name: 'Décoration', slug: 'decoration' },
  { id: 3, name: 'Éclairage', slug: 'eclairage' },
  { id: 4, name: 'Textile', slug: 'textile' },
]

afterEach(() => {
  cleanup()
})

describe('CategoriesShowcase', () => {
  // ===== Rendu global =====
  it('affiche le titre et le sous-titre', () => {
    render(<CategoriesShowcase categories={mockCategories} />)
    expect(screen.getByText('Parcourir nos catégories')).toBeInTheDocument()
    expect(screen.getByText(/découvrez nos différentes catégories/i)).toBeInTheDocument()
    expect(screen.getByText(/^categories$/i)).toBeInTheDocument()
  })

  it('affiche toutes les catégories fournies', () => {
    render(<CategoriesShowcase categories={mockCategories} />)

    // Chaque catégorie apparaît 2 fois : placeholder + h3
    mockCategories.forEach((cat) => {
      expect(screen.getAllByText(cat.name)).toHaveLength(2)
    })
  })

  it('rend un lien par catégorie', () => {
    render(<CategoriesShowcase categories={mockCategories} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(mockCategories.length)
  })

  // ===== Liens =====
  it('génère le bon href pour chaque catégorie', () => {
    render(<CategoriesShowcase categories={mockCategories} />)
    const links = screen.getAllByRole('link')

    expect(links[0]).toHaveAttribute('href', '/Catalogue?categorie=mobilier')
    expect(links[1]).toHaveAttribute('href', '/Catalogue?categorie=decoration')
    expect(links[2]).toHaveAttribute('href', '/Catalogue?categorie=eclairage')
    expect(links[3]).toHaveAttribute('href', '/Catalogue?categorie=textile')
  })

  it("encode correctement les slugs avec caractères spéciaux", () => {
    const cats = [{ id: 1, name: 'Meubles & Déco', slug: 'meubles-deco' }]
    render(<CategoriesShowcase categories={cats} />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/Catalogue?categorie=meubles-deco'
    )
  })

  // ===== Empty state =====
  it('affiche le message vide si aucune catégorie', () => {
    render(<CategoriesShowcase categories={[]} />)
    expect(screen.getByText(/aucune catégorie disponible/i)).toBeInTheDocument()
  })

  it("n'affiche PAS la grille si aucune catégorie", () => {
    render(<CategoriesShowcase categories={[]} />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('affiche toujours le titre même sans catégories', () => {
    render(<CategoriesShowcase categories={[]} />)
    expect(screen.getByText('Parcourir nos catégories')).toBeInTheDocument()
  })

  // ===== Structure =====
  it('affiche un seul lien pour une seule catégorie', () => {
    render(<CategoriesShowcase categories={[mockCategories[0]]} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/Catalogue?categorie=mobilier')
  })

  it("n'affiche pas l'empty state quand il y a des catégories", () => {
    render(<CategoriesShowcase categories={mockCategories} />)
    expect(screen.queryByText(/aucune catégorie disponible/i)).not.toBeInTheDocument()
  })
})