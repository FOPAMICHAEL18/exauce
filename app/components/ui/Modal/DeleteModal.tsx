import { AlertTriangle, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface DeleteModalProps {
    elementToDelete: string
    closeDeleteModal: () => void
    confirmDelete: () => void
}

const DeleteModal = ({elementToDelete, closeDeleteModal, confirmDelete} : DeleteModalProps) => {
    const pathname = usePathname()

    const context: Record<string, any> = {
        '/Admin/Products': {line1: 'Supprimer ce produit ?', line2: 'Êtes-vous sûr de vouloir supprimer le produit'}, 
        '/Admin/Categories': {line1: 'Supprimer cette categorie ?', line2: 'Êtes-vous sûr de vouloir supprimer la categorie'}, 
        '/Admin/Reviews': {line1: 'Supprimer ce commentaire ?', line2: 'Êtes-vous sûr de vouloir supprimer ce commentaire'} 
    }

    const contextPathname = context[pathname] 

    return (
        <div className="fixed w-screen h-screen inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 flex items-start gap-4">
                    <div className="bg-red-100 p-2.5 rounded-full shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1 pt-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {contextPathname.line1}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {contextPathname.line2} <span className="font-semibold text-gray-800">"{elementToDelete}"</span> ? Cette action est irréversible.
                        </p>
                    </div>
                    <button 
                        onClick={closeDeleteModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-gray-50 px-5 py-4 flex justify-end gap-3 border-t border-gray-100">
                    <button 
                        onClick={closeDeleteModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
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

export {DeleteModal}