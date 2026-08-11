export function Card({ children, className = "", padding = "p-5" }: any) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${padding} ${className}`}>
      {children}
    </div>
  );
}
