'use client'

import { useState, useEffect } from 'react';
import {useRouter} from 'next/navigation'
import { apiCall } from '@/app/lib/api';
import { Upload, X, Plus, Loader2, Form } from 'lucide-react';

interface InitialData {
    id?: number
    name: string
}

interface AdminCategoryFormProps {
    initialData?: InitialData
}

const AdminCategoryForm = ({initialData} : AdminCategoryFormProps) => {
    const router = useRouter()
    // Si initialData existe, on est en mode "édition". Sinon, "création".
    const isEditing = !!initialData;

    const submitButtonText = isEditing ? 'Mettre à jour' : 'Créer la categorie';

    // Si initialData existe, on l'utilise pour pré-remplir les champs.
    // Sinon, on met des valeurs par défaut (cas de la création).
    const [name, setName] = useState(initialData?.name || '');

    // isSubmitting : true quand le formulaire est en cours d'envoi.
    const [isSubmitting, setIsSubmitting] = useState(false);
    // error : message d'erreur à afficher en cas d'échec.
    const [error, setError] = useState<string | null>(null);
    // success : true quand la mise à jour a réussi.
    const [success, setSuccess] = useState(false);

    // Si la mise à jour réussit (success === true), on cache le message
    // de succès après 3 secondes.
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // On réinitialise les messages d'état.
        setError(null);
        setSuccess(false);
        setIsSubmitting(true);

        // On transforme les valeurs du formulaire en un objet à envoyer à l'API.
        const productData = {
            name: name.trim(),
        };

        try {
            // On détermine l'URL et la méthode en fonction du mode.
            // - Si édition : PUT /api/admin/categories/{id}
            // - Si création : POST /api/admin/categories
            const url = isEditing
                ? `/api/admin/categories/${initialData.id}`
                : '/api/admin/categories';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await apiCall<any>(url, {
                method: method,
                body: JSON.stringify(productData),
            });

            if (!response.success) {
                setError(response.message || 'Une erreur est survenue');
                return;
            }

            setSuccess(true);

            // Si c'est une création, on redirige vers la liste des produits après 1.5s.
            if (!isEditing) {
                setTimeout(() => {
                    router.push('/Admin/Categories');
                }, 1500);
            }
        } catch (error) {
            setError('Une erreur inattendue est survenue');
        } finally {
            setIsSubmitting(false);
        }
  };

  const handleCancel = () => {
    router.push('/Admin/Categories');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-sm">
          Catégorie {isEditing ? 'mise à jour' : 'créée'} avec succès !
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-gray-800">
          {isEditing ? 'Éditer la catégorie' : 'Nouvelle catégorie'}
        </h2>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Nom de la catégorie</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la catégorie"
            required
            className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800"
          />
        </div>

        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#11293C] hover:bg-[#0A1730] text-white py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitButtonText}</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </div>
    </form>
  )
  
}

export default AdminCategoryForm