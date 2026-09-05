import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { apiCall } from "../lib/api";

// Type représentant les données de product telles que renvoyées par Prisma.
interface ProductData {
  id?: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  stockStatus: string;
  images?: string[];
  // On ajoute category pour l'affichage, mais il n'est pas obligatoire
  // pour la mise à jour (Prisma utilisera categoryId).
  category?: {
    id: number;
    name: string;
  };
}




const useProducts = () => {
    const router = useRouter();
    const [data, setData] = useState<ProductData | null>(null)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Chargement des données
    // En résumé : Cette fonction va chercher les donnees des produits sur le serveur, et les range dans notre boîte data.
    const fetchProduct = async (productId : number) => {
        if (!productId) return
        setLoading(true); // On allume le voyant "Chargement" (pour afficher le spinner)
        setError(null); // On efface l'erreur précédente si elle existait
        try {
            const response = await apiCall<ProductData>(`/api/admin/products/${productId}`, {
                method: 'GET',
            });
            if (response.success && response.data) {
                setData(response.data);
            } else {
                setError(response.message || 'Erreur de chargement');
            }
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };


    // Mise à jour des données
    // Cela permet d'appeler updateProduct en envoyant UNIQUEMENT les champs modifiés, pas tout l'objet.
    const updateProduct = async (payload: Partial<ProductData>) => { // Avec Partial (tous les champs deviennent optionnels) 
        setError(null);
        setSuccess(false);
        try {
            const response = await apiCall<ProductData>(`/api/admin/products/${payload.id}`, {
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
        } catch {
            setError('Erreur de connexion au serveur');
            return false;
        }
    };

    // creation d'un produit
    const createProduct = async (payload: Partial<ProductData>) => { // Avec Partial (tous les champs deviennent optionnels) 
        setError(null);
        setSuccess(false);
        try {
            const response = await apiCall<ProductData>(`/api/admin/products`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (!response.success) {
                setError(response.message || 'Erreur de mise à jour');
                return false;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/Admin/Products');
            }, 1500);;
        } catch {
            setError('Erreur de connexion au serveur');
        }
    };


    return {
        data,
        loading,
        error,
        success,
        updateProduct,
        createProduct,
        refresh: fetchProduct,
    };
}

export {useProducts}

// Ce hook fabrique un petit assistant qui fait tout le travail sale (appels réseau, gestion des erreurs, état de chargement) pour le formulaire de contact. Le formulaire n'a plus qu'à lire les informations (data, loading) et appeler les fonctions (updateContact). C'est ce qu'on appelle la séparation des responsabilités : le formulaire gère l'affichage, le hook gère la logique.