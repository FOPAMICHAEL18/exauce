'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  slug: string
}

const ViewTracker = ({ slug }: ViewTrackerProps) => {
  useEffect(() => {
    if (!slug) return

    // 🔒 Verrou persistant : évite StrictMode ET les refresh/rechargements
    const key = `viewed:${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    const controller = new AbortController()

    const trackView = async () => {
      try {
        await fetch(`/api/products/${encodeURIComponent(slug)}/views`, {
          method: 'POST',
          signal: controller.signal,
        })
      } catch (err) {
        // Ignore AbortError ET l'InterceptorError de MSW (abort après traitement)
        if (
            (err instanceof DOMException && err.name === 'AbortError') ||
            (err instanceof Error && err.message.includes('already been handled'))
        ) {
            return
        }
        console.error('Erreur tracking vue :', err)
      }
    }

    void trackView()

    return () => controller.abort()
  }, [slug])

  return null
}

export default ViewTracker