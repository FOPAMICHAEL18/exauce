import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ProductFilter from './ProductFilter'

const mockPush = vi.fn()
const mockUseSearchParams = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
}))

const categories = [
  { id: 1, name: 'Mobilier', slug: 'mobilier' },
  { id: 2, name: 'Décoration', slug: 'decoration' },
  { id: 3, name: 'Éclairage', slug: 'eclairage' },
]

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
describe('ProductFilter — rendu', () => {
  it('affiche toutes les catégories', () => {
    render(<ProductFilter categories={categories} />)
    expect(screen.getByLabelText('Mobilier')).toBeInTheDocument()
    expect(screen.getByLabelText('Décoration')).toBeInTheDocument()
    expect(screen.getByLabelText('Éclairage')).toBeInTheDocument()
  })

  it('affiche les 3 sections sous forme de fieldset/legend', () => {
    render(<ProductFilter categories={categories} />)
    expect(screen.getByText('Catégories')).toBeInTheDocument()
    expect(screen.getByText('Prix max (FCFA)')).toBeInTheDocument()
    expect(screen.getByText('Disponibilité')).toBeInTheDocument()
  })

  it("affiche les 3 options de disponibilité", () => {
    render(<ProductFilter categories={categories} />)
    expect(screen.getByLabelText('Tous')).toBeInTheDocument()
    expect(screen.getByLabelText('En stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Sur commande')).toBeInTheDocument()
  })
})

// =========================================================================
// CATÉGORIES
// =========================================================================
describe('ProductFilter — catégories', () => {
  it('"Toutes" est coché par défaut', () => {
    render(<ProductFilter categories={categories} />)
    expect(screen.getByLabelText('Toutes')).toBeChecked()
  })

  it("coche la catégorie active depuis l'URL", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('categorie=mobilier'))
    render(<ProductFilter categories={categories} />)
    expect(screen.getByLabelText('Mobilier')).toBeChecked()
  })

  it('pousse categorie=X&page=1 au clic', async () => {
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)
    await user.click(screen.getByLabelText('Mobilier'))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue?categorie=mobilier&page=1')
  })

  it('supprime le paramètre au clic sur "Toutes"', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('categorie=mobilier'))
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)
    await user.click(screen.getByLabelText('Toutes'))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue?page=1')
  })

  it("préserve les autres paramètres existants", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=disponible'))
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)
    await user.click(screen.getByLabelText('Mobilier'))

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('categorie=mobilier')
    expect(url).toContain('status=disponible')
    expect(url).toContain('page=1')
  })
})

// =========================================================================
// DISPONIBILITÉ
// =========================================================================
describe('ProductFilter — disponibilité', () => {
  it('"Tous" est coché par défaut', () => {
    render(<ProductFilter categories={categories} />)
    expect(screen.getByLabelText('Tous')).toBeChecked()
  })

  it("coche 'En stock' si l'URL contient status=disponible", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=disponible'))
    render(<ProductFilter categories={categories} />)
    expect(screen.getByLabelText('En stock')).toBeChecked()
    expect(screen.getByLabelText('Sur commande')).not.toBeChecked()
  })

  it('pousse status=disponible au clic', async () => {
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)
    await user.click(screen.getByLabelText('En stock'))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue?status=disponible&page=1')
  })

  it('pousse status=rupture au clic sur "Sur commande"', async () => {
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)
    await user.click(screen.getByLabelText('Sur commande'))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue?status=rupture&page=1')
  })
})

// =========================================================================
// PRIX
// =========================================================================
describe('ProductFilter — prix', () => {
  it('affiche 500000 FCFA par défaut', () => {
    render(<ProductFilter categories={categories} />)
    expect(screen.getByText('500000 FCFA')).toBeInTheDocument()
  })

  it("affiche le prix parsé depuis l'URL", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('price=0-100000'))
    render(<ProductFilter categories={categories} />)
    expect(screen.getByText('100000 FCFA')).toBeInTheDocument()
  })

  it("fallback à 500000 si le prix de l'URL est invalide", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('price=abc'))
    render(<ProductFilter categories={categories} />)
    expect(screen.getByText('500000 FCFA')).toBeInTheDocument()
  })

  it("met à jour l'URL après le debounce", async () => {
    vi.useFakeTimers()
    render(<ProductFilter categories={categories} />)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '50000' } })

    // ✅ Avant le debounce : rien n'est encore poussé
    expect(mockPush).not.toHaveBeenCalled()

    // Avancer le temps
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(mockPush).toHaveBeenCalledWith('/Catalogue?price=0-50000&page=1')
  })

  it("ne pousse pas si la valeur n'a pas changé", async () => {
    vi.useFakeTimers()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('price=0-500000'))
    render(<ProductFilter categories={categories} />)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("resynchronise le slider si l'URL change (back/forward navigateur)", () => {
    const { rerender } = render(<ProductFilter categories={categories} />)
    expect(screen.getByText('500000 FCFA')).toBeInTheDocument()

    // Simule un changement d'URL (bouton retour navigateur)
    mockUseSearchParams.mockReturnValue(new URLSearchParams('price=0-200000'))
    rerender(<ProductFilter categories={categories} />)

    expect(screen.getByText('200000 FCFA')).toBeInTheDocument()
  })

  it('supprime le paramètre status au clic sur "Tous"', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=disponible'))
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)

    // Vérifie qu'on est bien sur l'état "En stock"
    expect(screen.getByLabelText('En stock')).toBeChecked()

    // Clic sur "Tous" → doit supprimer le paramètre
    await user.click(screen.getByLabelText('Tous'))

    expect(mockPush).toHaveBeenCalledWith('/Catalogue?page=1')
    })
})

// =========================================================================
// RESET
// =========================================================================
describe('ProductFilter — reset', () => {
  it('pousse /Catalogue sans params au clic', async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('categorie=mobilier&status=disponible&page=2')
    )
    const user = userEvent.setup()
    render(<ProductFilter categories={categories} />)
    await user.click(screen.getByRole('button', { name: /réinitialiser/i }))
    expect(mockPush).toHaveBeenCalledWith('/Catalogue')
  })
})