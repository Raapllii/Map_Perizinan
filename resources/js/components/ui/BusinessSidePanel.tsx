import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
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
  Briefcase,
  CheckCircle2,
  Loader2,
  Edit,
  Download
} from 'lucide-react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from './StatusBadge';
import { cn } from '../../lib/utils';
import { 
  validateCoordinates, 
  getSemanticRiskBadge, 
  formatFallback,
  formatCurrency,
  formatDate,
  extractBusinessIndicators
} from './businessPanelUtils';
import ServiceSurveyModal from '../ServiceSurveyModal';
import { getVisitorSession } from '../../lib/visitorSession';

export interface BusinessSidePanelProps {
  business: any;
  isMobile: boolean;
  onClose: () => void;
  onDirectionsClick?: () => void;
  onDetailClick?: () => void;
  onEditClick?: () => void;
  accessLogId?: number | null;
}

const DetailItem = ({ 
  label, 
  value, 
  className = "",
  mono = false,
  fullWidth = false,
}: { 
  label: string; 
  value: any; 
  className?: string;
  mono?: boolean;
  fullWidth?: boolean;
}) => {
  const isInvalid = value === null || value === undefined || value === "" || Number.isNaN(value) || value === "null" || value === "undefined";
  const displayVal = isInvalid ? '-' : value;
  
  return (
    <div className={cn("min-w-0", fullWidth ? "col-span-full" : "", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block truncate">
        {label}
      </span>
      <span className={cn(
        "text-xs font-medium text-foreground mt-0.5 block break-words [overflow-wrap:anywhere]",
        mono && "font-mono tracking-wide select-all"
      )}>
        {displayVal}
      </span>
    </div>
  );
};

export function BusinessSidePanel({
  business,
  isMobile,
  onClose,
  onDirectionsClick,
  onEditClick,
  accessLogId,
}: BusinessSidePanelProps) {
  const [copied, setCopied] = useState(false);
  const [detailBusiness, setDetailBusiness] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  // Fetch full business details when selected business changes
  useEffect(() => {
    if (!business) {
      setDetailBusiness(null);
      return;
    }

    // Set initial business marker object immediately to prevent flicker
    setDetailBusiness(business);

    if (business.id) {
      let isMounted = true;
      setIsLoadingDetail(true);

      axios.get(`/api/businesses/${business.id}`)
        .then(res => {
          if (isMounted && res.data) {
            setDetailBusiness(res.data);
          }
        })
        .catch(err => {
          console.warn('Tidak dapat mengambil detail usaha lengkap:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingDetail(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [business?.id]);

  const activeBusiness = detailBusiness || business;

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
    if (!activeBusiness) return { hasCoordinates: false, latNum: null, lngNum: null, formattedString: null };
    return validateCoordinates(activeBusiness.latitude, activeBusiness.longitude);
  }, [activeBusiness]);

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

  if (!business || !activeBusiness) return null;

  // Semantic risk data
  const riskInfo = getSemanticRiskBadge(activeBusiness.uraian_risiko_proyek);

  // Check if project name is distinct and worth highlighting
  const hasDistinctProjectName = Boolean(
    activeBusiness.nama_proyek &&
    activeBusiness.nama_proyek.trim() !== '' &&
    activeBusiness.nama_proyek.trim().toLowerCase() !== (activeBusiness.nama_perusahaan || '').trim().toLowerCase()
  );

  // Extract dynamic indicators (relational or legacy fallback)
  const indicators = extractBusinessIndicators(activeBusiness);

  // RENDER MAIN BODY (Comprehensive Detail Data Usaha Matching Admin)
  const renderPanelBody = () => (
    <div className="space-y-5 lg:space-y-6 min-w-0">
      {/* SECTION A: HEADER BUSINESS IDENTITY */}
      <div className="space-y-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 size={20} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl lg:text-[21px] font-bold tracking-tight text-foreground leading-snug break-words [overflow-wrap:anywhere]">
              {activeBusiness.nama_perusahaan || 'Nama Usaha Belum Terdaftar'}
            </h3>

            <p className="text-xs text-muted-foreground font-normal mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
              {activeBusiness.judul_kbli || 'Kategori Usaha / KBLI Belum Ditentukan'}
            </p>

            {hasDistinctProjectName && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-md bg-muted/50 text-[11px] font-medium text-foreground/85 border border-border/40 max-w-full min-w-0">
                <span className="text-muted-foreground font-normal shrink-0">Proyek:</span>
                <span className="font-semibold truncate min-w-0">{activeBusiness.nama_proyek}</span>
              </div>
            )}
          </div>
        </div>

        {/* STATUS & RISK BADGES */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 min-w-0">
          <StatusBadge status={activeBusiness.status || 'Aktif'} />

          {activeBusiness.uraian_risiko_proyek && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[0.7rem] uppercase tracking-wider font-semibold border transition-colors shrink-0',
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

      {/* SECTION B: IDENTITAS PERUSAHAAN */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <Building2 size={12} className="text-primary shrink-0" />
          <span>Identitas Perusahaan</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-3 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <DetailItem label="Nama Perusahaan" value={activeBusiness.nama_perusahaan} fullWidth />
            <DetailItem label="NIB" value={activeBusiness.nib} mono />
            <DetailItem label="Nama User" value={activeBusiness.nama_user} />
            <DetailItem label="Email" value={activeBusiness.email} />
            <DetailItem label="Telepon" value={activeBusiness.nomor_telp} />
            <DetailItem label="Jenis Perusahaan" value={activeBusiness.uraian_jenis_perusahaan} fullWidth />
          </div>
        </div>
      </div>

      {/* SECTION C: INFORMASI PROYEK */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <FileText size={12} className="text-primary/70 shrink-0" />
          <span>Informasi Proyek</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-3 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <DetailItem label="ID Proyek" value={activeBusiness.id_proyek} mono />
            <DetailItem label="Nama Proyek" value={activeBusiness.nama_proyek} />
            <DetailItem label="Uraian Jenis Proyek" value={activeBusiness.uraian_jenis_proyek} fullWidth />
            <DetailItem label="Skala Usaha" value={activeBusiness.uraian_skala_usaha} />
            <DetailItem label="Tgl Pengajuan Proyek" value={activeBusiness.day_of_tanggal_pengajuan_proyek} />
            <DetailItem label="Tgl Terbit OSS" value={formatDate(activeBusiness.tanggal_terbit_oss)} />
            <DetailItem label="Status Penanaman Modal" value={activeBusiness.uraian_status_penanaman_modal} />
            <DetailItem label="Risiko Proyek" value={activeBusiness.uraian_risiko_proyek} fullWidth />
          </div>
        </div>
      </div>

      {/* SECTION D: KEGIATAN USAHA & KBLI */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <Briefcase size={12} className="text-primary/70 shrink-0" />
          <span>Kegiatan Usaha & KBLI</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-3 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <DetailItem label="Kode KBLI" value={activeBusiness.kbli} mono />
            <DetailItem label="Sektor Pembina" value={activeBusiness.kl_sektor_pembina} />
            <DetailItem label="Judul KBLI / Kategori" value={activeBusiness.judul_kbli} fullWidth />
          </div>
        </div>
      </div>

      {/* SECTION E: LOKASI USAHA */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <MapPin size={12} className="text-primary shrink-0" />
          <span>Lokasi Usaha</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-3 min-w-0">
          <DetailItem label="Alamat Lengkap" value={activeBusiness.alamat_usaha} fullWidth />

          <div className="grid grid-cols-2 gap-3 min-w-0">
            <DetailItem label="Kecamatan" value={formatFallback(activeBusiness.kecamatan_usaha)} />
            <DetailItem label="Kelurahan" value={formatFallback(activeBusiness.kelurahan_usaha)} />
          </div>

          <DetailItem label="Kabupaten / Kota" value={formatFallback(activeBusiness.kab_kota_usaha)} fullWidth />
        </div>
      </div>

      {/* SECTION F: TANAH, INVESTASI & TENAGA KERJA */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <CheckCircle2 size={12} className="text-primary/70 shrink-0" />
          <span>Tanah, Investasi & Tenaga Kerja</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-3 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <DetailItem 
              label="Luas Tanah" 
              value={activeBusiness.luas_tanah ? `${activeBusiness.luas_tanah} ${activeBusiness.satuan_tanah || ''}` : '-'} 
            />
            <DetailItem 
              label="Jumlah Investasi" 
              value={formatCurrency(activeBusiness.jumlah_investasi)} 
            />
            <DetailItem 
              label="Tenaga Kerja Indonesia (TKI)" 
              value={activeBusiness.tki ? `${activeBusiness.tki} Orang` : '-'} 
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* SECTION G: STATUS SISTEM */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <CheckCircle2 size={12} className="text-primary/70 shrink-0" />
          <span>Status Sistem</span>
        </div>

        <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 flex items-center justify-between min-w-0">
          <span className="text-xs text-muted-foreground font-medium">Status Data</span>
          <StatusBadge status={activeBusiness.status || 'Aktif'} />
        </div>
      </div>

      {/* SECTION H: INDIKATOR TAMBAHAN (Dinamis per Data Usaha) */}
      {indicators.length > 0 && (
        <div className="space-y-2.5 min-w-0">
          <div className="flex items-center justify-between text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-primary/70 shrink-0" />
              <span>Indikator Tambahan</span>
            </div>
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {indicators.length} Indikator
            </span>
          </div>

          <div className="rounded-xl bg-muted/25 p-3.5 border border-border/40 space-y-2.5 min-w-0">
            {indicators.map((ind, idx) => (
              <div 
                key={ind.id ?? idx} 
                className="flex items-baseline justify-between gap-2.5 min-w-0 border-b border-border/30 last:border-0 pb-2 last:pb-0"
              >
                <span className="text-xs text-muted-foreground/85 font-normal shrink-0 max-w-[50%]" title={ind.judul}>
                  {ind.judul}
                </span>
                <span className="text-xs font-semibold text-foreground text-right break-words [overflow-wrap:anywhere] min-w-0">
                  {ind.nilai}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION I: TITIK KOORDINAT */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
            <Compass size={12} className="text-primary/70 shrink-0" />
            <span>Titik Koordinat</span>
          </div>

          {hasCoordinates && (
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md px-2 py-0.5 min-h-[30px] cursor-pointer active:scale-95 shrink-0"
              aria-label="Salin titik koordinat"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-500 animate-in fade-in zoom-in-75 duration-150" />
                  <span className="text-emerald-600 font-semibold" aria-live="polite">Tersalin</span>
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
          <div className="grid grid-cols-2 gap-2 min-w-0">
            <div className="rounded-xl bg-muted/25 px-2.5 sm:px-3 py-2 sm:py-2.5 border border-border/40 min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider block truncate">
                Latitude
              </span>
              <span className="text-xs font-mono font-semibold text-foreground tracking-tight block mt-0.5 truncate select-all min-w-0">
                {latNum?.toFixed(6)}
              </span>
            </div>
            <div className="rounded-xl bg-muted/25 px-2.5 sm:px-3 py-2 sm:py-2.5 border border-border/40 min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider block truncate">
                Longitude
              </span>
              <span className="text-xs font-mono font-semibold text-foreground tracking-tight block mt-0.5 truncate select-all min-w-0">
                {lngNum?.toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/25 p-3 border border-border/40 flex items-start gap-2.5 text-warning min-w-0">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Belum dipetakan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed break-words">
                Titik koordinat spasial belum tercatat di sistem GIS.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // FOOTER PRIMARY ACTION (Unduh Detail Usaha & Lihat Rute)
  const renderPanelFooter = () => (
    <div className="p-3.5 sm:p-4 border-t border-border/60 bg-card shrink-0 flex flex-col gap-2 min-w-0">
      {/* Button: Unduh Detail Usaha - Triggers Survey Modal */}
      <button
        type="button"
        disabled={!activeBusiness?.id}
        onClick={() => setIsSurveyModalOpen(true)}
        className="w-full h-11 min-h-[44px] px-3 sm:px-4 rounded-xl font-semibold text-xs tracking-wide uppercase inline-flex items-center justify-center gap-2 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 min-w-0 border bg-background hover:bg-muted/80 text-foreground border-border/80 active:scale-[0.99] cursor-pointer"
        aria-label={`Unduh Dokumen Detail Usaha ${activeBusiness.nama_perusahaan || ''}`}
      >
        <Download size={15} className="text-primary shrink-0" />
        <span className="truncate min-w-0">Unduh Detail Usaha</span>
      </button>

      {/* Button: Lihat Rute */}
      <button
        type="button"
        disabled={!hasCoordinates}
        onClick={onDirectionsClick}
        className={cn(
          "w-full h-11 min-h-[44px] px-3 sm:px-4 rounded-xl font-semibold text-xs tracking-wide uppercase inline-flex items-center justify-center gap-2 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 min-w-0",
          hasCoordinates
            ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
            : "bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/50"
        )}
        aria-label={hasCoordinates ? `Petunjuk rute menuju ${activeBusiness.nama_perusahaan}` : "Rute tidak tersedia karena koordinat belum ada"}
      >
        <Navigation size={15} className={cn("shrink-0", hasCoordinates ? "text-primary-foreground" : "text-muted-foreground/50")} />
        <span className="truncate min-w-0">{hasCoordinates ? "Lihat Rute" : "Belum Ada Koordinat Rute"}</span>
      </button>

      {/* Secondary Edit Action (Hanya jika onEditClick di-provide oleh parent Admin) */}
      {onEditClick && (
        <button
          type="button"
          onClick={onEditClick}
          className="w-full h-8 min-h-[36px] px-3 rounded-lg font-medium text-xs inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer min-w-0"
          aria-label="Edit data usaha"
        >
          <Edit size={13} className="shrink-0" />
          <span className="truncate min-w-0">Edit Data Usaha</span>
        </button>
      )}
    </div>
  );

  // MOBILE: BOTTOM SHEET (VAUL DRAWER)
  if (isMobile) {
    return (
      <>
        <Drawer.Root open={!!business} onOpenChange={(open) => !open && onClose()} modal={false}>
          <Drawer.Portal>
            <Drawer.Content
              className="bg-card flex flex-col rounded-t-[28px] fixed bottom-0 left-0 right-0 z-[1000] border-t border-border/80 shadow-[0_-12px_48px_rgba(0,0,0,0.14)] max-h-[90dvh] outline-none w-full max-w-[100vw] box-border"
              style={{
                pointerEvents: 'auto',
                paddingLeft: 'env(safe-area-inset-left, 0px)',
                paddingRight: 'env(safe-area-inset-right, 0px)',
              }}
            >
              {/* Visual Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between border-b border-border/60 shrink-0 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <Drawer.Title className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Detail Usaha
                  </Drawer.Title>
                  {isLoadingDetail && (
                    <Loader2 size={12} className="animate-spin text-primary shrink-0" />
                  )}
                </div>
                <Drawer.Description className="sr-only">
                  Profil detail usaha {activeBusiness.nama_perusahaan}
                </Drawer.Description>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shrink-0"
                  aria-label="Tutup panel detail usaha"
                >
                  <X size={17} strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 pb-6 overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {renderPanelBody()}
              </div>

              {/* Footer CTA with safe area bottom inset */}
              <div className="pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                {renderPanelFooter()}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Public Service Satisfaction Survey Modal before Download */}
        <ServiceSurveyModal
          isOpen={isSurveyModalOpen}
          onClose={() => setIsSurveyModalOpen(false)}
          business={activeBusiness}
          accessLogId={accessLogId || getVisitorSession()?.access_log_id || getVisitorSession()?.id || undefined}
        />
      </>
    );
  }

  // DESKTOP: FLOATING SIDE PANEL OVERLAY (Adaptive 380-420px Width)
  return (
    <>
      <AnimatePresence>
        {business && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-3 sm:top-4 bottom-3 sm:bottom-4 left-3 sm:left-4 z-[1000] w-[min(380px,calc(100vw-1.5rem))] sm:w-[min(400px,calc(100vw-2rem))] xl:w-[min(420px,calc(100vw-2rem))] max-w-[calc(100vw-1.5rem)] pointer-events-none"
          >
            <div className="w-full h-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden pointer-events-auto shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.04)] border border-border/70 rounded-2xl bg-card box-border">
              {/* Header */}
              <div className="px-4 sm:px-5 py-3 border-b border-border/60 bg-card flex items-center justify-between shrink-0 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90 truncate">
                    Detail Usaha
                  </span>
                  {isLoadingDetail && (
                    <Loader2 size={12} className="animate-spin text-primary shrink-0 ml-1" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] -mr-1 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shrink-0"
                  aria-label="Tutup panel detail usaha"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable Body with subtle thin scrollbar */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {renderPanelBody()}
              </div>

              {/* Footer CTA */}
              {renderPanelFooter()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Public Service Satisfaction Survey Modal before Download */}
      <ServiceSurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        business={activeBusiness}
        accessLogId={accessLogId || getVisitorSession()?.access_log_id || getVisitorSession()?.id || undefined}
      />
    </>
  );
}
