import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProducts } from './useProduct';
import * as apiModule from '../lib/api';

// Mock du router Next.js
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock du module API
vi.mock('../lib/api', () => ({
  apiCall: vi.fn(),
}));

const mockProduct = {
  id: 1,
  title: 'Produit Test',
  description: 'Description de test',
  price: 100,
  categoryId: 2,
  stockStatus: 'IN_STOCK',
  images: ['/img1.jpg'],
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initialise avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useProducts());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  describe('refresh (fetchProduct)', () => {
    it('ne fait rien si aucun productId n’est fourni (0 ou nul)', async () => {
      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.refresh(0);
      });

      expect(apiModule.apiCall).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('charge un produit avec succès', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: true,
        data: mockProduct,
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.refresh(1);
      });

      expect(apiModule.apiCall).toHaveBeenCalledWith('/api/admin/products/1', {
        method: 'GET',
      });
      expect(result.current.data).toEqual(mockProduct);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('gère l’erreur de réponse lors du chargement', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
        message: 'Produit non trouvé',
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.refresh(99);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Produit non trouvé');
      expect(result.current.loading).toBe(false);
    });

    it('gère l’erreur de réponse sans message d’erreur spécifique', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.refresh(99);
      });

      expect(result.current.error).toBe('Erreur de chargement');
    });

    it('gère une exception levée lors du chargement', async () => {
      vi.mocked(apiModule.apiCall).mockRejectedValueOnce(new Error('Erreur réseau'));

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.refresh(1);
      });

      expect(result.current.error).toBe('Erreur de connexion au serveur');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateProduct', () => {
    it('met à jour un produit avec succès', async () => {
      const updatedProduct = { ...mockProduct, title: 'Produit Modifié' };
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: true,
        data: updatedProduct,
      });

      const { result } = renderHook(() => useProducts());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateProduct({ id: 1, title: 'Produit Modifié' });
      });

      expect(apiModule.apiCall).toHaveBeenCalledWith('/api/admin/products/1', {
        method: 'PUT',
        body: JSON.stringify({ id: 1, title: 'Produit Modifié' }),
      });
      expect(success).toBe(true);
      expect(result.current.data).toEqual(updatedProduct);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('gère l’échec de mise à jour renvoyé par l’API', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
        message: 'Données invalides',
      });

      const { result } = renderHook(() => useProducts());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateProduct({ id: 1, title: '' });
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Données invalides');
      expect(result.current.success).toBe(false);
    });

    it('gère l’échec de mise à jour sans message explicite', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useProducts());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateProduct({ id: 1 });
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Erreur de mise à jour');
    });

    it('gère une exception lors de la mise à jour', async () => {
      vi.mocked(apiModule.apiCall).mockRejectedValueOnce(new Error('Crash réseau'));

      const { result } = renderHook(() => useProducts());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateProduct({ id: 1 });
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Erreur de connexion au serveur');
    });

    it('gère une réponse avec success: true mais sans data lors de la mise à jour', async () => {
        vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useProducts());

        let success: boolean | undefined;
        await act(async () => {
            success = await result.current.updateProduct({ id: 1, title: 'Produit sans data' });
        });

        expect(success).toBe(true);
        expect(result.current.success).toBe(true);
        expect(result.current.data).toBeNull(); // Le state data n'a pas changé
    })
  });

  describe('createProduct', () => {
    it('crée un produit avec succès et redirige après 1.5s', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: true,
        data: mockProduct,
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.createProduct(mockProduct);
      });

      expect(apiModule.apiCall).toHaveBeenCalledWith('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(mockProduct),
      });
      expect(result.current.success).toBe(true);

      // Vérification que la redirection n'est pas encore faite immédiatement
      expect(mockPush).not.toHaveBeenCalled();

      // Avancer le temps de 1500ms
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockPush).toHaveBeenCalledWith('/Admin/Products');
    });

    it('gère un échec de création renvoyé par l’API', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
        message: 'Nom de produit déjà existant',
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.createProduct(mockProduct);
      });

      expect(result.current.error).toBe('Nom de produit déjà existant');
      expect(result.current.success).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('gère un échec de création sans message explicite', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.createProduct(mockProduct);
      });

      expect(result.current.error).toBe('Erreur de mise à jour');
    });

    it('gère une exception lors de la création', async () => {
      vi.mocked(apiModule.apiCall).mockRejectedValueOnce(new Error('Erreur serveur'));

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.createProduct(mockProduct);
      });

      expect(result.current.error).toBe('Erreur de connexion au serveur');
    });
  });
});