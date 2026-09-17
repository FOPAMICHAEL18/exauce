import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfile } from './useProfile';
import * as apiModule from '../lib/api';

// Mock du module API
vi.mock('../lib/api', () => ({
  apiCall: vi.fn(),
}));

const mockProfile = {
  email: 'admin@test.com',
  name: 'John',
  surname: 'Doe',
};

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProfile (au montage)', () => {
    it('récupère le profil avec succès lors du rendu initial', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: true,
        data: mockProfile,
      });

      const { result } = renderHook(() => useProfile());

      // Attendre la résolution du useEffect
      await act(async () => {});

      expect(apiModule.apiCall).toHaveBeenCalledWith('/api/admin/profile', {
        method: 'GET',
      });
      expect(result.current.data).toEqual(mockProfile);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('gère un échec de récupération avec un message d’erreur renvoyé par l’API', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
        message: 'Accès refusé',
      });

      const { result } = renderHook(() => useProfile());

      await act(async () => {});

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Accès refusé');
      expect(result.current.loading).toBe(false);
    });

    it('gère un échec de récupération sans message explicite', async () => {
      vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useProfile());

      await act(async () => {});

      expect(result.current.error).toBe('Erreur de chargement');
    });

    it('gère une exception levée pendant la récupération', async () => {
      vi.mocked(apiModule.apiCall).mockRejectedValueOnce(new Error('Crash serveur'));

      const { result } = renderHook(() => useProfile());

      await act(async () => {});

      expect(result.current.error).toBe('Erreur de connexion au serveur');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('met à jour le profil avec succès et met à jour le state data', async () => {
      const updatedProfile = { ...mockProfile, name: 'Jane' };
      vi.mocked(apiModule.apiCall)
        .mockResolvedValueOnce({ success: true, data: mockProfile }) // Pour le useEffect
        .mockResolvedValueOnce({ success: true, data: updatedProfile }); // Pour le PUT

      const { result } = renderHook(() => useProfile());
      await act(async () => {});

      let successResult: boolean | undefined;
      await act(async () => {
        successResult = await result.current.updateProfile({ name: 'Jane' });
      });

      expect(apiModule.apiCall).toHaveBeenLastCalledWith('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Jane' }),
      });
      expect(successResult).toBe(true);
      expect(result.current.success).toBe(true);
      expect(result.current.data).toEqual(updatedProfile);
      expect(result.current.error).toBeNull();
    });

    it('gère le cas success: true sans data lors de la mise à jour (couverture de la branche if(response.data))', async () => {
      vi.mocked(apiModule.apiCall)
        .mockResolvedValueOnce({ success: true, data: mockProfile })
        .mockResolvedValueOnce({ success: true, data: undefined });

      const { result } = renderHook(() => useProfile());
      await act(async () => {});

      let successResult: boolean | undefined;
      await act(async () => {
        successResult = await result.current.updateProfile({ name: 'Jane' });
      });

      expect(successResult).toBe(true);
      expect(result.current.success).toBe(true);
      expect(result.current.data).toEqual(mockProfile); // Ne change pas car response.data est undefined
    });

    it('gère un échec de mise à jour renvoyé par l’API', async () => {
      vi.mocked(apiModule.apiCall)
        .mockResolvedValueOnce({ success: true, data: mockProfile })
        .mockResolvedValueOnce({
          success: false,
          message: 'Mot de passe actuel incorrect',
        });

      const { result } = renderHook(() => useProfile());
      await act(async () => {});

      let successResult: boolean | undefined;
      await act(async () => {
        successResult = await result.current.updateProfile({ currentPassword: 'wrong' });
      });

      expect(successResult).toBe(false);
      expect(result.current.error).toBe('Mot de passe actuel incorrect');
      expect(result.current.success).toBe(false);
    });

    it('gère un échec de mise à jour sans message explicite', async () => {
      vi.mocked(apiModule.apiCall)
        .mockResolvedValueOnce({ success: true, data: mockProfile })
        .mockResolvedValueOnce({ success: false });

      const { result } = renderHook(() => useProfile());
      await act(async () => {});

      let successResult: boolean | undefined;
      await act(async () => {
        successResult = await result.current.updateProfile({ name: 'Test' });
      });

      expect(successResult).toBe(false);
      expect(result.current.error).toBe('Erreur de mise à jour');
    });

    it('gère une exception lors de la mise à jour', async () => {
      vi.mocked(apiModule.apiCall)
        .mockResolvedValueOnce({ success: true, data: mockProfile })
        .mockRejectedValueOnce(new Error('Erreur réseau'));

      const { result } = renderHook(() => useProfile());
      await act(async () => {});

      let successResult: boolean | undefined;
      await act(async () => {
        successResult = await result.current.updateProfile({ name: 'Test' });
      });

      expect(successResult).toBe(false);
      expect(result.current.error).toBe('Erreur de connexion au serveur');
    });
  });

  describe('refresh', () => {
    it('re-déclenche le chargement du profil lorsqu’il est appelé manuellement', async () => {
      vi.mocked(apiModule.apiCall)
        .mockResolvedValueOnce({ success: true, data: mockProfile })
        .mockResolvedValueOnce({ success: true, data: { ...mockProfile, name: 'Refreshed' } });

      const { result } = renderHook(() => useProfile());
      await act(async () => {});

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data?.name).toBe('Refreshed');
    });
  });
});