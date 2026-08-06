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
  flyTrigger?: { lat: number, lng: number, zoom: number, ts: number } | null;
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

const customIcon = (risiko: string) => {
  const markerColor = getRiskColor(risiko);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${markerColor}" stroke="#fff" stroke-width="1"/>
      <circle cx="12" cy="9" r="3.5" fill="#fff"/>
    </svg>
  `;
  return new L.DivIcon({
    className: 'custom-svg-icon bg-transparent border-none',
    html: `<div style="cursor: pointer;">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
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

function MapFlyer({ trigger }: { trigger?: { lat: number, lng: number, zoom: number, ts: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (trigger) {
      map.flyTo([trigger.lat, trigger.lng], trigger.zoom, { duration: 1.5 });
    }
  }, [trigger?.ts, map]);
  return null;
}



export default function CityMapLeaflet({ height = "100%", markers = [], onSelectMarker, selectedMarker, onBoundsChange, className = "", mapType = 'peta', flyTrigger = null }: CityMapLeafletProps) {
  const defaultCenter: [number, number] = [-0.502106, 117.153709]; // Default to Samarinda
  
  const center = selectedMarker && selectedMarker.lat && selectedMarker.lng 
    ? [parseFloat(selectedMarker.lat), parseFloat(selectedMarker.lng)] as [number, number]
    : defaultCenter;

  const groupedMarkers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    markers.forEach(m => {
      if (m.lat && m.lng) {
        const key = `${m.lat},${m.lng}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      }
    });
    return Object.values(groups);
  }, [markers]);

  const renderedMarkers = useMemo(() => {
    return groupedMarkers.map((group, index) => {
      const primaryMarker = group[0];
      const isSelected = selectedMarker && group.some((m: any) => m.id === selectedMarker.id);
      
      return (
        <Marker 
          key={index} 
          position={[parseFloat(primaryMarker.lat), parseFloat(primaryMarker.lng)]}
          icon={customIcon(primaryMarker.risiko)}
          zIndexOffset={isSelected ? 1000 : 0}
          eventHandlers={{
            click: () => {
                if (onSelectMarker) {
                    onSelectMarker(primaryMarker);
                }
            }
          }}
        />
      );
    });
  }, [groupedMarkers, selectedMarker, onSelectMarker]);

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
        
        <MapFlyer trigger={flyTrigger} />
      </MapContainer>
      

    </div>
  );
}
