// app/components/admin/AdminProductForm.test.tsx
import {
  render,
  screen,
  cleanup,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AdminProductForm, {
  parsePrice,
  parseCategoryId,
  hasProductChanged,
  type ComparableProduct,
} from './AdminProductForm'

// =========================================================================
// MOCKS
// =========================================================================
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockRefresh = vi.fn()
const mockUpdateProduct = vi.fn()
const mockCreateProduct = vi.fn()
const mockUseProducts = vi.fn()

vi.mock('@/app/hooks/useProduct', () => ({
  useProducts: () => mockUseProducts(),
}))

const defaultHookValue = {
  data: null,
  loading: false,
  error: null,
  success: false,
  refresh: mockRefresh,
  updateProduct: mockUpdateProduct,
  createProduct: mockCreateProduct,
}

const mockCategories = [
  { id: 1, name: 'Mobilier' },
  { id: 2, name: 'Éclairage' },
]

beforeEach(() => {
  mockPush.mockReset()
  mockRefresh.mockReset()
  mockUpdateProduct.mockReset()
  mockCreateProduct.mockReset()
  mockUseProducts.mockReturnValue(defaultHookValue)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// Helpers
const fillBasicFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/nom du produit/i), 'Chaise bois')
  await user.selectOptions(screen.getByLabelText(/catégorie/i), '1')
  await user.type(screen.getByLabelText(/prix/i), '15000')
  await user.type(screen.getByLabelText(/description/i), 'Description test')
}

const submitBtn = () =>
  screen.getByRole('button', { name: /créer le produit|mettre à jour/i })

// =========================================================================
// LOGIQUE PURE — parsePrice
// =========================================================================
describe('parsePrice', () => {
  it('retourne un nombre pour une valeur valide', () => {
    expect(parsePrice('15000')).toBe(15000)
    expect(parsePrice('99.99')).toBe(99.99)
  })

  it('retourne null pour une valeur non numérique', () => {
    expect(parsePrice('abc')).toBeNull()
    expect(parsePrice('')).toBeNull()
  })

  it('retourne null pour un prix négatif', () => {
    expect(parsePrice('-100')).toBeNull()
  })

  it('accepte 0 (produit gratuit)', () => {
    expect(parsePrice('0')).toBe(0)
  })

  it('retourne null pour Infinity', () => {
    expect(parsePrice('Infinity')).toBeNull()
  })
})

// =========================================================================
// LOGIQUE PURE — parseCategoryId
// =========================================================================
describe('parseCategoryId', () => {
  it('retourne un entier pour une valeur valide', () => {
    expect(parseCategoryId('1')).toBe(1)
    expect(parseCategoryId('42')).toBe(42)
  })

  it('retourne null pour une valeur vide', () => {
    expect(parseCategoryId('')).toBeNull()
  })

  it('retourne null pour une valeur non numérique', () => {
    expect(parseCategoryId('abc')).toBeNull()
  })

  it('retourne null pour 0 ou négatif', () => {
    expect(parseCategoryId('0')).toBeNull()
    expect(parseCategoryId('-1')).toBeNull()
  })
})

// =========================================================================
// LOGIQUE PURE — hasProductChanged
// =========================================================================
describe('hasProductChanged', () => {
  const base: ComparableProduct = {
    title: 'Chaise',
    description: 'Desc',
    price: 15000,
    categoryId: 1,
    stockStatus: 'disponible',
    images: ['a.jpg', 'b.jpg'],
  }

  it('retourne false si rien ne change', () => {
    expect(hasProductChanged(base, base)).toBe(false)
  })

  it('détecte un changement de title', () => {
    expect(hasProductChanged({ ...base, title: 'Autre' }, base)).toBe(true)
  })

  it('détecte un changement de description', () => {
    expect(hasProductChanged({ ...base, description: 'Autre' }, base)).toBe(true)
  })

  it('détecte un changement de prix', () => {
    expect(hasProductChanged({ ...base, price: 20000 }, base)).toBe(true)
  })

  it('détecte un changement de catégorie', () => {
    expect(hasProductChanged({ ...base, categoryId: 2 }, base)).toBe(true)
  })

  it('détecte un changement de statut', () => {
    expect(hasProductChanged({ ...base, stockStatus: 'rupture' }, base)).toBe(
      true
    )
  })

  it("détecte un ajout d'image", () => {
    expect(hasProductChanged({ ...base, images: ['a.jpg'] }, base)).toBe(true)
  })

  it('détecte une image différente au même index', () => {
    expect(
      hasProductChanged({ ...base, images: ['x.jpg', 'b.jpg'] }, base)
    ).toBe(true)
  })

  it('retourne false si les images sont identiques', () => {
    expect(
      hasProductChanged({ ...base, images: ['a.jpg', 'b.jpg'] }, base)
    ).toBe(false)
  })
})

