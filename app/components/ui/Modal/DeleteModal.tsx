'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface DeleteModalProps {
  elementToDelete: string
  closeDeleteModal: () => void
  confirmDelete: () => void
}

interface ModalContext {
  line1: string
  line2: string
}

const FALLBACK: ModalContext = {
  line1: 'Supprimer cet élément ?',
  line2: 'Êtes-vous sûr de vouloir supprimer cet élément',
}

// 🎯 Match par préfixe : /Admin/Products/123/Edit → context /Admin/Products
const CONTEXTS: { prefix: string; context: ModalContext }[] = [
  {
    prefix: '/Admin/Products',
    context: {
      line1: 'Supprimer ce produit ?',
      line2: 'Êtes-vous sûr de vouloir supprimer le produit',
    },
  },
  {
    prefix: '/Admin/Categories',
    context: {
      line1: 'Supprimer cette catégorie ?',
      line2: 'Êtes-vous sûr de vouloir supprimer la catégorie',
    },
  },
  {
    prefix: '/Admin/Reviews',
    context: {
      line1: 'Supprimer ce commentaire ?',
      line2: 'Êtes-vous sûr de vouloir supprimer ce commentaire',
    },
  },
]

const resolveContext = (pathname: string): ModalContext =>
  CONTEXTS.find((c) => pathname.startsWith(c.prefix))?.context ?? FALLBACK

const DeleteModal = ({
  elementToDelete,
  closeDeleteModal,
  confirmDelete,
}: DeleteModalProps) => {
  const pathname = usePathname()
  const context = resolveContext(pathname)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 🎯 Escape ferme + focus initial sur data-autofocus
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDeleteModal()
    }
    document.addEventListener('keydown', handleKey)

    // 🎯 Focus explicite sur le bouton marqué data-autofocus (Annuler)
    dialogRef.current
      ?.querySelector<HTMLButtonElement>('[data-autofocus]')
      ?.focus()

    return () => {
      document.removeEventListener('keydown', handleKey)
    }
  }, [closeDeleteModal])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeDeleteModal()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm h-full"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-5 flex items-start gap-4">
          <div className="bg-red-100 p-2.5 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="flex-1 pt-1">
            <h3
              id="delete-modal-title"
              className="text-lg font-semibold text-gray-900 mb-1"
            >
              {context.line1}
            </h3>
            <p
              id="delete-modal-desc"
              className="text-sm text-gray-500 leading-relaxed"
            >
              {context.line2}{' '}
              <span className="font-semibold text-gray-800">
                &laquo;&nbsp;{elementToDelete}&nbsp;&raquo;
              </span>{' '}
              ? Cette action est irréversible.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDeleteModal}
            aria-label="Fermer la modale"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="bg-gray-50 px-5 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            data-autofocus
            onClick={closeDeleteModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
          >
            Oui, supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export { DeleteModal }