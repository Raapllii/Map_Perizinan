import React, { useState, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { 
  ClipboardCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Download, 
  FileText, 
  Check,
  RefreshCw,
  Building2
} from "lucide-react";
import { cn } from "../lib/utils";
import { SERVICE_SURVEY_QUESTIONS, SurveyQuestion } from "../constants/surveyQuestions";
import { getVisitorSession } from "../lib/visitorSession";

export interface ServiceSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: any;
  accessLogId?: number;
  onSuccess?: () => void;
}

export default function ServiceSurveyModal({
  isOpen,
  onClose,
  business,
  accessLogId,
  onSuccess,
}: ServiceSurveyModalProps) {
  // Map of answers: { [key: string]: { answer: string; score: number } }
  const [answers, setAnswers] = useState<Record<string, { answer: string; score: number }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState("Menyimpan penilaian...");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [unansweredKeys, setUnansweredKeys] = useState<string[]>([]);
  const [surveySaved, setSurveySaved] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Question container refs for auto-scroll
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset state when modal opens with new business
  React.useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setUnansweredKeys([]);
      setSurveySaved(false);
      setDownloadFailed(false);
      setSuccessMessage(null);
    }
  }, [isOpen, business?.id]);

  // Count answered questions
  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const totalQuestions = SERVICE_SURVEY_QUESTIONS.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = useCallback((questionKey: string, optionLabel: string, optionScore: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: { answer: optionLabel, score: optionScore },
    }));

    // Clear unanswered flag for this question
    setUnansweredKeys((prev) => prev.filter((k) => k !== questionKey));
    if (unansweredKeys.length <= 1) {
      setValidationError(null);
    }
  }, [unansweredKeys]);

  // Execute PDF file download
  const triggerPdfDownload = useCallback(async (businessId: number, companyName: string): Promise<boolean> => {
    try {
      const response = await axios.get(`/api/businesses/${businessId}/download`, {
        responseType: "blob",
      });

      const cleanName = (companyName || "usaha")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `usaha-${businessId}`;
      let filename = `detail-usaha-${cleanName}.pdf`;

      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (err) {
      console.error("Gagal mengunduh dokumen PDF:", err);
      return false;
    }
  }, []);

  // Direct retry download if survey was already saved
  const handleRetryDownload = async () => {
    if (!business?.id || isSubmitting) return;

    setIsSubmitting(true);
    setLoadingText("Menyiapkan detail usaha...");
    setDownloadFailed(false);

    const downloadOk = await triggerPdfDownload(business.id, business.nama_perusahaan);
    setIsSubmitting(false);

    if (downloadOk) {
      setSuccessMessage("Detail usaha sedang diunduh.");
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setDownloadFailed(true);
    }
  };

  // Submit survey and trigger download
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !business?.id) return;

    // 1. Validate all 9 questions
    const missing: string[] = [];
    SERVICE_SURVEY_QUESTIONS.forEach((q) => {
      if (!answers[q.key] || !answers[q.key].answer) {
        missing.push(q.key);
      }
    });

    if (missing.length > 0) {
      setUnansweredKeys(missing);
      setValidationError("Silakan lengkapi seluruh indikator sebelum mengunduh detail usaha.");

      // Scroll to the first missing question
      const firstMissingKey = missing[0];
      const targetEl = questionRefs.current[firstMissingKey];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // 2. Resolve access_log_id
    const resolvedAccessLogId = accessLogId || getVisitorSession()?.access_log_id || getVisitorSession()?.id;
    if (!resolvedAccessLogId) {
      setValidationError("Sesi pengunjung tidak ditemukan atau kedaluwarsa. Silakan muat ulang halaman.");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    setLoadingText("Menyimpan penilaian...");

    try {
      // Step A: Save survey responses to database
      await axios.post("/api/public-map-survey", {
        access_log_id: resolvedAccessLogId,
        business_id: business.id,
        answers: answers,
      });

      setSurveySaved(true);

      // Step B: Trigger PDF generation and download
      setLoadingText("Menyiapkan detail usaha...");
      const downloadOk = await triggerPdfDownload(business.id, business.nama_perusahaan);

      if (downloadOk) {
        setSuccessMessage("Survey berhasil disimpan. Detail usaha sedang diunduh.");
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setIsSubmitting(false);
        setDownloadFailed(true);
      }
    } catch (err: any) {
      console.error("Gagal menyimpan survey:", err);
      setIsSubmitting(false);
      const errData = err.response?.data;
      const msg = errData?.message || "Gagal menyimpan survei. Silakan periksa kembali jawaban Anda.";
      setValidationError(msg);
      if (errData?.missing_indicators) {
        setUnansweredKeys(errData.missing_indicators);
      }
    }
  };

  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-5 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl max-h-[92dvh] bg-card text-card-foreground border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 box-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-modal-title"
      >
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border/70 flex items-start justify-between gap-3 bg-card shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <ClipboardCheck size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="survey-modal-title" className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">
                Survei Kepuasan Pelayanan
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Sebelum mengunduh dokumen detail usaha untuk{" "}
                <span className="font-semibold text-foreground underline decoration-primary/30">
                  {business.nama_perusahaan || "usaha ini"}
                </span>
                , mohon kesediaan Saudara mengisi 9 indikator penilaian pelayanan berikut.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Tutup formulir survei"
          >
            <X size={17} />
          </button>
        </div>

        {/* Sticky Progress Bar */}
        <div className="px-5 py-3 bg-muted/30 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span>Progress Survei:</span>
              <span className="font-semibold text-primary">
                {answeredCount} dari {totalQuestions} indikator
              </span>
            </div>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full transition-colors",
              progressPercent === 100 
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-primary/10 text-primary"
            )}>
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Questions Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain [scrollbar-width:thin]">
          {/* Validation Alert */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-destructive" />
              <div className="flex-1 leading-relaxed">
                {validationError}
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                {successMessage}
              </div>
            </div>
          )}

          {/* Download Failed Retry State */}
          {downloadFailed && (
            <div className="p-4 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={17} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-foreground">Penilaian berhasil disimpan, tetapi dokumen gagal dibuat.</p>
                  <p className="text-muted-foreground mt-0.5">
                    Anda tidak perlu mengisi survei ulang. Silakan klik tombol di bawah untuk mengunduh kembali dokumen detail usaha.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleRetryDownload}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <RefreshCw size={13} className={isSubmitting ? "animate-spin" : ""} />
                  <span>Coba Unduh PDF Kembali</span>
                </button>
              </div>
            </div>
          )}

          {/* List of 9 Indicator Cards */}
          <div className="space-y-4">
            {SERVICE_SURVEY_QUESTIONS.map((item: SurveyQuestion) => {
              const isAnswered = Boolean(answers[item.key]?.answer);
              const isMissing = unansweredKeys.includes(item.key);
              const selectedValue = answers[item.key]?.answer;

              return (
                <div
                  key={item.key}
                  ref={(el) => (questionRefs.current[item.key] = el)}
                  className={cn(
                    "rounded-xl border p-4 sm:p-5 transition-all bg-card/60 shadow-2xs space-y-3.5 min-w-0",
                    isMissing
                      ? "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/40"
                      : isAnswered
                      ? "border-border/70 bg-card"
                      : "border-border/50 bg-muted/15"
                  )}
                >
                  {/* Indicator Header */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 transition-colors",
                          isAnswered
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground border border-border/70"
                        )}
                      >
                        {item.number}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                        {item.name}
                      </span>
                    </div>

                    {isAnswered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                        <Check size={12} strokeWidth={2.5} />
                        <span>Terjawab</span>
                      </span>
                    ) : isMissing ? (
                      <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider bg-destructive/10 px-2 py-0.5 rounded-full shrink-0">
                        Wajib Diisi
                      </span>
                    ) : null}
                  </div>

                  {/* Question Prompt */}
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed break-words">
                    {item.question}
                  </p>

                  {/* Radio Choice Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 min-w-0">
                    {item.options.map((opt) => {
                      const isSelected = selectedValue === opt.label;

                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSelectOption(item.key, opt.label, opt.score)}
                          className={cn(
                            "relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer min-h-[52px]",
                            isSelected
                              ? "bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/40 font-semibold"
                              : "bg-background hover:bg-muted/60 text-foreground border-border/70 hover:border-border font-normal"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 w-full">
                            <span className="text-xs leading-snug break-words">
                              {opt.label}
                            </span>
                            <span
                              className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-background"
                              )}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
                            Nilai: {opt.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 border-t border-border/70 bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {answeredCount === totalQuestions ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                <CheckCircle2 size={13} /> Seluruh 9 indikator telah dijawab
              </span>
            ) : (
              <span>Masih ada {totalQuestions - answeredCount} indikator yang belum diisi</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className={cn(
                "flex-1 sm:flex-none h-10 px-5 rounded-xl font-semibold text-xs tracking-wide uppercase inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:pointer-events-none",
                progressPercent === 100
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-primary/80 text-primary-foreground hover:bg-primary"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin shrink-0" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <Download size={15} className="shrink-0" />
                  <span>Kirim & Unduh Detail Usaha</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
