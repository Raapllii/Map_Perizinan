import * as React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { X, Navigation, Building2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { StatusBadge } from "./StatusBadge";

interface BusinessDetailCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  business: any; // The selectedBusiness object
  onClose?: () => void;
  onDirectionsClick?: () => void;
}

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
    <span className="text-xs font-medium text-foreground line-clamp-1" title={value}>{value || '-'}</span>
  </div>
);

const BusinessDetailCard = React.forwardRef<HTMLDivElement, BusinessDetailCardProps>(
  ({ className, business, onClose, onDirectionsClick, ...props }, ref) => {
    if (!business) return null;

    const imageUrl = business.image_url || business.photo_url || "";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "w-[260px] overflow-hidden rounded-2xl bg-card text-card-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border relative pointer-events-auto",
          className
        )}
        initial={{ y: 15, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 15, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        {...props}
      >
        {/* Top section with background image or placeholder */}
        <div className="relative h-28 w-full bg-muted flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={business.nama_perusahaan || "Business Image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Building2 className="text-primary/40 size-10" />
            </div>
          )}
          
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-10 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors"
              aria-label="Tutup detail usaha"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Content section */}
        <div className="p-4 bg-card flex flex-col gap-3">
          {/* Row 1: Status & Rute */}
          <div className="flex items-start justify-between gap-2">
            <StatusBadge status={business.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={onDirectionsClick}
              className="h-7 px-2.5 text-[11px] shrink-0 rounded-lg shadow-sm"
              aria-label={`Rute ke ${business.nama_perusahaan}`}
            >
              <Navigation className="mr-1 h-3 w-3" />
              Rute
            </Button>
          </div>

          {/* Row 2: NIB */}
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">NIB: <span className="text-foreground font-mono">{business.nib || '-'}</span></p>
          </div>

          {/* Row 3: Nama Usaha & Proyek */}
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold leading-tight line-clamp-2 text-foreground" title={business.nama_perusahaan}>
              {business.nama_perusahaan || '-'}
            </h3>
            {business.nama_proyek && (
              <p className="text-xs font-semibold text-primary line-clamp-1" title={business.nama_proyek}>
                Proyek: {business.nama_proyek}
              </p>
            )}
            {business.uraian_jenis_proyek && (
              <p className="text-[10px] font-medium text-muted-foreground line-clamp-1" title={business.uraian_jenis_proyek}>
                Jenis Proyek: {business.uraian_jenis_proyek}
              </p>
            )}
          </div>

          <div className="h-px w-full bg-border" />

          {/* Row 4: Grid Kategori, Skala, Status PM */}
          <div className="grid grid-cols-3 gap-2">
            <StatItem label="Kategori" value={business.kategori || business.judul_kbli} />
            <StatItem label="Skala" value={business.skala_usaha || business.risiko_proyek || business.risiko} />
            <StatItem label="Status PM" value={business.status_pm || '-'} />
          </div>
        </div>
      </motion.div>
    );
  }
);

BusinessDetailCard.displayName = "BusinessDetailCard";

export { BusinessDetailCard };
