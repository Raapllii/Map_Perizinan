import React from 'react';
import { X, Navigation, Eye, Building2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from './StatusBadge';
import { Btn } from './Btn';
import { Card } from './Card';

interface BusinessSidePanelProps {
  business: any;
  isMobile: boolean;
  onClose: () => void;
  onDirectionsClick?: () => void;
  onDetailClick?: () => void;
}

export function BusinessSidePanel({ business, isMobile, onClose, onDirectionsClick, onDetailClick }: BusinessSidePanelProps) {
  if (isMobile) {
    return (
      <Drawer.Root open={!!business} onOpenChange={(open) => !open && onClose()} modal={false}>
        <Drawer.Portal>
          <Drawer.Content
            className="bg-card flex flex-col rounded-t-3xl fixed bottom-0 left-0 right-0 z-[1000] border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[85vh] outline-none"
            style={{ pointerEvents: 'auto' }}
          >
            {business && (
              <>
                <div className="w-full flex justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-muted rounded-full"></div>
                </div>
                <div className="px-5 pb-3 flex items-start justify-between border-b border-border mt-1">
                  <div>
                    <Drawer.Title className="text-base font-bold text-foreground">{business.nama_perusahaan}</Drawer.Title>
                    {business.nama_proyek && <div className="text-sm font-semibold text-primary mt-0.5 line-clamp-1">{business.nama_proyek}</div>}
                    <Drawer.Description className="text-xs text-muted-foreground mt-0.5">{business.judul_kbli}</Drawer.Description>
                  </div>
                  <button onClick={onClose} className="p-2 bg-muted hover:bg-muted/80 transition-colors rounded-full text-muted-foreground ml-4 flex-shrink-0"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  <div className="flex gap-2">
                    <StatusBadge status={business.status} />
                    {business.risiko && (
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full">{business.risiko}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Kecamatan</p>
                      <p className="text-sm font-medium text-foreground">{business.kecamatan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">NIB</p>
                      <p className="text-sm font-mono text-foreground">{business.nib || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-border flex gap-3 bg-card mt-auto">
                  <Btn variant="primary" size="sm" Icon={Eye} className="flex-1 justify-center rounded-xl py-2.5" onClick={onDetailClick}>Detail</Btn>
                  <Btn variant="outline" size="sm" Icon={Navigation} className="flex-1 justify-center rounded-xl py-2.5" onClick={onDirectionsClick}>Rute</Btn>
                </div>
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop side panel (overlay from left)
  return (
    <AnimatePresence>
      {business && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-4 bottom-4 left-4 z-[1000] w-[380px] pointer-events-none"
        >
          <Card className="w-full h-full flex flex-col overflow-hidden pointer-events-auto shadow-2xl border-border" padding="p-0">
            <div className="p-4 bg-primary flex items-start justify-between shrink-0">
              <div>
                <p className="text-xs font-medium text-primary-foreground/80 mb-1">Detail Usaha</p>
                <h4 className="text-base font-semibold text-primary-foreground leading-snug">{business.nama_perusahaan}</h4>
              </div>
              <button onClick={onClose} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors mt-1">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="w-full h-36 shrink-0 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden relative">
                {(business.image_url || business.photo_url) ? (
                  <img src={business.image_url || business.photo_url} alt={business.nama_perusahaan} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Building2 size={28} className="text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Foto Usaha</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <StatusBadge status={business.status} />
                {business.risiko && (
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full">{business.risiko}</span>
                )}
              </div>

              {[
                { label: "NIB", value: business.nib || '-' },
                { label: "Kategori", value: business.judul_kbli || '-' },
                { label: "Kecamatan", value: business.kecamatan || '-' },
                { label: "Koordinat", value: business.lat && business.lng ? `${business.lat}, ${business.lng}` : '-' },
              ].map((f) => (
                <div key={f.label} className="border-b border-border pb-3 last:border-0">
                  <p className="text-[11px] font-bold text-muted-foreground mb-0.5 uppercase">{f.label}</p>
                  <p className="text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-border flex gap-3 bg-card mt-auto shrink-0">
              <Btn variant="primary" size="sm" Icon={Eye} className="flex-1 justify-center rounded-xl py-2.5" onClick={onDetailClick}>Detail</Btn>
              <Btn variant="outline" size="sm" Icon={Navigation} className="flex-1 justify-center rounded-xl py-2.5" onClick={onDirectionsClick}>Rute</Btn>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
