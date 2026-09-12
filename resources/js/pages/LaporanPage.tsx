import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  ChevronDown, Activity, Loader2, MapPin, MapPinOff, History,
  Clock, ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle,
  Building2, BarChart3, TrendingUp, FileDown, Printer,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, Btn, StatusBadge } from "../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  return n.toLocaleString("id-ID");
}

function pct(val: number, total: number): string {
  if (!total || !val) return "0.0";
  return ((val / total) * 100).toFixed(1);
}

const RISK_CONFIG: Record<string, { label: string; color: string; cssVar: string; icon: any; badgeCls: string }> = {
  "rendah": {
    label: "Risiko Rendah",
    color: "var(--success)",
    cssVar: "--success",
    icon: ShieldCheck,
    badgeCls: "bg-success/10 text-success border border-success/20",
  },
  "risiko rendah": {
    label: "Risiko Rendah",
    color: "var(--success)",
    cssVar: "--success",
    icon: ShieldCheck,
    badgeCls: "bg-success/10 text-success border border-success/20",
  },
  "menengah rendah": {
    label: "Menengah Rendah",
    color: "var(--warning)",
    cssVar: "--warning",
    icon: AlertTriangle,
    badgeCls: "bg-warning/10 text-warning border border-warning/20",
  },
  "menengah tinggi": {
    label: "Menengah Tinggi",
    color: "hsl(25 95% 53%)",
    cssVar: "--warning",
    icon: AlertTriangle,
    badgeCls: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
  },
  "tinggi": {
    label: "Risiko Tinggi",
    color: "var(--danger)",
    cssVar: "--danger",
    icon: ShieldAlert,
    badgeCls: "bg-danger/10 text-danger border border-danger/20",
  },
  "risiko tinggi": {
    label: "Risiko Tinggi",
    color: "var(--danger)",
    cssVar: "--danger",
    icon: ShieldAlert,
    badgeCls: "bg-danger/10 text-danger border border-danger/20",
  },
};

