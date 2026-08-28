import React, { useState, lazy, Suspense } from "react";
import { Layers, RefreshCw, MapPinOff } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Btn, SectionHeader } from "../components/ui";
import { Table, TableBody, TableRow, TableCell } from "../components/ui/Table";
import { Checkbox } from "../components/ui/checkbox";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function MonitoringPage() {
  const [selectedNoCoords, setSelectedNoCoords] = useState<string[]>([]);

  const toggleSelection = (nib: string) => {
    setSelectedNoCoords(prev => 
      prev.includes(nib) ? prev.filter(id => id !== nib) : [...prev, nib]
    );
  };


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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left panel: No coordinates */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <Card padding="p-5" className="flex-1">
            <SectionHeader title="Usaha Tanpa Koordinat" subtitle="Perlu penandaan lokasi">
              <span className="text-[10px] font-bold bg-info/15 text-info px-2 py-1 rounded-full uppercase tracking-wider">23 Usaha</span>
            </SectionHeader>
            <div className="mt-4 border border-border rounded-lg overflow-hidden">
              <Table>
                <TableBody>
                  {noCoords.map((n) => {
                    const isSelected = selectedNoCoords.includes(n.nib);
                    return (
                      <TableRow 
                        key={n.nib} 
                        data-state={isSelected && "selected"} 
                        onClick={() => toggleSelection(n.nib)}
                        className="cursor-pointer"
                      >
                        <TableCell className="w-[40px] pl-4 py-3 align-middle">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(n.nib)} />
                        </TableCell>
                        <TableCell className="py-3 pr-4 align-middle">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-medium text-foreground">{n.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {n.nib} &middot; {n.district}
                              </div>
                            </div>
                            <div className="text-[11px] text-warning flex items-center gap-1 font-medium bg-warning/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <MapPinOff size={10} strokeWidth={2} /> Belum
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="pt-3">
              <button className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors">Lihat semua 23 usaha &rarr;</button>
            </div>
          </Card>
        </div>

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
