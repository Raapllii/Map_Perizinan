import React, { useState } from 'react';
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { RISK_OPTIONS } from '../../lib/riskUtils';
import { cn } from '../../lib/utils';

export function MapRiskLegend() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-6 left-4 z-[40] pointer-events-auto flex flex-col items-start font-[Inter,sans-serif]">
      <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl overflow-hidden text-xs w-[170px] transition-all">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 flex items-center justify-between font-bold text-foreground bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer select-none"
          title={isOpen ? "Sembunyikan legenda risiko" : "Tampilkan legenda risiko"}
        >
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-primary shrink-0" />
            <span className="text-[11px] uppercase tracking-wider font-bold">Legenda Risiko</span>
          </div>
          {isOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
        </button>

        {isOpen && (
          <div className="p-2.5 space-y-1.5 border-t border-border/50 animate-in fade-in slide-in-from-bottom-1 duration-150">
            {RISK_OPTIONS.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs', item.dotClass)} />
                <span className="text-[11px] font-medium text-foreground truncate">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MapRiskLegend;
