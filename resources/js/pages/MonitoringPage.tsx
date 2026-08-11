import React, { useState, useEffect, lazy, Suspense } from "react";
import { Layers, RefreshCw, MapPin } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Btn, SectionHeader } from "../components/ui";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function MonitoringPage() {
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
          <Suspense fallback={<div>Loading Map...</div>}>
            <CityMapLeaflet height="340px" showHeatmap />
          </Suspense>
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
