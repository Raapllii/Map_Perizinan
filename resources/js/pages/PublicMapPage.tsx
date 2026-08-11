import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from 'axios';
import { useNavigate } from "react-router";
import { Menu, Map, Filter, Layers, Info, Search, RefreshCw, X, Building2, ChevronLeft, Check, Briefcase, Package, AlertTriangle, CheckCircle, MapPin, Home, Calendar, ChevronDown, RotateCcw, Navigation, Eye } from "lucide-react";
import { StatusBadge, Btn } from "../components/ui";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PublicMapPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [flyTrigger, setFlyTrigger] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [bounds, setBounds] = useState("");
  const [mapType, setMapType] = useState<'peta' | 'satelit'>('peta');
  
  const [filters, setFilters] = useState({
    kecamatan: "Semua",
    kelurahan: "Semua",
    kategori: "Semua",
    risiko: "Semua",
    status: "Semua",
    tahun: "Semua"
  });

  const navigate = useNavigate();

  // Fetch markers dynamically based on bounds and filters
  useEffect(() => {
    let url = `/api/businesses?map=true`;
    if (bounds) url += `&bounds=${bounds}`;
    if (filters.kecamatan !== "Semua") url += `&kecamatan=${encodeURIComponent(filters.kecamatan)}`;
    if (filters.kategori !== "Semua") url += `&kategori=${encodeURIComponent(filters.kategori)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    
    axios.get(url)
      .then(res => setMarkers(res.data))
      .catch(err => console.error(err));
  }, [bounds, filters]); // Intentionally not including searchQuery to avoid excessive map re-renders while typing

  // Autocomplete search with debounce
  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      const delayFn = setTimeout(() => {
        axios.get(`/api/businesses/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => {
            setSearchResults(res.data);
            setIsSearching(false);
          })
          .catch(err => {
            console.error(err);
            setIsSearching(false);
          });
      }, 300);
      return () => clearTimeout(delayFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

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
      }
    }
  };

  const selected = selectedBusiness || {};

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#E5E3DF] font-[Inter,sans-serif] flex">
      {/* Thin Navigation Rail */}
      <div className="w-[72px] h-full bg-white shadow-xl z-[2000] flex flex-col items-center py-4 justify-between border-r border-gray-100 flex-shrink-0">
         <div className="flex flex-col items-center gap-6 w-full">
            <button className="p-3 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} className="text-gray-600" /></button>
            <div className="flex flex-col items-center gap-2">
               <button className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-colors"><Map size={24} /></button>
               <span className="text-[10px] font-semibold text-blue-600">Peta</span>
            </div>
            <div className="flex flex-col items-center gap-2 mt-2">
               <button className="w-12 h-12 hover:bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center transition-colors"><Filter size={24} /></button>
               <span className="text-[10px] font-medium text-gray-500">Filter</span>
            </div>
            <div className="flex flex-col items-center gap-2 mt-2">
               <button className="w-12 h-12 hover:bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center transition-colors"><Layers size={24} /></button>
               <span className="text-[10px] font-medium text-gray-500">Legenda</span>
            </div>
         </div>
         <div className="flex flex-col items-center gap-2">
            <button className="w-12 h-12 hover:bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center transition-colors"><Info size={24} /></button>
            <span className="text-[10px] font-medium text-gray-500">Bantuan</span>
         </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative">
         <div className="absolute inset-0 z-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-[#E5E3DF] text-gray-400">Memuat Peta WebGIS...</div>}>
               <CityMapLeaflet 
                 height="100%" 
                 selectedMarker={selected} 
                 onSelectMarker={handleSelectBusiness} 
                 markers={markers} 
                 onBoundsChange={setBounds}
                 mapType={mapType}
                 flyTrigger={flyTrigger}
               />
            </Suspense>
         </div>

         {/* Floating Search & Detail Panel */}
         <div className="absolute top-4 left-4 z-[1000] w-[360px] flex flex-col gap-2 transition-transform duration-300">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center h-14 relative">
               <div className="pl-4 pr-3 text-gray-400"><Search size={20} /></div>
               <input 
                 type="text" 
                 placeholder="Cari perusahaan, proyek, NIB, atau alamat..." 
                 className="flex-1 h-full bg-transparent border-none focus:outline-none text-sm text-gray-800"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onFocus={() => { if (!searchQuery && searchHistory.length > 0) setSearchResults(searchHistory) }}
               />
               {isSearching ? (
                 <div className="px-4 text-[#2E7D32]"><RefreshCw size={18} className="animate-spin" /></div>
               ) : searchQuery ? (
                 <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="px-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
               ) : null}
               
               {(searchResults.length > 0 || (searchQuery.length > 2 && !isSearching)) && (
                 <div className="absolute top-[100%] left-0 right-0 bg-white rounded-xl shadow-lg mt-1 border border-gray-100 overflow-hidden z-30 max-h-80 overflow-y-auto">
                    {searchResults.length === 0 && searchQuery.length > 2 && !isSearching ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Data tidak ditemukan
                      </div>
                    ) : (
                      <>
                        {!searchQuery && searchHistory.length > 0 && (
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                            Pencarian Terakhir
                          </div>
                        )}
                        {searchResults.map((res: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0" onClick={() => handleSelectBusiness(res, true)}>
                             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                               <Building2 size={16} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{res.nama_perusahaan}</p>
                                  {res.status && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-green-100 text-green-700 flex-shrink-0">
                                      {res.status}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{res.judul_kbli}</p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                  <span>{res.nib || '-'}</span>
                                  <span>•</span>
                                  <span className="truncate">{res.kecamatan}, {res.kelurahan}</span>
                                </div>
                             </div>
                          </div>
                        ))}
                      </>
                    )}
                 </div>
               )}
            </div>

            {/* Detail View Card */}
            {selectedBusiness && (
               <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden max-h-[calc(100vh-100px)]">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" onClick={() => setSelectedBusiness(null)}>
                     <ChevronLeft size={18} />
                     <span className="text-sm font-semibold">Kembali ke hasil</span>
                  </div>
                  <div className="relative h-48 bg-gray-100 flex-shrink-0">
                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B5E20] to-[#2E7D32]">
                        <Building2 size={64} className="text-white/30" />
                     </div>
                     <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm">1/6</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                     <div className="p-5 border-b border-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                           <h2 className="text-lg font-bold text-gray-900 leading-tight">{selected.nama_perusahaan}</h2>
                           <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0"><Check size={10} strokeWidth={3} /></div>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">NIB: {selected.nib}</p>
                        
                        <div className="flex gap-2">
                           <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md flex items-center gap-1"><Building2 size={12}/> Perusahaan</span>
                           <span className="px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-md">Aktif</span>
                        </div>
                     </div>
                     
                     <div className="p-5 space-y-4">
                        {[
                           { label: "Nama Proyek", value: selected.id_proyek || 'Pembangunan Gedung', icon: Briefcase },
                           { label: "Jenis Usaha", value: selected.judul_kbli || '-', icon: Package },
                           { label: "Risiko", value: selected.risiko || '-', icon: AlertTriangle, badge: true, riskBadge: true },
                           { label: "Status OSS", value: selected.status || '-', icon: CheckCircle, badge: true },
                           { label: "Alamat", value: selected.alamat_proyek || '-', icon: MapPin },
                           { label: "Kecamatan", value: selected.kecamatan || '-', icon: Map },
                           { label: "Kelurahan", value: selected.kelurahan || '-', icon: Home },
                           { label: "Koordinat", value: selected.lat ? `${selected.lat}, ${selected.lng}` : '-', icon: MapPin },
                           { label: "Tanggal Terbit OSS", value: selected.tgl_terbit || '-', icon: Calendar },
                        ].map((f, idx) => (
                           <div key={idx} className="flex items-start gap-4">
                              <f.icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 flex flex-col sm:flex-row sm:gap-4 gap-1">
                                 <p className="text-[11px] font-medium text-gray-500 sm:w-24 flex-shrink-0 leading-tight">{f.label}</p>
                                 <div className="flex-1">
                                    {f.badge ? (
                                        f.riskBadge ? (
                                           <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                             f.value === 'Rendah' ? 'bg-green-100 text-green-800' :
                                             f.value === 'Menengah Rendah' ? 'bg-blue-100 text-blue-800' :
                                             f.value === 'Menengah Tinggi' ? 'bg-yellow-100 text-yellow-800' :
                                             f.value === 'Tinggi' ? 'bg-red-100 text-red-800' :
                                             f.value === 'Sangat Tinggi' ? 'bg-purple-100 text-purple-800' :
                                             'bg-gray-100 text-gray-800'
                                           }`}>{f.value}</span>
                                        ) : (
                                          <StatusBadge status={f.value} />
                                        )
                                    ) : (
                                       <p className="text-xs font-medium text-gray-800 leading-snug">{f.value}</p>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                     <Btn variant="primary" size="md" Icon={Eye} className="flex-1 justify-center rounded-xl shadow-md text-sm">Lihat Detail</Btn>
                     <Btn variant="outline" size="md" Icon={Navigation} className="flex-1 justify-center rounded-xl text-sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, '_blank')}>Navigasi</Btn>
                  </div>
               </div>
            )}
         </div>

         {/* Floating Top Filters */}
         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 overflow-x-auto max-w-full px-4 pb-2 hide-scrollbar">
            {[
               { label: "Kecamatan", key: "kecamatan", opts: ["Semua", "Kec. Pusat", "Kec. Utara", "Kec. Barat", "Kec. Timur", "Kec. Selatan"], icon: Map },
               { label: "Kelurahan", key: "kelurahan", opts: ["Semua", "Desa A", "Desa B", "Kel. Merdeka", "Kel. Damai", "Kel. Sejahtera"], icon: Home },
               { label: "Jenis Usaha", key: "kategori", opts: ["Semua", "Perdagangan Umum", "Jasa & Layanan", "Kuliner & F&B", "Industri Kecil", "Properti & Konstruksi"], icon: Briefcase },
               { label: "Risiko", key: "risiko", opts: ["Semua", "Rendah", "Menengah Rendah", "Menengah Tinggi", "Tinggi", "Sangat Tinggi"], icon: MapPin },
               { label: "Status OSS", key: "status", opts: ["Semua", "Aktif", "Dalam Proses", "Perlu Perpanjangan"], icon: CheckCircle },
               { label: "Tahun", key: "tahun", opts: ["Semua", "2025", "2024", "2023", "2022", "2021"], icon: Calendar },
            ].map((f) => (
               <div key={f.label} className="relative bg-white rounded-full shadow-sm border border-gray-200 px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group flex-shrink-0">
                  <f.icon size={14} className="text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{(filters as any)[f.key] === 'Semua' ? f.label : (filters as any)[f.key]}</span>
                  <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" />
                  
                  {/* Invisible Select overlaying the pill */}
                  <select 
                     value={(filters as any)[f.key]}
                     onChange={(e) => setFilters({...filters, [f.key]: e.target.value})}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                     {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
               </div>
            ))}
         </div>

         {/* Right Controls */}
         <div className="absolute top-4 right-4 z-[1000] flex gap-3">
            <button 
               onClick={() => setFilters({ kecamatan: "Semua", kelurahan: "Semua", kategori: "Semua", risiko: "Semua", status: "Semua", tahun: "Semua" })}
               className="bg-white rounded-full shadow-sm border border-gray-200 px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-blue-600 text-xs font-semibold whitespace-nowrap"
            >
               <RotateCcw size={14} /> Reset Filter
            </button>
            <div className="bg-white rounded-full shadow-sm border border-gray-200 flex p-1 h-[34px] items-center">
               <button onClick={() => setMapType('peta')} className={`px-4 h-full rounded-full text-xs font-semibold transition-colors flex items-center ${mapType === 'peta' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Peta</button>
               <button onClick={() => setMapType('satelit')} className={`px-4 h-full rounded-full text-xs font-semibold transition-colors flex items-center ${mapType === 'satelit' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Satelit</button>
            </div>
         </div>

         {/* Bottom Legend */}
         <div className="absolute bottom-6 left-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-3 flex items-center gap-6 z-[1000]">
            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Legenda Risiko</span>
            <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
               {[
                 { label: "Rendah", color: "text-[#34A853]" },
                 { label: "Menengah Rendah", color: "text-[#4285F4]" },
                 { label: "Menengah Tinggi", color: "text-[#FBBC05]" },
                 { label: "Tinggi", color: "text-[#EA4335]" },
                 { label: "Sangat Tinggi", color: "text-[#9C27B0]" },
                 { label: "Tidak Diketahui", color: "text-[#9E9E9E]" },
               ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5 flex-shrink-0">
                     <MapPin size={16} fill="currentColor" className={`${l.color} bg-white rounded-full overflow-hidden`} />
                     <span className="text-[11px] font-medium text-gray-600">{l.label}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
      
      {/* Hide scrollbar styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
