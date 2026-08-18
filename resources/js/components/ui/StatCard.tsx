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
    <Card padding="p-4" className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bgClass}`}>
          <Icon size={20} className={colorClass} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      <div className="text-xs font-medium text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}
