import { Clock } from 'lucide-react'

interface ContactHoursProps {
  hours: string | null
}

const ContactHours = ({ hours }: ContactHoursProps) => {
  // Normalise : trim + null si vide
  const trimmed = hours?.trim() ?? ''
  const hasHours = trimmed.length > 0

  return (
    <div
      className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-4"
      aria-labelledby="contact-hours-title"
    >
      <h3
        id="contact-hours-title"
        className="font-bold text-[#0A1730] text-sm flex items-center gap-2"
      >
        <Clock
          className="w-4 h-4 text-[#1B5E38]"
          aria-hidden="true"
        />
        Horaires d'ouverture
      </h3>

      {hasHours ? (
        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
          {trimmed}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Horaires non communiqués.
        </p>
      )}
    </div>
  )
}

export default ContactHours