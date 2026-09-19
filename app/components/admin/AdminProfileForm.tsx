'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/app/hooks/useProfile'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6
const SUCCESS_HIDE_MS = 3000

export interface PasswordValidationInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 🎯 Type discriminé : quand ok=false, error est GARANTI
export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; error: string }

export const validatePasswordChange = (
  input: PasswordValidationInput
): PasswordValidationResult => {
  const { currentPassword, newPassword, confirmPassword } = input

  if (!currentPassword && !newPassword && !confirmPassword) {
    return { ok: true }
  }

  if (!newPassword && !confirmPassword && currentPassword) {
    return {
      ok: false,
      error: 'Remplissez le nouveau mot de passe ou videz le mot de passe actuel.',
    }
  }

  if (!currentPassword) {
    return { ok: false, error: 'Veuillez entrer votre mot de passe actuel.' }
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'Les mots de passe ne correspondent pas.' }
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    }
  }

  return { ok: true }
}

const AdminProfileForm = () => {
  const router = useRouter()
  const { data, loading, error, success, updateProfile, refresh } = useProfile()

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSuccess, setLocalSuccess] = useState(false)

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!data) return
    setName(data.name || '')
    setSurname(data.surname || '')
    setEmail(data.email || '')
  }, [data])

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

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setLocalSuccess(false)

    const trimmedName = name.trim()
    const trimmedSurname = surname.trim()
    const trimmedEmail = email.trim()

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setLocalError('Adresse email invalide.')
      return
    }

    const hasTextChanged =
      trimmedName !== (data?.name || '') ||
      trimmedSurname !== (data?.surname || '') ||
      trimmedEmail !== (data?.email || '')

    const pwdValidation = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
    })

    // 🎯 TypeScript garantit que pwdValidation.error existe quand ok=false
    if (!pwdValidation.ok) {
      setLocalError(pwdValidation.error)
      return
    }

    const isChangingPassword = Boolean(newPassword && currentPassword)

    if (!hasTextChanged && !isChangingPassword) {
      setLocalError('Aucune modification détectée.')
      return
    }

    const payload: Record<string, string> = {
      name: trimmedName,
      surname: trimmedSurname,
      email: trimmedEmail,
    }
    if (isChangingPassword) {
      payload.currentPassword = currentPassword
      payload.newPassword = newPassword
    }

    setIsSubmitting(true)
    try {
      const result = await updateProfile(payload)
      if (result) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        await refresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-xl h-96"></div>
          <div className="bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

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
          Profil mis à jour avec succès !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Profil du vendeur</h2>

          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Nom / pseudo <span aria-hidden="true">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="Ouelou"
            />
          </div>

          <div>
            <label
              htmlFor="profile-surname"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Prénom
            </label>
            <input
              id="profile-surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="Jean-Baptiste"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              E-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="contact@maison-ebene.cm"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Changer le mot de passe
          </h2>

          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Mot de passe actuel
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder={`•••••••• (minimum ${MIN_PASSWORD_LENGTH} caractères)`}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#0A1730] text-white text-sm font-semibold rounded-lg hover:bg-[#0A1730]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AdminProfileForm