// =========================================================================
// RENDU
// =========================================================================
describe('AdminProductForm — rendu', () => {
  it('affiche le mode création (sans productId)', () => {
    render(<AdminProductForm categories={mockCategories} />)
    expect(
      screen.getByRole('heading', { name: /informations générales/i })
    ).toBeInTheDocument()
    expect(submitBtn()).toHaveTextContent(/créer le produit/i)
    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue('')
  })

  it('affiche le mode édition (avec productId)', () => {
    render(<AdminProductForm categories={mockCategories} productId={5} />)
    expect(submitBtn()).toHaveTextContent(/mettre à jour/i)
  })

  it('affiche le skeleton pendant le loading', () => {
    mockUseProducts.mockReturnValue({ ...defaultHookValue, loading: true })
    const { container } = render(
      <AdminProductForm categories={mockCategories} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByLabelText(/nom du produit/i)).not.toBeInTheDocument()
  })

  it('affiche les catégories dans le select', () => {
    render(<AdminProductForm categories={mockCategories} />)
    expect(screen.getByRole('option', { name: 'Mobilier' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Éclairage' })).toBeInTheDocument()
  })
})

// =========================================================================
// PRÉ-REMPLISSAGE
// =========================================================================
describe('AdminProductForm — pré-remplissage', () => {
  it('appelle refresh(productId) au montage en mode édition', () => {
    render(<AdminProductForm categories={mockCategories} productId={5} />)
    expect(mockRefresh).toHaveBeenCalledWith(5)
  })

  it("n'appelle PAS refresh en mode création", () => {
    render(<AdminProductForm categories={mockCategories} />)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('pré-remplit les champs avec les données du hook', () => {
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      data: {
        id: 5,
        title: 'Chaise bois',
        description: 'Description test',
        price: 15000,
        categoryId: 1,
        stockStatus: 'disponible',
        images: [],
      },
    })
    render(<AdminProductForm categories={mockCategories} productId={5} />)

    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue('Chaise bois')
    expect(screen.getByLabelText(/prix/i)).toHaveValue(15000)
    expect(screen.getByLabelText(/catégorie/i)).toHaveValue('1')
  })

  it('utilise les valeurs par défaut si les champs de data sont absents', () => {
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      data: {
        id: 5,
        title: '',
        description: '',
        price: 0,
        categoryId: 0,
        stockStatus: '',
        images: undefined,
      },
    })
    render(<AdminProductForm categories={mockCategories} productId={5} />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByAltText(/aperçu/i)).not.toBeInTheDocument()
  })

  it('utilise data.stockStatus et data.images quand ils existent', () => {
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      data: {
        id: 5,
        title: 'Test',
        description: '',
        price: 100,
        categoryId: 1,
        stockStatus: 'rupture',
        images: ['https://example.com/a.jpg'],
      },
    })
    render(<AdminProductForm categories={mockCategories} productId={5} />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByAltText(/aperçu 1/i)).toBeInTheDocument()
  })
})

// =========================================================================
// CRÉATION
// =========================================================================
describe('AdminProductForm — création', () => {
  it('envoie le payload formaté à createProduct', async () => {
    mockCreateProduct.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await fillBasicFields(user)
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith({
        title: 'Chaise bois',
        description: 'Description test',
        price: 15000,
        categoryId: 1,
        stockStatus: 'disponible',
        images: [],
      })
    )
  })

  it('trim les champs texte avant envoi', async () => {
    mockCreateProduct.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await user.type(screen.getByLabelText(/nom du produit/i), '  Chaise  ')
    await user.selectOptions(screen.getByLabelText(/catégorie/i), '1')
    await user.type(screen.getByLabelText(/prix/i), '15000')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Chaise' })
      )
    )
  })
})

