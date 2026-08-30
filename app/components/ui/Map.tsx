'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet a besoin d'images pour les marqueurs. Sans cette correction,
// le marqueur apparaît comme un point d'interrogation.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const Map = ({latitude, longitude, address} : MapProps) => {
    const position: [number, number] = [latitude, longitude]

    return (
        // Le conteneur de la carte (définit le centre, le zoom, la taille).
        <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full rounded-lg"
        >
            {/* Couche de fond (OpenStreetMap) */}
            {/* La couche de fond (les routes, les bâtiments) provenant d'OpenStreetMap. */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Marqueur de la boutique */}
            {/* Le marqueur qui indique l'emplacement exact (lat/long) */}
            <Marker position={position}>
                {/* La bulle qui s'affiche quand on clique sur le marqueur. */}
                <Popup>
                    <strong>{address}</strong>
                    <br />
                    Notre boutique
                </Popup>
            </Marker>
        </MapContainer>
    )
}

export default Map