import { LucideIcon } from 'lucide-react'

interface ContactCardProps {
  title: string
  subtitle: string | null
  badge?: string
  href: string
  icon: LucideIcon
}

const ContactCard = ({ title, subtitle, badge, href, icon: Icon }: ContactCardProps) => {
    return (
        <a 
            href={href}
            target="_blank" 
            rel="noreferrer"
            className="bg-white p-5 rounded-xl border border-gray-200/80 hover:border-[#1B5E38] transition-colors flex items-start gap-4 group"
        >
            <div className="p-3 bg-emerald-50 text-[#1B5E38] rounded-lg group-hover:bg-[#1B5E38] group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-[#0A1730] text-sm">{title}</h3>
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                {badge && <span className="text-[10px] text-emerald-600 font-medium">{badge}</span>}
            </div>                                          
        </a>
    )
}

export default ContactCard