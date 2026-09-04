import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, ZoomControl, ScaleControl, Popup, CircleMarker, Marker } from 'react-leaflet';
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
  onHoverMarker?: (marker: any | null) => void;
  hoveredMarker?: any;
  onBoundsChange?: (bounds: string, zoom: number) => void;
  className?: string;
  mapType?: 'peta' | 'satelit';
  flyTrigger?: { lat: number, lng: number, zoom: number, ts: number } | null;
  showHeatmap?: boolean;
  isMobile?: boolean;
  renderPopup?: (marker: any) => React.ReactNode;
  isMiniMap?: boolean;
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

const customSvgIcon = (isSelected: boolean = false, isHovered: boolean = false) => {
  const fillColor = isSelected ? '#22c55e' : (isHovered ? '#15803d' : '#096e2eff');
  
  // Use filter for visual changes instead of transform: scale to keep hitbox stable
  let filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
  if (isSelected) {
    filter = 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.8)) brightness(1.1)';
  } else if (isHovered) {
    filter = 'drop-shadow(0 4px 8px rgba(21, 128, 61, 0.6)) brightness(1.1)';
  }

  const style = `outline: none; transition: filter 0.2s ease, fill 0.2s ease; filter: ${filter};`;

  const svg = `
    <svg enable-background="new 0 0 500 500" viewBox="0 0 500 500" width="32" height="32" style="${style}">
      <path clip-rule="evenodd" d="M227.788,172.774c0-12.538,10.177-22.713,22.713-22.713  c12.536,0,22.715,10.175,22.715,22.713c0,12.536-10.179,22.713-22.715,22.713C237.964,195.487,227.788,185.31,227.788,172.774z   M250.501,113.718c-32.619,0-59.056,26.441-59.056,59.056c0,32.615,26.437,59.056,59.056,59.056  c32.614,0,59.056-26.44,59.056-59.056C309.557,140.159,283.115,113.718,250.501,113.718z M109.676,170.228  c0,92.672,109.297,163.992,118.112,270.569v4.543c0,12.536,10.177,22.711,22.713,22.711c12.536,0,22.715-10.175,22.715-22.711  v-4.543c9.35-106.577,118.108-177.897,118.108-270.569c0-76.407-63.045-138.278-140.823-138.278  C172.729,31.949,109.676,93.821,109.676,170.228z M250.501,77.375c52.693,0,95.396,42.705,95.396,95.398  c0,52.694-42.702,95.398-95.398,95.398c-52.694,0-95.398-42.704-95.398-95.398C155.103,120.08,197.807,77.375,250.501,77.375z" fill="${fillColor}" fill-rule="evenodd"/>
    </svg>
  `;
  return new L.DivIcon({
    className: 'custom-svg-icon bg-transparent border-none outline-none focus:outline-none flex items-center justify-center',
    html: `<div style="cursor: pointer; display: flex; align-items: center; justify-content: center;" tabindex="0" aria-label="Marker Lokasi Usaha">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

function MapEventsHandler({ onBoundsChange, onSelectMarker }: { onBoundsChange?: (bounds: string, zoom: number) => void, onSelectMarker?: (marker: any) => void }) {
  const map = useMapEvents({
    click: () => {
      if (onSelectMarker) {
        onSelectMarker(null);
      }
    },
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds().pad(0.05);
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        onBoundsChange(`${sw.lat},${sw.lng},${ne.lat},${ne.lng}`, map.getZoom());
      }
    }
  });

  useEffect(() => {
    if (onBoundsChange) {
      const bounds = map.getBounds().pad(0.05);
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onBoundsChange(`${sw.lat},${sw.lng},${ne.lat},${ne.lng}`, map.getZoom());
    }
  }, [map, onBoundsChange]);

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

export default function CityMapLeaflet({ height = "100%", markers = [], onSelectMarker, selectedMarker, onHoverMarker, hoveredMarker, onBoundsChange, className = "", mapType = 'peta', flyTrigger = null, isMobile = false, renderPopup, isMiniMap = false }: CityMapLeafletProps) {
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultCenter: [number, number] = [-0.502106, 117.153709];

  const renderedMarkers = useMemo(() => {
    const safeMarkers = Array.isArray(markers) ? markers : [];
    return safeMarkers.map((marker, index) => {
      if (!marker.latitude || !marker.longitude) return null;

      const isSelected = selectedMarker && marker.id === selectedMarker.id;
      const isHovered = hoveredMarker && marker.id === hoveredMarker.id;

      return (
        <Marker
          key={`${marker.id || index}-${index}`}
          position={[parseFloat(marker.latitude), parseFloat(marker.longitude)]}
          icon={customSvgIcon(isSelected, isHovered)}
          zIndexOffset={isSelected ? 1000 : (isHovered ? 500 : 0)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e as any);
              if (onSelectMarker) {
                onSelectMarker(marker);
              }
            },
            mouseover: () => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              if (!hoveredMarker || hoveredMarker.id !== marker.id) {
                if (onHoverMarker) onHoverMarker(marker);
              }
            },
            mouseout: () => {
              hoverTimeoutRef.current = setTimeout(() => {
                if (onHoverMarker) onHoverMarker(null);
              }, 150);
            },
            keypress: (e) => {
              if (e.originalEvent.key === 'Enter' && onSelectMarker) {
                onSelectMarker(marker);
              }
            }
          }}
        >
        </Marker>
      );
    });
  }, [markers, selectedMarker, hoveredMarker, onSelectMarker, onHoverMarker, isMobile, renderPopup]);

  const tileUrl = mapType === 'satelit'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = mapType === 'satelit'
    ? '&copy; Esri'
    : '&copy; OpenStreetMap';

  return (
    <div style={{ height, width: '100%', position: 'relative' }} className={className}>
      <MapContainer preferCanvas={true} center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution={attribution} url={tileUrl} />
        <ZoomControl position={isMiniMap ? "topright" : "bottomright"} />
        {!isMiniMap && <ScaleControl position="bottomright" />}
        <MapEventsHandler onBoundsChange={onBoundsChange} onSelectMarker={onSelectMarker} />
        <InvalidateSizeObserver />

        {renderedMarkers}

        {(() => {
          const activePopupMarker = hoveredMarker && (!selectedMarker || hoveredMarker.id !== selectedMarker.id) ? hoveredMarker : null;
          return activePopupMarker && !isMobile && renderPopup && activePopupMarker.latitude && activePopupMarker.longitude ? (
            <Popup
              position={[parseFloat(activePopupMarker.latitude), parseFloat(activePopupMarker.longitude)]}
              className="custom-popup"
              closeButton={false}
              autoPan={false}
              minWidth={260}
            >
              <div
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    if (onHoverMarker) onHoverMarker(null);
                  }, 150);
                }}
                style={{ width: '100%', height: '100%' }}
              >
                {renderPopup(activePopupMarker)}
              </div>
            </Popup>
          ) : null;
        })()}

        <MapFlyer trigger={flyTrigger} />
      </MapContainer>
    </div>
  );
}
