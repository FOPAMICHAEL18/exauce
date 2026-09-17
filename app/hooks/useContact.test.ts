import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { useContact } from './useContact';
import * as apiModule from '../lib/api';

describe('useContact', () => {
  // 1. Succès au chargement
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

  // 2. Erreur réseau envoyée par l'API au chargement
  it('gère une réponse réseau en échec lors du chargement', async () => {
    server.use(
      http.get('*/api/admin/contact', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur de connexion au serveur');
  });

  // 3. Échec métier avec message personnalisé
  it('gère un échec retourné par l’API avec message au chargement', async () => {
    server.use(
      http.get('*/api/admin/contact', () => {
        return HttpResponse.json(
          { success: false, message: 'Accès non autorisé' },
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

  // 4. Couverture branche fallback de fetchContact (Ligne 44)
  it('utilise la valeur de fallback quand response.message est absent au chargement (Ligne 44)', async () => {
    const spy = vi.spyOn(apiModule, 'apiCall').mockResolvedValueOnce({
      success: false,
      message: undefined,
    });

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur de chargement');
    spy.mockRestore();
  });

  // 5. Succès de mise à jour
  it('met à jour les coordonnées avec succès', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateContact({ address: 'Nouvelle adresse' });
    });

    expect(success).toBe(true);
    expect(result.current.success).toBe(true);
  });

  // 6. Échec de mise à jour avec message
  it('gère un échec de mise à jour retourné par l’API avec message', async () => {
    server.use(
      http.put('*/api/admin/contact', () => {
        return HttpResponse.json(
          { success: false, message: 'Données invalides' },
          { status: 400 }
        );
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

  // 7. Couverture branche fallback de updateContact (Lignes 65-69)
  it('utilise la valeur de fallback quand response.message est absent lors de la mise à jour (Lignes 65-69)', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const spy = vi.spyOn(apiModule, 'apiCall').mockResolvedValueOnce({
      success: false,
      message: undefined,
    });

    let success = true;
    await act(async () => {
      success = await result.current.updateContact({ address: 'Test' });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Erreur de mise à jour');
    spy.mockRestore();
  });

  // 8. Erreur réseau MSW lors de la mise à jour
  it('gère une erreur réseau lors de la mise à jour', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    server.use(
      http.put('*/api/admin/contact', () => {
        return HttpResponse.error();
      })
    );

    let success = true;
    await act(async () => {
      success = await result.current.updateContact({ address: 'Test' });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Erreur de connexion au serveur');
  });

  // 9. Rafraîchissement manuel
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

  // 10. Couverture catch de fetchContact
  it('exécute le catch block de fetchContact sur exception levée', async () => {
    const spy = vi.spyOn(apiModule, 'apiCall').mockRejectedValueOnce(new Error('Crash'));

    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur de connexion au serveur');
    spy.mockRestore();
  });

  // 11. Couverture catch de updateContact
  it('exécute le catch block de updateContact sur exception levée', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const spy = vi.spyOn(apiModule, 'apiCall').mockRejectedValueOnce(new Error('Crash'));

    let success = true;
    await act(async () => {
      success = await result.current.updateContact({ address: 'Test' });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Erreur de connexion au serveur');
    spy.mockRestore();
  });

  it('couvre la branche où updateContact réussit mais sans renvoyer de data (Ligne 69)', async () => {
    const { result } = renderHook(() => useContact());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const spy = vi.spyOn(apiModule, 'apiCall').mockResolvedValueOnce({
      success: true,
      data: undefined, // Force response.data à être falsy pour passer la ligne 69 à false
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateContact({ address: 'Test' });
    });

    expect(success).toBe(true);
    expect(result.current.success).toBe(true);
    spy.mockRestore();
  });
});