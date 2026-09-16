interface ContactMapProps {
  latitude?: number | null
  longitude?: number | null
  address: string
}

const ContactMap = ({latitude, longitude, address} : ContactMapProps) => {
    const mapSrc = latitude && longitude 
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=14&output=embed`

    return (
        <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
                <iframe 
                title="Localisation Boutique"
                src={mapSrc}
                className="w-full h-full border-0"
                loading="lazy"
                ></iframe>
            </div>
        </div>
    )
}

export default ContactMap