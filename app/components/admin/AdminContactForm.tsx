'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useContact } from '@/app/hooks/useContact'
import Map from '../ui/Map'

const SUCCESS_HIDE_MS = 3000

// 🎯 Parsing GPS isolé et borné
export const parseGpsInput = (
  value: string
): { latitude: number | null; longitude: number | null } => {
  if (!value.trim()) return { latitude: null, longitude: null }

  const matches = value.match(/(-?\d+(?:\.\d+)?)/g)
  if (!matches || matches.length < 2) return { latitude: null, longitude: null }

  const lat = parseFloat(matches[0])
  const lng = parseFloat(matches[1])

  // 🎯 Bornes GPS réelles
  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90
  const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180

  if (!validLat || !validLng) return { latitude: null, longitude: null }

  return { latitude: lat, longitude: lng }
}

// 🎯 Parsing horaires isolé
export const parseHours = (
  hours: string
): { weekday: string; saturday: string; sunday: string } => {
  const result = {
    weekday: '08:00 – 18:00',
    saturday: '09:00 – 15:00',
    sunday: 'Fermé',
  }

  hours.split('\n').forEach((line) => {
    if (line.startsWith('Lundi – Vendredi:'))
      result.weekday = line.replace('Lundi – Vendredi:', '').trim()
    if (line.startsWith('Samedi:'))
      result.saturday = line.replace('Samedi:', '').trim()
    if (line.startsWith('Dimanche:'))
      result.sunday = line.replace('Dimanche:', '').trim()
  })

  return result
}

const AdminContactForm = () => {
  const router = useRouter()
  const { data, loading, error, success, updateContact, refresh } = useContact()

  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  const [weekdayHours, setWeekdayHours] = useState('08:00 – 18:00')
  const [saturdayHours, setSaturdayHours] = useState('09:00 – 15:00')
  const [sundayHours, setSundayHours] = useState('Fermé')

  const [gpsInput, setGpsInput] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSuccess, setLocalSuccess] = useState(false)

  // 🔒 Timer ref pour cleanup
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGpsChange = (value: string) => {
    setGpsInput(value)
    const { latitude: lat, longitude: lng } = parseGpsInput(value)
    setLatitude(lat)
    setLongitude(lng)
  }

  // Sync avec les données du hook
  useEffect(() => {
    if (!data) return

    setAddress(data.address || '')
    setPhone(data.phone || '')
    setWhatsapp(data.whatsapp || '')
    setEmail(data.email || '')

    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      setLatitude(data.latitude)
      setLongitude(data.longitude)
      setGpsInput(`${data.latitude}° N, ${data.longitude}° E`)
    } else {
      setLatitude(null)
      setLongitude(null)
      setGpsInput('')
    }

    if (data.hours) {
      const parsed = parseHours(data.hours)
      setWeekdayHours(parsed.weekday)
      setSaturdayHours(parsed.saturday)
      setSundayHours(parsed.sunday)
    }
  }, [data])

  // Sync erreur / succès du hook
  useEffect(() => {
    if (error) setLocalError(error)
    if (success) {
      setLocalSuccess(true)
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      successTimerRef.current = setTimeout(() => setLocalSuccess(false), SUCCESS_HIDE_MS)
    }
  }, [error, success])

  // Cleanup du timer au démontage
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setLocalSuccess(false)
    setIsSubmitting(true)

    const formattedHours = `Lundi – Vendredi: ${weekdayHours}\nSamedi: ${saturdayHours}\nDimanche: ${sundayHours}`

    const payload = {
      address: address.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || null,
      email: email.trim(),
      hours: formattedHours,
      latitude,
      longitude,
    }

    const isOk = await updateContact(payload)
    setIsSubmitting(false)

    if (isOk) {
      await refresh()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-xl h-135"></div>
          <div className="bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  const showMap =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {localError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          {localError}
        </div>
      )}
      {localSuccess && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm"
        >
          Coordonnées mises à jour avec succès !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Coordonnées publiques</h2>

          <div>
            <label htmlFor="contact-address" className="block text-xs font-semibold text-gray-700 mb-1">
              Adresse de l'atelier
            </label>
            <input
              id="contact-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="Rue des Artisans, Bonanjo, Douala"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className="block text-xs font-semibold text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
                placeholder="+237 6 99 12 34 56"
              />
            </div>
            <div>
              <label htmlFor="contact-whatsapp" className="block text-xs font-semibold text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                id="contact-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
                placeholder="+237 6 99 12 34 56"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="contact@maison-ebene.cm"
            />
          </div>

          <div>
            <label htmlFor="contact-gps" className="block text-xs font-semibold text-gray-700 mb-1">
              Lien carte (coordonnées GPS)
            </label>
            <input
              id="contact-gps"
              type="text"
              value={gpsInput}
              onChange={(e) => handleGpsChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="4.0483° N, 9.7043° E"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Horaires d'ouverture</h2>

          <div className="space-y-3">
            <div>
              <label htmlFor="hours-weekday" className="block text-xs font-semibold text-gray-700 mb-1">
                Lundi – Vendredi
              </label>
              <input
                id="hours-weekday"
                type="text"
                value={weekdayHours}
                onChange={(e) => setWeekdayHours(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
                placeholder="08:00 – 18:00"
              />
            </div>

            <div>
              <label htmlFor="hours-saturday" className="block text-xs font-semibold text-gray-700 mb-1">
                Samedi
              </label>
              <input
                id="hours-saturday"
                type="text"
                value={saturdayHours}
                onChange={(e) => setSaturdayHours(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
                placeholder="09:00 – 15:00"
              />
            </div>

            <div>
              <label htmlFor="hours-sunday" className="block text-xs font-semibold text-gray-700 mb-1">
                Dimanche
              </label>
              <input
                id="hours-sunday"
                type="text"
                value={sundayHours}
                onChange={(e) => setSundayHours(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
                placeholder="Fermé"
              />
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Aperçu carte</h3>
            {showMap ? (
              <div className="h-44 rounded-lg overflow-hidden border border-gray-100">
                <Map latitude={latitude!} longitude={longitude!} address={address} />
              </div>
            ) : (
              <div className="h-44 bg-gray-50 rounded-lg border border-gray-200/60 flex items-center justify-center text-gray-400 text-xs">
                Carte — Location actuelle
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#0A1730] text-white text-sm font-semibold rounded-lg hover:bg-[#0A1730]/90 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/Admin/Dashboard')}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all disabled:opacity-60"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

export default AdminContactForm