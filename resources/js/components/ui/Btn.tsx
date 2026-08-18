import { memo } from 'react';
import { Loader2 } from 'lucide-react';

export const Btn = memo(function Btn({ children, variant = "primary", size = "md", Icon, isLoading = false, disabled, className = "", ...props }: any) {
  const v: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm active:scale-[0.98]",
    outline: "border border-input bg-background hover:bg-muted hover:text-foreground text-muted-foreground active:scale-[0.98]",
    danger: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm active:scale-[0.98]",
    destructive: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm active:scale-[0.98]",
    ghost: "hover:bg-muted text-muted-foreground hover:text-foreground active:scale-[0.98]",
    success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm active:scale-[0.98]",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm active:scale-[0.98]",
  };
  const s: Record<string, string> = {
    xs: "px-2.5 py-1 text-xs gap-1 min-h-[28px]",
    sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[36px]",
    md: "px-4 py-2 text-sm gap-2 min-h-[40px] sm:min-h-[44px]",
    lg: "px-5 py-2.5 text-base gap-2 min-h-[48px]",
  };
  
  const isDisabled = disabled || isLoading;

  return (
    <button 
      {...props}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${v[variant]} ${s[size]} ${className}`}>
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === "xs" || size === "sm" ? 14 : 16} />
      ) : Icon ? (
        <Icon size={size === "xs" || size === "sm" ? 14 : 16} />
      ) : null}
      {children}
    </button>
  );
});
