import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Navigation, 
  Building2, 
  Copy, 
  Check, 
  MapPin, 
  Compass, 
  FileText, 
  ShieldAlert, 
  ShieldCheck,
  AlertTriangle, 
  Edit 
} from 'lucide-react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from './StatusBadge';
import { cn } from '../../lib/utils';
import { 
  validateCoordinates, 
  getSemanticRiskBadge, 
  formatFallback 
} from './businessPanelUtils';

export interface BusinessSidePanelProps {
  business: any;
  isMobile: boolean;
  onClose: () => void;
  onDirectionsClick?: () => void;
  onDetailClick?: () => void;
  onEditClick?: () => void;
}

export function BusinessSidePanel({
  business,
  isMobile,
  onClose,
  onDirectionsClick,
  onEditClick,
}: BusinessSidePanelProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key on desktop
  useEffect(() => {
    if (!business) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [business, onClose]);

  // Coordinate validation (strict -90..90 and -180..180, rejects 0,0)
  const { hasCoordinates, latNum, lngNum, formattedString } = useMemo(() => {
    if (!business) return { hasCoordinates: false, latNum: null, lngNum: null, formattedString: null };
    return validateCoordinates(business.latitude, business.longitude);
  }, [business]);

  // Copy coordinates handler with smooth inline feedback
  const handleCopyCoordinates = useCallback(async () => {
    if (!hasCoordinates || !formattedString) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedString);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formattedString;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin koordinat:', err);
    }
  }, [hasCoordinates, formattedString]);

  if (!business) return null;

  // Semantic risk data
  const riskInfo = getSemanticRiskBadge(business.uraian_risiko_proyek);

  // Check if project name is distinct and worth highlighting
  const hasDistinctProjectName = Boolean(
    business.nama_proyek &&
    business.nama_proyek.trim() !== '' &&
    business.nama_proyek.trim().toLowerCase() !== (business.nama_perusahaan || '').trim().toLowerCase()
  );

  // RENDER MAIN BODY (Location Intelligence Profile - Less UI, More Hierarchy)
  const renderPanelBody = () => (
    <div className="space-y-5 lg:space-y-6">
      {/* TIER B: BUSINESS IDENTITY (Focal Point - NO PHOTO) */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {/* Subtle GIS Monogram Container */}
          <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary border border-primary/15 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 size={20} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Nama Usaha (Desktop 20-22px, Mobile 18-20px, Font 700 Bold, Break-Words) */}
            <h3 className="text-xl lg:text-[21px] font-bold tracking-tight text-foreground leading-snug break-words">
              {business.nama_perusahaan || 'Nama Usaha Belum Terdaftar'}
            </h3>

            {/* Kategori / Judul KBLI */}
            <p className="text-xs text-muted-foreground font-normal mt-1 leading-relaxed break-words">
              {business.judul_kbli || 'Kategori Usaha / KBLI Belum Ditentukan'}
            </p>

            {/* Nama Proyek Tag (hanya jika ada dan unik) */}
            {hasDistinctProjectName && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-md bg-muted/50 text-[11px] font-medium text-foreground/85 border border-border/40 max-w-full">
                <span className="text-muted-foreground font-normal shrink-0">Proyek:</span>
                <span className="font-semibold truncate">{business.nama_proyek}</span>
              </div>
            )}
          </div>
        </div>

        {/* TIER C: STATUS & RISK BADGES */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <StatusBadge status={business.status || 'Aktif'} />

          {business.uraian_risiko_proyek && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[0.7rem] uppercase tracking-wider font-semibold border transition-colors',
                riskInfo.colorClass
              )}
            >
              {riskInfo.level === 'low' ? (
                <ShieldCheck size={12} className="shrink-0" />
              ) : (
                <ShieldAlert size={12} className="shrink-0" />
              )}
              <span>{riskInfo.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* TIER E: LOKASI USAHA (Prioritas GIS Location Intelligence) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <MapPin size={12} className="text-primary" />
          <span>Lokasi Usaha</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-3">
          {/* Alamat Lengkap */}
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 block">
              Alamat Lengkap
            </span>
            <p className="text-xs font-semibold text-foreground mt-0.5 leading-relaxed break-words">
              {business.alamat_usaha || 'Alamat spesifik belum tercatat'}
            </p>
          </div>

          {/* Kecamatan & Kelurahan 2-Column Grid (Whitespace-driven) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 block">
                Kecamatan
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5 break-words">
                {formatFallback(business.kecamatan_usaha)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 block">
                Kelurahan
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5 break-words">
                {formatFallback(business.kelurahan_usaha)}
              </p>
            </div>
          </div>

          {/* Kabupaten / Kota (Data Asli dari DB, Tanpa Hardcoded Fallback) */}
          <div className="pt-1 flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground/80 font-normal">Kabupaten / Kota</span>
            <span className="text-xs font-medium text-foreground text-right break-words">
              {formatFallback(business.kab_kota_usaha)}
            </span>
          </div>
        </div>
      </div>

      {/* TIER D: INFORMASI USAHA (Editorial Metadata Layout) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <FileText size={12} className="text-primary/70" />
          <span>Informasi Usaha</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-2.5">
          {/* NIB */}
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground/80 font-normal shrink-0">NIB</span>
            <span className="text-xs font-mono font-medium text-foreground tracking-wide text-right select-all">
              {formatFallback(business.nib)}
            </span>
          </div>

          {/* KBLI */}
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground/80 font-normal shrink-0">Kode KBLI</span>
            <span className="text-xs font-mono font-medium text-foreground text-right select-all">
              {formatFallback(business.kbli)}
            </span>
          </div>

          {/* Bentuk Usaha */}
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground/80 font-normal shrink-0">Bentuk Usaha</span>
            <span className="text-xs font-normal text-foreground text-right break-words">
              {formatFallback(business.uraian_jenis_perusahaan)}
            </span>
          </div>

          {/* Skala Usaha */}
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground/80 font-normal shrink-0">Skala Usaha</span>
            <span className="text-xs font-normal text-foreground text-right break-words">
              {formatFallback(business.uraian_skala_usaha)}
            </span>
          </div>

          {/* Status Penanaman Modal */}
          {business.uraian_status_penanaman_modal && (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-muted-foreground/80 font-normal shrink-0">Penanaman Modal</span>
              <span className="text-xs font-normal text-foreground text-right break-words">
                {business.uraian_status_penanaman_modal}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TIER F: TITIK KOORDINAT (Technical Elegance) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
            <Compass size={12} className="text-primary/70" />
            <span>Titik Koordinat</span>
          </div>

          {/* Tombol Copy dengan Feedback Inline */}
          {hasCoordinates && (
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md px-2 py-0.5 min-h-[30px] cursor-pointer active:scale-95"
              aria-label="Salin titik koordinat"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-success animate-in fade-in zoom-in-75 duration-150" />
                  <span className="text-success font-semibold" aria-live="polite">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Salin</span>
                </>
              )}
            </button>
          )}
        </div>

        {hasCoordinates ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/25 px-3 py-2.5 border border-border/40">
              <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider block">
                Latitude
              </span>
              <span className="text-xs font-mono font-semibold text-foreground tracking-tight block mt-0.5 select-all">
                {latNum?.toFixed(6)}
              </span>
            </div>
            <div className="rounded-xl bg-muted/25 px-3 py-2.5 border border-border/40">
              <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider block">
                Longitude
              </span>
              <span className="text-xs font-mono font-semibold text-foreground tracking-tight block mt-0.5 select-all">
                {lngNum?.toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/25 p-3 border border-border/40 flex items-start gap-2.5 text-warning">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning" />
            <div>
              <p className="text-xs font-semibold text-foreground">Belum dipetakan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Titik koordinat spasial belum tercatat di sistem GIS.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ===========================================================================
  // TIER G: PRIMARY ACTION (Lihat Rute - Refined & Calm)
  // ===========================================================================
  const renderPanelFooter = () => (
    <div className="p-4 border-t border-border/60 bg-card shrink-0 flex flex-col gap-2">
      <button
        type="button"
        disabled={!hasCoordinates}
        onClick={onDirectionsClick}
        className={cn(
          "w-full h-11 px-4 rounded-xl font-semibold text-xs tracking-wide uppercase inline-flex items-center justify-center gap-2 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          hasCoordinates
            ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
            : "bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/50"
        )}
        aria-label={hasCoordinates ? `Petunjuk rute menuju ${business.nama_perusahaan}` : "Rute tidak tersedia karena koordinat belum ada"}
      >
        <Navigation size={15} className={hasCoordinates ? "text-primary-foreground" : "text-muted-foreground/50"} />
        <span>{hasCoordinates ? "Lihat Rute" : "Belum Ada Koordinat Rute"}</span>
      </button>

      {/* Secondary Edit Action (Hanya jika onEditClick di-provide oleh parent) */}
      {onEditClick && (
        <button
          type="button"
          onClick={onEditClick}
          className="w-full h-8 px-3 rounded-lg font-medium text-xs inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          aria-label="Edit data usaha"
        >
          <Edit size={13} />
          <span>Edit Data Usaha</span>
        </button>
      )}
    </div>
  );

  // ===========================================================================
  // MOBILE: BOTTOM SHEET (VAUL DRAWER)
  // ===========================================================================
  if (isMobile) {
    return (
      <Drawer.Root open={!!business} onOpenChange={(open) => !open && onClose()} modal={false}>
        <Drawer.Portal>
          <Drawer.Content
            className="bg-card flex flex-col rounded-t-[28px] fixed bottom-0 left-0 right-0 z-[1000] border-t border-border/80 shadow-[0_-12px_48px_rgba(0,0,0,0.14)] max-h-[85dvh] outline-none"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Visual Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <Drawer.Title className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Detail Usaha
                </Drawer.Title>
              </div>
              <Drawer.Description className="sr-only">
                Profil detail usaha {business.nama_perusahaan}
              </Drawer.Description>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label="Tutup panel detail usaha"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-6 overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {renderPanelBody()}
            </div>

            {/* Footer CTA with safe area bottom inset */}
            <div className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              {renderPanelFooter()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // ===========================================================================
  // DESKTOP: FLOATING SIDE PANEL OVERLAY (400-420px Optimal Width)
  // ===========================================================================
  return (
    <AnimatePresence>
      {business && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-4 bottom-4 left-4 z-[1000] w-[400px] xl:w-[420px] max-w-[calc(100vw-2rem)] pointer-events-none"
        >
          <div className="w-full h-full flex flex-col overflow-hidden pointer-events-auto shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.04)] border border-border/70 rounded-2xl bg-card">
            {/* Header */}
            <div className="px-5 py-3 border-b border-border/60 bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90">
                  Detail Usaha
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label="Tutup panel detail usaha"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Body with subtle thin scrollbar */}
            <div className="flex-1 overflow-y-auto p-5 overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {renderPanelBody()}
            </div>

            {/* Footer CTA */}
            {renderPanelFooter()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
