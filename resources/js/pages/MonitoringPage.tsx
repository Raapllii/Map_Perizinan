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
    <div className="space-y-6">
      {/* Live status bar */}
      <Card padding="px-5 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className={`w-3 h-3 bg-success rounded-full ${pulse ? "scale-110" : "scale-90"} transition-transform duration-700`} />
              <div className="absolute w-6 h-6 bg-success rounded-full opacity-30 animate-ping" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Sistem Aktif</div>
              <div className="text-[11px] font-medium text-muted-foreground mt-0.5">Pembaruan terakhir: 21 Jul 2025, 14:32 WIB</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {[
              { label: "Usaha Aktif Hari Ini", value: "+3", color: "text-success" },
              { label: "Izin Hampir Kadaluarsa", value: "15", color: "text-warning" },
              { label: "Tanpa Koordinat", value: "23", color: "text-info" },
              { label: "Notifikasi Terkirim", value: "89", color: "text-primary" },
            ].map(s => (
              <div key={s.label} className="text-center min-w-[100px]">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Map monitoring */}
        <Card className="xl:col-span-7 flex flex-col" padding="p-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Peta Monitoring Real-time</h3>
              <p className="text-xs font-medium text-muted-foreground mt-1">Kondisi usaha di seluruh wilayah</p>
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" Icon={Layers}>Heatmap</Btn>
              <Btn variant="outline" size="sm" Icon={RefreshCw} className="hidden sm:inline-flex">Refresh</Btn>
            </div>
          </div>
          <div className="flex-1 bg-muted/10 relative min-h-[300px]">
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground animate-pulse">Memuat Peta...</span>
              </div>
            }>
              <CityMapLeaflet height="100%" showHeatmap />
            </Suspense>
          </div>
        </Card>

        {/* Right panels */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* Expiring licenses */}
          <Card padding="p-5" className="flex-1">
            <SectionHeader title="Izin Segera Kadaluarsa" subtitle="Dalam 30 hari ke depan">
              <span className="text-[10px] font-bold bg-warning/15 text-warning px-2 py-1 rounded-full uppercase tracking-wider">15 Izin</span>
            </SectionHeader>
            <div className="space-y-3 mt-4">
              {expiringLicenses.map((e) => (
                <div key={e.name} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${e.days <= 7 ? "bg-danger" : e.days <= 14 ? "bg-warning" : "bg-success"}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{e.name}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">{e.district}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${e.days <= 7 ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>
                    {e.days} hari
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* No coordinates */}
          <Card padding="p-5" className="flex-1">
            <SectionHeader title="Usaha Tanpa Koordinat" subtitle="Perlu penandaan lokasi">
              <span className="text-[10px] font-bold bg-info/15 text-info px-2 py-1 rounded-full uppercase tracking-wider">23 Usaha</span>
            </SectionHeader>
            <div className="space-y-3 mt-4">
              {noCoords.map((n) => (
                <div key={n.name} className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all">
                  <div>
                    <p className="text-sm font-bold text-foreground">{n.name}</p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-1">
                      <span className="font-mono bg-muted px-1 py-0.5 rounded mr-1.5">{n.nib}</span>
                      {n.district}
                    </p>
                  </div>
                  <Btn variant="secondary" size="xs" Icon={MapPin}>Tandai</Btn>
                </div>
              ))}
              <div className="pt-2">
                <button className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors">Lihat semua 23 usaha &rarr;</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Trend chart */}
      <Card padding="p-5">
        <SectionHeader title="Tren Pertumbuhan Usaha (Real-time hari ini)" subtitle="Total usaha terdaftar dan aktif" />
        <div className="w-full overflow-x-auto mt-4">
          <div className="min-w-[600px]">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAktif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} />
                <Area type="monotone" dataKey="usaha" name="Total Usaha" stroke="var(--primary)" fill="url(#gradTotal)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="aktif" name="Usaha Aktif" stroke="var(--success)" fill="url(#gradAktif)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}
