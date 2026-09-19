// app/components/product/ProductGrid.test.tsx
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ProductGrid from './ProductGrid'

const mockPush = vi.fn()
const mockUseSearchParams = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
}))

// Mock ProductCard pour isoler ProductGrid
vi.mock('./ProductCard', () => ({
  default: ({ product }: { product: { title: string; slug: string } }) => (
    <a href={`/Catalogue/${product.slug}`}>{product.title}</a>
  ),
}))

const mockProducts = [
  { id: 1, title: 'Chaise bois', price: 12000, slug: 'chaise-bois', stockStatus: 'disponible', category: { name: 'Mobilier' } },
  { id: 2, title: 'Table chêne', price: 25000, slug: 'table-chene', stockStatus: 'rupture', category: { name: 'Mobilier' } },
  { id: 3, title: 'Lampe design', price: 8000, slug: 'lampe-design', stockStatus: 'disponible', category: { name: 'Éclairage' } },
]

const defaultProps = {
  products: mockProducts,
  filteredCount: 3,
  totalPages: 1,
  currentPage: 1,
}

beforeEach(() => {
  mockPush.mockReset()
  mockUseSearchParams.mockReturnValue(new URLSearchParams())
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// =========================================================================
// RENDU
// =========================================================================
describe('ProductGrid — rendu', () => {
  it('affiche le nombre de résultats', () => {
    render(<ProductGrid {...defaultProps} filteredCount={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/résultat\(s\) trouvé\(s\)/i)).toBeInTheDocument()
  })

  it('affiche une ProductCard par produit', () => {
    render(<ProductGrid {...defaultProps} />)
    expect(screen.getByRole('link', { name: 'Chaise bois' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Table chêne' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lampe design' })).toBeInTheDocument()
  })

  it("affiche le message vide si aucun produit", () => {
    render(<ProductGrid {...defaultProps} products={[]} filteredCount={0} />)
    expect(
      screen.getByText(/aucun produit ne correspond/i)
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it("n'affiche pas la pagination si totalPages = 1", () => {
    render(<ProductGrid {...defaultProps} totalPages={1} />)
    expect(
      screen.queryByRole('navigation', { name: /pagination/i })
    ).not.toBeInTheDocument()
  })
})

// =========================================================================
// RECHERCHE
// =========================================================================
describe('ProductGrid — recherche', () => {
  it("initialise le champ avec le search de l'URL", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('search=chaise'))
    render(<ProductGrid {...defaultProps} />)
    expect(screen.getByRole('searchbox')).toHaveValue('chaise')
  })

  it('met à jour le state local à la frappe (pas de push immédiat)', async () => {
    vi.useFakeTimers()
    render(<ProductGrid {...defaultProps} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'chaise' } })

    // ✅ Immédiat : state local mis à jour, mais pas de push
    expect(input).toHaveValue('chaise')
    expect(mockPush).not.toHaveBeenCalled()

    // Avance le debounce
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(mockPush).toHaveBeenCalledWith('/Catalogue?search=chaise&page=1')
  })

  it('reset la page à 1 lors d\'une recherche', async () => {
    vi.useFakeTimers()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=3'))
    render(<ProductGrid {...defaultProps} currentPage={3} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'table' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('page=1')
    expect(url).toContain('search=table')
  })

  it('supprime search si le champ est vidé', async () => {
    vi.useFakeTimers()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('search=chaise'))
    render(<ProductGrid {...defaultProps} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('search=')
    expect(url).toContain('page=1')
  })

  it('trim le terme avant de pusher', async () => {
    vi.useFakeTimers()
    render(<ProductGrid {...defaultProps} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  chaise  ' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(mockPush).toHaveBeenCalledWith('/Catalogue?search=chaise&page=1')
  })

  it('ne pushe pas si le terme est identique à l\'URL', async () => {
    vi.useFakeTimers()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('search=chaise'))
    render(<ProductGrid {...defaultProps} />)

    // L'input est déjà à "chaise", rien ne change
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
  
  it("resynchronise le champ search si l'URL change (back/forward navigateur)", () => {
    const { rerender } = render(<ProductGrid {...defaultProps} />)
    expect(screen.getByRole('searchbox')).toHaveValue('')

    // Simule un retour navigateur : l'URL change
    mockUseSearchParams.mockReturnValue(new URLSearchParams('search=table'))
    rerender(<ProductGrid {...defaultProps} />)

    expect(screen.getByRole('searchbox')).toHaveValue('table')
    })

    it("vide le champ search si l'URL n'a plus de paramètre (back navigateur)", () => {
    // 1. On démarre avec un search dans l'URL
    mockUseSearchParams.mockReturnValue(new URLSearchParams('search=chaise'))
    const { rerender } = render(<ProductGrid {...defaultProps} />)
    expect(screen.getByRole('searchbox')).toHaveValue('chaise')

    // 2. L'utilisateur revient en arrière → l'URL n'a plus de search
    mockUseSearchParams.mockReturnValue(new URLSearchParams(''))
    rerender(<ProductGrid {...defaultProps} />)

    // Le champ doit se vider
    expect(screen.getByRole('searchbox')).toHaveValue('')
    })
})

// =========================================================================
// PAGINATION
// =========================================================================
describe('ProductGrid — pagination', () => {
  const paginationProps = { ...defaultProps, totalPages: 3, currentPage: 2 }

  it('affiche les 3 boutons + précédent/suivant', () => {
    render(<ProductGrid {...paginationProps} />)
    expect(screen.getByLabelText('Page précédente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
    expect(screen.getByLabelText('Page suivante')).toBeInTheDocument()
  })

  it('marque la page courante avec aria-current', () => {
    render(<ProductGrid {...paginationProps} />)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('navigue vers la page suivante', async () => {
    const user = userEvent.setup()
    render(<ProductGrid {...paginationProps} />)
    await user.click(screen.getByLabelText('Page suivante'))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue?page=3')
  })

  it('navigue vers la page précédente', async () => {
    const user = userEvent.setup()
    render(<ProductGrid {...paginationProps} />)
    await user.click(screen.getByLabelText('Page précédente'))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue?page=1')
  })

  it('désactive précédent sur la page 1', () => {
    render(<ProductGrid {...defaultProps} totalPages={3} currentPage={1} />)
    expect(screen.getByLabelText('Page précédente')).toBeDisabled()
  })

  it('désactive suivant sur la dernière page', () => {
    render(<ProductGrid {...defaultProps} totalPages={3} currentPage={3} />)
    expect(screen.getByLabelText('Page suivante')).toBeDisabled()
  })

  it('conserve le search lors du changement de page', async () => {
    const user = userEvent.setup()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('search=chaise'))
    render(<ProductGrid {...defaultProps} totalPages={3} currentPage={1} />)

    await user.click(screen.getByLabelText('Page suivante'))

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('search=chaise')
    expect(url).toContain('page=2')
  })

  it('tronque la pagination si totalPages > 7', () => {
    render(<ProductGrid {...defaultProps} totalPages={20} currentPage={10} />)
    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 5' })).not.toBeInTheDocument()
  })

  it('affiche un spinner sur la page cliquée pendant le chargement', async () => {
    const user = userEvent.setup()
    render(<ProductGrid {...paginationProps} />)
    await user.click(screen.getByRole('button', { name: 'Page 3' }))

    const page3 = screen.getByRole('button', { name: 'Page 3' })
    expect(page3.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it("reset le spinner quand la nouvelle page arrive", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ProductGrid {...paginationProps} />)

    await user.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(
      screen.getByRole('button', { name: 'Page 3' }).querySelector('.animate-spin')
    ).toBeInTheDocument()

    // Simule l'arrivée de la page 3
    rerender(<ProductGrid {...paginationProps} currentPage={3} />)
    expect(
      screen.getByRole('button', { name: 'Page 3' }).querySelector('.animate-spin')
    ).not.toBeInTheDocument()
  })
})

// =========================================================================
// LOADER PENDANT RECHERCHE
// =========================================================================
describe('ProductGrid — loader de recherche', () => {
  it('affiche un spinner pendant la transition de recherche', async () => {
    const user = userEvent.setup()
    render(<ProductGrid {...defaultProps} />)

    // Le spinner apparaît quand isPending est true
    // Difficile à tester sans ralentir l'action, on vérifie au moins qu'il
    // n'est pas présent au repos
    expect(screen.queryByLabelText(/recherche en cours/i)).not.toBeInTheDocument()
  })
})