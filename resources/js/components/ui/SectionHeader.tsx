export function SectionHeader({ title, subtitle, children, className = "" }: any) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-foreground break-words">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 break-words">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap shrink-0">{children}</div>}
    </div>
  );
}
