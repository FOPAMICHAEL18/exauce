import { useState, useEffect } from "react";
import { apiCall } from "../lib/api";

// Type représentant les données de contact telles que renvoyées par Prisma.
interface ContactData { //C'est une fiche descriptive (un plan) qui dit : "Les données de contact contiennent toujours une adresse, un téléphone, un email... et parfois (c'est pour ça le | null) des horaires ou des coordonnées GPS."
  address: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  hours: string | null;
  socials: string | null;
  latitude: number | null;
  longitude: number | null;
}

const useContact = () => {
    const [data, setData] = useState<ContactData>({
        address: '',
        phone: '',
        whatsapp: null,
        email: '',
        hours:  null,
        socials: null,
        latitude: null,
        longitude: null
    })

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Chargement des données
    // En résumé : Cette fonction va chercher les coordonnées sur le serveur, et les range dans notre boîte data.
    const fetchContact = async () => {
        setLoading(true); // On allume le voyant "Chargement" (pour afficher le spinner)
        setError(null); // On efface l'erreur précédente si elle existait
        try {
            const response = await apiCall<ContactData>('/api/admin/contact', {
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
    // Cela permet d'appeler updateContact en envoyant UNIQUEMENT les champs modifiés, pas tout l'objet.
    const updateContact = async (payload: Partial<ContactData>) => { // Avec Partial (tous les champs deviennent optionnels) 
        setError(null);
        setSuccess(false);
        try {
        const response = await apiCall<ContactData>('/api/admin/contact', {
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

    // Chargement initial
    // En résumé : Dès que quelqu'un utilise ce hook (ex: le formulaire de contact), il va automatiquement chercher les coordonnées existantes une seule fois.
    useEffect(() => {
        fetchContact(); // On appelle la fonction qui charge les données
    }, []); // Le tableau vide [] signifie : "Fais-le une seule fois, quand la page s'affiche"

    return {
        data,
        loading,
        error,
        success,
        updateContact,
        refresh: fetchContact,
    };
}

export {useContact}

// Ce hook fabrique un petit assistant qui fait tout le travail sale (appels réseau, gestion des erreurs, état de chargement) pour le formulaire de contact. Le formulaire n'a plus qu'à lire les informations (data, loading) et appeler les fonctions (updateContact). C'est ce qu'on appelle la séparation des responsabilités : le formulaire gère l'affichage, le hook gère la logique.