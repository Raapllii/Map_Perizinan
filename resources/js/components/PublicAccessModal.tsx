import React, { useState } from "react";
import axios from "axios";
import { MapPin, Globe, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Btn, InputField } from "./ui";

import { setVisitorSession } from "../lib/visitorSession";

interface PublicAccessModalProps {
  isOpen: boolean;
  onSuccess: (visitor: { nama: string; instansi: string; id?: number }) => void;
}

export default function PublicAccessModal({ isOpen, onSuccess }: PublicAccessModalProps) {
  const [nama, setNama] = useState("");
  const [instansi, setInstansi] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedNama = nama.trim();
    const trimmedInstansi = instansi.trim();

    if (!trimmedNama || !trimmedInstansi) {
      setErrorMessage("Nama dan Instansi wajib diisi.");
      return;
    }

    if (trimmedNama.length < 2) {
      setErrorMessage("Nama harus memiliki minimal 2 karakter.");
      return;
    }

    if (trimmedInstansi.length < 2) {
      setErrorMessage("Instansi harus memiliki minimal 2 karakter.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/public-map-access", {
        nama: trimmedNama,
        instansi: trimmedInstansi,
      });

      const visitorData = response.data?.data || { nama: trimmedNama, instansi: trimmedInstansi };
      
      const savedVisitor = setVisitorSession(visitorData);
      
      onSuccess(savedVisitor);
    } catch (err: any) {
      console.error("Gagal mencatat akses publik:", err);
      const msg = err.response?.data?.message || "Terjadi kesalahan saat memproses akses. Silakan coba lagi.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center shadow-xs">
              <Globe size={24} className="animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Akses Peta PB
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              Silakan isi data berikut sebelum mengakses peta WebGIS Perizinan Berusaha.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 text-xs font-medium bg-danger/10 border border-danger/20 text-danger rounded-lg flex items-center gap-2">
              <span className="font-bold">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Nama <span className="text-danger">*</span>
              </label>
              <InputField
                name="nama"
                value={nama}
                onChange={(e: any) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                autoFocus
                disabled={loading}
              />
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
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Menghubungkan ke Peta...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Peta</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Btn>
            </div>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
            <ShieldCheck size={14} className="text-primary/70 shrink-0" />
            <span>Identitas digunakan untuk pencatatan akses & statistik resmi WebGIS.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
