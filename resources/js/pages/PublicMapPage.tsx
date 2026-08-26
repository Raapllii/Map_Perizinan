import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
import axios from 'axios';
import { Map, Search, X, Navigation, Eye } from "lucide-react";
import { Drawer } from "vaul";
import { motion } from "motion/react";
import { StatusBadge, Btn } from "../components/ui";
import Navbar from "../components/ui/mini-navbar";
import { BusinessDetailCard } from "../components/ui/BusinessDetailCard";
import { AnimatePresence } from "motion/react";
import { useBusinessSearch } from "../hooks/useBusinessSearch";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PublicMapPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [flyTrigger, setFlyTrigger] = useState<any>(null);
  
  const { 
    searchQuery, setSearchQuery, 
    searchResults, setSearchResults, 
    isSearching, 
    searchError 
  } = useBusinessSearch();
  
  const [toastMsg, setToastMsg] = useState("");
  
  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [mapType, setMapType] = useState<'peta' | 'satelit'>('peta');

  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [isFetchingMap, setIsFetchingMap] = useState(false);

  // Debounced Bounds & Zoom
  const [mapBounds, setMapBounds] = useState("");
  const [mapZoom, setMapZoom] = useState(12);
  const debounceTimer = useRef<any>(null);

  const handleBoundsChange = useCallback((bounds: string, zoom: number) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setMapBounds(bounds);
      setMapZoom(zoom);
    }, 400);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const minZoom = 8;
    if (mapZoom < minZoom || !mapBounds) {
      setMarkers([]);
      setIsFetchingMap(false);
      return;
    }

    let url = `/api/businesses?map=true&zoom=${mapZoom}`;
    if (mapBounds) url += `&bounds=${mapBounds}`;
    
    activeFilters.forEach((f: any) => {
      const key = f.type.toLowerCase();
      if (f.value && f.value.length > 0) {
        url += `&${key}=${encodeURIComponent(f.value.join(','))}`;
      }
      if (f.operator === 'bukan') {
        url += `&${key}_operator=bukan`;
      }
    });

    const controller = new AbortController();

    setIsFetchingMap(true);
    axios.get(url, { signal: controller.signal })
      .then(res => {
        setMarkers(res.data.data || []);
        setIsFetchingMap(false);
      })
      .catch(err => {
        if (!axios.isCancel(err)) {
          console.error(err);
          setIsFetchingMap(false);
        }
      });

    return () => controller.abort();
  }, [mapBounds, mapZoom, activeFilters]);


  const saveToHistory = (item: any) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectBusiness = (b: any, fromSearch: boolean = false) => {
    setSelectedBusiness(b);
    setSearchQuery("");
    setSearchResults([]);

    if (fromSearch) {
      saveToHistory(b);
      if (b.lat && b.lng) {
        setFlyTrigger({ lat: parseFloat(b.lat), lng: parseFloat(b.lng), zoom: 17, ts: Date.now() });
      } else {
        setToastMsg("Data usaha ditemukan, namun belum memiliki titik koordinat lokasi di peta.");
        setTimeout(() => setToastMsg(""), 5000);
      }
    }
  };

  const resetFilters = () => {
    setActiveFilters([]);
  };

  const selected = selectedBusiness || {};
  const [snap, setSnap] = useState<number | string | null>(1);

  return (
    <div className="w-screen h-screen overflow-hidden bg-background flex flex-col md:flex-row font-[Inter,sans-serif]">
      <Navbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onFocus={() => { if (!searchQuery && searchHistory.length > 0) setSearchResults(searchHistory) }}
        onFilterChange={setActiveFilters}
        searchResults={searchResults}
        isSearching={isSearching}
        searchError={searchError}
        onSelectResult={(result) => handleSelectBusiness(result, true)}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-sm font-medium w-max max-w-[90vw]"
          >
            <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center text-foreground flex-shrink-0">!</div>
            {toastMsg}
            <button onClick={() => setToastMsg("")} className="ml-2 opacity-70 hover:opacity-100"><X size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Main Map Container */}
      <div className="flex-1 relative h-full">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground font-medium">Memuat Peta WebGIS...</div>}>
            <CityMapLeaflet
              height="100%"
              selectedMarker={selected}
              onSelectMarker={handleSelectBusiness}
              markers={markers}
              onBoundsChange={handleBoundsChange}
              mapType={mapType}
              flyTrigger={flyTrigger}
              isMobile={isMobile}
              renderPopup={(marker) => (
                <BusinessDetailCard
                  business={marker}
                  onClose={() => setSelectedBusiness(null)}
                  onDirectionsClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`, '_blank')}
                />
              )}
            />
          </Suspense>
        </div>

        {/* Zoom Overlay */}
        {mapZoom < 8 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-border text-sm font-semibold text-foreground flex items-center gap-2">
              <Search size={18} className="text-primary" />
              Perbesar peta (zoom in) untuk melihat sebaran data usaha.
            </div>
          </div>
        )}

        {/* Empty State Overlay */}
        {mapZoom >= 8 && markers.length === 0 && activeFilters.length > 0 && !isFetchingMap && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md px-6 py-4 rounded-xl shadow-lg border border-border text-sm font-semibold text-foreground flex flex-col items-center gap-2">
              <Search size={24} className="text-muted-foreground" />
              Tidak ada data yang sesuai dengan filter.
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className={`absolute z-20 flex-col gap-2 transition-opacity duration-300 md:top-4 md:right-4 md:bottom-auto md:left-auto top-auto right-auto left-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] ${isMobile && selectedBusiness ? 'hidden md:flex' : 'flex'}`}>
          <div className="bg-card shadow-sm border border-border flex overflow-hidden p-0.5 md:p-1 gap-1 rounded-lg md:rounded-xl">
            <button onClick={() => setMapType('peta')} className={`px-3 md:px-4 py-1.5 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold transition-colors relative z-10 ${mapType === 'peta' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {mapType === 'peta' && <motion.div layoutId="map-tab" className="absolute inset-0 bg-primary z-[-1] rounded-md md:rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              Peta
            </button>
            <button onClick={() => setMapType('satelit')} className={`px-3 md:px-4 py-1.5 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold transition-colors relative z-10 ${mapType === 'satelit' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {mapType === 'satelit' && <motion.div layoutId="map-tab" className="absolute inset-0 bg-primary z-[-1] rounded-md md:rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              Satelit
            </button>
          </div>
        </div>

        {/* Mobile Search Overlay (only when searching on mobile) */}
        {/* Detail Bottom Sheet (Mobile) using Vaul */}
        {isMobile && (
          <Drawer.Root open={!!selectedBusiness} onOpenChange={(open) => !open && setSelectedBusiness(null)} modal={false}>
            <Drawer.Portal>
              <Drawer.Content
                className="bg-card flex flex-col rounded-t-3xl fixed bottom-0 left-0 right-0 z-50 border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[85vh] outline-none"
                style={{ pointerEvents: 'auto' }}
              >
                {selectedBusiness && (
                  <>
                    <div className="w-full flex justify-center pt-4 pb-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full"></div>
                    </div>

                    <div className="px-5 pb-3 flex items-start justify-between border-b border-border mt-1">
                      <div>
                        <Drawer.Title className="text-base font-bold text-foreground">{selected.nama_perusahaan}</Drawer.Title>
                        {selected.nama_proyek && <div className="text-sm font-semibold text-primary mt-0.5 line-clamp-1">{selected.nama_proyek}</div>}
                        <Drawer.Description className="text-xs text-muted-foreground mt-0.5">{selected.judul_kbli}</Drawer.Description>
                      </div>
                      <button onClick={() => setSelectedBusiness(null)} className="p-2 bg-muted hover:bg-muted/80 transition-colors rounded-full text-muted-foreground ml-4 flex-shrink-0"><X size={16} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      <div className="flex gap-2">
                        <StatusBadge status={selected.status} />
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full">{selected.risiko}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Kecamatan</p>
                          <p className="text-sm font-medium text-foreground">{selected.kecamatan || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">NIB</p>
                          <p className="text-sm font-mono text-foreground">{selected.nib || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border-t border-border flex gap-3 bg-card mt-auto">
                      <Btn variant="primary" size="sm" Icon={Eye} className="flex-1 justify-center rounded-xl py-2.5">Detail</Btn>
                      <Btn variant="outline" size="sm" Icon={Navigation} className="flex-1 justify-center rounded-xl py-2.5" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, '_blank')}>Rute</Btn>
                    </div>
                  </>
                )}
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        )}

      </div>
    </div>
  );
}