// =========================================================================
// ÉDITION
// =========================================================================
describe('AdminProductForm — édition', () => {
  it('envoie le payload avec id à updateProduct', async () => {
    mockUpdateProduct.mockResolvedValueOnce(true)
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      data: {
        id: 5,
        title: 'Ancien titre',
        description: '',
        price: 10000,
        categoryId: 1,
        stockStatus: 'disponible',
        images: [],
      },
      updateProduct: mockUpdateProduct,
    })

    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} productId={5} />)

    await user.clear(screen.getByLabelText(/nom du produit/i))
    await user.type(screen.getByLabelText(/nom du produit/i), 'Nouveau titre')
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockUpdateProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 5,
          title: 'Nouveau titre',
        })
      )
    )
  })

  it('affiche une erreur si aucune modification', async () => {
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      data: {
        id: 5,
        title: 'Titre',
        description: 'Desc',
        price: 10000,
        categoryId: 1,
        stockStatus: 'disponible',
        images: [],
      },
    })

    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} productId={5} />)

    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /aucune modification/i
    )
    expect(mockUpdateProduct).not.toHaveBeenCalled()
  })
})

// =========================================================================
// SÉCURITÉ
// =========================================================================
describe('AdminProductForm — sécurité', () => {
  it("bloque l'envoi si le prix est NaN", async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await user.type(screen.getByLabelText(/nom du produit/i), 'Test')
    await user.selectOptions(screen.getByLabelText(/catégorie/i), '1')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/prix/i)
    expect(mockCreateProduct).not.toHaveBeenCalled()
  })

  it("bloque l'envoi si aucune catégorie sélectionnée", async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await user.type(screen.getByLabelText(/nom du produit/i), 'Test')
    await user.type(screen.getByLabelText(/prix/i), '15000')
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/catégorie/i)
    expect(mockCreateProduct).not.toHaveBeenCalled()
  })

  it("bloque l'envoi si le categoryId est invalide (0)", async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await user.type(screen.getByLabelText(/nom du produit/i), 'Test')
    await user.type(screen.getByLabelText(/prix/i), '15000')
    fireEvent.change(screen.getByLabelText(/catégorie/i), {
      target: { value: '0' },
    })
    await user.click(submitBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent(/catégorie/i)
    expect(mockCreateProduct).not.toHaveBeenCalled()
  })

  it("désactive le bouton et les inputs pendant l'envoi", async () => {
    let resolveCreate!: (v: boolean) => void
    mockCreateProduct.mockReturnValueOnce(
      new Promise((r) => {
        resolveCreate = r
      })
    )
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await fillBasicFields(user)
    await user.click(submitBtn())

    expect(submitBtn()).toBeDisabled()
    expect(screen.getByLabelText(/nom du produit/i)).toBeDisabled()

    await act(async () => {
      resolveCreate(true)
    })
  })
})

