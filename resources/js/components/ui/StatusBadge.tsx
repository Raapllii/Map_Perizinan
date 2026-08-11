import { memo } from 'react';

export const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Aktif": "bg-green-100 text-green-700 border border-green-200",
    "Pending": "bg-amber-100 text-amber-700 border border-amber-200",
    "Kadaluarsa": "bg-orange-100 text-orange-700 border border-orange-200",
    "Ditolak": "bg-red-100 text-red-700 border border-red-200",
    "Revision": "bg-blue-100 text-blue-700 border border-blue-200",
    "Nonaktif": "bg-gray-100 text-gray-500 border border-gray-200",
    "Super Admin": "bg-purple-100 text-purple-700 border border-purple-200",
    "Administrator": "bg-indigo-100 text-indigo-700 border border-indigo-200",
    "Verifier": "bg-teal-100 text-teal-700 border border-teal-200",
    "Surveyor": "bg-sky-100 text-sky-700 border border-sky-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
});
