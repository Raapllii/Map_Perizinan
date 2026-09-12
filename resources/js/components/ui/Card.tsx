export function Card({ children, className = "", padding = "p-5" }: any) {
  return (
    <div className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm min-w-0 ${padding} ${className}`}>
      {children}
    </div>
  );
}
