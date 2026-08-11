import { useState, useEffect } from "react";
import axios from 'axios';
import {
  Building2, Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  Download, FileSpreadsheet, Printer, FileText
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card, SectionHeader, Btn } from "../components/ui";
import CityMapLeaflet from "../components/CityMapLeaflet";

export default function DashboardPage() {
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
