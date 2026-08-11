import React, { useState, useEffect, Suspense, lazy } from "react";
import axios from 'axios';
import { X, Search, RotateCcw, Filter, ZoomIn, ZoomOut, Layers, Maximize2, Building2, Eye, Edit, Navigation, ChevronDown } from "lucide-react";
import { Card, Btn, StatusBadge } from "../components/ui";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PetaUsahaPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [activeLayer, setActiveLayer] = useState("cluster");
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapBounds, setMapBounds] = useState<string | null>(null);
  const debounceTimer = React.useRef<any>(null);

  useEffect(() => {
    let url = '/api/businesses?map=true';
    if (mapBounds) {
      url += `&bounds=${mapBounds}`;
    }
    axios.get(url)
      .then(res => setMarkers(res.data))
      .catch(err => console.error(err));
  }, [mapBounds]);

  const handleBoundsChange = React.useCallback((bounds: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setMapBounds(bounds);
    }, 600);
  }, []);

  const selected = selectedBusiness;

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Filter panel */}
      {showFilters && (
        <Card className="w-56 flex-shrink-0 flex flex-col" padding="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-900">Filter Usaha</span>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-auto text-sm">
            {[
              { label: "Kecamatan", opts: ["Semua", "Kec. Pusat", "Kec. Utara", "Kec. Barat", "Kec. Timur", "Kec. Selatan"] },
              { label: "Kelurahan", opts: ["Semua", "Kel. Merdeka", "Kel. Damai", "Kel. Sejahtera"] },
              { label: "Kategori", opts: ["Semua", "Perdagangan", "Kuliner", "Jasa", "Industri"] },
              { label: "Status", opts: ["Semua", "Aktif", "Pending", "Kadaluarsa", "Ditolak"] },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <div className="relative">
                  <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white appearance-none focus:outline-none focus:border-[#2E7D32]">
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Usaha</label>
              <input type="text" placeholder="Cari nama..." className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#2E7D32]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rentang Tanggal</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#2E7D32]" />
            </div>
            <Btn variant="primary" size="sm" Icon={Search} className="w-full justify-center">Terapkan</Btn>
            <Btn variant="ghost" size="sm" Icon={RotateCcw} className="w-full justify-center text-gray-500">Reset Filter</Btn>
          </div>
        </Card>
      )}

      {/* Map area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Map toolbar */}
        <Card padding="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!showFilters && (
                <Btn variant="outline" size="sm" Icon={Filter} onClick={() => setShowFilters(true)}>Filter</Btn>
              )}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {["cluster", "heatmap", "boundary"].map(l => (
                  <button key={l} onClick={() => setActiveLayer(l)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all capitalize ${activeLayer === l ? "bg-white shadow-sm text-[#2E7D32]" : "text-gray-500"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                📍 -6.2088°, 106.8456°
              </div>
              <Btn variant="outline" size="sm" Icon={ZoomIn} />
              <Btn variant="outline" size="sm" Icon={ZoomOut} />
              <Btn variant="outline" size="sm" Icon={Layers} />
              <Btn variant="outline" size="sm" Icon={Maximize2} />
            </div>
          </div>
        </Card>

        <div className="flex-1 relative">
          <Card className="h-full" padding="p-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-gray-50 text-gray-400">Memuat Peta...</div>}>
              <CityMapLeaflet height="100%" selectedMarker={selected} onSelectMarker={setSelectedBusiness} markers={markers} onBoundsChange={handleBoundsChange} />
            </Suspense>
          </Card>

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs font-semibold text-gray-700 mb-2">Legenda</p>
            {[
              { color: "#2E7D32", label: "Izin Aktif" },
              { color: "#F57F17", label: "Pending Verifikasi" },
              { color: "#E65100", label: "Kadaluarsa" },
              { color: "#C62828", label: "Ditolak" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-gray-600">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Zoom count */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
            <span className="text-xs text-gray-500">Zoom: </span>
            <span className="text-xs font-semibold text-gray-900">14</span>
          </div>
        </div>
      </div>

      {/* Detail sidebar */}
      {selected && (
        <Card className="w-64 flex-shrink-0 flex flex-col" padding="p-0">
          <div className="p-4 bg-[#2E7D32] rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-200 mb-1">Detail Usaha</p>
              <h4 className="text-sm font-semibold text-white leading-snug">{selected.nama_perusahaan}</h4>
            </div>
            <button onClick={() => setSelectedBusiness(null)} className="text-white/80 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            <div className="w-full h-28 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center">
              <div className="text-center">
                <Building2 size={28} className="text-green-400 mx-auto mb-1" />
                <p className="text-xs text-green-600">Foto Usaha</p>
              </div>
            </div>

            {[
              { label: "NIB", value: selected.nib || '-' },
              { label: "Status", value: selected.status || '-', badge: true },
              { label: "Kategori", value: selected.judul_kbli || '-' },
              { label: "Kecamatan", value: selected.kecamatan || '-' },
              { label: "Koordinat", value: selected.lat && selected.lng ? `${selected.lat}, ${selected.lng}` : '-' },
            ].map((f) => (
              <div key={f.label} className="border-b border-gray-50 pb-2.5 last:border-0">
                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                {f.badge ? <StatusBadge status={f.value} /> : (
                  <p className="text-xs font-medium text-gray-800">{f.value}</p>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-2">
            <Btn variant="primary" size="sm" Icon={Eye} className="w-full justify-center">Lihat Detail</Btn>
            <Btn variant="secondary" size="sm" Icon={Edit} className="w-full justify-center">Edit Data</Btn>
            <Btn variant="outline" size="sm" Icon={Navigation} className="w-full justify-center text-blue-600">Rute</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
