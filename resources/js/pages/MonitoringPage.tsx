import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Layers, RefreshCw, MapPinOff, CheckCircle2, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Btn, SectionHeader } from "../components/ui";
import { Table, TableBody, TableRow, TableCell } from "../components/ui/Table";
import { Checkbox } from "../components/ui/checkbox";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

interface NoCoordBusiness {
  name: string;
  nib: string;
  district: string;
}

interface AreaDataPoint {
  time: string;
  usaha: number;
  aktif: number;
}

export default function MonitoringPage() {
  useDocumentTitle("Monitoring");
  const navigate = useNavigate();
  const [selectedNoCoords, setSelectedNoCoords] = useState<string[]>([]);
  const [noCoords, setNoCoords] = useState<NoCoordBusiness[]>([]);
  const [totalNoCoords, setTotalNoCoords] = useState<number>(0);
  const [isLoadingNoCoords, setIsLoadingNoCoords] = useState<boolean>(true);
  const [areaData, setAreaData] = useState<AreaDataPoint[]>([]);

  const toggleSelection = (nib: string) => {
    setSelectedNoCoords(prev => 
      prev.includes(nib) ? prev.filter(id => id !== nib) : [...prev, nib]
    );
  };

  const loadData = () => {
    setIsLoadingNoCoords(true);

    // Fetch unmapped businesses
    axios.get('/api/businesses?status_pemetaan=Belum+Dipetakan&per_page=10')
      .then(res => {
        const rawItems = res.data?.data || [];
        const items: NoCoordBusiness[] = rawItems.map((b: any) => ({
          name: b.nama_perusahaan || "Tidak Ada Nama",
          nib: b.nib || "-",
          district: b.kecamatan_usaha || "Samarinda",
        }));
        setNoCoords(items);
        setTotalNoCoords(res.data?.total ?? items.length);
      })
      .catch(err => {
        console.error("Gagal memuat usaha tanpa koordinat:", err);
      })
      .finally(() => {
        setIsLoadingNoCoords(false);
      });

    // Fetch real trend statistics from dashboard
    axios.get('/api/admin/dashboard')
      .then(res => {
        const monthly = res.data?.monthly || [];
        const totalVal = res.data?.kpi?.total?.value ?? 0;
        const activeVal = res.data?.kpi?.active?.value ?? totalVal;

        if (Array.isArray(monthly) && monthly.length > 0) {
          setAreaData(monthly.map((m: any) => ({
            time: m.month || "-",
            usaha: Number(m.registrasi) || 0,
            aktif: Number(m.terverifikasi) || 0,
          })));
        } else {
          const hours = ["08:00", "10:00", "12:00", "14:00", "16:00"];
          setAreaData(hours.map(h => ({
            time: h,
            usaha: totalVal,
            aktif: activeVal,
          })));
        }
      })
      .catch(err => {
        console.error("Gagal memuat tren dashboard:", err);
        setAreaData([
          { time: "08:00", usaha: 0, aktif: 0 },
          { time: "12:00", usaha: 0, aktif: 0 },
          { time: "16:00", usaha: 0, aktif: 0 },
        ]);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left panel: No coordinates */}
        <div className="xl:col-span-5 flex flex-col gap-5 min-w-0">
          <Card padding="p-4 sm:p-5" className="flex-1 min-w-0">
            <SectionHeader title="Usaha Tanpa Koordinat" subtitle="Perlu penandaan lokasi">
              <span className="text-[10px] font-bold bg-info/15 text-info px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                {totalNoCoords} Usaha
              </span>
            </SectionHeader>

            {isLoadingNoCoords ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs">Memuat data usaha...</span>
              </div>
            ) : noCoords.length === 0 ? (
              <div className="mt-4 p-8 border border-border rounded-lg text-center flex flex-col items-center justify-center gap-2 bg-muted/5">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mb-1">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-sm font-semibold text-foreground">Semua usaha telah memiliki titik koordinat</p>
                <p className="text-xs text-muted-foreground">Tidak ada usaha yang membutuhkan penandaan lokasi di peta.</p>
              </div>
            ) : (
              <>
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
                            <TableCell className="w-[40px] pl-3 sm:pl-4 py-3 align-middle">
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(n.nib)} />
                            </TableCell>
                            <TableCell className="py-3 pr-3 sm:pr-4 align-middle">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">{n.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {n.nib} &middot; {n.district}
                                  </div>
                                </div>
                                <div className="text-[11px] text-warning flex items-center gap-1 font-medium bg-warning/10 px-2 py-0.5 rounded-full shrink-0">
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
                  <button 
                    onClick={() => navigate('/admin/data-usaha?status_pemetaan=Belum+Dipetakan')}
                    className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    Lihat semua {totalNoCoords} usaha &rarr;
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Map monitoring */}
        <Card className="xl:col-span-7 flex flex-col min-w-0" padding="p-0">
          <div className="p-3.5 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-foreground">Peta Monitoring Real-time</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Kondisi usaha di seluruh wilayah</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Btn variant="secondary" size="sm" Icon={Layers} className="flex-1 sm:flex-none justify-center">Heatmap</Btn>
              <Btn variant="outline" size="sm" Icon={RefreshCw} onClick={loadData} className="flex-1 sm:flex-none justify-center">Refresh</Btn>
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
                <YAxis 
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                  axisLine={false} 
                  tickLine={false} 
                  domain={[0, (dataMax: number) => Math.max(dataMax + 1, 5)]} 
                />
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
