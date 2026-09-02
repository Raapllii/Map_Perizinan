import React, { useState, useEffect, Suspense, lazy } from "react";
import { useLocation } from "react-router";
import axios from 'axios';
import { X, Search, RotateCcw, Filter, ZoomIn, ZoomOut, Layers, Maximize2, Building2, Eye, Edit, Navigation, ChevronDown } from "lucide-react";
import { Card, Btn, StatusBadge } from "../components/ui";
import { BusinessSidePanel } from "../components/ui/BusinessSidePanel";
import { BusinessDetailCard } from "../components/ui/BusinessDetailCard";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PetaUsahaPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [hoveredBusiness, setHoveredBusiness] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeLayer, setActiveLayer] = useState("cluster");
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapBounds, setMapBounds] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [flyTrigger, setFlyTrigger] = useState<{lat: number, lng: number, zoom: number, ts: number} | null>(null);
  const location = useLocation();
  const debounceTimer = React.useRef<any>(null);

  useEffect(() => {
    if (location.state && (location.state as any).flyTo) {
      const { lat, lng, id } = (location.state as any).flyTo;
      setFlyTrigger({ lat: parseFloat(lat), lng: parseFloat(lng), zoom: 17, ts: Date.now() });
      
      // Select the marker immediately if we have it in current markers,
      // or we can just fetch it from DB to ensure it exists.
      if (id) {
        axios.get(`/api/admin/businesses/${id}`)
          .then(res => setSelectedBusiness(res.data))
          .catch(() => {
            // fallback if api doesn't exist under /api/admin
            console.log('Fetching business via other endpoint or fallback to marker loop');
          });
      }
      
      // Clean up history state so it doesn't fire again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let url = '/api/businesses?map=true';
    if (mapBounds) {
      url += `&bounds=${mapBounds}`;
    }
    axios.get(url)
      .then(res => setMarkers(res.data.data || (Array.isArray(res.data) ? res.data : [])))
      .catch(err => console.error(err));
  }, [mapBounds]);

  const handleBoundsChange = React.useCallback((bounds: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setMapBounds(bounds);
    }, 600);
  }, []);

  const selected = selectedBusiness;

  // Filter form content reused in desktop sidebar and mobile drawer
  const FilterContent = () => (
    <div className="space-y-3 text-sm">
      {[
        { label: "Kecamatan", opts: ["Semua", "Kec. Pusat", "Kec. Utara", "Kec. Barat", "Kec. Timur", "Kec. Selatan"] },
        { label: "Kelurahan", opts: ["Semua", "Kel. Merdeka", "Kel. Damai", "Kel. Sejahtera"] },
        { label: "Kategori", opts: ["Semua", "Perdagangan", "Kuliner", "Jasa", "Industri"] },
        { label: "Status", opts: ["Semua", "Aktif", "Pending", "Kadaluarsa", "Ditolak"] },
      ].map((f) => (
        <div key={f.label}>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
          <div className="relative">
            <select className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background appearance-none focus:outline-none focus:border-primary">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      ))}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Usaha</label>
        <input type="text" placeholder="Cari nama..." className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary bg-background" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Rentang Tanggal</label>
        <input type="date" className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary bg-background" />
      </div>
      <Btn variant="primary" size="sm" Icon={Search} className="w-full justify-center">Terapkan</Btn>
      <Btn variant="ghost" size="sm" Icon={RotateCcw} className="w-full justify-center text-muted-foreground">Reset Filter</Btn>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-[calc(100dvh-10rem)]">

      {/* Map area — full width on mobile */}
      <div className="flex-1 relative min-w-0 h-full overflow-hidden rounded-xl border border-border bg-card">

        {/* Floating Controls Overlay */}
        <div className={`absolute top-4 z-[400] pointer-events-none flex flex-col items-start gap-2 transition-all duration-300 ${selected && !isMobile ? 'left-[412px]' : 'left-4'}`}>
          <div className="flex w-full items-start gap-4">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Btn
                variant="outline"
                size="sm"
                Icon={Filter}
                className="bg-card/95 backdrop-blur-sm"
                onClick={() => isMobile ? setShowFilterDrawer(true) : setShowFilters(!showFilters)}
              >
                Filter
              </Btn>
              <div className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm rounded-md p-1 border border-border">
                {["cluster", "heatmap", "boundary"].map(l => (
                  <button key={l} onClick={() => setActiveLayer(l)}
                    className={`px-2 md:px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${activeLayer === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center pointer-events-auto">
              <span className="text-xs text-muted-foreground bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border">
                📍 -6.2088°, 106.8456°
              </span>
            </div>
          </div>

          {/* Desktop Floating Filter Panel */}
          {showFilters && !isMobile && (
            <Card className="w-64 flex-shrink-0 flex-col pointer-events-auto shadow-xl" padding="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">Filter Usaha</span>
                <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-auto pr-1">
                <FilterContent />
              </div>
            </Card>
          )}
        </div>

        {/* Map Container */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground">Memuat Peta...</div>}>
            <CityMapLeaflet 
              height="100%" 
              selectedMarker={selected} 
              onSelectMarker={setSelectedBusiness}
              hoveredMarker={hoveredBusiness}
              onHoverMarker={setHoveredBusiness}
              markers={markers} 
              onBoundsChange={handleBoundsChange} 
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

        {/* Unified Side Panel overlay */}
        <BusinessSidePanel 
          business={selected}
          isMobile={isMobile}
          onClose={() => setSelectedBusiness(null)}
          onDirectionsClick={() => {
            if (selected) {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, '_blank');
            }
          }}
          onEditClick={() => {
            // Ensure this uses the actual Edit route logic if it exists, or acts as a placeholder
          }}
        />

      </div>

      {/* Mobile: Filter bottom sheet */}
      {isMobile && showFilterDrawer && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilterDrawer(false)} />
          <div className="bg-card rounded-t-3xl border-t border-border shadow-xl max-h-[80vh] flex flex-col relative">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-foreground">Filter Usaha</span>
              <button onClick={() => setShowFilterDrawer(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
