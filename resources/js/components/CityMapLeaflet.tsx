import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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
  showHeatmap?: boolean;
}

const getRiskColor = (risiko: string) => {
  switch (risiko?.toLowerCase()) {
    case 'rendah': return 'var(--success)';
    case 'menengah rendah': return 'var(--info)';
    case 'menengah tinggi': return 'var(--warning)';
    case 'tinggi': return 'var(--danger)';
    case 'sangat tinggi': return 'var(--critical)';
    default: return 'var(--muted-foreground)';
  }
};

const customIcon = (risiko: string, isSelected: boolean = false) => {
  const markerColor = isSelected ? 'var(--primary)' : getRiskColor(risiko);
  const scale = isSelected ? 'transform: scale(1.1);' : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" style="outline: none; ${scale}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${markerColor}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="3.5" fill="#fff"/>
    </svg>
  `;
  return new L.DivIcon({
    className: 'custom-svg-icon bg-transparent border-none outline-none focus:outline-none',
    html: `<div style="cursor: pointer;" tabindex="0" aria-label="Marker Lokasi Usaha">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
};

function MapEventsHandler({ onBoundsChange, onSelectMarker }: { onBoundsChange?: (bounds: string) => void, onSelectMarker?: (marker: any) => void }) {
  const map = useMapEvents({
    click: () => {
      if (onSelectMarker) {
        onSelectMarker(null);
      }
    },
    moveend: () => {
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

function InvalidateSizeObserver() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function CityMapLeaflet({ height = "100%", markers = [], onSelectMarker, selectedMarker, onBoundsChange, className = "", mapType = 'peta', flyTrigger = null }: CityMapLeafletProps) {
  const defaultCenter: [number, number] = [-0.502106, 117.153709];

  const renderedMarkers = useMemo(() => {
    return markers.map((marker, index) => {
      if (!marker.lat || !marker.lng) return null;
      const isSelected = selectedMarker && marker.id === selectedMarker.id;

      return (
        <Marker
          key={`${marker.id || index}-${index}`}
          position={[parseFloat(marker.lat), parseFloat(marker.lng)]}
          icon={customIcon(marker.risiko, isSelected)}
          zIndexOffset={isSelected ? 1000 : 0}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              if (onSelectMarker) {
                onSelectMarker(marker);
              }
            },
            keypress: (e) => {
              if (e.originalEvent.key === 'Enter' && onSelectMarker) {
                onSelectMarker(marker);
              }
            }
          }}
        />
      );
    });
  }, [markers, selectedMarker, onSelectMarker]);

  const tileUrl = mapType === 'satelit'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = mapType === 'satelit'
    ? '&copy; Esri'
    : '&copy; OpenStreetMap';

  return (
    <div style={{ height, width: '100%', position: 'relative' }} className={className}>
      <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution={attribution} url={tileUrl} />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomright" />
        <MapEventsHandler onBoundsChange={onBoundsChange} onSelectMarker={onSelectMarker} />
        <InvalidateSizeObserver />
        
        <MarkerClusterGroup 
          chunkedLoading 
          maxClusterRadius={60} 
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {renderedMarkers}
        </MarkerClusterGroup>

        <MapFlyer trigger={flyTrigger} />
      </MapContainer>
    </div>
  );
}
