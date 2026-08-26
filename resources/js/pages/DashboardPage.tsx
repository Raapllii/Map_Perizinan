import { useState, useEffect } from "react";
import axios from 'axios';
import {
  Building2, Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  Download, FileSpreadsheet, Printer, FileText
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card, SectionHeader, Btn, Skeleton, StatCard } from "../components/ui";
import CityMapLeaflet from "../components/CityMapLeaflet";

export default function DashboardPage() {
  const activityColors: Record<string, string> = {
    new: "bg-info/15 text-info",
    approved: "bg-success/15 text-success",
    expired: "bg-warning/15 text-warning",
    revision: "bg-secondary/15 text-secondary",
    rejected: "bg-danger/15 text-danger",
    update: "bg-primary/15 text-primary",
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (refresh = false) => {
    setLoading(true);
    setError(null);
    const url = refresh ? '/api/admin/dashboard?refresh=true' : '/api/admin/dashboard';
    axios.get(url)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Gagal memuat data dashboard.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();

    const handleRefresh = () => fetchData(true);
    window.addEventListener('refreshDashboard', handleRefresh);
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, []);

  const kpiData = data?.kpi;
  const monthlyData = data?.monthly || [];
  const distributionData = data?.distribution || [];
  const districtData = data?.districts || [];
  const activityFeed = data?.activities || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[120px] w-full" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <Skeleton className="xl:col-span-7 h-[360px]" />
          <Skeleton className="xl:col-span-5 h-[360px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-border rounded-xl bg-card">
        <AlertTriangle className="w-12 h-12 text-danger mb-4 opacity-80" />
        <h3 className="text-lg font-bold text-foreground mb-2">Terjadi Kesalahan</h3>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Btn variant="primary" onClick={() => fetchData(true)}>Coba Lagi</Btn>
      </div>
    );
  }

  const KPI_CARDS = [
    { label: "Total Usaha", value: kpiData?.total?.value?.toLocaleString('id') || "0", icon: Building2, change: kpiData?.total?.change || "+0%", up: kpiData?.total?.up ?? true, color: "text-primary", bg: "bg-primary/10" },
    { label: "Izin Aktif", value: kpiData?.active?.value?.toLocaleString('id') || "0", icon: CheckCircle, change: kpiData?.active?.change || "+0%", up: kpiData?.active?.up ?? true, color: "text-success", bg: "bg-success/10" },
    { label: "Pending Verifikasi", value: kpiData?.pending?.value?.toLocaleString('id') || "0", icon: Clock, change: kpiData?.pending?.change || "+0%", up: kpiData?.pending?.up ?? true, color: "text-warning", bg: "bg-warning/10" },
    { label: "Izin Kadaluarsa", value: kpiData?.expired?.value?.toLocaleString('id') || "0", icon: AlertTriangle, change: kpiData?.expired?.change || "+0%", up: kpiData?.expired?.up ?? false, color: "text-danger", bg: "bg-danger/10" },
    { label: "Ditolak", value: kpiData?.rejected?.value?.toLocaleString('id') || "0", icon: XCircle, change: kpiData?.rejected?.change || "+0%", up: kpiData?.rejected?.up ?? false, color: "text-danger", bg: "bg-danger/10" },
    { label: "Usaha Baru", value: kpiData?.new?.value?.toLocaleString('id') || "0", icon: TrendingUp, change: kpiData?.new?.change || "+0%", up: kpiData?.new?.up ?? true, color: "text-info", bg: "bg-info/10" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPI_CARDS.map((k) => (
          <StatCard key={k.label} {...k} colorClass={k.color} bgClass={k.bg} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Monthly registrations */}
        <Card className="xl:col-span-7" padding="p-5">
          <SectionHeader title="Pendaftaran Usaha Bulanan" subtitle={`Tahun ${currentYear} — registrasi, terverifikasi, dan ditolak`}>
            <Btn variant="outline" size="sm" Icon={Download} onClick={() => window.open('/api/admin/dashboard/export/excel', '_blank')}>Export</Btn>
          </SectionHeader>
          <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4} barCategoryGap="20%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground, #6b7280)" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground, #6b7280)" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} 
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
                  <Bar dataKey="registrasi" name="Registrasi" fill="var(--primary, #0E5A8A)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terverifikasi" name="Terverifikasi" fill="var(--success, #10B981)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ditolak" name="Ditolak" fill="var(--danger, #EF4444)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution donut */}
        <Card className="xl:col-span-5" padding="p-5">
          <SectionHeader title="Distribusi Kategori Usaha" subtitle="Berdasarkan jenis usaha terdaftar" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={3} stroke="var(--card)">
                {distributionData.map((d: any, i: number) => <Cell key={i} fill={d.color || `var(--chart-${(i % 5) + 1})`} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 mt-4">
            {distributionData.map((d: any, i: number) => (
              <div key={d.name} className="flex items-center gap-2.5 text-xs">
                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ background: d.color || `var(--chart-${(i % 5) + 1})` }} />
                <span className="truncate text-muted-foreground font-medium">{d.name}</span>
                <span className="ml-auto font-bold text-foreground">{d.value.toLocaleString("id")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Activity timeline */}
        <Card className="xl:col-span-4" padding="p-5">
          <SectionHeader title="Aktivitas Terkini" subtitle="Log aktivitas sistem hari ini" />
          <div className="space-y-4">
            {activityFeed.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3.5 group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-transform group-hover:scale-105 ${activityColors[a.status] || "bg-muted text-muted-foreground"}`}>
                  {a.time.split(":")[0]}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-sm font-semibold text-foreground truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.action}</div>
                </div>
                <div className="text-xs font-medium text-muted-foreground/60 flex-shrink-0 pt-1">{a.time}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* District breakdown */}
        <Card className="xl:col-span-5" padding="p-5">
          <SectionHeader title="Statistik per Kecamatan" subtitle="Distribusi usaha di setiap kecamatan" />
          <div className="space-y-4">
            {districtData.map((d: any, i: number) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-foreground truncate min-w-0">{d.name}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground flex-shrink-0">{d.active} / {d.total} aktif</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                       style={{ width: `${(d.active / d.total) * 100}%`, background: d.color || `var(--chart-${(i % 5) + 1})` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mini map + quick actions */}
        <Card className="xl:col-span-3" padding="p-5 flex flex-col">
          <SectionHeader title="Pratinjau Peta" />
          <div className="rounded-md overflow-hidden h-40 md:h-48 mb-5 border border-border flex-shrink-0 relative z-0 min-w-0">
            <CityMapLeaflet height="100%" isMiniMap={true} markers={data?.markers || []} />
          </div>
          <div className="space-y-2.5 flex-1 flex flex-col justify-end">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Aksi Cepat</p>
            <Btn variant="outline" Icon={FileText} size="sm" className="w-full justify-start" onClick={() => window.print()}>
              Export PDF
            </Btn>
            <Btn variant="outline" Icon={FileSpreadsheet} size="sm" className="w-full justify-start" onClick={() => window.open('/api/admin/dashboard/export/excel', '_blank')}>
              Export Excel
            </Btn>
            <Btn variant="outline" Icon={Printer} size="sm" className="w-full justify-start" onClick={() => window.print()}>
              Cetak Laporan
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
