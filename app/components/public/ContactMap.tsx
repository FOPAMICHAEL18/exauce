interface ContactMapProps {
  latitude?: number | null
  longitude?: number | null
  address: string
}

// 🎯 Extraite pour être testable en isolation
const buildMapSrc = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  address: string
): string => {
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  if (hasCoords) {
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
  }

  const trimmedAddress = address.trim()
  if (trimmedAddress.length > 0) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmedAddress)}&z=14&output=embed`
  }

  // 🎯 Fallback ultime : vue monde
  return 'https://maps.google.com/maps?q=0,0&z=2&output=embed'
}

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