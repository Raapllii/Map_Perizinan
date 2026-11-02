import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, ZoomControl, ScaleControl, Popup, Marker } from 'react-leaflet';
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
  renderPopup?: (marker: any, options?: { maxHeight?: number }) => React.ReactNode;
  isMiniMap?: boolean;
}

import { getRiskConfig } from '../lib/riskUtils';

const customSvgIcon = (marker: any, isSelected: boolean = false, isHovered: boolean = false) => {
  const riskConfig = getRiskConfig(marker?.uraian_risiko_proyek);
  const fillColor = riskConfig.hexColor;
  
  let filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
  let transform = 'scale(1)';
  if (isSelected) {
    filter = `drop-shadow(0 0 10px ${fillColor}) drop-shadow(0 0 4px rgba(0,0,0,0.6)) brightness(1.15)`;
    transform = 'scale(1.15)';
  } else if (isHovered) {
    filter = `drop-shadow(0 4px 10px ${fillColor}) brightness(1.1)`;
    transform = 'scale(1.08)';
  }

  const style = `outline: none; transition: all 0.2s ease; filter: ${filter}; transform: ${transform}; transform-origin: bottom center;`;

  const selectedHalo = isSelected ? `
    <circle cx="250" cy="172" r="150" fill="none" stroke="${fillColor}" stroke-width="28" opacity="0.85" />
    <circle cx="250" cy="172" r="175" fill="none" stroke="#ffffff" stroke-width="14" opacity="0.95" />
  ` : '';

  const svg = `
    <svg enable-background="new 0 0 500 500" viewBox="0 0 500 500" width="34" height="34" style="${style}">
      ${selectedHalo}
      <path clip-rule="evenodd" d="M227.788,172.774c0-12.538,10.177-22.713,22.713-22.713  c12.536,0,22.715,10.175,22.715,22.713c0,12.536-10.179,22.713-22.715,22.713C237.964,195.487,227.788,185.31,227.788,172.774z   M250.501,113.718c-32.619,0-59.056,26.441-59.056,59.056c0,32.615,26.437,59.056,59.056,59.056  c32.614,0,59.056-26.44,59.056-59.056C309.557,140.159,283.115,113.718,250.501,113.718z M109.676,170.228  c0,92.672,109.297,163.992,118.112,270.569v4.543c0,12.536,10.177,22.711,22.713,22.711c12.536,0,22.715-10.175,22.715-22.711  v-4.543c9.35-106.577,118.108-177.897,118.108-270.569c0-76.407-63.045-138.278-140.823-138.278  C172.729,31.949,109.676,93.821,109.676,170.228z M250.501,77.375c52.693,0,95.396,42.705,95.396,95.398  c0,52.694-42.702,95.398-95.398,95.398c-52.694,0-95.398-42.704-95.398-95.398C155.103,120.08,197.807,77.375,250.501,77.375z" fill="${fillColor}" fill-rule="evenodd"/>
    </svg>
  `;
  return new L.DivIcon({
    className: 'custom-svg-icon bg-transparent border-none outline-none focus:outline-none flex items-center justify-center',
    html: `<div style="cursor: pointer; display: flex; align-items: center; justify-content: center;" tabindex="0" aria-label="Marker Lokasi Usaha (${riskConfig.category})">${svg}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
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

interface AdaptivePopupProps {
  marker: any;
  isMiniMap?: boolean;
  isMobile?: boolean;
  selectedMarker?: any;
  hoverTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  onHoverMarker?: (marker: any | null) => void;
  renderPopup: (marker: any, options?: { maxHeight?: number }) => React.ReactNode;
}

function AdaptivePopup({
  marker,
  isMiniMap = false,
  isMobile = false,
  selectedMarker,
  hoverTimeoutRef,
  onHoverMarker,
  renderPopup,
}: AdaptivePopupProps) {
  const map = useMap();
  const popupRef = useRef<L.Popup | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const lat = parseFloat(marker.latitude);
  const lng = parseFloat(marker.longitude);

  const computePopupLayout = useCallback(
    (cardWidth: number, cardHeight: number) => {
      const mapSize = map.getSize();
      const point = map.latLngToContainerPoint([lat, lng]);
      const mapContainerRect = map.getContainer().getBoundingClientRect();

      let navBottomInMap = 0;
      if (typeof document !== 'undefined') {
        // Only look for a floating top navigation bar that actually overlaps the map horizontally
        const floatingNav = document.querySelector('header.fixed, nav.pointer-events-auto, .fixed nav, [data-floating-nav]');
        if (floatingNav) {
          const navRect = floatingNav.getBoundingClientRect();
          const isTopBar = navRect.height < 140;
          const horizontallyOverlaps =
            navRect.right > mapContainerRect.left + 50 &&
            navRect.left < mapContainerRect.right - 50;
          const isAboveMapBottom = navRect.bottom > mapContainerRect.top && navRect.bottom < mapContainerRect.bottom;

          if (isTopBar && horizontallyOverlaps && isAboveMapBottom) {
            navBottomInMap = Math.max(0, navRect.bottom - mapContainerRect.top);
          }
        }
      }

      const topPad = isMiniMap ? 12 : (navBottomInMap > 0 ? Math.max(76, Math.round(navBottomInMap + 12)) : 16);
      const bottomPad = isMiniMap ? 12 : 16;
      const hasDesktopSidePanel = Boolean(
        !isMiniMap && !isMobile && selectedMarker?.id && mapSize.x >= 768
      );
      const sidePanelRightEdge = hasDesktopSidePanel
        ? Math.min(436, Math.round(mapSize.x * 0.45))
        : 16;
      const leftPad =
        mapSize.x - sidePanelRightEdge >= cardWidth + 24 ? sidePanelRightEdge : 16;
      const rightPad = 16;

      const maxAllowedHeight = Math.max(160, Math.floor(mapSize.y - topPad - bottomPad));
      const effectiveCardHeight = Math.min(cardHeight, maxAllowedHeight);
      const effectiveCardWidth = Math.min(cardWidth, Math.max(200, mapSize.x - leftPad - rightPad));

      const minX = leftPad;
      const maxX = Math.max(leftPad, mapSize.x - rightPad - effectiveCardWidth);
      const minY = topPad;
      const maxY = Math.max(topPad, mapSize.y - bottomPad - effectiveCardHeight);

      const MARKER_HEIGHT = 38;
      const MARKER_HALF_WIDTH = 18;
      const GAP = 10;

      // Candidate 1: Above marker (preferred natural position)
      const aboveTopY = point.y - MARKER_HEIGHT - GAP - effectiveCardHeight;
      // Candidate 2: Below marker (when marker is near top or navbar)
      const belowTopY = point.y + GAP;

      let targetLeftX = Math.min(Math.max(point.x - effectiveCardWidth / 2, minX), maxX);
      let targetTopY: number;

      if (aboveTopY >= minY && aboveTopY <= maxY) {
        targetTopY = aboveTopY;
      } else if (belowTopY >= minY && belowTopY + effectiveCardHeight <= mapSize.y - bottomPad) {
        targetTopY = belowTopY;
      } else {
        // Marker is near edge or viewport is short: position to the side
        const rightCandidateX = point.x + MARKER_HALF_WIDTH + GAP;
        const leftCandidateX = point.x - MARKER_HALF_WIDTH - GAP - effectiveCardWidth;
        const fitsRight = rightCandidateX + effectiveCardWidth <= mapSize.x - rightPad;
        const fitsLeft = leftCandidateX >= leftPad;

        if (fitsRight) {
          targetLeftX = rightCandidateX;
        } else if (fitsLeft) {
          targetLeftX = leftCandidateX;
        } else {
          targetLeftX = Math.min(Math.max(point.x - effectiveCardWidth / 2, minX), maxX);
        }

        const centeredSideTopY = point.y - MARKER_HEIGHT / 2 - effectiveCardHeight / 2;
        targetTopY = Math.min(Math.max(centeredSideTopY, minY), maxY);
      }

      const offsetX = Math.round(targetLeftX - point.x) + Math.round(effectiveCardWidth / 2);
      const offsetY = Math.round(targetTopY + effectiveCardHeight - point.y);

      return {
        offset: [offsetX, offsetY] as [number, number],
        autoPanPaddingTopLeft: [leftPad, topPad] as [number, number],
        autoPanPaddingBottomRight: [rightPad, bottomPad] as [number, number],
        maxWidth: Math.min(256, Math.max(200, mapSize.x - 32)),
        maxHeight: maxAllowedHeight,
      };
    },
    [map, lat, lng, isMiniMap, isMobile, selectedMarker?.id]
  );

  const syncPopupPosition = useCallback(() => {
    const popup = popupRef.current;
    if (!popup || !map) return;

    const containerEl = (popup as any)._container as HTMLElement | undefined;
    const cardEl = contentRef.current;
    const cardChild = cardEl?.firstElementChild as HTMLElement | null;
    const measuredWidth = cardChild?.offsetWidth || cardEl?.offsetWidth || containerEl?.offsetWidth;
    const cardWidth = Math.min(252, Math.max(200, measuredWidth || map.getSize().x - 32));
    const cardHeight = cardChild?.offsetHeight || cardEl?.offsetHeight || containerEl?.offsetHeight || 230;

    const layout = computePopupLayout(cardWidth, cardHeight);
    popup.options.offset = L.point(layout.offset[0], layout.offset[1]);
    popup.options.autoPanPaddingTopLeft = L.point(
      layout.autoPanPaddingTopLeft[0],
      layout.autoPanPaddingTopLeft[1]
    );
    popup.options.autoPanPaddingBottomRight = L.point(
      layout.autoPanPaddingBottomRight[0],
      layout.autoPanPaddingBottomRight[1]
    );
    popup.options.maxWidth = layout.maxWidth;

    if (containerEl) {
      (popup as any)._updateLayout();
      (popup as any)._updatePosition();
    }
  }, [computePopupLayout, map]);

  const handleContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      contentRef.current = node;
      if (node) {
        syncPopupPosition();
        if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(() => {
            syncPopupPosition();
          });
          observer.observe(node);
          resizeObserverRef.current = observer;
        }
      }
    },
    [syncPopupPosition]
  );

  useEffect(() => {
    syncPopupPosition();
    map.on('popupopen move zoom resize', syncPopupPosition);
    return () => {
      map.off('popupopen move zoom resize', syncPopupPosition);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [map, syncPopupPosition]);

  const initialWidth = Math.min(248, Math.max(200, map.getSize().x - 32));
  const initialLayout = computePopupLayout(initialWidth, 230);

  return (
    <Popup
      ref={popupRef}
      key={marker.id || `${lat}-${lng}`}
      position={[lat, lng]}
      className="custom-popup"
      closeButton={false}
      autoPan={false}
      offset={initialLayout.offset}
      autoPanPaddingTopLeft={initialLayout.autoPanPaddingTopLeft}
      autoPanPaddingBottomRight={initialLayout.autoPanPaddingBottomRight}
      minWidth={200}
      maxWidth={initialLayout.maxWidth}
    >
      <div
        ref={handleContentRef}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }}
        onMouseLeave={() => {
          hoverTimeoutRef.current = setTimeout(() => {
            if (onHoverMarker) onHoverMarker(null);
          }, 180);
        }}
        style={{
          width: '100%',
          maxHeight: initialLayout.maxHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {renderPopup(marker, { maxHeight: initialLayout.maxHeight })}
      </div>
    </Popup>
  );
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
          icon={customSvgIcon(marker, isSelected, isHovered)}
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
              }, 180);
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

  const activePopupMarker =
    hoveredMarker && (!selectedMarker || hoveredMarker.id !== selectedMarker.id)
      ? hoveredMarker
      : null;

  return (
    <div style={{ height, width: '100%', position: 'relative' }} className={className}>
      <MapContainer preferCanvas={true} center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution={attribution} url={tileUrl} />
        <ZoomControl position={isMiniMap ? "topright" : "bottomright"} />
        {!isMiniMap && <ScaleControl position="bottomright" />}
        <MapEventsHandler onBoundsChange={onBoundsChange} onSelectMarker={onSelectMarker} />
        <InvalidateSizeObserver />

        {renderedMarkers}

        {activePopupMarker && !isMobile && renderPopup && activePopupMarker.latitude && activePopupMarker.longitude ? (
          <AdaptivePopup
            marker={activePopupMarker}
            isMiniMap={isMiniMap}
            isMobile={isMobile}
            selectedMarker={selectedMarker}
            hoverTimeoutRef={hoverTimeoutRef}
            onHoverMarker={onHoverMarker}
            renderPopup={renderPopup}
          />
        ) : null}

        <MapFlyer trigger={flyTrigger} />
      </MapContainer>
    </div>
  );
}
