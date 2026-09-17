import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { useContact } from './useContact';
import * as apiModule from '../lib/api'

describe('useContact', () => {
  // 1. Chargement réussi
  it('charge les coordonnées au montage', async () => {
    const { result } = renderHook(() => useContact());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.address).toBe('Rue Test, Douala');
    expect(result.current.data.phone).toBe('+237 699 123 456');
    expect(result.current.error).toBeNull();
  });

  // 2. Erreur réseau lors du fetch initial (Couvre la ligne 47)
  it('gère une erreur réseau lors du chargement (catch block)', async () => {
    server.use(
      http.get('*/api/admin/contact', () => {
        return HttpResponse.error(); // Simule une panne réseau brute
      })
    );

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur de connexion au serveur');
  });

  // 3. Réponse serveur success: false lors du fetch initial
  it('gère une réponse échec sans exception lors du chargement', async () => {
    server.use(
      http.get('*/api/admin/contact', () => {
        return HttpResponse.json({
          success: false,
          message: 'Accès non autorisé',
        },
        { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Accès non autorisé');
  });

  // 4. Mise à jour réussie
  it('met à jour les coordonnées avec succès', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateContact({
        address: 'Nouvelle adresse',
      });
    });

    expect(success).toBe(true);
    expect(result.current.success).toBe(true);
  });

  // 5. Échec métier de la mise à jour (Couvre les lignes 65-66)
  it('gère un échec de mise à jour renvoyé par l’API', async () => {
    server.use(
      http.put('*/api/admin/contact', () => {
        return HttpResponse.json({
          success: false,
          message: 'Données invalides',
        },
        { status: 400 });
      })
    );

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success = true;
    await act(async () => {
      success = await result.current.updateContact({ address: '' });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Données invalides');
  });

  // 6. Erreur réseau lors de la mise à jour (Couvre les lignes 75-76)
  it('gère une erreur réseau lors de la mise à jour (catch block)', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    server.use(
      http.put('*/api/admin/contact', () => {
        return HttpResponse.error(); // Simule une coupure réseau au moment du PUT
      })
    );

    let success = true;
    await act(async () => {
      success = await result.current.updateContact({ address: 'Test' });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Erreur de connexion au serveur');
  });

  // 7. Rafraîchissement manuel
  it('permet de rafraîchir les données manuellement via refresh()', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data.address).toBe('Rue Test, Douala');
  });

  // Test dédié pour forcer l'entrée dans le catch de fetchContact (Ligne 47)
    it('exécute le catch block de fetchContact sur exception levée', async () => {
    vi.spyOn(apiModule, 'apiCall').mockRejectedValueOnce(new Error('Fatal Error'));

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur de connexion au serveur');
    });

    // Test dédié pour forcer l'entrée dans le catch de updateContact (Lignes 75-76)
    it('exécute le catch block de updateContact sur exception levée', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    vi.spyOn(apiModule, 'apiCall').mockRejectedValueOnce(new Error('Fatal Error'));

    let success = true;
    await act(async () => {
        success = await result.current.updateContact({ address: 'Test' });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Erreur de connexion au serveur');
    });
});