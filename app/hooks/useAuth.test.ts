import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import * as apiModule from '../lib/api';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../lib/api', () => ({
  apiCall: vi.fn(),
}));

// Utilisateur de test + JWT valide décodable par notre base64url decoder.
const mockAdmin = { id: 1, email: 'admin@test.com', name: 'Admin' };
const mockHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const mockPayload = btoa(JSON.stringify(mockAdmin));
const mockValidToken = `${mockHeader}.${mockPayload}.signature`

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initialise à non-authentifié si aucun token n’est dans le localStorage', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.admin).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('restaure la session si un token valide est présent dans le localStorage', () => {
    localStorage.setItem('adminToken', mockValidToken);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.admin).toEqual(mockAdmin);
    expect(result.current.loading).toBe(false);
  });

  it('nettoie le token et réinitialise la session si le token est corrompu', () => {
    localStorage.setItem('adminToken', 'token-invalide-corrompu');

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.admin).toBeNull();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('connecte l’utilisateur avec succès', async () => {
    vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
      success: true,
      data: {
        token: mockValidToken,
        // ⚠️ le serveur renvoie `admin`, pas `user`
        admin: mockAdmin,
      },
    });

    const { result } = renderHook(() => useAuth());

    let loginResult: { success: boolean; message?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('admin@test.com', 'password123');
    });

    expect(loginResult).toEqual({ success: true });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.admin).toEqual(mockAdmin);
    expect(localStorage.getItem('adminToken')).toBe(mockValidToken);
    // ℹ️ Plus de router.push ici : c’est LoginForm qui redirige désormais.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('gère un échec de connexion renvoyé par l’API', async () => {
    vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
      success: false,
      message: 'Identifiants incorrects',
    });

    const { result } = renderHook(() => useAuth());

    let loginResult: { success: boolean; message?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('admin@test.com', 'wrongpassword');
    });

    expect(loginResult?.success).toBe(false);
    expect(loginResult?.message).toBe('Identifiants incorrects');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('gère une réponse échec sans message d’erreur spécifique', async () => {
    vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
      success: false,
      message: 'identifiants incorrects',
    });

    const { result } = renderHook(() => useAuth());

    let loginResult: { success: boolean; message?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('admin@test.com', 'wrongpassword');
    });

    expect(loginResult?.success).toBe(false);
    expect(loginResult?.message).toBe('identifiants incorrects');
  });

  it('exécute le catch block lors d’une exception levée pendant la connexion', async () => {
    vi.mocked(apiModule.apiCall).mockRejectedValueOnce(new Error('Erreur réseau'));

    const { result } = renderHook(() => useAuth());

    let loginResult: { success: boolean; message?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('admin@test.com', 'password123');
    });

    expect(loginResult?.success).toBe(false);
    expect(loginResult?.message).toBe('Erreur de connexion au serveur');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('déconnecte l’utilisateur, nettoie le localStorage et redirige vers /Admin/Login', () => {
    localStorage.setItem('adminToken', mockValidToken);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.admin).toBeNull();
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/Admin/Login');
  })

  it('gère un succès sans données (data undefined)', async () => {
    vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    const { result } = renderHook(() => useAuth());

    let loginResult: { success: boolean; message?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('admin@test.com', 'password123');
    });

    expect(loginResult?.success).toBe(false);
    expect(loginResult?.message).toBe('Identifiants incorrects.');
    expect(result.current.isAuthenticated).toBe(false);
  });
});