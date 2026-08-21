import React, { useState, useEffect, Suspense, lazy } from "react";
import axios from 'axios';
import { X, Search, RotateCcw, Filter, ZoomIn, ZoomOut, Layers, Maximize2, Building2, Eye, Edit, Navigation, ChevronDown } from "lucide-react";
import { Card, Btn, StatusBadge } from "../components/ui";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PetaUsahaPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeLayer, setActiveLayer] = useState("cluster");
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapBounds, setMapBounds] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimer = React.useRef<any>(null);

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

      {/* Desktop Filter panel */}
      {showFilters && (
        <Card className="hidden md:flex w-56 flex-shrink-0 flex-col" padding="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-foreground">Filter Usaha</span>
            <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <FilterContent />
          </div>
        </Card>
      )}

      {/* Map area — full width on mobile */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 h-full">
        {/* Map toolbar */}
        <Card padding="px-3 py-2 md:px-4 md:py-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Btn
                variant="outline"
                size="sm"
                Icon={Filter}
                onClick={() => isMobile ? setShowFilterDrawer(true) : setShowFilters(!showFilters)}
              >
                Filter
              </Btn>
              <div className="flex items-center gap-0.5 bg-muted rounded-xl p-1">
                {["cluster", "heatmap", "boundary"].map(l => (
                  <button key={l} onClick={() => setActiveLayer(l)}
                    className={`px-2 md:px-3 py-1 text-xs font-medium rounded-lg transition-all capitalize ${activeLayer === l ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="hidden lg:flex text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                📍 -6.2088°, 106.8456°
              </span>
              <Btn variant="outline" size="sm" Icon={ZoomIn} />
              <Btn variant="outline" size="sm" Icon={ZoomOut} />
              <Btn variant="outline" size="sm" Icon={Layers} className="hidden sm:flex" />
              <Btn variant="outline" size="sm" Icon={Maximize2} className="hidden sm:flex" />
            </div>
          </div>
        </Card>

        <div className="flex-1 relative min-h-0">
          <Card className="h-full" padding="p-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground">Memuat Peta...</div>}>
              <CityMapLeaflet height="100%" selectedMarker={selected} onSelectMarker={setSelectedBusiness} markers={markers} onBoundsChange={handleBoundsChange} />
            </Suspense>
          </Card>

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border p-3 shadow-sm z-10">
            <p className="text-xs font-semibold text-foreground mb-2">Legenda</p>
            {[
              { color: "var(--success)", label: "Izin Aktif" },
              { color: "var(--info)", label: "Pending Verifikasi" },
              { color: "var(--warning)", label: "Kadaluarsa" },
              { color: "var(--danger)", label: "Ditolak" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Zoom count */}
          <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border px-3 py-2 shadow-sm z-10">
            <span className="text-xs text-muted-foreground">Zoom: </span>
            <span className="text-xs font-semibold text-foreground">14</span>
          </div>
        </div>
      </div>

      {/* Desktop Detail sidebar */}
      {selected && (
        <Card className="hidden md:flex w-64 flex-shrink-0 flex-col overflow-hidden" padding="p-0">
          <div className="p-4 bg-primary flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary-foreground/80 mb-1">Detail Usaha</p>
              <h4 className="text-sm font-semibold text-primary-foreground leading-snug">{selected.nama_perusahaan}</h4>
            </div>
            <button onClick={() => setSelectedBusiness(null)} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            <div className="w-full h-28 rounded-xl bg-muted border border-border flex items-center justify-center">
              <div className="text-center">
                <Building2 size={28} className="text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Foto Usaha</p>
              </div>
            </div>
            {[
              { label: "NIB", value: selected.nib || '-' },
              { label: "Status", value: selected.status || '-', badge: true },
              { label: "Kategori", value: selected.judul_kbli || '-' },
              { label: "Kecamatan", value: selected.kecamatan || '-' },
              { label: "Koordinat", value: selected.lat && selected.lng ? `${selected.lat}, ${selected.lng}` : '-' },
            ].map((f) => (
              <div key={f.label} className="border-b border-border pb-2.5 last:border-0">
                <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                {f.badge ? <StatusBadge status={f.value} /> : (
                  <p className="text-xs font-medium text-foreground">{f.value}</p>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border space-y-2">
            <Btn variant="primary" size="sm" Icon={Eye} className="w-full justify-center">Lihat Detail</Btn>
            <Btn variant="secondary" size="sm" Icon={Edit} className="w-full justify-center">Edit Data</Btn>
            <Btn variant="outline" size="sm" Icon={Navigation} className="w-full justify-center">Rute</Btn>
          </div>
        </Card>
      )}

      {/* Mobile: Detail bottom sheet */}
      {isMobile && selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedBusiness(null)} />
          <div className="bg-card rounded-t-3xl border-t border-border shadow-xl max-h-[70vh] flex flex-col relative">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <div className="p-4 bg-primary flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs font-medium text-primary-foreground/80 mb-0.5">Detail Usaha</p>
                <h4 className="text-sm font-semibold text-primary-foreground leading-snug">{selected.nama_perusahaan}</h4>
              </div>
              <button onClick={() => setSelectedBusiness(null)} className="text-primary-foreground/80 hover:text-primary-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {[
                { label: "NIB", value: selected.nib || '-' },
                { label: "Status", value: selected.status || '-', badge: true },
                { label: "Kategori", value: selected.judul_kbli || '-' },
                { label: "Kecamatan", value: selected.kecamatan || '-' },
              ].map((f) => (
                <div key={f.label} className="border-b border-border pb-2.5 last:border-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                  {f.badge ? <StatusBadge status={f.value} /> : (
                    <p className="text-xs font-medium text-foreground">{f.value}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
              <Btn variant="primary" size="sm" Icon={Eye} className="flex-1 justify-center">Lihat Detail</Btn>
              <Btn variant="outline" size="sm" Icon={Navigation} className="flex-1 justify-center">Rute</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Filter bottom sheet */}
      {isMobile && showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
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
