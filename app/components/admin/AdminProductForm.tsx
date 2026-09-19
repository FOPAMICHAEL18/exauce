'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, Loader2 } from 'lucide-react'
import { useProducts } from '@/app/hooks/useProduct'

interface Category {
  id: number
  name: string
}

interface AdminProductFormProps {
  categories: Category[]
  productId?: number
}

const SUCCESS_HIDE_MS = 3000

// =========================================================================
// LOGIQUE PURE — testable en isolation
// =========================================================================
export const parsePrice = (value: string): number | null => {
  const num = parseFloat(value)
  if (!Number.isFinite(num) || num < 0) return null
  return num
}

export const parseCategoryId = (value: string): number | null => {
  const num = parseInt(value, 10)
  if (!Number.isInteger(num) || num <= 0) return null
  return num
}

export interface ComparableProduct {
  title: string
  description: string
  price: number
  categoryId: number
  stockStatus: string
  images: string[]
}

// 🎯 Détecte si un produit a changé — logique métier pure
export const hasProductChanged = (
  current: ComparableProduct,
  original: ComparableProduct
): boolean => {
  if (current.title !== original.title) return true
  if (current.description !== original.description) return true
  if (current.price !== original.price) return true
  if (current.categoryId !== original.categoryId) return true
  if (current.stockStatus !== original.stockStatus) return true
  if (current.images.length !== original.images.length) return true
  if (current.images.some((img, i) => img !== original.images[i])) return true
  return false
}

// =========================================================================
// COMPOSANT
// =========================================================================
const AdminProductForm = ({ categories, productId }: AdminProductFormProps) => {
  const router = useRouter()
  const isEditing = Boolean(productId)
  const {
    data,
    loading,
    error,
    success,
    updateProduct,
    createProduct,
    refresh,
  } = useProducts()

  const submitButtonText = !isEditing ? 'Créer le produit' : 'Mettre à jour'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [stockStatus, setStockStatus] = useState('disponible')
  const [images, setImages] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSuccess, setLocalSuccess] = useState(false)

  // 🔒 Timer ref pour éviter les fuites mémoire
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync : charge le produit en mode édition
  useEffect(() => {
    if (!productId) return
    refresh(productId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // Sync : pré-remplit le formulaire quand les données arrivent
  useEffect(() => {
    if (!data) return
    setTitle(data.title || '')
    setDescription(data.description || '')
    setPrice(data?.price?.toString() || '')
    setCategoryId(data?.categoryId?.toString() || '')
    setStockStatus(data.stockStatus || 'disponible')
    setImages(data.images || [])
  }, [data])

  // Sync : affiche les erreurs/succès du hook
  useEffect(() => {
    if (error) setLocalError(error)
    if (success) {
      setLocalSuccess(true)
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      successTimerRef.current = setTimeout(
        () => setLocalSuccess(false),
        SUCCESS_HIDE_MS
      )
    }
  }, [error, success])

  // 🔒 Cleanup du timer au démontage
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    const newImageUrls = filesArray.map((file) => URL.createObjectURL(file))
    setImages((prev) => [...prev, ...newImageUrls])
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setLocalSuccess(false)

    // 🎯 Validation avant tout envoi réseau
    const priceNumber = parsePrice(price)
    const categoryIdNumber = parseCategoryId(categoryId)

    if (priceNumber === null) {
      setLocalError('Le prix doit être un nombre positif.')
      return
    }
    if (categoryIdNumber === null) {
      setLocalError('Veuillez sélectionner une catégorie.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing) {
        const current: ComparableProduct = {
          title: title.trim(),
          description: description.trim(),
          price: priceNumber,
          categoryId: categoryIdNumber,
          stockStatus,
          images,
        }

        const original: ComparableProduct = {
          title: data?.title || '',
          description: data?.description || '',
          price: data?.price || 0,
          categoryId: data?.categoryId || 0,
          stockStatus: data?.stockStatus || '',
          images: data?.images || [],
        }

        if (!hasProductChanged(current, original)) {
          setLocalError('Aucune modification détectée.')
          return
        }

        await updateProduct({ id: productId, ...current })
      } else {
        await createProduct({
          title: title.trim(),
          description: description.trim(),
          price: priceNumber,
          categoryId: categoryIdNumber,
          stockStatus,
          images,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => router.push('/Admin/Products')

  const toggleStockStatus = () => {
    setStockStatus((prev) => (prev === 'disponible' ? 'rupture' : 'disponible'))
  }

  if (loading) {
    return (
      <div className="space-y-6 px-20 py-4 animate-pulse" aria-busy="true">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-gray-200 rounded-xl h-120"></div>
          <div className="lg:col-span-5 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto space-y-4">
      {localError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
        >
          {localError}
        </div>
      )}
      {localSuccess && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-sm"
        >
          Produit {!isEditing ? 'créé' : 'mis à jour'} avec succès !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Colonne Gauche */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-800">
            Informations générales
          </h2>

          <div className="space-y-1.5">
            <label
              htmlFor="product-title"
              className="text-xs font-semibold text-gray-700"
            >
              Nom du produit
            </label>
            <input
              id="product-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nom du produit"
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800 disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="product-category"
                className="text-xs font-semibold text-gray-700"
              >
                Catégorie
              </label>
              <select
                id="product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800 disabled:opacity-60"
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
              <label
                htmlFor="product-price"
                className="text-xs font-semibold text-gray-700"
              >
                Prix (FCFA)
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitting}
                placeholder="Prix du produit"
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="product-description"
              className="text-xs font-semibold text-gray-700"
            >
              Description
            </label>
            <textarea
              id="product-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Description détaillée du produit..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1730] text-gray-800 resize-none disabled:opacity-60"
            />
          </div>

          <div className="pt-2">
            <span className="text-xs font-semibold text-gray-700 block mb-2">
              Statut du stock
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={stockStatus === 'disponible'}
              aria-label="Rendre le produit visible dans le catalogue"
              onClick={toggleStockStatus}
              disabled={isSubmitting}
              className="flex items-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                  stockStatus === 'disponible' ? 'bg-[#154D38]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    stockStatus === 'disponible'
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {stockStatus === 'disponible'
                  ? 'Visible dans le catalogue public'
                  : 'Masqué du catalogue'}
              </span>
            </button>
          </div>
        </div>

        {/* Colonne Droite */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">
              Images du produit
            </h2>

            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-gray-300 transition-colors cursor-pointer bg-gray-50/50">
              <Upload
                className="w-5 h-5 text-gray-400 mb-2 mx-auto"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-gray-700">
                Glissez-déposez{' '}
                <span className="font-normal text-gray-500">vos images ici</span>
              </p>
              <p className="text-xs text-gray-500 mb-1">
                ou cliquez pour parcourir
              </p>
              <p className="text-[10px] text-gray-400">
                JPG, PNG — 5 Mo max par image
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                aria-label="Ajouter des images"
                className="hidden"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {images.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl}-${idx}`}
                  className="relative w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Aperçu ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={`Supprimer l'image ${idx + 1}`}
                    disabled={isSubmitting}
                    className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                <Plus className="w-5 h-5" aria-hidden="true" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  aria-label="Ajouter une image"
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2.5 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#11293C] hover:bg-[#0A1730] text-white py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              <span>{submitButtonText}</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default AdminProductForm