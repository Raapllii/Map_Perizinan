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
  Edit,
  Layers,
  Sparkles
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

  // Coordinate validation
  const { hasCoordinates, latNum, lngNum, formattedString } = useMemo(() => {
    if (!business) return { hasCoordinates: false, latNum: null, lngNum: null, formattedString: null };
    return validateCoordinates(business.latitude, business.longitude);
  }, [business]);

  // Copy coordinates handler
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

  // RENDER MAIN BODY (7-Tier Architecture)
  const renderPanelBody = () => (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TIER B: BUSINESS IDENTITY (Focal Point - NO PHOTO)                       */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-start gap-3.5">
          {/* Subtle GIS / Business Monogram Icon */}
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-6 h-6" strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Nama Usaha (Desktop 20-22px, Mobile 18-20px, Bold, Break-Words) */}
            <h3 className="text-xl lg:text-[22px] font-bold tracking-tight text-foreground leading-snug break-words">
              {business.nama_perusahaan || 'Nama Usaha Belum Terdaftar'}
            </h3>

            {/* Kategori / Judul KBLI */}
            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed break-words">
              {business.judul_kbli || 'Kategori Usaha / KBLI Belum Ditentukan'}
            </p>

            {/* Nama Proyek Tag (jika relevan & berbeda) */}
            {hasDistinctProjectName && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-foreground/90 border border-border/70 max-w-full">
                <span className="text-muted-foreground font-normal shrink-0">Proyek:</span>
                <span className="font-semibold truncate">{business.nama_proyek}</span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* TIER C: STATUS & RISK BADGES                                           */}
        {/* ======================================================================= */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
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

      {/* ========================================================================= */}
      {/* TIER D: INFORMASI UTAMA                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <FileText size={13} className="text-primary/70" />
          <span>Informasi Usaha</span>
        </div>

        <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 divide-y divide-border/40">
          {/* NIB */}
          <div className="flex items-start justify-between gap-3 pb-2.5">
            <span className="text-xs text-muted-foreground font-medium shrink-0">NIB</span>
            <span className="text-xs font-mono font-semibold text-foreground tracking-wide text-right select-all">
              {formatFallback(business.nib)}
            </span>
          </div>

          {/* KBLI */}
          <div className="flex items-start justify-between gap-3 py-2.5">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Kode KBLI</span>
            <span className="text-xs font-mono font-medium text-foreground text-right select-all">
              {formatFallback(business.kbli)}
            </span>
          </div>

          {/* Bentuk Usaha / Jenis Perusahaan */}
          <div className="flex items-start justify-between gap-3 py-2.5">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Bentuk Usaha</span>
            <span className="text-xs font-medium text-foreground text-right break-words">
              {formatFallback(business.uraian_jenis_perusahaan)}
            </span>
          </div>

          {/* Skala Usaha */}
          <div className="flex items-start justify-between gap-3 py-2.5">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Skala Usaha</span>
            <span className="text-xs font-medium text-foreground text-right break-words">
              {formatFallback(business.uraian_skala_usaha)}
            </span>
          </div>

          {/* Status Penanaman Modal */}
          {business.uraian_status_penanaman_modal && (
            <div className="flex items-start justify-between gap-3 pt-2.5">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Penanaman Modal</span>
              <span className="text-xs font-medium text-foreground text-right break-words">
                {business.uraian_status_penanaman_modal}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER E: LOKASI USAHA                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <MapPin size={13} className="text-primary/70" />
          <span>Lokasi Usaha</span>
        </div>

        <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 space-y-3">
          {/* Alamat Lengkap */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Alamat Lengkap
            </span>
            <p className="text-xs font-semibold text-foreground mt-0.5 leading-relaxed break-words">
              {business.alamat_usaha || 'Alamat spesifik belum tercatat'}
            </p>
          </div>

          {/* Kecamatan & Kelurahan 2-Column Grid */}
          <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Kecamatan
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5 break-words">
                {formatFallback(business.kecamatan_usaha)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Kelurahan
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5 break-words">
                {formatFallback(business.kelurahan_usaha)}
              </p>
            </div>
          </div>

          {/* Kabupaten / Kota */}
          <div className="border-t border-border/40 pt-2.5 flex items-start justify-between gap-3">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Kabupaten / Kota</span>
            <span className="text-xs font-medium text-foreground text-right break-words">
              {business.kab_kota_usaha || 'Samarinda'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER F: TITIK KOORDINAT                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <Compass size={13} className="text-primary/70" />
            <span>Titik Koordinat</span>
          </div>

          {/* Tombol Copy dengan Inline Feedback */}
          {hasCoordinates && (
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md px-2.5 py-1 min-h-[32px] cursor-pointer active:scale-95"
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
                  <span>Salin Koordinat</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="bg-muted/40 rounded-2xl p-3.5 border border-border/60">
          {hasCoordinates ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/50 shadow-2xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Latitude
                </span>
                <span className="text-xs font-mono font-semibold text-foreground tracking-tight block mt-0.5 truncate select-all">
                  {latNum?.toFixed(6)}
                </span>
              </div>
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/50 shadow-2xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Longitude
                </span>
                <span className="text-xs font-mono font-semibold text-foreground tracking-tight block mt-0.5 truncate select-all">
                  {lngNum?.toFixed(6)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-1.5 px-1 text-warning">
              <AlertTriangle size={17} className="shrink-0 mt-0.5 text-warning" />
              <div>
                <p className="text-xs font-bold text-foreground">Belum dipetakan</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Titik koordinat spasial belum tercatat di sistem GIS.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  {/* ========================================================================= */}
  {/* TIER G: PRIMARY ACTION (Lihat Rute - NO Redundant Detail Button)           */}
  {/* ========================================================================= */}
  const renderPanelFooter = () => (
    <div className="p-4 border-t border-border/70 bg-card/95 backdrop-blur-md mt-auto shrink-0 flex flex-col gap-2">
      <button
        type="button"
        disabled={!hasCoordinates}
        onClick={onDirectionsClick}
        className={cn(
          "w-full h-11 px-4 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          hasCoordinates
            ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
            : "bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/60"
        )}
        aria-label={hasCoordinates ? `Petunjuk rute menuju ${business.nama_perusahaan}` : "Rute tidak tersedia karena koordinat belum ada"}
      >
        <Navigation size={16} className={hasCoordinates ? "text-primary-foreground" : "text-muted-foreground/50"} />
        <span>{hasCoordinates ? "Lihat Rute" : "Belum Ada Koordinat Rute"}</span>
      </button>

      {onEditClick && (
        <button
          type="button"
          onClick={onEditClick}
          className="w-full h-9 px-3 rounded-xl font-medium text-xs inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] cursor-pointer"
          aria-label="Edit data usaha"
        >
          <Edit size={14} />
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
            className="bg-card flex flex-col rounded-t-[28px] fixed bottom-0 left-0 right-0 z-[1000] border-t border-border/80 shadow-[0_-12px_48px_rgba(0,0,0,0.16)] max-h-[85dvh] outline-none"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Visual Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <Drawer.Title className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Detail Usaha
                </Drawer.Title>
              </div>
              <Drawer.Description className="sr-only">
                Profil detail usaha {business.nama_perusahaan}
              </Drawer.Description>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label="Tutup panel detail usaha"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-6 overscroll-contain">
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
  // DESKTOP: FLOATING SIDE PANEL OVERLAY
  // ===========================================================================
  return (
    <AnimatePresence>
      {business && (
        <motion.div
          initial={{ x: -28, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -28, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="absolute top-4 bottom-4 left-4 z-[1000] w-[390px] xl:w-[420px] max-w-[calc(100vw-2rem)] pointer-events-none"
        >
          <div className="w-full h-full flex flex-col overflow-hidden pointer-events-auto shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-border/80 rounded-2xl bg-card">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border/70 bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Detail Usaha
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label="Tutup panel detail usaha"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar overscroll-contain">
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
