'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/app/lib/api';
import { Upload, X, Plus, Loader2 } from 'lucide-react';

// On définit le type des données d'un produit pour TypeScript.
// Cela permet d'avoir l'autocomplétion et la vérification des types.
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

// On définit le type des catégories reçues en props.
interface Category {
  id: number;
  name: string;
}

// On définit les props que le composant ProductForm va recevoir.
interface AdminProductFormProps {
  // initialData est optionnel car ce composant sera aussi utilisé
  // pour la création (où il n'y a pas de données initiales).
  initialData?: ProductData;
  // categories est obligatoire car l'admin doit choisir une catégorie.
  categories: Category[];
}

const AdminProductForm = ({ initialData, categories }: AdminProductFormProps) => {
  const router = useRouter();

  // Si initialData existe, on est en mode "édition". Sinon, "création".
  const isEditing = !!initialData;

  const submitButtonText = isEditing ? 'Mettre à jour' : 'Créer le produit';

  // Si initialData existe, on l'utilise pour pré-remplir les champs.
  // Sinon, on met des valeurs par défaut (cas de la création).
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId?.toString() || '');
  const [stockStatus, setStockStatus] = useState(initialData?.stockStatus || 'disponible');
  const [images, setImages] = useState<string[]>(initialData?.images || []);

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
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    // On transforme les valeurs du formulaire en un objet à envoyer à l'API.
    // Conversion du prix : on le transforme en nombre flottant (parseFloat).
    // Conversion du categoryId : on le transforme en nombre entier (parseInt).
    const productData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      categoryId: parseInt(categoryId, 10),
      stockStatus: stockStatus,
      images: images,
    };

    try {
      // On détermine l'URL et la méthode en fonction du mode.
      // - Si édition : PUT /api/admin/products/{id}
      // - Si création : POST /api/admin/products
      const url = isEditing
        ? `/api/admin/products/${initialData.id}`
        : '/api/admin/products';
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
          router.push('/Admin/Products');
        }, 1500);
      }
    } catch (error) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/Admin/Products');
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto space-y-4">
      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-sm">
          Produit {isEditing ? 'mis à jour' : 'créé'} avec succès !
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
            <label className="text-xs font-semibold text-gray-700 block mb-2">Statut de publication</label>
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