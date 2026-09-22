import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../lib/api';

// Structure de l'utilisateur stocké dans le state / token
export interface AuthAdmin {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  admin: AuthAdmin;
}

export function useAuth() {
  const [admin, setAdmin] = useState<AuthAdmin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // 1. Restauration de la session au chargement
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        // Extraction et décodage du payload JWT (base64)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decodedPayload = JSON.parse(atob(padded)) as AuthAdmin;
        
        setAdmin(decodedPayload);
        setIsAuthenticated(true);
      } catch (error) {
        // En cas de token corrompu
        localStorage.removeItem('adminToken');
        setAdmin(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  // 2. Méthode de connexion
  const login = async (email: string, password: string) => {
    try {
      // On passe <LoginResponse> en générique à apiCall
      const response = await apiCall<LoginResponse>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data) {
        const { token, admin: adminData } = response.data;

        // Stockage du jeton
        localStorage.setItem('adminToken', token);
        
        // Mise à jour de l'état
        setAdmin(adminData);
        setIsAuthenticated(true);

        return { success: true };
      }

      return {
        success: false,
        message: response.message || 'Identifiants incorrects.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
      };
    }
  };

  // 3. Méthode de déconnexion
  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    setIsAuthenticated(false);
    router.push('/Admin/Login');
  };

  return {
    admin,
    isAuthenticated,
    loading,
    login,
    logout,
  };
}