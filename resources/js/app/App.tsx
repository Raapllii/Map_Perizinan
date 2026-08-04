import { useState, useEffect } from "react";
import {
  LayoutDashboard, Map, Plus, Database, CheckSquare, Activity,
  FileText, Settings, Users, SlidersHorizontal, Search, Bell,
  User, Sun, Moon, ChevronRight, Building2, MapPin, Clock,
  Download, Printer, RefreshCw, Eye, Edit, Trash2, CheckCircle,
  XCircle, Upload, Filter, ChevronDown, ChevronUp, MoreVertical,
  TrendingUp, TrendingDown, Shield, UserCheck, UserX, Globe,
  Lock, Key, Layers, ZoomIn, ZoomOut, Maximize2, Navigation,
  Calendar, Phone, Mail, Save, RotateCcw, AlertTriangle, Info,
  BarChart2, FileSpreadsheet, Wifi, LogOut, Briefcase, Check, X,
  AlertCircle, Copy, ExternalLink, FileUp, Pencil, Menu,
  ChevronLeft, Home, Award, Star, Package
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis
} from "recharts";
import axios from 'axios';
import { lazy, Suspense, memo, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

// ─── DATA ────────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { id: "peta-usaha", icon: Map, label: "Peta Usaha", badge: null },
  { id: "tambah-usaha", icon: Plus, label: "Tambah Usaha", badge: null },
  { id: "data-usaha", icon: Database, label: "Data Usaha", badge: null },
  { id: "verifikasi-izin", icon: CheckSquare, label: "Verifikasi Izin", badge: 23 },
  { id: "monitoring", icon: Activity, label: "Monitoring", badge: null },
  { id: "laporan", icon: FileText, label: "Laporan", badge: null },
  { id: "master-data", icon: Briefcase, label: "Master Data", badge: null },
  { id: "pengguna", icon: Users, label: "Pengguna", badge: null },
  { id: "pengaturan", icon: Settings, label: "Pengaturan", badge: null },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "dashboard": { title: "Dashboard", subtitle: "Ringkasan informasi sistem NIB" },
  "peta-usaha": { title: "Peta Usaha", subtitle: "Visualisasi spasial lokasi usaha" },
  "tambah-usaha": { title: "Tambah Usaha", subtitle: "Registrasi usaha baru ke sistem" },
  "data-usaha": { title: "Data Usaha", subtitle: "Manajemen data seluruh usaha" },
  "verifikasi-izin": { title: "Verifikasi Izin", subtitle: "Antrian pengajuan izin usaha" },
  "monitoring": { title: "Monitoring", subtitle: "Pemantauan real-time kondisi usaha" },
  "laporan": { title: "Laporan & Analitik", subtitle: "Laporan statistik dan distribusi usaha" },
  "master-data": { title: "Master Data", subtitle: "Manajemen data referensi sistem" },
  "pengguna": { title: "Pengguna", subtitle: "Manajemen akun dan hak akses" },
  "pengaturan": { title: "Pengaturan", subtitle: "Konfigurasi sistem dan preferensi" },
};

// Mock data removed

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Aktif": "bg-green-100 text-green-700 border border-green-200",
    "Pending": "bg-amber-100 text-amber-700 border border-amber-200",
    "Kadaluarsa": "bg-orange-100 text-orange-700 border border-orange-200",
    "Ditolak": "bg-red-100 text-red-700 border border-red-200",
    "Revision": "bg-blue-100 text-blue-700 border border-blue-200",
    "Nonaktif": "bg-gray-100 text-gray-500 border border-gray-200",
    "Super Admin": "bg-purple-100 text-purple-700 border border-purple-200",
    "Administrator": "bg-indigo-100 text-indigo-700 border border-indigo-200",
    "Verifier": "bg-teal-100 text-teal-700 border border-teal-200",
    "Surveyor": "bg-sky-100 text-sky-700 border border-sky-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
});

