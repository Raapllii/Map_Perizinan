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
