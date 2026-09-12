import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  up?: boolean;
  colorClass?: string;
  bgClass?: string;
}

export function StatCard({ label, value, icon: Icon, change, up, colorClass = "text-primary", bgClass = "bg-primary/10" }: StatCardProps) {
  return (
    <Card padding="p-3.5 sm:p-4" className="transition-colors hover:bg-muted/30 min-w-0 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-2.5 sm:mb-3 gap-2">
        <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${bgClass}`}>
          <Icon size={18} className={`sm:w-5 sm:h-5 ${colorClass}`} />
        </div>
        {change && (
          <div className={`flex items-center flex-shrink-0 gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-md ${up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            {up ? <TrendingUp size={11} className="sm:w-3 sm:h-3" /> : <TrendingDown size={11} className="sm:w-3 sm:h-3" />}
            {change}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-foreground tracking-tight break-words" title={typeof value === 'string' ? value : undefined}>{value}</div>
        <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-1 break-words line-clamp-2 leading-snug" title={label}>{label}</div>
      </div>
    </Card>
  );
}
