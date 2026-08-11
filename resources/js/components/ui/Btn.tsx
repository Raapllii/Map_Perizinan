import { memo } from 'react';

export const Btn = memo(function Btn({ children, variant = "primary", size = "md", Icon, className = "", ...props }: any) {
  const v: Record<string, string> = {
    primary: "bg-[#2E7D32] text-white hover:bg-[#1B5E20] shadow-sm",
    secondary: "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] border border-[#C8E6C9]",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    ghost: "text-gray-600 hover:bg-gray-100",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
  };
  const s: Record<string, string> = {
    xs: "px-2.5 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };
  return (
    <button {...props}
      className={`inline-flex items-center font-medium rounded-xl transition-all duration-150 ${v[variant]} ${s[size]} ${props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      {Icon && <Icon size={size === "xs" || size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
});
