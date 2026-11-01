/**
 * Google reCAPTCHA v3 Helper
 * Seamless invisible bot protection with action scoring.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    APP_CONFIG?: {
      recaptcha_site_key?: string;
    };
  }
}

const SCRIPT_ID = "google-recaptcha-v3-script";

export function getRecaptchaSiteKey(): string {
  if (typeof window !== "undefined" && window.APP_CONFIG?.recaptcha_site_key) {
    return window.APP_CONFIG.recaptcha_site_key;
  }
  return (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || "";
}

/**
 * Preload Google reCAPTCHA v3 script tag.
 */
export function preloadRecaptchaV3(): Promise<boolean> {
  const siteKey = getRecaptchaSiteKey();
  if (!siteKey) {
    return Promise.resolve(false);
  }

  if (typeof window !== "undefined" && window.grecaptcha?.execute) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => resolve(true));
        } else {
          resolve(false);
        }
      };

      script.onerror = () => resolve(false);

      document.head.appendChild(script);
    } else {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => resolve(true));
      } else {
        script.addEventListener("load", () => {
          window.grecaptcha?.ready(() => resolve(true));
        });
        script.addEventListener("error", () => resolve(false));
      }
    }
  });
}

/**
 * Execute Google reCAPTCHA v3 and retrieve an action token.
 */
export async function executeRecaptchaV3(action: string = "verify_identity"): Promise<string> {
  const siteKey = getRecaptchaSiteKey();
  if (!siteKey) {
    throw new Error("Konfigurasi reCAPTCHA Site Key belum diatur di server.");
  }

  const isReady = await preloadRecaptchaV3();
  if (!isReady || !window.grecaptcha?.execute) {
    throw new Error("Gagal memuat layanan Google reCAPTCHA. Periksa koneksi internet Anda.");
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Waktu verifikasi keamanan habis. Silakan coba lagi."));
    }, 10000);

    window.grecaptcha!.ready(async () => {
      try {
        const token = await window.grecaptcha!.execute(siteKey, { action });
        clearTimeout(timeout);
        resolve(token);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}
