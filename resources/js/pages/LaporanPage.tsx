import { useState, useEffect } from "react";
import axios from 'axios';
import { ChevronDown, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, Btn } from "../components/ui";

export default function LaporanPage() {
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
    { name: "Aktif", value: 1923, color: "var(--success)" },
    { name: "Kadaluarsa", value: 156, color: "var(--warning)" },
    { name: "Pending", value: 234, color: "var(--info)" },
    { name: "Ditolak", value: 89, color: "var(--danger)" },
    { name: "Lainnya", value: 445, color: "var(--muted-foreground)" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Usaha Terdaftar", value: "2.847", sub: "Per Juli 2025", color: "text-primary" },
          { label: "Tingkat Verifikasi", value: "87.4%", sub: "+2.1% dari bulan lalu", color: "text-info" },
          { label: "Rata-rata/Bulan", value: "237", sub: "Pendaftaran baru", color: "text-secondary" },
          { label: "Tingkat Kepatuhan", value: "92.3%", sub: "Izin yang masih berlaku", color: "text-success" },
        ].map(k => (
          <Card key={k.label} padding="p-5" className="hover:shadow-md transition-shadow">
            <div className={`text-3xl font-bold ${k.color} mb-1.5 tracking-tight`}>{k.value}</div>
            <div className="text-sm font-bold text-foreground">{k.label}</div>
            <div className="text-xs font-medium text-muted-foreground mt-1">{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Card padding="p-5" className="flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-1 bg-muted/30 rounded-xl p-1 w-full md:w-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === t.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select value={year} onChange={e => setYear(e.target.value)}
                className="text-sm font-medium border border-border rounded-xl px-4 py-2 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background pr-9 transition-colors">
                {["2025", "2024", "2023", "2022"].map(y => <option key={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <Btn variant="outline" size="sm" Icon={FileText}>PDF</Btn>
            <Btn variant="outline" size="sm" Icon={FileSpreadsheet}>Excel</Btn>
            <Btn variant="outline" size="sm" Icon={Printer}>Cetak</Btn>
          </div>
        </div>

        {activeTab === "kecamatan" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[400px]">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={districts} layout="vertical" barGap={4} barCategoryGap="20%" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                    <Bar dataKey="active" name="Aktif" fill="var(--success)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="var(--warning)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="expired" name="Kadaluarsa" fill="var(--danger)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Kecamatan", "Total", "Aktif", "Pending", "Kadaluarsa"].map(h => (
                      <th key={h} className="py-3.5 px-4 text-xs font-bold text-muted-foreground tracking-wider uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {districts.map(d => (
                    <tr key={d.name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-xs font-bold text-foreground">{d.name}</td>
                      <td className="py-3 px-4 text-xs font-bold text-foreground">{d.total}</td>
                      <td className="py-3 px-4 text-xs font-bold text-success bg-success/5">{d.active}</td>
                      <td className="py-3 px-4 text-xs font-bold text-warning bg-warning/5">{d.pending}</td>
                      <td className="py-3 px-4 text-xs font-bold text-danger bg-danger/5">{d.expired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "kategori" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={distribution} cx="50%" cy="50%" outerRadius={120} dataKey="value" paddingAngle={3} stroke="var(--card)"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {distribution.map((d, i) => <Cell key={i} fill={d.color || `var(--chart-${(i % 5) + 1})`} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4 lg:pl-4">
              {distribution.map((d, i) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ background: d.color || `var(--chart-${(i % 5) + 1})` }} />
                      <span className="text-sm font-bold text-foreground">{d.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{d.value.toLocaleString("id")}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(d.value / 2847) * 100}%`, background: d.color || `var(--chart-${(i % 5) + 1})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tren" && (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                  <Line type="monotone" dataKey="total" name="Total Usaha" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--card)" }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="active" name="Izin Aktif" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--success)", strokeWidth: 2, stroke: "var(--card)" }} />
                  <Line type="monotone" dataKey="expired" name="Kadaluarsa" stroke="var(--danger)" strokeWidth={2.5} strokeDasharray="6 6" dot={{ r: 4, fill: "var(--danger)", strokeWidth: 2, stroke: "var(--card)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "status" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={4} stroke="var(--card)">
                  {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 lg:pl-4">
              {statusPie.map(d => (
                <div key={d.name} className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-transparent hover:border-border hover:bg-muted/40 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: d.color }} />
                  <span className="text-sm font-bold text-foreground flex-1">{d.name}</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-foreground block">{d.value.toLocaleString("id")}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{((d.value / 2847) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
