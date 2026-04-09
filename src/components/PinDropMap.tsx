import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PIN_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none">
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#E8457C"/>
  <circle cx="18" cy="17" r="7" fill="white"/>
</svg>`);

const pinIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${PIN_SVG}`,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -48],
});

const DEFAULT_CENTER: [number, number] = [41.8781, -87.6298];
const DEFAULT_ZOOM = 13;

type LatLng = { lat: number; lng: number };

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address;
    if (!addr) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
    const state = addr.state || "";
    const parts = [city, state].filter(Boolean);
    return parts.length > 0
      ? parts.join(", ")
      : data.display_name?.split(",").slice(0, 2).join(",").trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  const prevCenter = useRef(center);
  useEffect(() => {
    if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
      prevCenter.current = center;
    }
  }, [center, zoom, map]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

type PinDropMapProps = {
  pin: LatLng | null;
  locationName: string;
  radiusMiles: number | null;
  onPinChange: (pin: LatLng, locationName: string) => void;
  className?: string;
  height?: number;
};

export function PinDropMap({ pin, locationName, radiusMiles, onPinChange, className = "", height = 340 }: PinDropMapProps) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [geolocated, setGeolocated] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (geolocated) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(loc);
        setFlyTarget(loc);
        setGeolocated(true);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [geolocated]);

  const handleClick = useCallback(
    async (latlng: LatLng) => {
      setGeocoding(true);
      setFlyTarget([latlng.lat, latlng.lng]);
      const name = await reverseGeocode(latlng.lat, latlng.lng);
      onPinChange(latlng, name);
      setGeocoding(false);
    },
    [onPinChange]
  );

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFlyTarget([latlng.lat, latlng.lng]);
        setGeocoding(true);
        const name = await reverseGeocode(latlng.lat, latlng.lng);
        onPinChange(latlng, name);
        setGeocoding(false);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onPinChange]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
        <MapContainer
          center={pin ? [pin.lat, pin.lng] : center}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ClickHandler onMapClick={handleClick} />
          {flyTarget && <FlyTo center={flyTarget} />}
          {pin && <Marker position={[pin.lat, pin.lng]} icon={pinIcon} />}
          {pin && radiusMiles && (
            <Circle
              center={[pin.lat, pin.lng]}
              radius={radiusMiles * 1609.34}
              pathOptions={{
                color: "#E8457C",
                fillColor: "#E8457C",
                fillOpacity: 0.08,
                weight: 2,
                opacity: 0.35,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Locate-me button */}
      <button
        type="button"
        onClick={handleLocateMe}
        className="absolute top-3 right-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
        title="Use my location"
      >
        <svg className="w-5 h-5 text-[var(--color-brown)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
        </svg>
      </button>

      {/* Prompt overlay */}
      {!pin && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="bg-white/90 backdrop-blur-md text-[var(--color-brown)] text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">
            Tap to drop a pin
          </div>
        </div>
      )}

      {/* Location pill -- slides up from bottom of map */}
      {pin && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-pink-light)] flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[var(--color-sand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-brown)] font-semibold text-sm truncate">
                {geocoding ? "Finding location..." : locationName}
              </p>
              {!geocoding && (
                <p className="text-[var(--color-muted)] text-xs">
                  Tap elsewhere to move pin
                </p>
              )}
            </div>
            {geocoding && (
              <div className="w-5 h-5 border-2 border-[var(--color-sand)] border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
