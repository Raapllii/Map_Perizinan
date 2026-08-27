export function Card({ children, className = "", padding = "p-5" }: any) {
  return (
    <div className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm ${padding} ${className}`}>
      {children}
    </div>
  );
}
