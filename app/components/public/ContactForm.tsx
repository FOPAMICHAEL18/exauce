'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'

interface ContactFormProps {
  whatsappNumber: string | null
}

interface FormState {
  name: string
  phone: string
  email: string
  message: string
}

const INITIAL_FORM: FormState = { name: '', phone: '', email: '', message: '' }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PHONE_DIGITS = 6

const buildWhatsAppMessage = (data: FormState): string => {
  const name = data.name.trim()
  const phone = data.phone.trim()
  const email = data.email.trim()
  const message = data.message.trim()
  const contactLine = email ? `${phone} | ${email}` : phone
  return `Bonjour, je suis ${name}.\n\n${message}\n\n📍 Contact : ${contactLine}`
}

const normalizePhone = (phone: string | null): string =>
  phone ? phone.replace(/\D/g, '') : ''

const ContactForm = ({ whatsappNumber }: ContactFormProps) => {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)

  const cleanWhatsapp = normalizePhone(whatsappNumber)

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      if (error) setError(null)
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 🔴 Guard : numéro WhatsApp absent
    if (!cleanWhatsapp) {
      setError("Le contact WhatsApp n'est pas disponible pour le moment.")
      return
    }

    // Validation email (uniquement si fourni)
    const trimmedEmail = formData.email.trim()
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Adresse email invalide.')
      return
    }

    // Validation téléphone (au moins 6 chiffres)
    const digitsOnly = formData.phone.replace(/\D/g, '')
    if (digitsOnly.length < MIN_PHONE_DIGITS) {
      setError('Numéro de téléphone invalide.')
      return
    }

    const text = buildWhatsAppMessage(formData)
    const url = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(text)}`

    try {
      window.open(url, '_blank', 'noopener,noreferrer')
      setSubmitted(true)
    } catch {
      setError("Une erreur est survenue lors de l'ouverture de WhatsApp.")
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="p-4 bg-emerald-50 text-[#1B5E38] rounded-lg text-xs flex items-center gap-3"
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>Votre message a été généré ! Une fenêtre WhatsApp vient de s'ouvrir.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="contact-name" className="text-xs font-semibold text-gray-700">
            Nom complet <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            placeholder="Votre nom"
            value={formData.name}
            onChange={handleChange('name')}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contact-phone" className="text-xs font-semibold text-gray-700">
            Téléphone / WhatsApp <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            required
            placeholder="+237 6..."
            value={formData.phone}
            onChange={handleChange('phone')}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-email" className="text-xs font-semibold text-gray-700">
          E-mail (optionnel)
        </label>
        <input
          id="contact-email"
          type="email"
          placeholder="vous@exemple.com"
          value={formData.email}
          onChange={handleChange('email')}
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-message" className="text-xs font-semibold text-gray-700">
          Message <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          placeholder="Quel produit recherchez-vous ?"
          value={formData.message}
          onChange={handleChange('message')}
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
        />
      </div>

      <button
        type="submit"
        className="px-6 py-2.5 bg-[#0A1730] hover:bg-[#1B5E38] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" aria-hidden="true" />
        Envoyer sur WhatsApp
      </button>
    </form>
  )
}

export default ContactForm