const Btn = memo(function Btn({ children, variant = "primary", size = "md", Icon, className = "", ...props }: any) {
  const v: Record<string, string> = {
    primary: "bg-[#2E7D32] text-white hover:bg-[#1B5E20] shadow-sm",
    secondary: "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] border border-[#C8E6C9]",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    ghost: "text-gray-600 hover:bg-gray-100",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
  };
  const s: Record<string, string> = {
    xs: "px-2.5 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };
  return (
    <button {...props}
      className={`inline-flex items-center font-medium rounded-xl transition-all duration-150 ${v[variant]} ${s[size]} ${props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      {Icon && <Icon size={size === "xs" || size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
});

function Card({ children, className = "", padding = "p-5" }: any) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${padding} ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, children }: any) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

function InputField({ label, type = "text", placeholder, required = false, value, onChange, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] bg-white transition-all"
      />
    </div>
  );
}

function SelectField({ label, options, required = false, value, onChange, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] bg-white appearance-none transition-all"
        >
          {options.map((o: string) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── PAGE: DASHBOARD ─────────────────────────────────────────────────────────

function DashboardPage() {
  const activityColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-600",
    approved: "bg-green-100 text-green-600",
    expired: "bg-orange-100 text-orange-600",
    revision: "bg-amber-100 text-amber-600",
    rejected: "bg-red-100 text-red-600",
    update: "bg-purple-100 text-purple-600",
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const kpiData = data?.kpi;
  const monthlyData = data?.monthly || [];
  const distributionData = data?.distribution || [];
  const districtData = data?.districts || [];
  const activityFeed = data?.activities || [];

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard Data...</div>;
  }

  const KPI_CARDS = [
    { label: "Total Usaha", value: kpiData?.total?.toLocaleString('id') || "0", icon: Building2, change: "+5.2%", up: true, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Izin Aktif", value: kpiData?.active?.toLocaleString('id') || "0", icon: CheckCircle, change: "+3.1%", up: true, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "Pending Verifikasi", value: kpiData?.pending?.toLocaleString('id') || "0", icon: Clock, change: "+12.4%", up: true, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Izin Kadaluarsa", value: kpiData?.expired?.toLocaleString('id') || "0", icon: AlertTriangle, change: "-2.3%", up: false, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "Ditolak", value: kpiData?.rejected?.toLocaleString('id') || "0", icon: XCircle, change: "+1.5%", up: false, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    { label: "Usaha Baru", value: kpiData?.new?.toLocaleString('id') || "0", icon: TrendingUp, change: "+18.7%", up: true, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        {KPI_CARDS.map((k) => (
          <Card key={k.label} padding="p-4" className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${k.bg}`}>
                <k.icon size={18} className={k.color} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${k.up ? "text-green-600" : "text-red-500"}`}>
                {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {k.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{k.value}</div>
            <div className="text-xs text-gray-500 mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-5">
        {/* Monthly registrations */}
        <Card className="col-span-7" padding="p-5">
          <SectionHeader title="Pendaftaran Usaha Bulanan" subtitle="Tahun 2025 — registrasi, terverifikasi, dan ditolak">
            <Btn variant="outline" size="sm" Icon={Download}>Export</Btn>
          </SectionHeader>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyData} barGap={2} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="registrasi" name="Registrasi" fill="#2E7D32" radius={[4, 4, 0, 0]} />
              <Bar dataKey="terverifikasi" name="Terverifikasi" fill="#66BB6A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ditolak" name="Ditolak" fill="#EF9A9A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribution donut */}
        <Card className="col-span-5" padding="p-5">
          <SectionHeader title="Distribusi Kategori Usaha" subtitle="Berdasarkan jenis usaha terdaftar" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={2}>
                {distributionData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {distributionData.map((d: any) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto font-medium text-gray-900">{d.value.toLocaleString("id")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-12 gap-5">
        {/* Activity timeline */}
        <Card className="col-span-4" padding="p-5">
          <SectionHeader title="Aktivitas Terkini" subtitle="Log aktivitas sistem hari ini" />
          <div className="space-y-3">
            {activityFeed.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${activityColors[a.status]}`}>
                  {a.time.split(":")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{a.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.action}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{a.time}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* District breakdown */}
        <Card className="col-span-5" padding="p-5">
          <SectionHeader title="Statistik per Kecamatan" subtitle="Distribusi usaha di setiap kecamatan" />
          <div className="space-y-3">
            {districtData.map((d: any) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{d.name}</span>
                  <span className="text-xs text-gray-500">{d.active}/{d.total} aktif</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.active / d.total) * 100}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mini map + quick actions */}
        <Card className="col-span-3" padding="p-5">
          <SectionHeader title="Pratinjau Peta" />
          <div className="rounded-xl overflow-hidden h-36 mb-4 border border-gray-100">
            <CityMapLeaflet height="100%" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Aksi Cepat</p>
            {[
              { label: "Export PDF", icon: FileText, variant: "outline" },
              { label: "Export Excel", icon: FileSpreadsheet, variant: "outline" },
              { label: "Cetak Laporan", icon: Printer, variant: "outline" },
            ].map((a) => (
              <Btn key={a.label} variant={a.variant as any} Icon={a.icon} size="sm" className="w-full justify-start">
                {a.label}
              </Btn>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGE: PETA USAHA ─────────────────────────────────────────────────────────

function PetaUsahaPage() {
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

  const selected = selectedBusiness || markers[0] || {};

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
      <Card className="w-64 flex-shrink-0 flex flex-col" padding="p-0">
        <div className="p-4 bg-[#2E7D32] rounded-t-2xl">
          <p className="text-xs font-medium text-green-200 mb-1">Detail Usaha</p>
          <h4 className="text-sm font-semibold text-white leading-snug">{selected.nama_perusahaan || 'Pilih Usaha'}</h4>
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
    </div>
  );
}

// ─── PAGE: TAMBAH USAHA ───────────────────────────────────────────────────────

function TambahUsahaPage() {
  const [form, setForm] = useState({
    namaUsaha: "", nib: "", pemilik: "", kategori: "Perdagangan Umum",
    kecamatan: "Kec. Pusat", kelurahan: "Kel. Merdeka", alamat: "",
    telepon: "", email: "", lat: "-6.2088", lng: "106.8456",
  });
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  const handleUploadDemo = () => {
    setUploading(true);
    setTimeout(() => setUploading(false), 1500);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setUploading(true);
    const payload = {
      nama_perusahaan: form.namaUsaha,
      nib: form.nib,
      alamat_proyek: form.alamat,
      kecamatan: form.kecamatan,
      kelurahan: form.kelurahan,
      judul_kbli: form.kategori,
      lat: form.lat,
      lng: form.lng,
      status: "Aktif",
      tgl_terbit: new Date().toISOString().split('T')[0],
      color: "#2E7D32"
    };

    axios.post('/api/admin/businesses', payload)
      .then(res => {
        alert("Data usaha berhasil disimpan!");
        setUploading(false);
        setStep(1);
      })
      .catch(err => {
        console.error(err);
        alert("Gagal menyimpan data.");
        setUploading(false);
      });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step indicator */}
      <Card padding="px-6 py-4" className="mb-5">
        <div className="flex items-center gap-0">
          {["Informasi Usaha", "Lokasi & Koordinat", "Dokumen & Foto", "Konfirmasi"].map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${step > i + 1 ? "bg-[#2E7D32] text-white" : step === i + 1 ? "bg-[#2E7D32] text-white ring-4 ring-green-100" : "bg-gray-100 text-gray-400"}`}>
                  {step > i + 1 ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? "text-[#2E7D32]" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-3 ${step > i + 1 ? "bg-[#2E7D32]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Form */}
        <div className="col-span-2 space-y-5">
          {step === 1 && (
            <Card>
              <SectionHeader title="Informasi Dasar Usaha" subtitle="Isi data identitas dan informasi umum usaha" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Nama Usaha" placeholder="Contoh: Toko Maju Bersama" required
                  value={form.namaUsaha} onChange={(e: any) => setForm({ ...form, namaUsaha: e.target.value })} className="col-span-2" />
                <InputField label="Nomor Induk Berusaha (NIB)" placeholder="12 digit NIB" required
                  value={form.nib} onChange={(e: any) => setForm({ ...form, nib: e.target.value })} />
                <InputField label="Nama Pemilik" placeholder="Nama lengkap pemilik" required
                  value={form.pemilik} onChange={(e: any) => setForm({ ...form, pemilik: e.target.value })} />
                <SelectField label="Kategori Usaha" required options={["Perdagangan Umum", "Jasa & Layanan", "Kuliner & F&B", "Industri Kecil", "Properti & Konstruksi"]}
                  value={form.kategori} onChange={(e: any) => setForm({ ...form, kategori: e.target.value })} />
                <SelectField label="Kecamatan" required options={["Kec. Pusat", "Kec. Utara", "Kec. Barat", "Kec. Timur", "Kec. Selatan", "Kec. Tenggara"]}
                  value={form.kecamatan} onChange={(e: any) => setForm({ ...form, kecamatan: e.target.value })} />
                <SelectField label="Kelurahan" required options={["Kel. Merdeka", "Kel. Damai", "Kel. Sejahtera", "Kel. Makmur"]}
                  value={form.kelurahan} onChange={(e: any) => setForm({ ...form, kelurahan: e.target.value })} />
                <InputField label="Alamat Lengkap" placeholder="Jl., No., RT/RW" required
                  value={form.alamat} onChange={(e: any) => setForm({ ...form, alamat: e.target.value })} className="col-span-2" />
                <InputField label="Nomor Telepon" type="tel" placeholder="+62 812 xxxx xxxx"
                  value={form.telepon} onChange={(e: any) => setForm({ ...form, telepon: e.target.value })} />
                <InputField label="Email Usaha" type="email" placeholder="usaha@email.com"
                  value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <SectionHeader title="Lokasi & Koordinat" subtitle="Tandai lokasi usaha pada peta atau masukkan koordinat secara manual" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Latitude" value={form.lat} onChange={(e: any) => setForm({ ...form, lat: e.target.value })} placeholder="-6.2088" />
                <InputField label="Longitude" value={form.lng} onChange={(e: any) => setForm({ ...form, lng: e.target.value })} placeholder="106.8456" />
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <SectionHeader title="Upload Dokumen & Foto" subtitle="Unggah foto usaha dan dokumen perizinan yang diperlukan" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto Usaha <span className="text-red-500">*</span></label>
                  <div onClick={handleUploadDemo}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#2E7D32] hover:bg-green-50/30 transition-all cursor-pointer">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-[#2E7D32]" />
                        <span className="text-sm text-[#2E7D32]">Mengupload...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Klik untuk upload foto</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP maks. 5MB</p>
                      </>
                    )}
                  </div>
                </div>
                {["Surat Izin Usaha (SIUP)", "Kartu Tanda Penduduk (KTP) Pemilik", "NPWP Perusahaan", "Sertifikat Tanah / Surat Sewa"].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-[#2E7D32] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText size={15} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc}</p>
                        <p className="text-xs text-gray-400">PDF, JPG — maks. 10MB</p>
                      </div>
                    </div>
                    <Btn variant="outline" size="sm" Icon={Upload}>Upload</Btn>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <SectionHeader title="Konfirmasi Data" subtitle="Periksa kembali data sebelum menyimpan" />
              <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Data siap disimpan</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nama Usaha", value: form.namaUsaha || "Belum diisi" },
                    { label: "NIB", value: form.nib || "Belum diisi" },
                    { label: "Kategori", value: form.kategori },
                    { label: "Kecamatan", value: form.kecamatan },
                    { label: "Koordinat", value: `${form.lat}, ${form.lng}` },
                    { label: "Dokumen", value: "4 file siap upload" },
                  ].map((f) => (
                    <div key={f.label} className="text-xs">
                      <span className="text-gray-500">{f.label}: </span>
                      <span className="font-medium text-gray-800">{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-green-100 flex justify-end">
                  <Btn variant="primary" type="submit" Icon={Save} disabled={uploading}>
                    {uploading ? "Menyimpan..." : "Simpan Usaha"}
                  </Btn>
                </div>
              </form>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {step > 1 && (
                <Btn variant="outline" Icon={ChevronLeft} onClick={() => setStep(s => s - 1)}>Sebelumnya</Btn>
              )}
              <Btn variant="ghost" Icon={RotateCcw}>Reset Form</Btn>
            </div>
            <div className="flex gap-2">
              <Btn variant="outline">Batal</Btn>
              {step < 4 && (
                <Btn variant="primary" onClick={() => setStep(s => s + 1)}>
                  Lanjut <ChevronRight size={15} />
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* Right: Info + tips */}
        <div className="space-y-4">
          <Card padding="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Panduan Pengisian</h4>
            <div className="space-y-2.5">
              {[
                { n: 1, t: "NIB terdiri dari 12 digit angka yang diperoleh dari OSS" },
                { n: 2, t: "Koordinat dapat diambil dari Google Maps dengan klik kanan pada lokasi" },
                { n: 3, t: "Foto usaha harus menampilkan papan nama dan tampak depan" },
                { n: 4, t: "Semua dokumen harus masih berlaku dan dapat dibaca jelas" },
              ].map((p) => (
                <div key={p.n} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#2E7D32]">{p.n}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{p.t}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Dokumen Wajib</h4>
            <div className="space-y-2">
              {["NIB dari OSS", "KTP Pemilik", "NPWP", "SIUP/TDP", "Foto Usaha"].map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle size={13} className="text-[#2E7D32] flex-shrink-0" />
                  {d}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: DATA USAHA ─────────────────────────────────────────────────────────

function DataUsahaPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchBusinesses = (pageNumber = 1) => {
    setLoading(true);
    axios.get(`/api/businesses?page=${pageNumber}`)
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

  useEffect(() => {
    fetchBusinesses(1);
  }, []);

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data usaha ini?')) {
      axios.delete(`/api/admin/businesses/${id}`)
        .then(() => {
          alert('Data berhasil dihapus');
          fetchBusinesses(page);
        })
        .catch(err => alert('Gagal menghapus data'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card padding="px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Data Usaha</h3>
        </div>
      </Card>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading Data Usaha...</div>
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Usaha / NIB</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pemilik</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lokasi</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-gray-900">{b.nama_perusahaan}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{b.nib}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.nama_perusahaan}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.kecamatan}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.judul_kbli}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-[#2E7D32] hover:bg-green-50 rounded-lg transition-colors" title="Detail">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">Menampilkan {businesses.length} data (Total: {totalItems})</span>
            <div className="flex gap-1">
              <button
                onClick={() => fetchBusinesses(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-gray-700">Halaman {page} dari {totalPages}</span>
              <button
                onClick={() => fetchBusinesses(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── PAGE: VERIFIKASI IZIN ───────────────────────────────────────────────────

function VerifikasiIzinPage() {
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/businesses')
      .then(res => setQueue(res.data))
      .catch(console.error);
  }, []);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleAction = (id: number, action: string) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, status: action } : item));
  };

  const statusMap: Record<string, string> = { pending: "Pending", approved: "Aktif", rejected: "Ditolak", revision: "Revision" };
  const filtered = queue.filter(q => q.status === statusMap[activeTab]);

  const summaryCards = [
    { label: "Menunggu Review", count: queue.filter(q => q.status === "Pending").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", tab: "pending" },
    { label: "Disetujui", count: queue.filter(q => q.status === "Aktif").length, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", tab: "approved" },
    { label: "Ditolak", count: queue.filter(q => q.status === "Ditolak").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", tab: "rejected" },
    { label: "Perlu Revisi", count: queue.filter(q => q.status === "Revision").length, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", tab: "revision" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <button key={c.tab} onClick={() => setActiveTab(c.tab)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${activeTab === c.tab ? `${c.bg} ${c.border}` : "bg-white border-gray-100 hover:border-gray-200"}`}>
            <div className={`text-3xl font-bold ${c.color} mb-1`}>{c.count}</div>
            <div className="text-sm text-gray-600 font-medium">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Verification table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Antrian Verifikasi</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{filtered.length} perlu ditinjau</span>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" Icon={Filter}>Filter</Btn>
            <Btn variant="outline" size="sm" Icon={RefreshCw}>Refresh</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Usaha / Pemilik", "NIB", "Kategori", "Kecamatan", "Tgl. Diajukan", "Dokumen", "Status", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(activeTab === "pending" || activeTab === "revision" ? filtered : queue.slice(0, 3)).map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.owner}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{item.nib}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{item.category}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{item.district}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{item.submitted}</td>
                  <td className="px-4 py-3.5">
                    <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      <FileText size={12} />
                      {item.docs} file
                    </button>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleAction(item.id, "Aktif")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors">
                        <Check size={11} /> Setujui
                      </button>
                      <button onClick={() => handleAction(item.id, "Revision")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit size={11} /> Revisi
                      </button>
                      <button onClick={() => handleAction(item.id, "Ditolak")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                        <X size={11} /> Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(activeTab === "approved" || activeTab === "rejected") && (
          <div className="p-8 text-center text-gray-400">
            <CheckCircle size={36} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Tampilkan riwayat verifikasi sebelumnya</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── PAGE: MONITORING ────────────────────────────────────────────────────────

function MonitoringPage() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(t);
  }, []);

  const expiringLicenses = [
    { name: "UD. Karya Mandiri", days: 3, district: "Kec. Timur" },
    { name: "Toko Sumber Rejeki", days: 7, district: "Kec. Pusat" },
    { name: "CV. Barokah Jaya", days: 12, district: "Kec. Utara" },
    { name: "Warung Pak Haji", days: 18, district: "Kec. Barat" },
    { name: "Kios Bangunan Indah", days: 21, district: "Kec. Selatan" },
  ];

  const noCoords = [
    { name: "Bengkel Rapi Motor", nib: "220599001122", district: "Kec. Tenggara" },
    { name: "Toko Kelontong Pak Amin", nib: "220588112233", district: "Kec. Barat" },
    { name: "Laundry Bersih Sejahtera", nib: "220577223344", district: "Kec. Utara" },
  ];

  const areaData = [
    { time: "07:00", usaha: 2830, aktif: 1890 },
    { time: "08:00", usaha: 2833, aktif: 1895 },
    { time: "09:00", usaha: 2838, aktif: 1905 },
    { time: "10:00", usaha: 2840, aktif: 1910 },
    { time: "11:00", usaha: 2843, aktif: 1915 },
    { time: "12:00", usaha: 2844, aktif: 1918 },
    { time: "13:00", usaha: 2845, aktif: 1920 },
    { time: "14:00", usaha: 2847, aktif: 1923 },
  ];

  return (
    <div className="space-y-5">
      {/* Live status bar */}
      <Card padding="px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className={`w-2.5 h-2.5 bg-green-500 rounded-full ${pulse ? "scale-110" : "scale-90"} transition-transform duration-700`} />
              <div className="absolute w-5 h-5 bg-green-400 rounded-full opacity-30 animate-ping" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Sistem Aktif</span>
            <span className="text-xs text-gray-500">Pembaruan terakhir: 21 Jul 2025, 14:32 WIB</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            {[
              { label: "Usaha Aktif Hari Ini", value: "+3", color: "text-green-600" },
              { label: "Izin Hampir Kadaluarsa", value: "15", color: "text-orange-600" },
              { label: "Tanpa Koordinat", value: "23", color: "text-amber-600" },
              { label: "Notifikasi Terkirim", value: "89", color: "text-blue-600" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-5">
        {/* Map monitoring */}
        <Card className="col-span-7" padding="p-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Peta Monitoring Real-time</h3>
              <p className="text-xs text-gray-500 mt-0.5">Kondisi usaha di seluruh wilayah</p>
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" Icon={Layers}>Heatmap</Btn>
              <Btn variant="outline" size="sm" Icon={RefreshCw}>Refresh</Btn>
            </div>
          </div>
          <CityMapLeaflet height="340px" showHeatmap />
        </Card>

        {/* Right panels */}
        <div className="col-span-5 space-y-4">
          {/* Expiring licenses */}
          <Card padding="p-4">
            <SectionHeader title="Izin Segera Kadaluarsa" subtitle="Dalam 30 hari ke depan">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">15 izin</span>
            </SectionHeader>
            <div className="space-y-2.5">
              {expiringLicenses.map((e) => (
                <div key={e.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${e.days <= 7 ? "bg-red-500" : e.days <= 14 ? "bg-orange-500" : "bg-amber-400"}`} />
                    <div>
                      <p className="text-xs font-medium text-gray-800">{e.name}</p>
                      <p className="text-xs text-gray-400">{e.district}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${e.days <= 7 ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}>
                    {e.days} hari
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* No coordinates */}
          <Card padding="p-4">
            <SectionHeader title="Usaha Tanpa Koordinat" subtitle="Perlu penandaan lokasi">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">23 usaha</span>
            </SectionHeader>
            <div className="space-y-2">
              {noCoords.map((n) => (
                <div key={n.name} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-xs font-medium text-gray-800">{n.name}</p>
                    <p className="text-xs text-gray-400">{n.nib} · {n.district}</p>
                  </div>
                  <Btn variant="secondary" size="xs" Icon={MapPin}>Tandai</Btn>
                </div>
              ))}
              <button className="text-xs text-[#2E7D32] font-medium hover:underline mt-1">Lihat semua 23 usaha →</button>
            </div>
          </Card>
        </div>
      </div>

      {/* Trend chart */}
      <Card padding="p-5">
        <SectionHeader title="Tren Pertumbuhan Usaha (Real-time hari ini)" subtitle="Total usaha terdaftar dan aktif" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAktif" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#66BB6A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[2820, 2860]} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
            <Area type="monotone" dataKey="usaha" name="Total Usaha" stroke="#2E7D32" fill="url(#gradTotal)" strokeWidth={2} />
            <Area type="monotone" dataKey="aktif" name="Usaha Aktif" stroke="#66BB6A" fill="url(#gradAktif)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── PAGE: LAPORAN ────────────────────────────────────────────────────────────

function LaporanPage() {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(res => {
        setTrendData(res.data.trend || []);
        setDistricts(res.data.districts || []);
        setDistribution(res.data.distribution || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  const [activeTab, setActiveTab] = useState("kecamatan");
  const [year, setYear] = useState("2025");

  const tabs = [
    { id: "kecamatan", label: "Per Kecamatan" },
    { id: "kategori", label: "Kategori Usaha" },
    { id: "tren", label: "Tren Tahunan" },
    { id: "status", label: "Status Izin" },
  ];

  const statusPie = [
    { name: "Aktif", value: 1923, color: "#2E7D32" },
    { name: "Kadaluarsa", value: 156, color: "#F57C00" },
    { name: "Pending", value: 234, color: "#F57F17" },
    { name: "Ditolak", value: 89, color: "#C62828" },
    { name: "Lainnya", value: 445, color: "#9E9E9E" },
  ];

  return (
    <div className="space-y-5">
      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Usaha Terdaftar", value: "2.847", sub: "Per Juli 2025", color: "text-[#2E7D32]" },
          { label: "Tingkat Verifikasi", value: "87.4%", sub: "+2.1% dari bulan lalu", color: "text-blue-600" },
          { label: "Rata-rata/Bulan", value: "237", sub: "Pendaftaran baru", color: "text-purple-600" },
          { label: "Tingkat Kepatuhan", value: "92.3%", sub: "Izin yang masih berlaku", color: "text-teal-600" },
        ].map(k => (
          <Card key={k.label} padding="p-4">
            <div className={`text-2xl font-bold ${k.color} mb-1`}>{k.value}</div>
            <div className="text-sm font-medium text-gray-700">{k.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Card padding="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === t.id ? "bg-white shadow-sm text-[#2E7D32]" : "text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={year} onChange={e => setYear(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 appearance-none focus:outline-none focus:border-[#2E7D32] bg-white pr-8">
                {["2025", "2024", "2023", "2022"].map(y => <option key={y}>{y}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <Btn variant="outline" size="sm" Icon={FileText}>PDF</Btn>
            <Btn variant="outline" size="sm" Icon={FileSpreadsheet}>Excel</Btn>
            <Btn variant="outline" size="sm" Icon={Printer}>Cetak</Btn>
          </div>
        </div>

        {activeTab === "kecamatan" && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={districts} layout="vertical" barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                  <Bar dataKey="active" name="Aktif" fill="#2E7D32" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#FFA726" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="expired" name="Kadaluarsa" fill="#EF5350" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Kecamatan", "Total", "Aktif", "Pending", "Kadaluarsa"].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {districts.map(d => (
                    <tr key={d.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-2 text-xs font-medium text-gray-900">{d.name}</td>
                      <td className="py-2.5 px-2 text-xs text-gray-700 font-semibold">{d.total}</td>
                      <td className="py-2.5 px-2 text-xs text-green-600">{d.active}</td>
                      <td className="py-2.5 px-2 text-xs text-amber-600">{d.pending}</td>
                      <td className="py-2.5 px-2 text-xs text-red-600">{d.expired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "kategori" && (
          <div className="grid grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={distribution} cx="50%" cy="50%" outerRadius={110} dataKey="value" paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pt-4">
              {distribution.map(d => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-sm text-gray-700">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{d.value.toLocaleString("id")}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / 2847) * 100}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tren" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="total" name="Total Usaha" stroke="#2E7D32" strokeWidth={3} dot={{ r: 5, fill: "#2E7D32" }} />
              <Line type="monotone" dataKey="active" name="Izin Aktif" stroke="#66BB6A" strokeWidth={2.5} dot={{ r: 4, fill: "#66BB6A" }} />
              <Line type="monotone" dataKey="expired" name="Kadaluarsa" stroke="#EF5350" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: "#EF5350" }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === "status" && (
          <div className="grid grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {statusPie.map(d => (
                <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm text-gray-700 flex-1">{d.name}</span>
                  <span className="text-sm font-bold text-gray-900">{d.value.toLocaleString("id")}</span>
                  <span className="text-xs text-gray-400">{((d.value / 2847) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── PAGE: MASTER DATA ────────────────────────────────────────────────────────

function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("kecamatan");
  const [showAddModal, setShowAddModal] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/districts').then(res => setDistricts(res.data)).catch(console.error);
    axios.get('/api/categories').then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const tabs = [
    { id: "kecamatan", label: "Kecamatan", count: 6 },
    { id: "kelurahan", label: "Kelurahan", count: 56 },
    { id: "kategori", label: "Kat. Usaha", count: 12 },
    { id: "jenis-izin", label: "Jenis Izin", count: 8 },
    { id: "status", label: "Status Usaha", count: 5 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${activeTab === t.id ? "bg-[#2E7D32] text-white border-[#2E7D32] shadow-sm" : "bg-white border-gray-200 hover:border-[#2E7D32]/40"}`}>
            <div className={`text-xl font-bold mb-0.5 ${activeTab === t.id ? "text-white" : "text-gray-900"}`}>{t.count}</div>
            <div className={`text-xs font-medium ${activeTab === t.id ? "text-green-100" : "text-gray-600"}`}>{t.label}</div>
          </button>
        ))}
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Manajemen data referensi sistem</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Cari data..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] bg-white w-48" />
            </div>
            <Btn variant="primary" size="sm" Icon={Plus} onClick={() => setShowAddModal(true)}>Tambah Data</Btn>
          </div>
        </div>

        {(activeTab === "kecamatan") && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Kode", "Nama Kecamatan", "Jml. Kelurahan", "Luas Wilayah", "Populasi", "Status", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {districts.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{d.code}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{d.villages}</td>
                  <td className="px-4 py-3.5 text-gray-600">{d.area}</td>
                  <td className="px-4 py-3.5 text-gray-600">{d.population}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                      <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14} /></button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(activeTab === "kategori") && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Kode", "Nama Kategori", "Deskripsi", "Total Usaha", "Status", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{c.code}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{c.desc}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-[#2E7D32]">{c.total.toLocaleString("id")}</span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14} /></button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(activeTab === "kelurahan" || activeTab === "jenis-izin" || activeTab === "status") && (
          <div className="p-12 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Pilih tab untuk mengelola data referensi {tabs.find(t => t.id === activeTab)?.label}</p>
            <Btn variant="primary" size="sm" Icon={Plus} className="mt-4" onClick={() => setShowAddModal(true)}>Tambah Data Pertama</Btn>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">Total: {tabs.find(t => t.id === activeTab)?.count} data</p>
          <Btn variant="outline" size="xs" Icon={Download}>Export CSV</Btn>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[480px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tambah {tabs.find(t => t.id === activeTab)?.label}</h3>
            <div className="space-y-3">
              <InputField label="Kode" placeholder="KEC00X" required />
              <InputField label="Nama" placeholder="Masukkan nama..." required />
              <SelectField label="Status" options={["Aktif", "Nonaktif"]} />
            </div>
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowAddModal(false)}>Batal</Btn>
              <Btn variant="primary" className="flex-1 justify-center" Icon={Save}>Simpan</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE: PENGGUNA ───────────────────────────────────────────────────────────

function PenggunaPage() {
  const [activeRole, setActiveRole] = useState("semua");
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsers(res.data)).catch(console.error);
  }, []);

  const roles = [
    { id: "super-admin", label: "Super Admin", color: "bg-purple-100 text-purple-700", icon: Award },
    { id: "administrator", label: "Administrator", color: "bg-indigo-100 text-indigo-700", icon: Shield },
    { id: "verifier", label: "Verifier", color: "bg-teal-100 text-teal-700", icon: UserCheck },
    { id: "surveyor", label: "Surveyor", color: "bg-sky-100 text-sky-700", icon: Navigation },
  ];

  const roleSummary = roles.map(r => ({
    ...r,
    count: users.filter(u => u.role?.toLowerCase() === r.id.toLowerCase()).length
  }));

  const filtered = activeRole === "semua" ? users
    : users.filter(u => u.role.toLowerCase() === activeRole.toLowerCase());

  return (
    <div className="space-y-5">
      {/* Role summary */}
      <div className="grid grid-cols-5 gap-4">
        <button onClick={() => setActiveRole("semua")}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${activeRole === "semua" ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 hover:border-gray-300"}`}>
          <div className={`text-2xl font-bold mb-1 ${activeRole === "semua" ? "text-white" : "text-gray-900"}`}>{users.length}</div>
          <div className={`text-xs font-medium ${activeRole === "semua" ? "text-gray-300" : "text-gray-500"}`}>Semua Pengguna</div>
        </button>
        {roleSummary.map(r => (
          <button key={r.id} onClick={() => setActiveRole(r.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${activeRole === r.id ? "border-[#2E7D32] bg-[#E8F5E9]" : "bg-white border-gray-100 hover:border-[#2E7D32]/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${r.color}`}>
                <r.icon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{r.count}</div>
            <div className="text-xs text-gray-500">{r.label}</div>
          </button>
        ))}
      </div>

      {/* Users table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Daftar Pengguna</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{filtered.length} pengguna</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Cari pengguna..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] bg-white w-48" />
            </div>
            <Btn variant="primary" size="sm" Icon={Plus} onClick={() => setShowAddUser(true)}>Tambah Pengguna</Btn>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Pengguna", "Email", "Peran", "Status", "Login Terakhir", "Aktivitas", "Aksi"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xs font-semibold">
                      {u.avatar}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{u.email}</td>
                <td className="px-4 py-3.5"><StatusBadge status={u.role} /></td>
                <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{u.lastLogin}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E7D32] rounded-full" style={{ width: `${(u.actions / 350) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{u.actions}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                    <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Key size={14} /></button>
                    <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><UserX size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
          Menampilkan {filtered.length} dari {users.length} pengguna aktif dalam sistem
        </div>
      </Card>

      {/* Activity log */}
      <Card padding="p-5">
        <SectionHeader title="Log Aktivitas Terkini" subtitle="Rekam jejak tindakan pengguna dalam sistem" />
        <div className="space-y-2">
          {[
            { user: "Dr. Andi Kurniawan", action: "Mengubah konfigurasi sistem", time: "14:32", ip: "192.168.1.10" },
            { user: "Siti Rahayu, SE", action: "Menverifikasi izin CV. Sukses Jaya", time: "14:15", ip: "192.168.1.12" },
            { user: "Budi Hartono", action: "Menolak pengajuan Bengkel Las Putra", time: "13:58", ip: "192.168.1.15" },
            { user: "Fitriani Dewi", action: "Menambahkan koordinat Toko Sumber Rejeki", time: "13:45", ip: "192.168.1.18" },
            { user: "Rahmat Hidayat", action: "Login ke sistem", time: "13:30", ip: "192.168.1.20" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800">
                  <span className="font-medium">{log.user}</span>
                  <span className="text-gray-500"> — {log.action}</span>
                </p>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">{log.time}</div>
              <div className="text-xs text-gray-300 font-mono flex-shrink-0">{log.ip}</div>
            </div>
          ))}
        </div>
      </Card>

      {showAddUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAddUser(false)}>
          <div className="bg-white rounded-2xl p-6 w-[520px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tambah Pengguna Baru</h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Nama Lengkap" placeholder="Nama dengan gelar" required className="col-span-2" />
              <InputField label="Email" type="email" placeholder="nama@pemkab.go.id" required />
              <SelectField label="Peran" required options={["Super Admin", "Administrator", "Verifier", "Surveyor"]} />
              <InputField label="Password Awal" type="password" placeholder="Min. 8 karakter" required />
              <SelectField label="Status" options={["Aktif", "Nonaktif"]} />
            </div>
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowAddUser(false)}>Batal</Btn>
              <Btn variant="primary" className="flex-1 justify-center" Icon={Save}>Buat Pengguna</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE: PENGATURAN ─────────────────────────────────────────────────────────

function PengaturanPage({ darkMode, setDarkMode }: any) {
  const [activeSection, setActiveSection] = useState("profil");
  const [notifSettings, setNotifSettings] = useState({
    email: true, browser: true, kadaluarsa: true, baru: true, sistem: false,
  });

  const sections = [
    { id: "profil", icon: User, label: "Profil & Akun" },
    { id: "keamanan", icon: Lock, label: "Keamanan" },
    { id: "tampilan", icon: Sun, label: "Tampilan & Tema" },
    { id: "notifikasi", icon: Bell, label: "Notifikasi" },
    { id: "peta", icon: Map, label: "Konfigurasi Peta" },
    { id: "database", icon: Database, label: "Database & Backup" },
  ];

  return (
    <div className="flex gap-5">
      {/* Settings nav */}
      <div className="w-52 flex-shrink-0 space-y-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s.id ? "bg-[#E8F5E9] text-[#2E7D32]" : "text-gray-600 hover:bg-gray-100"}`}>
            <s.icon size={16} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Settings content */}
      <div className="flex-1 space-y-5">
        {activeSection === "profil" && (
          <Card>
            <SectionHeader title="Profil & Akun" subtitle="Kelola informasi akun Anda" />
            <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xl font-bold">AK</div>
              <div>
                <h4 className="font-semibold text-gray-900">Dr. Andi Kurniawan</h4>
                <p className="text-sm text-gray-500">Super Admin · andi.k@pemkab.go.id</p>
              </div>
              <Btn variant="outline" size="sm" Icon={Upload} className="ml-auto">Ganti Foto</Btn>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Nama Depan" value="Dr. Andi" onChange={() => { }} placeholder="" />
              <InputField label="Nama Belakang" value="Kurniawan" onChange={() => { }} placeholder="" />
              <InputField label="Email" type="email" value="andi.k@pemkab.go.id" onChange={() => { }} placeholder="" className="col-span-2" />
              <InputField label="Jabatan" value="Kepala Dinas" onChange={() => { }} placeholder="" />
              <InputField label="No. Telepon" type="tel" value="+62 811 2345 6789" onChange={() => { }} placeholder="" />
            </div>
            <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
              <Btn variant="primary" Icon={Save}>Simpan Perubahan</Btn>
              <Btn variant="outline" Icon={RotateCcw}>Reset</Btn>
            </div>
          </Card>
        )}

        {activeSection === "tampilan" && (
          <Card>
            <SectionHeader title="Tampilan & Tema" subtitle="Sesuaikan tampilan antarmuka sistem" />
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Mode Tampilan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Terang", icon: Sun, value: false },
                    { label: "Gelap", icon: Moon, value: true },
                    { label: "Sistem", icon: Globe, value: null },
                  ].map((m) => (
                    <button key={m.label} onClick={() => m.value !== null && setDarkMode(m.value)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${darkMode === m.value ? "border-[#2E7D32] bg-[#E8F5E9]" : "border-gray-200 hover:border-gray-300"}`}>
                      <m.icon size={20} className={darkMode === m.value ? "text-[#2E7D32]" : "text-gray-400"} />
                      <span className={`text-sm font-medium ${darkMode === m.value ? "text-[#2E7D32]" : "text-gray-600"}`}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Ukuran Font</label>
                <div className="flex gap-3">
                  {["Kecil", "Normal", "Besar"].map((f, i) => (
                    <button key={f} className={`px-4 py-2 rounded-xl border-2 text-sm transition-all ${i === 1 ? "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]" : "border-gray-200 text-gray-600"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Perubahan tampilan akan langsung diterapkan ke seluruh halaman sistem.</p>
              </div>
            </div>
          </Card>
        )}

        {activeSection === "notifikasi" && (
          <Card>
            <SectionHeader title="Pengaturan Notifikasi" subtitle="Atur kapan dan bagaimana Anda menerima notifikasi" />
            <div className="space-y-4">
              {[
                { key: "email", label: "Notifikasi Email", desc: "Kirim notifikasi ke email terdaftar" },
                { key: "browser", label: "Notifikasi Browser", desc: "Tampilkan notifikasi di browser" },
                { key: "kadaluarsa", label: "Izin Hampir Kadaluarsa", desc: "Peringatan 30, 14, dan 7 hari sebelum kadaluarsa" },
                { key: "baru", label: "Usaha Baru", desc: "Notifikasi saat ada pendaftaran usaha baru" },
                { key: "sistem", label: "Pembaruan Sistem", desc: "Informasi pemeliharaan dan pembaruan sistem" },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                  </div>
                  <button onClick={() => setNotifSettings(s => ({ ...s, [n.key]: !s[n.key as keyof typeof s] }))}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${(notifSettings as any)[n.key] ? "bg-[#2E7D32]" : "bg-gray-200"}`}
                    style={{ height: "22px" }}>
                    <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${(notifSettings as any)[n.key] ? "translate-x-4.5" : "translate-x-0.5"}`}
                      style={{ width: "18px", height: "18px", transform: (notifSettings as any)[n.key] ? "translateX(20px)" : "translateX(2px)" }} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "peta" && (
          <Card>
            <SectionHeader title="Konfigurasi Peta" subtitle="Atur penyedia peta dan sistem koordinat" />
            <div className="space-y-4">
              <SelectField label="Penyedia Peta" options={["OpenStreetMap", "Google Maps", "Mapbox", "ArcGIS Online"]}
                value="OpenStreetMap" onChange={() => { }} />
              <SelectField label="Sistem Koordinat" options={["WGS 84 (EPSG:4326)", "Web Mercator (EPSG:3857)", "TM-3 Indonesia"]}
                value="WGS 84 (EPSG:4326)" onChange={() => { }} />
              <SelectField label="Tile Layer Default" options={["Standard", "Satellite", "Terrain", "Hybrid"]}
                value="Standard" onChange={() => { }} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Pusat Peta (Latitude)" value="-6.2088" onChange={() => { }} placeholder="" />
                <InputField label="Pusat Peta (Longitude)" value="106.8456" onChange={() => { }} placeholder="" />
              </div>
              <InputField label="Zoom Default" value="13" onChange={() => { }} placeholder="" />
            </div>
            <Btn variant="primary" Icon={Save} className="mt-5">Simpan Konfigurasi</Btn>
          </Card>
        )}

        {activeSection === "database" && (
          <div className="space-y-4">
            <Card>
              <SectionHeader title="Backup Database" subtitle="Buat cadangan data sistem" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: "Backup Terakhir", value: "21 Jul 2025 03:00", icon: CheckCircle, color: "text-green-600" },
                  { label: "Ukuran Database", value: "2.4 GB", icon: Database, color: "text-blue-600" },
                  { label: "Total Record", value: "284.731", icon: FileText, color: "text-purple-600" },
                  { label: "Backup Tersedia", value: "14 file", icon: Download, color: "text-teal-600" },
                ].map(s => (
                  <div key={s.label} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <s.icon size={18} className={s.color} />
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Btn variant="primary" Icon={Download}>Backup Sekarang</Btn>
                <Btn variant="outline" Icon={Upload}>Restore Backup</Btn>
                <Btn variant="outline" Icon={FileSpreadsheet}>Export Data</Btn>
              </div>
            </Card>
            <Card>
              <SectionHeader title="Import Data" subtitle="Impor data dari file CSV/Excel" />
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#2E7D32] transition-all cursor-pointer">
                <FileUp size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Seret file atau klik untuk upload</p>
                <p className="text-xs text-gray-400 mt-1">CSV, XLSX, JSON — maks. 50MB</p>
              </div>
            </Card>
          </div>
        )}

        {activeSection === "keamanan" && (
          <Card>
            <SectionHeader title="Keamanan Akun" subtitle="Kelola password dan keamanan akun" />
            <div className="space-y-4">
              <InputField label="Password Saat Ini" type="password" placeholder="••••••••" />
              <InputField label="Password Baru" type="password" placeholder="Min. 8 karakter" />
              <InputField label="Konfirmasi Password Baru" type="password" placeholder="Ulangi password baru" />
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle size={13} />
                  Password harus mengandung huruf besar, angka, dan karakter khusus minimal 8 karakter.
                </p>
              </div>
              <Btn variant="primary" Icon={Lock}>Perbarui Password</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-[#1B5E20] flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#66BB6A] rounded-xl flex items-center justify-center flex-shrink-0">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">WebGIS NIB</div>
            <div className="text-green-300 text-xs leading-tight">Sistem Informasi Usaha</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <p className="text-green-400 text-xs font-semibold uppercase tracking-wider px-2 pt-1 pb-2">Menu Utama</p>
        {MENU_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button key={item.id} onClick={() => navigate(`/admin/${item.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active ? "bg-[#2E7D32] text-white shadow-sm" : "text-green-100 hover:bg-[#2E7D32]/60 hover:text-white"
                }`}>
              <item.icon size={17} className={active ? "text-white" : "text-green-300 group-hover:text-white"} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight size={13} className="text-green-300" />}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#66BB6A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Dr. Andi Kurniawan</p>
            <p className="text-green-300 text-xs truncate">Super Admin</p>
          </div>
          <button onClick={() => {
            axios.post('/api/admin/logout').finally(() => {
              window.location.href = '/admin/login';
            });
          }} className="text-green-400 hover:text-white transition-colors p-1">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
// ─── TOP BAR ─────────────────────────────────────────────────────────────────

function TopBar({ darkMode, setDarkMode }: any) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pageInfo = PAGE_TITLES[activePage];

  const notifications = [
    { title: "Izin baru menunggu verifikasi", desc: "Toko Serba Ada Jaya · 10 Jul 2025", read: false },
    { title: "Izin CV. Bangunan Kokoh disetujui", desc: "Terverifikasi · 09 Jul 2025", read: false },
    { title: "5 izin akan kadaluarsa minggu ini", desc: "Lihat daftar lengkap", read: false },
    { title: "Backup database berhasil", desc: "Otomatis · 21 Jul 2025 03:00", read: true },
    { title: "Pembaruan sistem tersedia", desc: "Versi 2.4.1 · Lihat detail", read: true },
  ];

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-6 gap-4 relative z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-4">
        <Home size={13} className="text-gray-400" />
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-gray-400">Sistem NIB</span>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="font-medium text-gray-700">{pageInfo?.title}</span>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Cari usaha, NIB, atau lokasi..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#2E7D32] transition-all" />
      </div>

      <div className="flex-1" />

      {/* Date time */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 font-mono tabular-nums">
        {time.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
        {" "}
        <span className="font-semibold text-gray-700">
          {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Dark mode */}
      <button onClick={() => setDarkMode(!darkMode)}
        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all hover:text-gray-700">
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all hover:text-gray-700">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Notifikasi</span>
              <span className="text-xs text-[#2E7D32] font-medium cursor-pointer hover:underline">Tandai semua dibaca</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={i} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? "bg-green-50/30" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />}
                    {n.read && <div className="w-1.5 h-1.5 flex-shrink-0" />}
                    <div>
                      <p className={`text-xs ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 text-center">
              <button className="text-xs text-[#2E7D32] font-medium hover:underline">Lihat semua notifikasi</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xs font-bold">
          AK
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-gray-900">Dr. Andi K.</p>
          <p className="text-xs text-gray-400">Super Admin</p>
        </div>
        <ChevronDown size={13} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </header>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ setUser }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Optional: get CSRF cookie first (Laravel 8+ Sanctum feature, but works for web too)
    axios.get('/sanctum/csrf-cookie').then(() => {
      axios.post('/api/admin/login', { email, password })
        .then(res => {
          setUser(res.data.user);
          navigate('/admin/dashboard');
        })
        .catch(err => {
          setError(err.response?.data?.message || "Login gagal. Periksa email dan password.");
          setLoading(false);
        });
    }).catch(err => {
      setError("Gagal terhubung ke server.");
      setLoading(false);
    });
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl" padding="p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-[#2E7D32]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Map Perizinan</h1>
          <p className="text-sm text-gray-500 mt-1">Silakan masuk ke akun Anda</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <InputField label="Email" type="email" required value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="admin@pemkab.go.id" />
          <InputField label="Password" type="password" required value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />

          <Btn variant="primary" className="w-full justify-center mt-2" disabled={loading} type="submit">
            {loading ? "Memproses..." : "Masuk"}
          </Btn>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Gunakan email admin (misal: andi.k@pemkab.go.id) dan password 'password'
        </div>
      </Card>
    </div>
  );
}


// ─── PUBLIC MAP PAGE ─────────────────────────────────────────────────────────

function PublicMapPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
      const delayFn = setTimeout(() => {
        axios.get(`/api/businesses?map=true&search=${encodeURIComponent(searchQuery)}`)
          .then(res => setSearchResults(res.data.slice(0, 5)))
          .catch(err => console.error(err));
      }, 300);
      return () => clearTimeout(delayFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectBusiness = (b: any) => {
    setSelectedBusiness(b);
    setSearchQuery("");
    setSearchResults([]);
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
               />
            </Suspense>
         </div>

         {/* Floating Search & Detail Panel */}
         <div className="absolute top-4 left-4 z-[1000] w-[360px] flex flex-col gap-2 transition-transform duration-300">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center overflow-hidden h-14 relative">
               <div className="pl-4 pr-3 text-gray-400"><Search size={20} /></div>
               <input 
                 type="text" 
                 placeholder="Cari perusahaan, proyek, NIB, atau alamat..." 
                 className="flex-1 h-full bg-transparent border-none focus:outline-none text-sm text-gray-800"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery("")} className="px-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
               )}
               {searchResults.length > 0 && (
                 <div className="absolute top-[100%] left-0 right-0 bg-white rounded-xl shadow-lg mt-1 border border-gray-100 overflow-hidden z-30 max-h-64 overflow-y-auto">
                    {searchResults.map((res: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0" onClick={() => handleSelectBusiness(res)}>
                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0"><MapPin size={16} /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{res.nama_perusahaan}</p>
                            <p className="text-xs text-gray-500 truncate">{res.kecamatan} • {res.judul_kbli}</p>
                         </div>
                      </div>
                    ))}
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

// ─── APP & ROUTING ────────────────────────────────────────────────────────────

function AdminLayout({ darkMode, setDarkMode, setUser }: any) {
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';
  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES['dashboard'];

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "peta-usaha": return <PetaUsahaPage />;
      case "tambah-usaha": return <TambahUsahaPage />;
      case "data-usaha": return <DataUsahaPage />;
      case "verifikasi-izin": return <VerifikasiIzinPage />;
      case "monitoring": return <MonitoringPage />;
      case "laporan": return <LaporanPage />;
      case "master-data": return <MasterDataPage />;
      case "pengguna": return <PenggunaPage />;
      case "pengaturan": return <PengaturanPage darkMode={darkMode} setDarkMode={setDarkMode} />;
      default: return <Navigate to="/admin/dashboard" replace />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA] font-[Inter,sans-serif]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-auto">
          {/* Page header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{pageInfo?.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{pageInfo?.subtitle}</p>
              </div>
              {activePage === "dashboard" && (
                <div className="flex items-center gap-2">
                  <Btn variant="outline" size="sm" Icon={RefreshCw}>Refresh</Btn>
                  <Btn variant="primary" size="sm" Icon={Download}>Export Laporan</Btn>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 pb-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: any) {
  // Authentication is handled via Laravel Session & Axios interceptors.
  // Unauthenticated users navigating directly will hit Laravel's auth middleware first,
  // except for client-side routing where the next API call will 401 and redirect them.
  return children;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Setup axios for session cookies
    axios.defaults.withCredentials = true;

    // Axios interceptor to catch 401 Unauthorized or 419 CSRF Token Mismatch
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 419)) {
          // If we are not already on the login page, redirect
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Routes>
      <Route path="/" element={<PublicMapPage />} />
      <Route path="/admin/login" element={
        <LoginScreen setUser={setUser} />
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <AdminLayout darkMode={darkMode} setDarkMode={setDarkMode} setUser={setUser} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
