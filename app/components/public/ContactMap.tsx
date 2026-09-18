import { buildMapSrc } from "@/app/lib/utils"
interface ContactMapProps {
  latitude?: number | null
  longitude?: number | null
  address: string
}

// 🎯 Extraite pour être testable en isolation


const ContactMap = ({ latitude, longitude, address }: ContactMapProps) => {
  const mapSrc = buildMapSrc(latitude, longitude, address)

  return (
    <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
        <iframe
          title="Localisation de la boutique"
          src={mapSrc}
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  )
}

export { ContactMap, buildMapSrc }
export default ContactMap