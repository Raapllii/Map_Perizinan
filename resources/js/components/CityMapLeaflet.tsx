import React, { useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default leaflet marker icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CityMapLeafletProps {
  height?: string;
  markers?: any[];
  onSelectMarker?: (marker: any) => void;
  selectedMarker?: any;
  onBoundsChange?: (bounds: string) => void;
  className?: string;
  mapType?: 'peta' | 'satelit';
}

const getRiskColor = (risiko: string) => {
  switch (risiko?.toLowerCase()) {
    case 'rendah': return '#34A853'; // Hijau
    case 'menengah rendah': return '#4285F4'; // Biru
    case 'menengah tinggi': return '#FBBC05'; // Kuning
    case 'tinggi': return '#EA4335'; // Merah
    case 'sangat tinggi': return '#9C27B0'; // Ungu
    default: return '#9E9E9E'; // Abu-abu
  }
};

const customIcon = (risiko: string, isSelected: boolean = false) => {
  const markerColor = getRiskColor(risiko);
  const scale = isSelected ? 'scale(1.25)' : 'scale(1)';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${markerColor}" stroke="#fff" stroke-width="1"/>
      <circle cx="12" cy="9" r="3.5" fill="#fff"/>
    </svg>
  `;
  return new L.DivIcon({
    className: 'custom-svg-icon bg-transparent border-none',
    html: `<div style="transition: transform 0.2s ease; cursor: pointer; transform: ${scale};" onmouseover="this.style.transform='scale(1.25)'" onmouseout="this.style.transform='${scale}'">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

function MapEventsHandler({ onBoundsChange }: { onBoundsChange?: (bounds: string) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        onBoundsChange(`${sw.lat},${sw.lng},${ne.lat},${ne.lng}`);
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        onBoundsChange(`${sw.lat},${sw.lng},${ne.lat},${ne.lng}`);
      }
    }
  });
  return null;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function CityMapLeaflet({ height = "100%", markers = [], onSelectMarker, selectedMarker, onBoundsChange, className = "", mapType = 'peta' }: CityMapLeafletProps) {
  const defaultCenter: [number, number] = [-0.502106, 117.153709]; // Default to Samarinda
  
  const center = selectedMarker && selectedMarker.lat && selectedMarker.lng 
    ? [parseFloat(selectedMarker.lat), parseFloat(selectedMarker.lng)] as [number, number]
    : defaultCenter;

  const processedMarkers = useMemo(() => {
    const locationCounts: Record<string, number> = {};
    const locationIndices: Record<string, number> = {};
    
    // Count markers at each exact location
    markers.forEach(m => {
      if (m.lat && m.lng) {
        const key = `${m.lat},${m.lng}`;
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      }
    });

    return markers.filter(m => m.lat && m.lng).map(marker => {
      const key = `${marker.lat},${marker.lng}`;
      const total = locationCounts[key];
      const currentIndex = locationIndices[key] || 0;
      locationIndices[key] = currentIndex + 1;
      
      let finalLat = parseFloat(marker.lat);
      let finalLng = parseFloat(marker.lng);
      
      if (total > 1) {
        // Spiral/circle offset for overlapping coordinates
        const radiusLat = 0.00015 + (Math.floor(currentIndex / 8) * 0.0001);
        const radiusLng = 0.00015 + (Math.floor(currentIndex / 8) * 0.0001);
        const angle = (currentIndex / Math.min(total, 8)) * Math.PI * 2;
        
        finalLat += radiusLat * Math.cos(angle);
        finalLng += radiusLng * Math.sin(angle);
      }
      
      return { ...marker, finalLat, finalLng };
    });
  }, [markers]);

  const renderedMarkers = useMemo(() => {
    return processedMarkers.map((marker, index) => {
      const isSelected = selectedMarker?.id === marker.id;
      return (
        <Marker 
          key={index} 
          position={[marker.finalLat, marker.finalLng]}
          icon={customIcon(marker.risiko, isSelected)}
          zIndexOffset={isSelected ? 1000 : 0}
          eventHandlers={{
            click: () => onSelectMarker && onSelectMarker(marker),
          }}
        >
          <Popup className="custom-popup" closeButton={false}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px] flex flex-col items-center text-center">
              <h3 className="font-bold text-sm text-gray-900 mb-1">{marker.nama_perusahaan}</h3>
              <p className="text-xs text-gray-500 mb-3">{marker.judul_kbli}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); onSelectMarker && onSelectMarker(marker); }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                Lihat detail &gt;
              </button>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [processedMarkers, selectedMarker, onSelectMarker]);

  const tileUrl = mapType === 'satelit' 
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = mapType === 'satelit'
    ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    : '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div style={{ height, width: '100%', position: 'relative' }} className={className}>
      <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomright" />
        <MapEventsHandler onBoundsChange={onBoundsChange} />
        
        {renderedMarkers}
        
        {selectedMarker && selectedMarker.lat && selectedMarker.lng && (
           <MapController center={[parseFloat(selectedMarker.lat), parseFloat(selectedMarker.lng)]} />
        )}
      </MapContainer>
      
      {/* Global styles for Leaflet Popup to match design (no borders/padding from leaflet defaults) */}
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 12px; }
        .leaflet-popup-content { margin: 0; }
        .leaflet-popup-tip { box-shadow: none; }
      `}</style>
    </div>
  );
}
