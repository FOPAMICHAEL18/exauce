import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ProductImageGallery from './ProductImageGallery'

vi.mock('next/image', () => ({
  default: ({ fill, priority, sizes, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

const mockImages = [
  { url: 'https://example.com/img1.jpg' },
  { url: 'https://example.com/img2.jpg' },
  { url: 'https://example.com/img3.jpg' },
]

afterEach(() => {
  cleanup()
})

describe('ProductImageGallery', () => {
  // ===== Rendu de base =====
  it("affiche la première image par défaut", () => {
    render(<ProductImageGallery images={mockImages} title="Chaise bois" />)
    const mainImage = screen.getAllByRole('img')[0]
    expect(mainImage).toHaveAttribute('src', 'https://example.com/img1.jpg')
    expect(mainImage).toHaveAttribute('alt', 'Chaise bois')
  })

  // ===== Fallback =====
  it("affiche le placeholder quand aucune image n'est fournie", () => {
    render(<ProductImageGallery images={[]} title="Chaise bois" />)
    expect(screen.getByText(/photo produit — chaise bois/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  // ===== Interaction (LE test critique) =====
  it("change l'image principale au clic sur une miniature", async () => {
    const user = userEvent.setup()
    render(<ProductImageGallery images={mockImages} title="Chaise bois" />)

    // Au départ, la première image
    expect(screen.getAllByRole('img')[0]).toHaveAttribute(
      'src',
      'https://example.com/img1.jpg'
    )

    // Clic sur la 3ᵉ miniature
    const thumbnails = screen.getAllByRole('button')
    await user.click(thumbnails[2])

    // L'image principale change
    expect(screen.getAllByRole('img')[0]).toHaveAttribute(
      'src',
      'https://example.com/img3.jpg'
    )
  })

  // ===== Branche : thumbnails visibles seulement si > 1 image =====
  it("n'affiche PAS de miniatures s'il n'y a qu'une image", () => {
    render(<ProductImageGallery images={[mockImages[0]]} title="Chaise bois" />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('affiche une miniature par image supplémentaire', () => {
    render(<ProductImageGallery images={mockImages} title="Chaise bois" />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  // ===== A11y =====
  it("les miniatures ont un aria-label explicite", () => {
    render(<ProductImageGallery images={mockImages} title="Chaise bois" />)
    expect(screen.getByLabelText(/image 1 sur 3/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/image 3 sur 3/i)).toBeInTheDocument()
  })

  it('marque la miniature active avec aria-current', () => {
    render(<ProductImageGallery images={mockImages} title="Chaise bois" />)
    expect(screen.getByLabelText(/image 1 sur 3/i)).toHaveAttribute('aria-current', 'true')
    expect(screen.getByLabelText(/image 2 sur 3/i)).not.toHaveAttribute('aria-current')
  })

  // ===== Bug #4 : changement de produit =====
  it('reset selectedImage à 0 si le produit change', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ProductImageGallery images={mockImages} title="Chaise bois" />
    )

    // Sélectionne la 3ᵉ image
    await user.click(screen.getAllByRole('button')[2])
    expect(screen.getAllByRole('img')[0]).toHaveAttribute(
      'src',
      'https://example.com/img3.jpg'
    )

    // Change de produit avec 2 images seulement
    const newImages = [mockImages[0], mockImages[1]]
    rerender(<ProductImageGallery images={newImages} title="Table chêne" />)

    // Doit revenir à la 1ère image, PAS planter sur l'index 2
    expect(screen.getAllByRole('img')[0]).toHaveAttribute(
      'src',
      'https://example.com/img1.jpg'
    )
  })
})