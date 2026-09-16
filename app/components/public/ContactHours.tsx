import { Clock } from 'lucide-react'

const ContactHours = ({ hours }: { hours: string | null }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-[#0A1730] text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1B5E38]" /> Horaires d'ouverture
            </h3>
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                {hours}
            </p>
        </div>
    )
}

export default ContactHours