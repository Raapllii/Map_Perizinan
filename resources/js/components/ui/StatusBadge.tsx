import { memo } from 'react';

export const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Aktif": "bg-success/10 text-success border border-success/20",
    "Pending": "bg-warning/10 text-warning border border-warning/20",
    "Kadaluarsa": "bg-danger/10 text-danger border border-danger/20",
    "Ditolak": "bg-danger/10 text-danger border border-danger/20",
    "Revision": "bg-info/10 text-info border border-info/20",
    "Nonaktif": "bg-muted text-muted-foreground border border-border",
    "Super Admin": "bg-primary/10 text-primary border border-primary/20",
    "Administrator": "bg-info/10 text-info border border-info/20",
    "Verifier": "bg-secondary/10 text-secondary border border-secondary/20",
    "Surveyor": "bg-accent/10 text-accent border border-accent/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-muted text-muted-foreground border border-border"}`}>
      {status}
    </span>
  );
});
