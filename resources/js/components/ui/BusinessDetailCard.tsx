import * as React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { X, Navigation, Building2, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { StatusBadge } from './StatusBadge';

import { getRiskConfig } from '../../lib/riskUtils';

interface BusinessDetailCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  business: any;
  onClose?: () => void;
  onDirectionsClick?: () => void;
}

const BusinessDetailCard = React.forwardRef<HTMLDivElement, BusinessDetailCardProps>(
  ({ className, business, onClose, onDirectionsClick, ...props }, ref) => {
    if (!business) return null;

    const riskConfig = getRiskConfig(business.uraian_risiko_proyek);

    const hasCoords = Boolean(
      business.latitude !== null &&
      business.longitude !== null &&
      business.latitude !== undefined &&
      business.longitude !== undefined &&
      !isNaN(Number(business.latitude)) &&
      !isNaN(Number(business.longitude)) &&
      !(Number(business.latitude) === 0 && Number(business.longitude) === 0)
    );

    return (
      <motion.div
        ref={ref}
        className={cn(
          'w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-card text-card-foreground shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-border/80 relative pointer-events-auto',
          className
        )}
        initial={{ y: 10, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        {...props}
      >
        {/* Card Header with Icon & Close Button */}
        <div className="px-4 py-3 border-b border-border/60 bg-card flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
              <Building2 size={14} />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              Pratinjau Usaha
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-w-[32px] min-h-[32px] flex items-center justify-center -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Tutup pratinjau"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {/* Status & Risk Badges */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={business.status || 'Aktif'} />
              <span className={cn('px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border', riskConfig.badgeClass)}>
                {riskConfig.category}
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
              NIB: {business.nib || '-'}
            </span>
          </div>

          {/* Business Name & Project */}
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold leading-tight text-foreground line-clamp-2" title={business.nama_perusahaan}>
              {business.nama_perusahaan || 'Usaha Tanpa Nama'}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1" title={business.judul_kbli}>
              {business.judul_kbli || 'Kategori belum diisi'}
            </p>
          </div>

          {/* Location snippet */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 border border-border/50">
            <MapPin size={12} className="text-primary shrink-0" />
            <span className="truncate">
              {business.kecamatan_usaha ? `Kec. ${business.kecamatan_usaha}` : 'Samarinda'}
            </span>
          </div>

          {/* Primary Action: Directions */}
          <Button
            variant="outline"
            size="sm"
            disabled={!hasCoords}
            onClick={onDirectionsClick}
            className="w-full h-8 text-xs font-semibold rounded-xl gap-1.5"
            aria-label={hasCoords ? `Rute ke ${business.nama_perusahaan}` : 'Rute tidak tersedia'}
          >
            <Navigation className="h-3 w-3 text-primary" />
            <span>{hasCoords ? 'Lihat Rute' : 'Belum Ada Koordinat'}</span>
          </Button>
        </div>
      </motion.div>
    );
  }
);

BusinessDetailCard.displayName = 'BusinessDetailCard';

export { BusinessDetailCard };
