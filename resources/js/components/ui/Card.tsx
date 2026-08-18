export function Card({ children, className = "", padding = "p-5" }: any) {
  return (
    <div className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border ${padding} ${className}`}>
      {children}
    </div>
  );
}
