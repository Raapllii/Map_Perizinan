import * as React from "react";
import { motion } from "motion/react";
import { MapPin, X, Navigation } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

interface BusinessDetailCardProps extends React.HTMLAttributes<HTMLDivElement> {
  business: any; // The selectedBusiness object
  onClose?: () => void;
  onDirectionsClick?: () => void;
}

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-sm font-semibold text-foreground line-clamp-1" title={value}>{value || '-'}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const BusinessDetailCard = React.forwardRef<HTMLDivElement, BusinessDetailCardProps>(
  ({ className, business, onClose, onDirectionsClick, ...props }, ref) => {
    if (!business) return null;

    // Gunakan placeholder bertema arsitektur/kantor yang elegan (Green Enterprise Vibe)
    const imageUrl = "";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "w-full max-w-sm overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl border border-border relative pointer-events-auto",
          className
        )}
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        {...props}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors"
            aria-label="Tutup Detail"
          >
            <X size={16} />
          </button>
        )}

        {/* Top section with background image and content */}
        <div className="relative h-48 w-full group">
          <img
            src={imageUrl}
            alt={business.nama_perusahaan}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-4">
            <div className="text-white pr-2 w-full">
              <h3 className="text-lg font-bold leading-tight line-clamp-2">{business.nama_perusahaan}</h3>
              <p className="text-sm text-white/80 mt-1 flex items-start gap-1.5">
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-white/70" />
                <span className="line-clamp-2">{business.alamat_proyek}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom section with trail details */}
        <div className="p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {business.risiko_proyek || 'Tidak Diketahui'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">NIB: <span className="text-foreground">{business.nib}</span></p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={onDirectionsClick}
              className="h-8 px-3 shrink-0 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              Rute
            </Button>
          </div>

          <div className="my-4 h-px w-full bg-border" />

          <div className="grid grid-cols-3 gap-3">
            <StatItem label="Kategori" value={business.kategori} />
            <StatItem label="Skala Usaha" value={business.skala_usaha} />
            <StatItem label="Status PM" value={business.status_pm} />
          </div>
        </div>
      </motion.div>
    );
  }
);

BusinessDetailCard.displayName = "BusinessDetailCard";

export { BusinessDetailCard };
