import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  User,
  Building2,
  Calendar,
  Clock,
  Shield,
  Award,
  CheckCircle2,
  Loader2,
  FileText,
  AlertCircle
} from "lucide-react";
import { cn } from "../lib/utils";

export interface SurveyRespondentDetailModalProps {
  isOpen: boolean;
  surveyId: number | null;
  onClose: () => void;
}

export default function SurveyRespondentDetailModal({
  isOpen,
  surveyId,
  onClose,
}: SurveyRespondentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !surveyId) {
      setSurveyData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/admin/service-surveys/${surveyId}`)
      .then((res) => {
        if (isMounted && res.data?.status === "success") {
          setSurveyData(res.data.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal memuat detail survei responden:", err);
          setError("Gagal memuat rincian survei responden. Silakan coba lagi.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, surveyId]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return { date: "-", time: "-" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: "" };
      const date = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
      const time = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d).replace(/\./g, ":");
      return { date, time: `${time} WITA` };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  const getScoreBadgeClass = (score: number) => {
    switch (score) {
      case 4:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case 3:
        return "bg-primary/10 text-primary border-primary/20";
      case 2:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
  };

  const { date, time } = formatDateTime(surveyData?.created_at);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                Rincian Isian Survei Responden
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Hasil penilaian 9 indikator pelayanan publik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 [scrollbar-width:thin]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p className="text-xs font-medium text-muted-foreground">
                Memuat rincian jawaban survei...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <AlertCircle size={32} className="text-destructive" />
              <p className="text-sm font-semibold text-foreground">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80 text-foreground cursor-pointer"
              >
                Tutup
              </button>
            </div>
          ) : surveyData ? (
            <>
              {/* Respondent & Business Information Card */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Nama Responden
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-bold text-foreground text-sm">
                      <User size={14} className="text-primary shrink-0" />
                      <span className="truncate">{surveyData.nama_responden}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Instansi / Asal
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-medium text-foreground">
                      <Building2 size={14} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{surveyData.instansi}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      NIK Terdaftar (Masked)
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-mono text-muted-foreground">
                      <Shield size={13} className="text-emerald-500 shrink-0" />
                      <span>{surveyData.nik_masked}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Waktu Pengisian
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground font-medium">
                      <Calendar size={13} className="shrink-0" />
                      <span>{date}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <Clock size={13} className="shrink-0" />
                      <span>{time}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-border/50">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Usaha yang Diminta / Diunduh
                    </span>
                    <div className="font-semibold text-foreground text-xs mt-0.5">
                      {surveyData.business_name}{" "}
                      {surveyData.business_nib && surveyData.business_nib !== "-" && (
                        <span className="text-[11px] font-mono font-normal text-muted-foreground">
                          (NIB: {surveyData.business_nib})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Summary KPI Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Total Nilai
                  </span>
                  <div className="text-lg font-bold text-foreground mt-0.5 font-mono">
                    {surveyData.total_score}{" "}
                    <span className="text-xs text-muted-foreground font-normal">/ 36</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-semibold text-primary">
                    Rata-rata Skor
                  </span>
                  <div className="text-lg font-bold text-primary mt-0.5 font-mono">
                    {Number(surveyData.average_score).toFixed(2)}{" "}
                    <span className="text-xs font-normal">/ 4.00</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                    Mutu Layanan
                  </span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <Award size={16} />
                    <span>
                      {surveyData.average_score >= 3.51
                        ? "Sangat Baik (A)"
                        : surveyData.average_score >= 2.6
                        ? "Baik (B)"
                        : surveyData.average_score >= 1.76
                        ? "Kurang Baik (C)"
                        : "Tidak Baik (D)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* All 9 Answered Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-border/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Daftar 9 Indikator Pelayanan
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    9/9 Selesai
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(surveyData.responses || []).map((res: any, idx: number) => (
                    <div
                      key={res.id || idx}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {res.no || idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-foreground block">
                              {res.indicator_name}
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                              {res.question}
                            </p>
                          </div>
                        </div>

                        <div className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 flex items-center gap-1.5",
                          getScoreBadgeClass(res.score)
                        )}>
                          <span>Nilai {res.score}</span>
                        </div>
                      </div>

                      <div className="pl-7 pt-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-xs font-semibold text-foreground border border-border/60">
                          <span className="text-muted-foreground font-normal">Jawaban:</span>
                          <span>{res.answer_label}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 sm:py-3.5 border-t border-border bg-card flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