// =========================================================================
// IMAGES
// =========================================================================
describe('AdminProductForm — images', () => {
  it('ajoute une image au changement du file input', async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    const file = new File(['fake-image-content'], 'test.jpg', {
      type: 'image/jpeg',
    })
    const fileInput = screen.getByLabelText(
      /ajouter des images/i
    ) as HTMLInputElement

    await user.upload(fileInput, file)

    const preview = screen.getByAltText(/aperçu 1/i)
    expect(preview).toBeInTheDocument()
    expect(preview.getAttribute('src')).toMatch(/^blob:/)

    expect(screen.getByLabelText(/supprimer l'image 1/i)).toBeInTheDocument()
  })

  it("supprime une image au clic sur le bouton supprimer", async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    const file = new File(['fake-image-content'], 'test.jpg', {
      type: 'image/jpeg',
    })
    const fileInput = screen.getByLabelText(
      /ajouter des images/i
    ) as HTMLInputElement

    await user.upload(fileInput, file)
    expect(screen.getByAltText(/aperçu 1/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/supprimer l'image 1/i))

    expect(screen.queryByAltText(/aperçu 1/i)).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText(/supprimer l'image 1/i)
    ).not.toBeInTheDocument()
  })

  it('génère des URLs uniques pour chaque image', async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    const file1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(
      /ajouter des images/i
    ) as HTMLInputElement

    await user.upload(fileInput, [file1, file2])

    const previews = screen.getAllByAltText(/aperçu/i)
    expect(previews).toHaveLength(2)

    const src1 = previews[0].getAttribute('src')
    const src2 = previews[1].getAttribute('src')

    expect(src1).toBeTruthy()
    expect(src2).toBeTruthy()
    expect(src1).not.toBe(src2)
    expect(src1).toMatch(/^blob:/)
    expect(src2).toMatch(/^blob:/)
  })

  it("ne fait rien si aucune file n'est fournie", () => {
    render(<AdminProductForm categories={mockCategories} />)

    const fileInput = screen.getByLabelText(
      /ajouter des images/i
    ) as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: null } })

    expect(screen.queryByAltText(/aperçu/i)).not.toBeInTheDocument()
  })
})

// =========================================================================
// FEEDBACK
// =========================================================================
describe('AdminProductForm — feedback', () => {
  it("affiche l'erreur du hook", () => {
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      error: 'Erreur serveur',
    })
    render(<AdminProductForm categories={mockCategories} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/erreur serveur/i)
  })

  it('affiche le succès du hook', () => {
    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      success: true,
    })
    render(<AdminProductForm categories={mockCategories} />)
    expect(screen.getByRole('status')).toHaveTextContent(/avec succès/i)
  })

  it('cache le succès après 3s', async () => {
    vi.useFakeTimers()
    mockUseProducts.mockReturnValue({ ...defaultHookValue, success: true })
    render(<AdminProductForm categories={mockCategories} />)

    expect(screen.getByRole('status')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('nettoie le timer précédent si le succès se redéclenche', async () => {
    vi.useFakeTimers()
    mockUseProducts.mockReturnValue({ ...defaultHookValue, success: true })
    const { rerender } = render(
      <AdminProductForm categories={mockCategories} />
    )

    expect(screen.getByRole('status')).toBeInTheDocument()

    mockUseProducts.mockReturnValue({ ...defaultHookValue, success: false })
    rerender(<AdminProductForm categories={mockCategories} />)

    mockUseProducts.mockReturnValue({ ...defaultHookValue, success: true })
    rerender(<AdminProductForm categories={mockCategories} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it("affiche 'créé' en création et 'mis à jour' en édition", () => {
    mockUseProducts.mockReturnValue({ ...defaultHookValue, success: true })
    const { unmount } = render(
      <AdminProductForm categories={mockCategories} />
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      /produit créé avec succès/i
    )
    unmount()

    mockUseProducts.mockReturnValue({
      ...defaultHookValue,
      success: true,
      data: {
        id: 5,
        title: 'Test',
        description: '',
        price: 100,
        categoryId: 1,
        stockStatus: 'disponible',
        images: [],
      },
    })
    render(<AdminProductForm categories={mockCategories} productId={5} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      /produit mis à jour avec succès/i
    )
  })
})

// =========================================================================
// NAVIGATION
// =========================================================================
describe('AdminProductForm — navigation', () => {
  it('redirige vers /Admin/Products au clic sur Annuler', async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)
    await user.click(screen.getByRole('button', { name: /annuler/i }))
    expect(mockPush).toHaveBeenCalledWith('/Admin/Products')
  })
})

// =========================================================================
// TOGGLE STATUT
// =========================================================================
describe('AdminProductForm — toggle statut', () => {
  it('passe de disponible à rupture au clic', async () => {
    mockCreateProduct.mockResolvedValueOnce(true)
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    await fillBasicFields(user)
    await user.click(screen.getByRole('switch'))
    await user.click(submitBtn())

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ stockStatus: 'rupture' })
      )
    )
  })

  it('repasse à disponible au second clic', async () => {
    const user = userEvent.setup()
    render(<AdminProductForm categories={mockCategories} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})