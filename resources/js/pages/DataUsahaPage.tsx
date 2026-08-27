import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import axios from 'axios';
import { Eye, Edit, Trash2, Search, Plus, FileSpreadsheet, Loader2, Inbox, AlertCircle, Upload, X, Filter, ChevronDown, Check, ArrowDownUp } from "lucide-react";
import { Card, StatusBadge, Btn, InputField, SelectField } from "../components/ui";

// Modals
import DataUsahaDetailModal from "../components/DataUsahaDetailModal";
import DataUsahaFormModal from "../components/DataUsahaFormModal";
import DataUsahaImportModal from "../components/DataUsahaImportModal";

export default function DataUsahaPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortType, setSortType] = useState("terbaru");

  // Popover State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Active Filters
  const [activeFilters, setActiveFilters] = useState({
    kecamatan: "",
    kelurahan: "",
    kategori: "",
    status: "",
  });

  // Temporary Filters (inside popover)
  const [tempFilters, setTempFilters] = useState({
    kecamatan: "",
    kelurahan: "",
    kategori: "",
    status: "",
  });
  
  // Modals state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  const [alertMsg, setAlertMsg] = useState("");
  const location = useLocation();

  // Click outside to close popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).noCoord) {
      setAlertMsg("Data usaha ini belum memiliki titik koordinat lokasi di peta, sehingga dialihkan ke tabel data.");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch Options for Filter
  useEffect(() => {
    axios.get('/api/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to load categories', err));
      
    axios.get('/api/locations/kecamatan')
      .then(res => setKecamatanOptions(res.data))
      .catch(err => console.error('Failed to load kecamatan', err));
  }, []);

  useEffect(() => {
    if (tempFilters.kecamatan && tempFilters.kecamatan !== "Semua") {
      axios.get(`/api/locations/kelurahan?kecamatan=${encodeURIComponent(tempFilters.kecamatan)}`)
        .then(res => setKelurahanOptions(res.data))
        .catch(err => console.error(err));
    } else {
      setKelurahanOptions([]);
    }
    // Reset kelurahan when kecamatan changes
    setTempFilters(prev => ({ ...prev, kelurahan: "" }));
  }, [tempFilters.kecamatan]);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page to 1 when search changes
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchBusinesses = (pageNumber = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams();
    params.append('page', pageNumber.toString());
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (activeFilters.kategori) params.append('kategori', activeFilters.kategori);
    if (activeFilters.status) params.append('status', activeFilters.status);
    if (activeFilters.kecamatan && activeFilters.kecamatan !== "Semua") params.append('kecamatan', activeFilters.kecamatan);
    if (activeFilters.kelurahan && activeFilters.kelurahan !== "Semua") params.append('kelurahan', activeFilters.kelurahan);
    
    if (sortType === 'terlama') {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_az') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_za') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'desc');
    } else {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'desc');
    }
    
    axios.get(`/api/businesses?${params.toString()}`)
      .then(res => {
        setBusinesses(res.data.data);
        setTotalPages(res.data.last_page);
        setTotalItems(res.data.total);
        setPage(res.data.current_page);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Refetch when filters or search or page change
  useEffect(() => {
    fetchBusinesses(page);
  }, [debouncedSearch, activeFilters, sortType, page]);

  // Handle Popover Filter Changes
  const handleTempChange = (field: keyof typeof tempFilters, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'kecamatan' ? { kelurahan: "" } : {})
    }));
  };

  const applyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  };

  const resetFilters = () => {
    const emptyFilters = { kecamatan: "", kelurahan: "", kategori: "", status: "" };
    setTempFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setPage(1);
  };

  const removeFilter = (field: keyof typeof activeFilters) => {
    const newActive = { ...activeFilters, [field]: "" };
    setActiveFilters(newActive);
    setTempFilters(newActive);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortType(value);
    setPage(1);
    setIsSortOpen(false);
  };

  // Actions
  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data usaha ini?')) {
      axios.delete(`/api/admin/businesses/${id}`)
        .then(() => {
          alert('Data berhasil dihapus');
          fetchBusinesses(page);
        })
        .catch(err => alert('Gagal menghapus data. ' + (err.response?.data?.message || '')));
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (activeFilters.kategori) params.append('kategori', activeFilters.kategori);
    if (activeFilters.status) params.append('status', activeFilters.status);
    if (activeFilters.kecamatan && activeFilters.kecamatan !== "Semua") params.append('kecamatan', activeFilters.kecamatan);
    if (activeFilters.kelurahan && activeFilters.kelurahan !== "Semua") params.append('kelurahan', activeFilters.kelurahan);
    
    if (sortType === 'terlama') {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_az') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_za') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'desc');
    } else {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'desc');
    }
    
    const exportUrl = `/api/admin/database/export?${params.toString()}`;
    window.location.href = exportUrl;
  };

  const openAddModal = () => {
    setSelectedBusiness(null);
    setIsFormOpen(true);
  };

  const openEditModal = (business: any) => {
    // If we need the full details, fetch them first
    axios.get(`/api/admin/businesses/${business.id}`)
      .then(res => {
        setSelectedBusiness(res.data);
        setIsFormOpen(true);
      })
      .catch(err => {
        // Fallback to table data if detail fetch fails
        setSelectedBusiness(business);
        setIsFormOpen(true);
      });
  };

  const openDetailModal = (business: any) => {
    axios.get(`/api/admin/businesses/${business.id}`)
      .then(res => {
        setSelectedBusiness(res.data);
        setIsDetailOpen(true);
      })
      .catch(err => {
        // Fallback
        setSelectedBusiness(business);
        setIsDetailOpen(true);
      });
  };

  const activeFiltersCount = Object.values(activeFilters).filter(val => val !== "").length;
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-5">
      {alertMsg && (
        <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            <p className="font-semibold">Perhatian</p>
            <p className="opacity-90 mt-0.5">{alertMsg}</p>
          </div>
        </div>
      )}

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Usaha</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola data perizinan usaha yang terdaftar di sistem.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" Icon={Upload} onClick={() => setIsImportOpen(true)}>Import CSV</Btn>
          <Btn variant="outline" Icon={FileSpreadsheet} onClick={handleExport}>Export</Btn>
          <Btn variant="primary" Icon={Plus} onClick={openAddModal}>Tambah Usaha</Btn>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar - Flex Grow */}
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <InputField 
              placeholder="Cari NIB, Nama Usaha, Pemilik..." 
              className="pl-9 w-full bg-card"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Row - Filter & Sort */}
          <div className="flex items-center gap-2">
            {/* Popover Filter Container */}
            <div className="relative" ref={filterRef}>
              <Btn 
                variant="outline" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`bg-card gap-2 ${isFilterOpen || hasActiveFilters ? 'border-primary text-primary' : ''}`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </Btn>

              {/* Popover Panel */}
              {isFilterOpen && (
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-full mt-2 w-[calc(100vw-24px)] max-w-[320px] bg-card border border-border rounded-xl shadow-lg z-50 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                    <h3 className="font-semibold text-sm">Filter Data Usaha</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Lokasi */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lokasi</div>
                      <SelectField
                        value={tempFilters.kecamatan}
                        onChange={(e: any) => handleTempChange('kecamatan', e.target.value)}
                        options={[
                          { value: "", label: "Semua Kecamatan" },
                          ...kecamatanOptions.map(k => ({ value: k, label: k }))
                        ]}
                      />
                      <SelectField
                        value={tempFilters.kelurahan}
                        onChange={(e: any) => handleTempChange('kelurahan', e.target.value)}
                        disabled={!tempFilters.kecamatan || tempFilters.kecamatan === "Semua Kecamatan"}
                        options={[
                          { value: "", label: "Semua Kelurahan" },
                          ...kelurahanOptions.map(k => ({ value: k, label: k }))
                        ]}
                      />
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Kategori & Status */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kriteria</div>
                      <SelectField
                        value={tempFilters.kategori}
                        onChange={(e: any) => handleTempChange('kategori', e.target.value)}
                        options={[
                          { value: "", label: "Semua Kategori" },
                          ...categories.map(c => ({ value: c.nama, label: c.nama }))
                        ]}
                      />
                      <SelectField
                        value={tempFilters.status}
                        onChange={(e: any) => handleTempChange('status', e.target.value)}
                        options={[
                          { value: "", label: "Semua Status" },
                          { value: "Aktif", label: "Aktif" },
                          { value: "Pending", label: "Pending" },
                          { value: "Tidak Aktif", label: "Tidak Aktif" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
                    <Btn variant="ghost" onClick={resetFilters} className="flex-1">Reset</Btn>
                    <Btn variant="primary" onClick={applyFilters} className="flex-1">Terapkan</Btn>
                  </div>
                </div>
              )}
            </div>

            {/* Sorting */}
            <div className="relative w-[180px]" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center justify-between w-full h-10 px-3 bg-card border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  isSortOpen ? 'border-primary ring-2 ring-primary/20' : 'border-input hover:border-border-hover'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <ArrowDownUp size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    {sortType === 'terbaru' ? 'Terbaru' : 
                     sortType === 'terlama' ? 'Terlama' : 
                     sortType === 'nama_az' ? 'Nama A–Z' : 'Nama Z–A'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="py-1">
                    {[
                      { value: "terbaru", label: "Terbaru" },
                      { value: "terlama", label: "Terlama" },
                      { value: "nama_az", label: "Nama A–Z" },
                      { value: "nama_za", label: "Nama Z–A" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                          sortType === option.value 
                            ? 'bg-primary/5 text-primary font-medium' 
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {option.label}
                        {sortType === option.value && <Check size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips Row */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Filter aktif:</span>
            {activeFilters.kecamatan && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium">
                <span className="text-muted-foreground">Kecamatan:</span> {activeFilters.kecamatan}
                <button onClick={() => removeFilter('kecamatan')} className="hover:text-destructive ml-0.5"><X size={12} /></button>
              </span>
            )}
            {activeFilters.kelurahan && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium">
                <span className="text-muted-foreground">Kelurahan:</span> {activeFilters.kelurahan}
                <button onClick={() => removeFilter('kelurahan')} className="hover:text-destructive ml-0.5"><X size={12} /></button>
              </span>
            )}
            {activeFilters.kategori && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium">
                <span className="text-muted-foreground">Kategori:</span> {activeFilters.kategori}
                <button onClick={() => removeFilter('kategori')} className="hover:text-destructive ml-0.5"><X size={12} /></button>
              </span>
            )}
            {activeFilters.status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium">
                <span className="text-muted-foreground">Status:</span> {activeFilters.status}
                <button onClick={() => removeFilter('status')} className="hover:text-destructive ml-0.5"><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <Card padding="p-0" className="overflow-hidden border-border shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/4">Nama Usaha / NIB</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/5">Pemilik / User</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/6">Lokasi</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/5">Kategori (KBLI)</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading && businesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-sm font-medium text-muted-foreground">Memuat data usaha...</p>
                      </div>
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-2">
                          <Inbox size={28} />
                        </div>
                        <p className="text-base font-semibold text-foreground">Tidak ada data</p>
                        <p className="text-sm text-muted-foreground">Belum ada data usaha yang terdaftar atau sesuai kriteria filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  businesses.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-foreground">{b.nama_perusahaan}</div>
                        {b.nama_proyek && <div className="text-xs font-semibold text-primary mt-0.5 line-clamp-1">{b.nama_proyek}</div>}
                        <div className="text-[11px] text-muted-foreground font-mono mt-1 px-1.5 py-0.5 bg-muted rounded w-fit">{b.nib}</div>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-foreground line-clamp-2 mt-2">{b.nama_pemilik || b.nama_user || b.nama_perusahaan}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        <div>{b.kecamatan}</div>
                        {(!b.lat || !b.lng) && (
                          <div className="text-[10px] text-warning mt-1 italic">Belum dipetakan</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground truncate max-w-[200px]" title={b.judul_kbli}>{b.judul_kbli || '-'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-80 group-hover:opacity-100 transition-opacity">
                          <Btn variant="ghost" size="xs" Icon={Eye} onClick={() => openDetailModal(b)} className="text-info hover:text-info hover:bg-info/10" aria-label="Lihat Detail" />
                          <Btn variant="ghost" size="xs" Icon={Edit} onClick={() => openEditModal(b)} className="text-primary hover:text-primary hover:bg-primary/10" aria-label="Edit Data" />
                          <Btn variant="ghost" size="xs" Icon={Trash2} onClick={() => handleDelete(b.id)} className="text-danger hover:text-danger hover:bg-danger/10" aria-label="Hapus Data" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {!loading && businesses.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-medium text-muted-foreground">
              Menampilkan data <strong className="text-foreground font-semibold">{businesses.length}</strong> dari total <strong className="text-foreground font-semibold">{totalItems}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Btn>
              <div className="px-3 py-1 rounded-md bg-background border border-border text-xs font-bold text-foreground">
                {page} <span className="text-muted-foreground font-normal mx-1">/</span> {totalPages}
              </div>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Berikutnya
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <DataUsahaDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        business={selectedBusiness} 
      />

      <DataUsahaFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        business={selectedBusiness}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchBusinesses(page);
        }}
      />

      <DataUsahaImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => fetchBusinesses(1)} 
      />
    </div>
  );
}
