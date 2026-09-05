'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/app/lib/api';
import { Upload, X, Plus, Loader2 } from 'lucide-react';
import { useProducts } from '@/app/hooks/useProduct';

// On définit le type des catégories reçues en props.
interface Category {
  id: number;
  name: string;
}
interface AdminProductFormProps {
  categories: Category[],
  productId?: number
}

const AdminProductForm = ({categories, productId} : AdminProductFormProps) => {
  const router = useRouter();
  const isEditing = Boolean(productId)
  const { data, loading, error, success, updateProduct, createProduct, refresh } = useProducts();


  const submitButtonText = !isEditing ? 'Créer le produit' : 'Mettre à jour';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('disponible');
  const [images, setImages] = useState<string[]>([]);

  // isSubmitting : true quand le formulaire est en cours d'envoi.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // error : message d'erreur à afficher en cas d'échec.
  const [localError, setLocalError] = useState<string | null>(null);
  // success : true quand la mise à jour a réussi.
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect((() => {
    refresh(productId as number)
  }), [productId])

  useEffect(() => {
    if (data) {
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(data?.price?.toString() || '');
      setCategoryId(data?.categoryId?.toString() || '');
      setStockStatus(data.stockStatus || 'disponible');
      setImages(data.images || []);
    }
  }, [data]);

  useEffect(() => {
      if (error) setLocalError(error);
      if (success) {
      setLocalSuccess(true);
      setTimeout(() => setLocalSuccess(false), 3000);
    }
  }, [error, success]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImageUrls = filesArray.map((file) => URL.createObjectURL(file));
      setImages((prevImages) => [...prevImages, ...newImageUrls]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // On réinitialise les messages d'état.
    setLocalError(null);
    setLocalSuccess(false);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        const haveSameImage = (a: string[], b: string[]) : boolean => {
          if (a.length !== b.length) return false
          return a.every((val, index) => val === b[index])
        }
        const hasChange = title !== (data?.title || '') || description !== (data?.description || '') || price !== (data?.price?.toString() || '') || categoryId !== (data?.categoryId?.toString() || '') || stockStatus !== (data?.stockStatus || '') || !haveSameImage(images, (data?.images || []))
        console.log(price)
        console.log(data?.price?.toString())
        console.log(price !== (data?.price?.toString() || ''))
        console.log(hasChange)
        if (!hasChange) {
          setLocalError('Aucune modification detectee')
          setIsSubmitting(false);
          return
        }

        // On transforme les valeurs du formulaire en un objet à envoyer à l'API.
        // Conversion du prix : on le transforme en nombre flottant (parseFloat).
        // Conversion du categoryId : on le transforme en nombre entier (parseInt).
        const payload: Record<string, any> = {
          id: productId,
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          categoryId: parseInt(categoryId, 10),
          stockStatus,
          images,
        };

        await updateProduct(payload)
      } else {
        const payload: Record<string, any> = {
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          categoryId: parseInt(categoryId, 10),
          stockStatus,
          images,
        };

        await createProduct(payload)
      }
    } finally {
      setIsSubmitting(false); // Réinitialise l'état du bouton quoi qu'il arrive
    }
  }

  const handleCancel = () => {
    router.push('/Admin/Products');
  };

  if (loading) {
    return (
      <div className="space-y-6 px-20 py-4 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-gray-200 rounded-xl h-120"></div>
          <div className="lg:col-span-5 bg-gray-200 rounded-xl  "></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto space-y-4">
      {/* Messages d'erreur et de succès */}
      {localError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {localError}
        </div>
      )}
      {localSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-sm">
          Produit {!isEditing ? 'créé' : 'mis à jour'} avec succès !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Colonne Gauche : Informations Générales */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Informations générales</h2>

          {/* Nom du produit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Nom du produit</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du produit"
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800"
            />
          </div>

          {/* Catégorie & Prix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Prix (FCFA)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Prix du produit"
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée du produit..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800 resize-none"
            />
          </div>

          {/* Statut du stock (Toggle Switch lié à stockStatus) */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-gray-700 block mb-2">Statut du stock</label>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setStockStatus(stockStatus === 'disponible' ? 'indisponible' : 'disponible')}
            >
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                  stockStatus === 'disponible' ? 'bg-[#154D38]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    stockStatus === 'disponible' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {stockStatus === 'disponible' ? 'Visible dans le catalogue public' : 'Masqué du catalogue'}
              </span>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Images & Actions */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Images du produit</h2>

            {/* Zone Drag & Drop / Upload */}
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-gray-300 transition-colors cursor-pointer bg-gray-50/50 ">
              <Upload className="w-5 h-5 text-gray-400 mb-2 mx-auto" />
              <p className="text-xs font-semibold text-gray-700">
                Glissez-déposez <span className="font-normal text-gray-500">vos images ici</span>
              </p>
              <p className="text-xs text-gray-500 mb-1">ou cliquez pour parcourir</p>
              <p className="text-[10px] text-gray-400">JPG, PNG — 5 Mo max par image</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {/* Aperçus des images */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  <img src={imgUrl} alt={`Aperçu ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                <Plus className="w-5 h-5" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Boutons d'Action */}
          <div className="space-y-2.5 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#11293C] hover:bg-[#0A1730] text-white py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitButtonText}</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdminProductForm;


//Cas A : Vous cliquez sur "Ajouter un produit" (Création)
//initialData vaut undefined.

//!undefined devient true.

//!true devient false.

//Résultat : isEditing vaut false.

// Cas B : Vous cliquez sur "Éditer un produit" (Édition)
// initialData vaut { id: 1, title: "Chaussure" } (une valeur "truthy" / existante).

// !{...} devient false.

// !false devient true.

// Résultat : isEditing vaut true.
//