function getRiskConfig(name: string) {
  const key = (name ?? "").toLowerCase().trim();
  return RISK_CONFIG[key] ?? {
    label: name || "Tidak Diisi",
    color: "var(--muted-foreground)",
    cssVar: "--muted-foreground",
    icon: HelpCircle,
    badgeCls: "bg-muted text-muted-foreground border border-border",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const LaporanSkeleton = () => (
  <div className="space-y-7 pb-12 animate-pulse">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between gap-4 pb-6 border-b border-border/40">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-muted/60 rounded-lg" />
        <div className="h-4 w-80 bg-muted/40 rounded-md" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-32 bg-muted/50 rounded-md" />
        <div className="h-9 w-20 bg-muted/50 rounded-md" />
        <div className="h-9 w-20 bg-muted/50 rounded-md" />
      </div>
    </div>
    {/* KPI Panel */}
    <div className="h-24 w-full bg-muted/40 rounded-xl border border-border/40" />
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 h-[340px] bg-muted/40 rounded-xl border border-border/40" />
      <div className="lg:col-span-2 h-[340px] bg-muted/40 rounded-xl border border-border/40" />
    </div>
    {/* Komposisi risiko */}
    <div className="h-[200px] w-full bg-muted/40 rounded-xl border border-border/40" />
    {/* Table + Categories */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 h-[380px] bg-muted/40 rounded-xl border border-border/40" />
      <div className="lg:col-span-2 h-[380px] bg-muted/40 rounded-xl border border-border/40" />
    </div>
  </div>
);

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border shadow-lg rounded-lg px-4 py-3 text-sm min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Risk Badge inline ─────────────────────────────────────────────────────────

const RiskBadge = ({ name }: { name: string }) => {
  const cfg = getRiskConfig(name);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.68rem] font-semibold uppercase tracking-wide ${cfg.badgeCls}`}>
      {name || "Tidak Diisi"}
    </span>
  );
};

// ─── Section Title ─────────────────────────────────────────────────────────────

const SectionTitle = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState("2025");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("header-actions"));
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/admin/dashboard?year=${year}`)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [year]);

  // ── Safe data extraction ───────────────────────────────────────────────────

  const kpis        = data?.kpi ?? {};
  const risks       = useMemo(() => Array.isArray(kpis?.risks) ? kpis.risks : [], [kpis]);
  const monthly     = useMemo(() => Array.isArray(data?.monthly) ? data.monthly : [], [data]);
  const distribution = useMemo(() => Array.isArray(data?.distribution) ? data.distribution : [], [data]);
  const districts   = useMemo(() => Array.isArray(data?.districts) ? data.districts : [], [data]);
  const activities  = useMemo(() => Array.isArray(data?.activities) ? data.activities : [], [data]);

  const totalUsaha    = kpis?.total?.value ?? 0;
  const totalChange   = kpis?.total?.change ?? null;
  const totalUp       = kpis?.total?.up ?? true;
  const belumDipetakan = typeof kpis?.belum_dipetakan === 'number' ? kpis.belum_dipetakan : 0;
  const sudahDipetakan = Math.max(0, totalUsaha - belumDipetakan);
  const denominator   = totalUsaha > 0 ? totalUsaha : 1;

  // ── Pie chart data ─────────────────────────────────────────────────────────
  const pieData = useMemo(() =>
    risks
      .map((r: any) => ({ name: r.name || "Tidak Diisi", value: r.value ?? 0, color: getRiskConfig(r.name).color }))
      .filter((d: any) => d.value > 0),
    [risks]
  );

  // ── Max district total for mini-bar ───────────────────────────────────────
  const maxDistTotal = useMemo(() => Math.max(...districts.map((d: any) => d.total ?? 0), 1), [districts]);

  // ── Max category value for progress bar ───────────────────────────────────
  const maxCatVal = useMemo(() => Math.max(...distribution.map((d: any) => d.value ?? 0), 1), [distribution]);

  if (loading && !data) return <LaporanSkeleton />;

  // ── Section separator ──────────────────────────────────────────────────────

  const Divider = () => <div className="border-t border-border/40" />;

  return (
    <div className="space-y-7 pb-12 pt-1 max-w-[1600px] mx-auto">

      {/* ═══════════════════════════════════════════════════════════════════════
          1. ACTION TOOLBAR (Portaled to Global Header)
      ═══════════════════════════════════════════════════════════════════════ */}
      {portalTarget && createPortal(
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start sm:justify-end gap-2 w-full sm:w-auto mt-3 sm:mt-0">
          {/* Year filter */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full sm:w-auto text-sm font-medium border border-border rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background cursor-pointer transition-colors"
            >
              {["2025", "2024", "2023", "2022"].map((y) => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="hidden sm:block w-px h-5 bg-border/60 mx-1" />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Btn 
              variant="outline" 
              size="sm" 
              className="h-9 text-xs font-medium gap-1.5 flex-1 sm:flex-none justify-center"
              onClick={() => window.open(`/api/admin/dashboard/export/excel?year=${year}`, '_blank')}
            >
              <FileDown size={13} /> Excel
            </Btn>
            <Btn 
              variant="outline" 
              size="sm" 
              className="h-9 text-xs font-medium gap-1.5 flex-1 sm:flex-none justify-center"
              onClick={() => window.print()}
            >
              <Printer size={13} /> Cetak
            </Btn>
          </div>

          {loading && <Loader2 size={15} className="animate-spin text-muted-foreground hidden sm:block ml-1" />}
        </div>,
        portalTarget
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          2. KPI SUMMARY — Responsive Grid
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-card">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[1px] bg-border/40">

          {/* Total Usaha — prominent */}
          <div className="px-3.5 sm:px-5 xl:px-6 py-3.5 sm:py-5 flex flex-col justify-center bg-primary/[0.03] hover:bg-primary/[0.05] transition-colors relative min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Building2 size={13} className="text-primary shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Total Usaha</span>
            </div>
            <div className="text-xl sm:text-2xl xl:text-3xl font-bold tabular-nums tracking-tight text-foreground break-words">
              {fmt(totalUsaha)}
            </div>
            {totalChange && (
              <div className={`flex items-center gap-1 mt-1 sm:mt-1.5 text-[11px] sm:text-xs font-semibold ${totalUp ? "text-success" : "text-danger"}`}>
                {totalUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                <span className="truncate">{totalChange} vs. lalu</span>
              </div>
            )}
          </div>

          {/* Belum Dipetakan */}
          <div className="px-3.5 sm:px-5 py-3.5 sm:py-5 flex flex-col justify-center bg-card hover:bg-orange-500/5 transition-colors relative min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPinOff size={12} className="text-orange-500 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Belum Dipetakan</span>
            </div>
            <div className="text-lg sm:text-xl xl:text-2xl font-bold tabular-nums tracking-tight text-foreground break-words">
              {fmt(belumDipetakan)}
            </div>
            <div className="text-[11px] sm:text-xs text-orange-500/80 mt-0.5 font-medium truncate">
              {pct(belumDipetakan, denominator)}% dari total
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
              {fmt(sudahDipetakan)} sudah dipetakan
            </div>
          </div>

          {/* Risk breakdown (Static Order) */}
          {["Risiko Rendah", "Menengah Rendah", "Menengah Tinggi", "Risiko Tinggi"].map((riskName, i) => {
            // Find value from backend response
            const rValue = risks.find((r: any) => r.name === riskName)?.value ?? 0;
            const cfg = getRiskConfig(riskName);
            const Icon = cfg.icon;
            const share = pct(rValue, denominator);
            return (
              <div key={i} className="px-3.5 sm:px-5 py-3.5 sm:py-5 flex flex-col justify-center bg-card hover:bg-muted/30 transition-colors relative min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} style={{ color: cfg.color }} className="shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate max-w-[120px]">{cfg.label}</span>
                </div>
                <div className="text-lg sm:text-xl xl:text-2xl font-bold tabular-nums tracking-tight text-foreground break-words">
                  {fmt(rValue)}
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{share}%</div>
              </div>
            );
          })}   
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. GRAFIK ANALISIS (60/40)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={15} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Analisis Data Usaha</h2>
          <span className="text-xs text-muted-foreground">— tahun {year}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Area Chart — Tren Pendaftaran */}
          <Card className="lg:col-span-3 p-5 border-border/40 shadow-sm flex flex-col bg-card">
            <SectionTitle
              title="Tren Pendaftaran Usaha"
              subtitle="Pergerakan registrasi dan verifikasi per bulan"
            />
            <div className="flex-1 min-h-[280px]">
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gVerif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
                      wrapperStyle={{ paddingTop: "12px" }}
                    />
                    <Area type="monotone" dataKey="registrasi" name="Total Registrasi"
                      stroke="var(--primary)" strokeWidth={2} fill="url(#gReg)"
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area type="monotone" dataKey="terverifikasi" name="Terverifikasi"
                      stroke="var(--success)" strokeWidth={2} fill="url(#gVerif)"
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/50 min-h-[200px]">
                  <Activity size={22} className="mb-2 opacity-40" />
                  <p className="text-sm">Belum ada data tren untuk tahun {year}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Donut Chart — Distribusi Risiko */}
          <Card className="lg:col-span-2 p-5 border-border/40 shadow-sm flex flex-col bg-card">
            <SectionTitle
              title="Distribusi Risiko Proyek"
              subtitle="Proporsi tingkat risiko usaha terdaftar"
            />
            {pieData.length > 0 ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="relative h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="50%"
                        innerRadius={62} outerRadius={88}
                        paddingAngle={2} dataKey="value" stroke="none"
                      >
                        {pieData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, name: string) => [fmt(v) + " usaha", name]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)", padding: "8px 12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold tabular-nums text-foreground">{fmt(totalUsaha)}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Total</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2.5 mt-4">
                  {pieData.map((d: any, i: number) => {
                    const share = pct(d.value, denominator);
                    return (
                      <div key={i} className="flex items-center gap-2.5 group">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">{fmt(d.value)}</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">{share}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/50 min-h-[200px]">
                <BarChart3 size={22} className="mb-2 opacity-40" />
                <p className="text-sm">Data risiko tidak tersedia</p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. KOMPOSISI RISIKO — Progress bar panel
      ═══════════════════════════════════════════════════════════════════════ */}
      {risks.length > 0 && (
        <Card className="p-5 border-border/40 shadow-sm bg-card">
          <SectionTitle
            title="Komposisi Risiko Proyek"
            subtitle="Detail persentase setiap kategori risiko berdasarkan total usaha terdaftar"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
            {risks.map((r: any, i: number) => {
              const cfg = getRiskConfig(r.name);
              const share = parseFloat(pct(r.value ?? 0, denominator));
              return (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">{fmt(r.value)}</span>
                  </div>
                  <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${share}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{share.toFixed(1)}% dari total usaha</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          5. DISTRIBUSI KECAMATAN + TOP KATEGORI (60/40)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Tabel Kecamatan (60%) */}
        <Card className="lg:col-span-3 border-border/40 shadow-sm bg-card overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-border/30">
            <SectionTitle
              title="Distribusi Usaha Berdasarkan Kecamatan"
              subtitle="Rincian total dan komposisi risiko per wilayah kecamatan"
            />
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/30">
                  <th className="py-3 px-5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-6 whitespace-nowrap">No.</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Kecamatan</th>
                  <th className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Total</th>
                  <th className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Rendah</th>
                  <th className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Menengah</th>
                  <th className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Tinggi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/25">
                {districts.length > 0 ? districts.map((d: any, i: number) => {
                  const barW = Math.round((d.total / maxDistTotal) * 100);
                  return (
                    <tr key={d.name ?? i} className="hover:bg-muted/25 transition-colors group">
                      <td className="py-3.5 px-5 text-xs text-muted-foreground font-medium">{i + 1}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-muted-foreground/60 shrink-0" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{d.name}</p>
                            {/* Mini progress bar */}
                            <div className="mt-1 h-1 w-24 bg-muted/40 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary/60" style={{ width: `${barW}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold tabular-nums text-foreground">{fmt(d.total)}</td>
                      <td className="py-3.5 px-5 text-right tabular-nums text-success">{fmt(d.risiko_rendah)}</td>
                      <td className="py-3.5 px-5 text-right tabular-nums text-warning">{fmt(d.risiko_menengah)}</td>
                      <td className="py-3.5 px-5 text-right tabular-nums text-danger">{fmt(d.risiko_tinggi)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                      <MapPin size={20} className="mx-auto mb-2 opacity-30" />
                      Data kecamatan tidak tersedia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top 5 Kategori Usaha (40%) */}
        <Card className="lg:col-span-2 p-5 border-border/40 shadow-sm bg-card">
          <SectionTitle
            title="Kategori Usaha Terbanyak"
            subtitle="Top 5 sektor KBLI dengan pendaftaran tertinggi"
          />
          {distribution.length > 0 ? (
            <div className="space-y-5">
              {distribution.slice(0, 5).map((d: any, i: number) => {
                const barPct = Math.round(((d.value ?? 0) / maxCatVal) * 100);
                const share = pct(d.value ?? 0, denominator);
                const rankColors = ["text-primary", "text-blue-500", "text-indigo-500", "text-violet-500", "text-purple-500"];
                return (
                  <div key={i} className="group">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className={`text-sm font-bold tabular-nums shrink-0 ${rankColors[i] ?? "text-muted-foreground"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2" title={d.name}>{d.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums text-foreground">{fmt(d.value)}</p>
                        <p className="text-xs text-muted-foreground">{share}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${barPct}%`, backgroundColor: d.color ?? "var(--primary)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingUp size={22} className="mb-2 opacity-30" />
              <p className="text-sm">Belum ada data kategori</p>
            </div>
          )}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. AKTIVITAS TERBARU — Compact
      ═══════════════════════════════════════════════════════════════════════ */}
      {activities.length > 0 && (
        <Card className="p-5 border-border/40 shadow-sm bg-card">
          <SectionTitle
            title="Aktivitas Terbaru"
            subtitle="Pencatatan tindakan terkini pada sistem perizinan OSS"
          />
          <div className="space-y-0 divide-y divide-border/30">
            {activities.slice(0, 5).map((act: any, i: number) => (
              <div key={i} className="flex items-center gap-3.5 py-3 group hover:bg-muted/20 -mx-5 px-5 transition-colors first:rounded-t-xl last:rounded-b-xl">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <History size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{act.action ?? "-"}</p>
                  {act.name && <p className="text-xs text-muted-foreground truncate mt-0.5">{act.name}</p>}
                </div>
                {act.status && <StatusBadge status={act.status} />}
                {act.time && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 tabular-nums">
                    <Clock size={10} />
                    {act.time}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
