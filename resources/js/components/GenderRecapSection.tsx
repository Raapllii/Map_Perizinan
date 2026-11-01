import React from "react";
import { Users, UserCheck, HelpCircle, FileSpreadsheet, Loader2, Info } from "lucide-react";
import { Card, Btn } from "./ui";

export interface GenderRecapData {
  laki_laki?: number;
  perempuan?: number;
  tidak_diketahui?: number;
  total_valid?: number;
  total?: number;
  persentase_laki_valid?: number;
  persentase_perempuan_valid?: number;
  persentase_laki_total?: number;
  persentase_perempuan_total?: number;
  persentase_tidak_diketahui_total?: number;
  source_available?: boolean;
  source_note?: string;
}

interface GenderRecapSectionProps {
  gender?: GenderRecapData | null;
  title?: string;
  subtitle?: string;
  onExportExcel?: () => void;
  isExporting?: boolean;
  showExportButton?: boolean;
}

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  return n.toLocaleString("id-ID");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0.0";
  return Number(n).toFixed(1);
}

export default function GenderRecapSection({
  gender,
  title = "Rekapitulasi Berdasarkan Gender",
  subtitle = "Proporsi jenis kelamin berdasarkan data yang tersedia pada sistem",
  onExportExcel,
  isExporting = false,
  showExportButton = true,
}: GenderRecapSectionProps) {
  const lakiLaki = gender?.laki_laki ?? 0;
  const perempuan = gender?.perempuan ?? 0;
  const tidakDiketahui = gender?.tidak_diketahui ?? 0;
  const totalValid = gender?.total_valid ?? lakiLaki + perempuan;
  const totalAll = gender?.total ?? totalValid + tidakDiketahui;

  const pctLakiValid =
    gender?.persentase_laki_valid ?? (totalValid > 0 ? (lakiLaki / totalValid) * 100 : 0);
  const pctPerempuanValid =
    gender?.persentase_perempuan_valid ?? (totalValid > 0 ? (perempuan / totalValid) * 100 : 0);

  const pctLakiTotal =
    gender?.persentase_laki_total ?? (totalAll > 0 ? (lakiLaki / totalAll) * 100 : 0);
  const pctPerempuanTotal =
    gender?.persentase_perempuan_total ?? (totalAll > 0 ? (perempuan / totalAll) * 100 : 0);
  const pctUnknownTotal =
    gender?.persentase_tidak_diketahui_total ??
    (totalAll > 0 ? (tidakDiketahui / totalAll) * 100 : 0);

  return (
    <Card className="p-5 border-border/40 shadow-sm bg-card">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        {showExportButton && onExportExcel && (
          <Btn
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium gap-1.5 self-start sm:self-auto"
            onClick={onExportExcel}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Mengekspor Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} className="text-primary" />
                <span>Export Excel</span>
              </>
            )}
          </Btn>
        )}
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {/* Card 1: Laki-laki */}
        <div className="rounded-xl border border-border/50 bg-blue-500/[0.03] hover:bg-blue-500/[0.06] transition-colors p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Laki-laki
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {fmtPct(pctLakiValid)}% Valid
            </span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground">{fmt(lakiLaki)}</div>
          <div className="mt-2 h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(100, pctLakiValid)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {fmtPct(pctLakiValid)}% dari data valid ({fmtPct(pctLakiTotal)}% dari total keseluruhan)
          </p>
        </div>

        {/* Card 2: Perempuan */}
        <div className="rounded-xl border border-border/50 bg-pink-500/[0.03] hover:bg-pink-500/[0.06] transition-colors p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Perempuan
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
              {fmtPct(pctPerempuanValid)}% Valid
            </span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground">{fmt(perempuan)}</div>
          <div className="mt-2 h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-600 transition-all duration-500"
              style={{ width: `${Math.min(100, pctPerempuanValid)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {fmtPct(pctPerempuanValid)}% dari data valid ({fmtPct(pctPerempuanTotal)}% dari total keseluruhan)
          </p>
        </div>

        {/* Card 3: Belum Diisi / Tidak Diketahui */}
        <div className="rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/35 transition-colors p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              Belum Diisi / Tidak Diketahui
            </span>
            <HelpCircle size={14} className="text-muted-foreground shrink-0" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {fmt(tidakDiketahui)}
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-400 transition-all duration-500"
              style={{ width: `${Math.min(100, pctUnknownTotal)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {fmtPct(pctUnknownTotal)}% dari total keseluruhan data ({fmt(totalAll)})
          </p>
        </div>

        {/* Card 4: Total Data Valid & Keseluruhan */}
        <div className="rounded-xl border border-border/50 bg-primary/[0.03] hover:bg-primary/[0.05] transition-colors p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Data Valid
            </span>
            <UserCheck size={14} className="text-primary shrink-0" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground">{fmt(totalValid)}</div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span>Total Keseluruhan Data:</span>
            <span className="font-semibold text-foreground tabular-nums">{fmt(totalAll)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {totalAll > 0 ? fmtPct((totalValid / totalAll) * 100) : "0.0"}% data memiliki atribut gender
          </p>
        </div>
      </div>

      {/* Combined Visual Distribution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Komposisi Distribusi Gender</span>
          <span className="tabular-nums">Total: {fmt(totalAll)} data</span>
        </div>

        <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden flex">
          {totalAll > 0 && (
            <>
              {lakiLaki > 0 && (
                <div
                  className="h-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${pctLakiTotal}%` }}
                  title={`Laki-laki: ${fmt(lakiLaki)} (${fmtPct(pctLakiValid)}% valid / ${fmtPct(pctLakiTotal)}% total)`}
                />
              )}
              {perempuan > 0 && (
                <div
                  className="h-full bg-pink-600 transition-all duration-700"
                  style={{ width: `${pctPerempuanTotal}%` }}
                  title={`Perempuan: ${fmt(perempuan)} (${fmtPct(pctPerempuanValid)}% valid / ${fmtPct(pctPerempuanTotal)}% total)`}
                />
              )}
              {tidakDiketahui > 0 && (
                <div
                  className="h-full bg-slate-400/80 transition-all duration-700"
                  style={{ width: `${pctUnknownTotal}%` }}
                  title={`Belum Diisi / Tidak Diketahui: ${fmt(tidakDiketahui)} (${fmtPct(pctUnknownTotal)}% total)`}
                />
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span>Laki-laki:</span>
              <strong className="text-foreground tabular-nums">{fmt(lakiLaki)}</strong>
              <span>({fmtPct(pctLakiValid)}% valid)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-600 shrink-0" />
              <span>Perempuan:</span>
              <strong className="text-foreground tabular-nums">{fmt(perempuan)}</strong>
              <span>({fmtPct(pctPerempuanValid)}% valid)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <span>Belum Diisi / Tidak Diketahui:</span>
              <strong className="text-foreground tabular-nums">{fmt(tidakDiketahui)}</strong>
              <span>({fmtPct(pctUnknownTotal)}% total)</span>
            </span>
          </div>

          {gender?.source_note && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Info size={12} className="shrink-0 text-muted-foreground" />
              <span>{gender.source_note}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

