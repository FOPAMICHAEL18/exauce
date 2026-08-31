import { useState, useEffect } from 'react';
import { apiCall } from '../lib/api';

interface ProfileData {
  email: string;
  name: string;
  surname: string | null;
}

const useProfile = () => {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall<ProfileData>('/api/admin/profile', {
                method: 'GET',
            })
            if (response.success && response.data) {
                setData(response.data);
            } else {
                setError(response.message || 'Erreur de chargement');
            }
        } catch (error) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    }

    const updateProfile = async (payload: {
        email?: string,
        name?:string,
        surname?: string,
        currentPassword?: string,
        newPassword?: string,
    }) => {
        setError(null);
        setSuccess(false);
        
        try {
            const response = await apiCall<ProfileData>('/api/admin/profile', {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            if (!response.success) {
                setError(response.message || 'Erreur de mise à jour');
                return false;
            }

            if (response.data) {
                setData(response.data);
            }
            setSuccess(true);
            return true;
        } catch (error) {
            setError('Erreur de connexion au serveur');
            return false;
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    return {
        data,
        loading,
        error,
        success,
        updateProfile,
        refresh: fetchProfile,
    };
}

export {useProfile}