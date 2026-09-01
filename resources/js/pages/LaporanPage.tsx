import { useState, useEffect } from "react";
import axios from 'axios';
import { ChevronDown, FileText, FileSpreadsheet, Printer, TrendingUp, TrendingDown, Activity, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Btn } from "../components/ui";

// Skeleton Loader Component (Data Table Skeleton [id: 19002] inspired)
const LaporanSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <div className="h-8 w-48 bg-muted/60 rounded-md mb-2"></div>
        <div className="h-4 w-64 bg-muted/40 rounded-md"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-muted/60 rounded-md"></div>
        <div className="h-9 w-24 bg-muted/60 rounded-md"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-[120px] bg-muted/40 rounded-xl border border-border/50"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[400px] bg-muted/40 rounded-xl border border-border/50"></div>
      <div className="h-[400px] bg-muted/40 rounded-xl border border-border/50"></div>
    </div>
    <div className="h-[300px] bg-muted/40 rounded-xl border border-border/50"></div>
  </div>
);

// Modern Stat Card (Stats Card [id: 8321] inspired)
const StatCard = ({ title, value, change, isUp, icon: Icon, colorClass, bgClass, iconColorClass }: any) => (
  <Card padding="p-5" className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border/40 bg-card">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight text-foreground">
          {typeof value === 'number' ? value.toLocaleString('id') : value}
        </h3>
      </div>
      <div className={`p-2.5 rounded-xl ${bgClass} ${iconColorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4">
      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
        {isUp ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
        {change}
      </span>
      <span className="text-[11px] text-muted-foreground font-medium">vs bulan lalu</span>
    </div>
  </Card>
);

export default function LaporanPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState("2025");

  useEffect(() => {
    setLoading(true);
    // API request menyertakan filter tahun
    axios.get(`/api/admin/dashboard?year=${year}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [year]);

  if (loading && !data) {
    return <LaporanSkeleton />;
  }

  // Fallback data mapping
  const kpis = data?.kpi || {
    total: { value: 0, change: '0%', up: true },
    active: { value: 0, change: '0%', up: true },
    pending: { value: 0, change: '0%', up: true },
    expired: { value: 0, change: '0%', up: true },
  };

  const statusPie = [
    { name: "Izin Aktif", value: kpis.active.value, color: "var(--success)" },
    { name: "Pending", value: kpis.pending.value, color: "var(--warning)" },
    { name: "Kadaluarsa", value: kpis.expired.value, color: "var(--danger)" },
  ].filter(d => d.value > 0);

  const totalUsaha = kpis.total.value || 1; // prevent div by 0

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header & Filter Chips Breadcrumb inspired */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan & Analitik</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan performa pendaftaran dan status izin usaha.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Search Bar / Compact Filter Pattern */}
          <div className="relative group">
            <select 
              value={year} 
              onChange={e => setYear(e.target.value)}
              className="text-sm font-semibold border border-border/80 rounded-lg pl-4 pr-9 py-2 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background transition-all hover:bg-muted/20 cursor-pointer shadow-sm"
            >
              {["2025", "2024", "2023", "2022"].map(y => <option key={y} value={y}>Tahun {y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
          </div>
          <div className="w-px h-8 bg-border/60 mx-1 hidden sm:block"></div>
          <Btn variant="outline" size="sm" Icon={FileText} className="shadow-sm border-border/80">PDF</Btn>
          <Btn variant="outline" size="sm" Icon={FileSpreadsheet} className="shadow-sm border-border/80">Excel</Btn>
          <Btn variant="outline" size="sm" Icon={Printer} className="shadow-sm border-border/80">Cetak</Btn>
        </div>
      </div>

      {/* KPI Summary (Grid 4 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard 
          title="Total Usaha Terdaftar" 
          value={kpis.total.value} 
          change={kpis.total.change} 
          isUp={kpis.total.up} 
          icon={Activity} 
          bgClass="bg-primary/10"
          iconColorClass="text-primary"
        />
        <StatCard 
          title="Izin Aktif" 
          value={kpis.active.value} 
          change={kpis.active.change} 
          isUp={kpis.active.up} 
          icon={CheckCircle} 
          bgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard 
          title="Menunggu Verifikasi" 
          value={kpis.pending.value} 
          change={kpis.pending.change} 
          isUp={kpis.pending.up} 
          icon={Clock} 
          bgClass="bg-amber-500/10"
          iconColorClass="text-amber-600 dark:text-amber-400"
        />
        <StatCard 
          title="Izin Kadaluarsa" 
          value={kpis.expired.value} 
          change={kpis.expired.change} 
          isUp={kpis.expired.up} 
          icon={AlertTriangle} 
          bgClass="bg-rose-500/10"
          iconColorClass="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Main Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart: Tren Registrasi (Area Charts 2 [id: 4729] inspired) */}
        <Card className="lg:col-span-2 p-5 lg:p-6 border-border/50 shadow-sm flex flex-col">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Tren Pendaftaran Bulanan</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Pergerakan jumlah registrasi vs terverifikasi tahun {year}</p>
            </div>
            {loading && <Loader2 className="animate-spin text-muted-foreground opacity-50" size={18} />}
          </div>
          
          <div className="w-full flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "var(--card)", padding: "12px" }}
                  itemStyle={{ fontSize: "13px", fontWeight: 600, padding: "2px 0" }}
                  labelStyle={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "4px" }}
                />
                <Area type="monotone" dataKey="registrasi" name="Total Registrasi" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReg)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="terverifikasi" name="Terverifikasi" stroke="var(--success)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVerif)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution & Status (Stacked vertically in LG, grid in SM) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          
          {/* Status Izin Pie */}
          <Card className="p-5 lg:p-6 border-border/50 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-foreground tracking-tight mb-4">Proporsi Status Izin</h3>
            <div className="flex-1 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4">
              <div className="w-[140px] h-[140px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                      {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                      contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</span>
                  <span className="text-base font-bold text-foreground leading-none mt-1">{totalUsaha.toLocaleString('id')}</span>
                </div>
              </div>
              <div className="w-full space-y-2.5 flex-1">
                {statusPie.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs font-semibold text-foreground">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{((d.value / totalUsaha) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Kategori Usaha List */}
          <Card className="p-5 lg:p-6 border-border/50 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-foreground tracking-tight mb-4">Top 5 Kategori Usaha</h3>
            <div className="flex-1 space-y-3.5">
              {(data?.distribution || []).map((d: any, i: number) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-semibold text-foreground truncate pr-2 max-w-[75%]" title={d.name}>{d.name}</span>
                    <span className="text-xs font-bold text-muted-foreground">{d.value.toLocaleString('id')}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(d.value / totalUsaha) * 100}%`, background: d.color || `var(--chart-${(i % 5) + 1})` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>

      {/* Modern SaaS Data Table for Districts */}
      <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 lg:p-6 border-b border-border/50 bg-muted/10">
          <h3 className="text-lg font-bold text-foreground tracking-tight">Sebaran Data per Kecamatan</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Rincian status usaha di setiap wilayah</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3.5 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Kecamatan</th>
                <th className="py-3.5 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Total Usaha</th>
                <th className="py-3.5 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Izin Aktif</th>
                <th className="py-3.5 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Menunggu</th>
                <th className="py-3.5 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Kadaluarsa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(data?.districts || []).map((d: any) => (
                <tr key={d.name} className="hover:bg-muted/30 transition-colors group">
                  <td className="py-3.5 px-6 font-semibold text-foreground group-hover:text-primary transition-colors">{d.name}</td>
                  <td className="py-3.5 px-6 font-semibold text-foreground">{d.total.toLocaleString('id')}</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {d.active.toLocaleString('id')}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {d.pending.toLocaleString('id')}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      {d.expired.toLocaleString('id')}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.districts || data.districts.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm font-medium">
                    Tidak ada data untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
}
