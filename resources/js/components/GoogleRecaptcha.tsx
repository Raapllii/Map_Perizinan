import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { ShieldCheck, AlertCircle, Lock } from "lucide-react";
import { getRecaptchaSiteKey, preloadRecaptchaV3, executeRecaptchaV3 } from "../lib/recaptchaV3";

export interface GoogleRecaptchaHandle {
  execute: (action?: string) => Promise<string>;
  reset: () => void;
  getResponse: () => string;
}

interface GoogleRecaptchaProps {
  siteKey?: string;
  onVerify?: (token: string) => void;
  onExpired?: () => void;
  onError?: (error?: string) => void;
  className?: string;
}

const GoogleRecaptcha = forwardRef<GoogleRecaptchaHandle, GoogleRecaptchaProps>(
  ({ siteKey, className = "" }, ref) => {
    const effectiveSiteKey = siteKey || getRecaptchaSiteKey();
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;
      if (!effectiveSiteKey) {
        setLoadError("reCAPTCHA Site Key belum dikonfigurasi.");
        return;
      }

      preloadRecaptchaV3()
        .then((ready) => {
          if (isMounted) {
            setIsReady(ready);
            if (!ready) {
              setLoadError("Gagal memuat reCAPTCHA v3.");
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoadError("Gagal memuat reCAPTCHA v3.");
          }
        });

      return () => {
        isMounted = false;
      };
    }, [effectiveSiteKey]);

    useImperativeHandle(
      ref,
      () => ({
        execute: async (action: string = "verify_identity") => {
          return await executeRecaptchaV3(action);
        },
        reset: () => {
          // v3 is score-based and stateless, no reset needed
        },
        getResponse: () => "",
      }),
      []
    );

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Missing Key Warning */}
        {!effectiveSiteKey && (
          <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>reCAPTCHA Site Key belum dikonfigurasi di environment.</span>
          </div>
        )}

        {/* Load Error */}
        {loadError && effectiveSiteKey && (
          <div className="p-2.5 text-xs bg-danger/10 border border-danger/20 text-danger rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* reCAPTCHA v3 Protection Badge */}
        {effectiveSiteKey && !loadError && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Proteksi Keamanan Otomatis</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    reCAPTCHA v3
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {isReady ? "Verifikasi bot aktif di latar belakang (tanpa centang manual)." : "Menyiapkan perlindungan keamanan..."}
                </p>
              </div>
            </div>
            <Lock size={15} className="text-muted-foreground/60 shrink-0" />
          </div>
        )}

        {/* Google reCAPTCHA Disclaimer */}
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed text-center sm:text-left">
          Situs ini dilindungi oleh Google reCAPTCHA v3. Berlaku{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Privasi
          </a>{" "}
          dan{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Persyaratan
          </a>{" "}
          Google.
        </p>
      </div>
    );
  }
);

GoogleRecaptcha.displayName = "GoogleRecaptcha";

export default GoogleRecaptcha;
