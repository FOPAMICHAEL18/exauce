'use client' // OBLIGATOIRE : error.tsx doit être un Client Component.

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Ici tu logges l'erreur. Aujourd'hui console.error,
    // demain Sentry.captureException(error) quand tu l'ajouteras.
    console.error('Erreur admin:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
      <h1 className="text-2xl font-bold text-[#0A1730]">
        Une erreur est survenue
      </h1>
      <p className="text-gray-600 text-sm text-center max-w-md">
        Le tableau de bord est temporairement indisponible. Si le problème
        persiste, contactez le support.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#1B5E38] hover:bg-[#14472A] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}