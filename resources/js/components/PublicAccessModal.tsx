import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Globe, ArrowRight, Loader2, ShieldCheck, RefreshCw,
  CheckCircle2, User, Building2
} from "lucide-react";
import { Btn, InputField } from "./ui";
import { setVisitorSession } from "../lib/visitorSession";

interface PublicAccessModalProps {
  isOpen: boolean;
  onSuccess: (visitor: { nama: string; instansi: string; nik?: string; id?: number }) => void;
}

type Step = "nik" | "instansi" | "done";

interface CaptchaChallenge {
  question: string;
  token: string;
}

export default function PublicAccessModal({ isOpen, onSuccess }: PublicAccessModalProps) {
  const [step, setStep] = useState<Step>("nik");

  // Step 1: NIK + CAPTCHA
  const [nik, setNik] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Step 2: Instansi
  const [namaVerified, setNamaVerified] = useState("");
  const [instansi, setInstansi] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer("");
    try {
      const res = await axios.get("/api/captcha-challenge");
      setCaptcha(res.data);
    } catch {
      setCaptcha(null);
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("nik");
      setNik("");
      setNamaVerified("");
      setInstansi("");
      setCaptchaAnswer("");
      setErrorMessage("");
      fetchCaptcha();
    }
  }, [isOpen, fetchCaptcha]);

  if (!isOpen) return null;

  // ── Step 1: Verify NIK + CAPTCHA ──────────────────────────────────────
  const handleVerifyNik = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedNik = nik.replace(/\D/g, "");
    if (trimmedNik.length !== 16) {
      setErrorMessage("NIK harus terdiri dari 16 digit angka.");
      return;
    }
    if (!captchaAnswer.trim()) {
      setErrorMessage("Jawaban CAPTCHA wajib diisi.");
      return;
    }
    if (!captcha) {
      setErrorMessage("CAPTCHA belum dimuat. Klik 'Ganti soal'.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/verify-nik", {
        nik: trimmedNik,
        captcha_token: captcha.token,
        captcha_answer: captchaAnswer.trim(),
      });
      setNamaVerified(res.data.data.nama);
      setStep("instansi");
    } catch (err: any) {
      const errData = err.response?.data;
      const firstFieldError = errData?.errors
        ? (Object.values(errData.errors).flat()[0] as string)
        : undefined;
      setErrorMessage(firstFieldError || errData?.message || "Verifikasi gagal. Silakan coba lagi.");
      // Refresh CAPTCHA on any error
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Submit instansi + log access ─────────────────────────────
  const handleSubmitInstansi = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedInstansi = instansi.trim();
    if (trimmedInstansi.length < 2) {
      setErrorMessage("Instansi harus memiliki minimal 2 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/public-map-access", {
        nama: namaVerified,
        instansi: trimmedInstansi,
        nik: nik.replace(/\D/g, ""),
      });

      const visitorData = res.data?.data || {
        nama: namaVerified,
        instansi: trimmedInstansi,
        nik: nik.replace(/\D/g, ""),
      };

      setStep("done");
      setTimeout(() => {
        const savedVisitor = setVisitorSession(visitorData);
        onSuccess(savedVisitor);
      }, 1200);
    } catch (err: any) {
      const errData = err.response?.data;
      const firstFieldError = errData?.errors
        ? (Object.values(errData.errors).flat()[0] as string)
        : undefined;
      setErrorMessage(firstFieldError || errData?.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const stepList: Step[] = ["nik", "instansi"];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center shadow-xs">
              {step === "done"
                ? <CheckCircle2 size={24} className="text-success" />
                : <Globe size={24} className="animate-pulse" />}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {step === "nik" && "Verifikasi Identitas"}
              {step === "instansi" && "Lengkapi Data"}
              {step === "done" && "Akses Diberikan"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              {step === "nik" && "Masukkan NIK Anda untuk memverifikasi identitas sebelum mengakses peta."}
              {step === "instansi" && "Identitas terverifikasi. Pilih instansi Anda untuk melanjutkan."}
              {step === "done" && "Selamat datang di Peta WebGIS Perizinan Berusaha."}
            </p>
          </div>

          {/* Step Indicator */}
          {step !== "done" && (
            <div className="flex items-center justify-center gap-2">
              {stepList.map((s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                      step === s
                        ? "bg-primary text-primary-foreground"
                        : stepList.indexOf(step) > i
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < stepList.length - 1 && <div className="w-8 h-px bg-border" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 text-xs font-medium bg-danger/10 border border-danger/20 text-danger rounded-lg flex items-center gap-2">
              <span className="font-bold shrink-0">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── Step 1: NIK + CAPTCHA ── */}
          {step === "nik" && (
            <form onSubmit={handleVerifyNik} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  NIK <span className="text-danger">*</span>
                </label>
                <InputField
                  name="nik"
                  value={nik}
                  onChange={(e: any) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="16 digit NIK sesuai KTP"
                  required
                  autoFocus
                  disabled={loading}
                  inputMode="numeric"
                  maxLength={16}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Nomor Induk Kependudukan (KTP) — 16 digit angka.
                </p>
              </div>

              {/* CAPTCHA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    CAPTCHA <span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading || loading}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={11} className={captchaLoading ? "animate-spin" : ""} />
                    Ganti soal
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-muted border border-border rounded-lg px-4 py-2.5 font-mono font-bold text-base text-foreground min-w-[110px] text-center select-none">
                    {captchaLoading
                      ? <Loader2 size={16} className="animate-spin mx-auto" />
                      : (captcha?.question ?? "—")}
                  </div>
                  <InputField
                    name="captcha_answer"
                    value={captchaAnswer}
                    onChange={(e: any) => setCaptchaAnswer(e.target.value)}
                    placeholder="Jawaban"
                    required
                    disabled={loading || captchaLoading}
                    inputMode="numeric"
                    className="max-w-[100px]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Btn
                  type="submit"
                  variant="primary"
                  disabled={loading || captchaLoading}
                  className="w-full justify-center py-2.5 sm:py-3 text-sm font-semibold shadow-md gap-2"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /><span>Memverifikasi...</span></>
                  ) : (
                    <><span>Verifikasi</span><ArrowRight size={16} /></>
                  )}
                </Btn>
              </div>
            </form>
          )}

          {/* ── Step 2: Instansi ── */}
          {step === "instansi" && (
            <form onSubmit={handleSubmitInstansi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Nama (Terverifikasi)
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-success/10 border border-success/30 rounded-lg text-sm font-semibold text-foreground">
                  <User size={14} className="text-success shrink-0" />
                  <span className="truncate">{namaVerified}</span>
                  <CheckCircle2 size={14} className="text-success shrink-0 ml-auto" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Instansi <span className="text-danger">*</span>
                </label>
                <InputField
                  name="instansi"
                  value={instansi}
                  onChange={(e: any) => setInstansi(e.target.value)}
                  placeholder="Contoh: DPMPTSP / BAPENDA / Swasta / Umum"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="pt-2">
                <Btn
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full justify-center py-2.5 sm:py-3 text-sm font-semibold shadow-md gap-2"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /><span>Menghubungkan ke Peta...</span></>
                  ) : (
                    <><Building2 size={16} /><span>Masuk ke Peta</span></>
                  )}
                </Btn>
              </div>
            </form>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={48} className="text-success animate-in zoom-in-50 duration-300" />
              <p className="text-sm font-semibold text-foreground text-center">
                Identitas diverifikasi. Memuat peta...
              </p>
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Footer note */}
          {step !== "done" && (
            <div className="pt-2 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
              <ShieldCheck size={14} className="text-primary/70 shrink-0" />
              <span>NIK diverifikasi melalui layanan Dukcapil. Data digunakan untuk statistik resmi WebGIS.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
