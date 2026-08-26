export function Card({ children, className = "", padding = "p-5" }: any) {
  return (
    <div className={`bg-card text-card-foreground rounded-md border border-border ${padding} ${className}`}>
      {children}
    </div>
  );
}
