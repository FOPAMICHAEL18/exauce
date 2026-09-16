'use client'

import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'

interface ContactFormProps {
  whatsappNumber: string | null
}

const ContactForm = ({ whatsappNumber }: ContactFormProps) => {
    const [submitted, setSubmitted] = useState(false)
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const cleanWhatsapp = whatsappNumber?.replace(/[^0-9]/g, '')
        const text = `Bonjour, je suis ${formData.name}.\n\n${formData.message}\n\n📍 Contact : ${formData.phone} ${formData.email ? `| ${formData.email}` : ''}`
        
        window.open(`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(text)}`, '_blank')
        setSubmitted(true)
    }

    if (submitted) {
        return (
        <div className="p-4 bg-emerald-50 text-[#1B5E38] rounded-lg text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Votre message a été généré ! Une fenêtre WhatsApp vient de s'ouvrir.</span>
        </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Nom complet *</label>
                    <input 
                        type="text" 
                        required 
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Téléphone / WhatsApp *</label>
                    <input 
                        type="tel" 
                        required 
                        placeholder="+237 6..."
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">E-mail (optionnel)</label>
                <input 
                type="email" 
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Message *</label>
                <textarea 
                required 
                rows={4} 
                placeholder="Quel produit recherchez-vous ?"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E38]"
                ></textarea>
            </div>

            <button 
                type="submit" 
                className="px-6 py-2.5 bg-[#0A1730] hover:bg-[#1B5E38] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
                <Send className="w-3.5 h-3.5" /> Envoyer sur WhatsApp
            </button>
        </form>
    )
}

export default ContactForm