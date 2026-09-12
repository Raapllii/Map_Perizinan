import React, { useState, useEffect, Suspense, lazy } from "react";
import { useLocation } from "react-router";
import axios from 'axios';
import { X, Search, RotateCcw, Filter, ZoomIn, ZoomOut, Layers, Maximize2, Building2, Eye, Edit, Navigation, ChevronDown } from "lucide-react";
import { Card, Btn, StatusBadge } from "../components/ui";
import { BusinessSidePanel } from "../components/ui/BusinessSidePanel";
import { BusinessDetailCard } from "../components/ui/BusinessDetailCard";
import { Business } from "../types";
import DataUsahaFormModal from "../components/DataUsahaFormModal";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PetaUsahaPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [hoveredBusiness, setHoveredBusiness] = useState<Business | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeLayer, setActiveLayer] = useState("cluster");
  const [markers, setMarkers] = useState<Business[]>([]);
  const [mapBounds, setMapBounds] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [flyTrigger, setFlyTrigger] = useState<{lat: number, lng: number, zoom: number, ts: number} | null>(null);
  const location = useLocation();
  const debounceTimer = React.useRef<any>(null);

  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    kecamatan_usaha: "Semua",
    kelurahan_usaha: "Semua",
    uraian_risiko_proyek: "Semua",
    status: "Semua",
    search: ""
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    axios.get('/api/locations/kecamatan')
      .then(res => setKecamatanOptions(res.data))
      .catch(err => console.error('Failed to load kecamatan', err));
  }, []);

  useEffect(() => {
    if (filters.kecamatan_usaha && filters.kecamatan_usaha !== "Semua") {
      axios.get(`/api/locations/kelurahan?kecamatan_usaha=${encodeURIComponent(filters.kecamatan_usaha)}`)
        .then(res => setKelurahanOptions(res.data))
        .catch(err => console.error(err));
    } else {
      setKelurahanOptions([]);
    }
  }, [filters.kecamatan_usaha]);

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
    const params = new URLSearchParams();
    params.append('map', 'true');
    if (mapBounds) params.append('bounds', mapBounds);
    if (appliedFilters.kecamatan_usaha !== "Semua") params.append('kecamatan_usaha', appliedFilters.kecamatan_usaha);
    if (appliedFilters.kelurahan_usaha !== "Semua") params.append('kelurahan_usaha', appliedFilters.kelurahan_usaha);
    if (appliedFilters.uraian_risiko_proyek !== "Semua") params.append('uraian_risiko_proyek', appliedFilters.uraian_risiko_proyek);
    if (appliedFilters.status !== "Semua") params.append('status', appliedFilters.status);
    if (appliedFilters.search) params.append('search', appliedFilters.search);

    axios.get(`/api/businesses?${params.toString()}`)
      .then(res => setMarkers(res.data.data || (Array.isArray(res.data) ? res.data : [])))
      .catch(err => console.error(err));
  }, [mapBounds, appliedFilters, refreshTrigger]);

  const handleBoundsChange = React.useCallback((bounds: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setMapBounds(bounds);
    }, 600);
  }, []);

  const selected = selectedBusiness;

  // Filter form content reused in desktop sidebar and mobile drawer
  const FilterContent = () => {
    const handleApply = () => {
      setAppliedFilters(filters);
      if (isMobile) setShowFilterDrawer(false);
      else setShowFilters(false);
    };

    const handleReset = () => {
      const reset = { kecamatan_usaha: "Semua", kelurahan_usaha: "Semua", uraian_risiko_proyek: "Semua", status: "Semua", search: "" };
      setFilters(reset);
      setAppliedFilters(reset);
    };

    return (
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Kecamatan</label>
          <div className="relative">
            <select 
              value={filters.kecamatan_usaha} 
              onChange={e => setFilters(f => ({...f, kecamatan_usaha: e.target.value, kelurahan_usaha: "Semua"}))} 
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background appearance-none focus:outline-none focus:border-primary"
            >
              <option value="Semua">Semua</option>
              {kecamatanOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Kelurahan</label>
          <div className="relative">
            <select 
              value={filters.kelurahan_usaha} 
              onChange={e => setFilters(f => ({...f, kelurahan_usaha: e.target.value}))} 
              disabled={filters.kecamatan_usaha === "Semua"}
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background appearance-none focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="Semua">Semua</option>
              {kelurahanOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Risiko Proyek</label>
          <div className="relative">
            <select 
              value={filters.uraian_risiko_proyek} 
              onChange={e => setFilters(f => ({...f, uraian_risiko_proyek: e.target.value}))} 
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background appearance-none focus:outline-none focus:border-primary"
            >
              {["Semua", "Rendah", "Menengah Rendah", "Menengah Tinggi", "Tinggi"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
          <div className="relative">
            <select 
              value={filters.status} 
              onChange={e => setFilters(f => ({...f, status: e.target.value}))} 
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background appearance-none focus:outline-none focus:border-primary"
            >
              {["Semua", "Aktif", "Pending", "Kadaluarsa", "Ditolak"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Pencarian</label>
          <input 
            type="text" 
            placeholder="Cari nama atau NIB..." 
            value={filters.search}
            onChange={e => setFilters(f => ({...f, search: e.target.value}))}
            className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary bg-background" 
          />
        </div>
        
        <Btn variant="primary" size="sm" Icon={Search} onClick={handleApply} className="w-full justify-center">Terapkan</Btn>
        <Btn variant="ghost" size="sm" Icon={RotateCcw} onClick={handleReset} className="w-full justify-center text-muted-foreground">Reset Filter</Btn>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 min-h-[420px] h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-10rem)]">

      {/* Map area — full width on mobile */}
      <div className="flex-1 relative min-w-0 h-full overflow-hidden rounded-xl border border-border bg-card">

        {/* Floating Controls Overlay */}
        <div className={`absolute top-3 sm:top-4 z-[400] pointer-events-none flex flex-col items-start gap-2 transition-all duration-300 ${selected && !isMobile ? 'left-[404px] max-w-[calc(100%-416px)]' : 'left-3 sm:left-4 max-w-[calc(100%-1.5rem)]'}`}>
          <div className="flex w-full items-start gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
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
                    className={`px-2 sm:px-2.5 md:px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${activeLayer === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Floating Filter Panel */}
          {showFilters && !isMobile && (
            <Card className="w-64 max-w-[calc(100vw-3rem)] flex-shrink-0 flex-col pointer-events-auto shadow-xl" padding="p-4">
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
                  onDirectionsClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}`, '_blank')}
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
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`, '_blank');
            }
          }}
          onEditClick={() => {
            if (selected) {
              setEditingBusiness(selected);
              setIsEditModalOpen(true);
            }
          }}
        />

        {/* Edit Business Modal */}
        <DataUsahaFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBusiness(null);
          }}
          business={editingBusiness}
          onSuccess={() => {
            setIsEditModalOpen(false);
            if (selected?.id) {
              axios.get(`/api/admin/businesses/${selected.id}`)
                .then(res => setSelectedBusiness(res.data))
                .catch(() => {});
            }
            setRefreshTrigger(prev => prev + 1);
          }}
        />

      </div>

      {/* Mobile: Filter bottom sheet */}
      {isMobile && showFilterDrawer && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilterDrawer(false)} />
          <div className="bg-card rounded-t-3xl border-t border-border shadow-xl max-h-[85dvh] pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex flex-col relative">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-foreground">Filter Usaha</span>
              <button onClick={() => setShowFilterDrawer(false)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Tutup filter">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-5">
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
