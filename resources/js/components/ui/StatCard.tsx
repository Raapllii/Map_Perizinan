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
    <Card padding="p-4" className="transition-colors hover:bg-muted/30">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${bgClass}`}>
          <Icon size={20} className={colorClass} />
        </div>
        {change && (
          <div className={`flex items-center flex-shrink-0 gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full ${up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </div>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{value}</div>
      <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-1 truncate">{label}</div>
    </Card>
  );
}
