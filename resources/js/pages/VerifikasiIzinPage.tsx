import { useState, useEffect } from "react";
import axios from 'axios';
import { Filter, RefreshCw, FileText, Check, Edit, X, CheckCircle } from "lucide-react";
import { Card, Btn, StatusBadge } from "../components/ui";

export default function VerifikasiIzinPage() {
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/businesses')
      .then(res => {
        // Extract array from paginated response or normal response
        const rawData = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        
        // Map backend properties to frontend UI expected properties
        const formattedData = rawData.map((item: any) => ({
          id: item.id,
          name: item.nama_perusahaan || "Tidak Ada Nama",
          owner: item.nama_pemilik || "Pemilik Tidak Diketahui",
          nib: item.nib || "-",
          category: item.judul_kbli || "-",
          district: item.kecamatan || "-",
          submitted: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : "-",
          docs: item.docs || 3,
          status: item.status || "Pending"
        }));
        
        setQueue(formattedData);
      })
      .catch(console.error);
  }, []);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleAction = (id: number, action: string) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, status: action } : item));
  };

  const statusMap: Record<string, string> = { pending: "Pending", approved: "Aktif", rejected: "Ditolak", revision: "Revision" };
  const safeQueue = Array.isArray(queue) ? queue : [];
  const filtered = safeQueue.filter(q => q.status === statusMap[activeTab]);

  const summaryCards = [
    { label: "Menunggu Review", count: safeQueue.filter(q => q.status === "Pending").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", tab: "pending" },
    { label: "Disetujui", count: safeQueue.filter(q => q.status === "Aktif").length, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", tab: "approved" },
    { label: "Ditolak", count: safeQueue.filter(q => q.status === "Ditolak").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", tab: "rejected" },
    { label: "Perlu Revisi", count: safeQueue.filter(q => q.status === "Revision").length, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", tab: "revision" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <button key={c.tab} onClick={() => setActiveTab(c.tab)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${activeTab === c.tab ? `${c.bg} ${c.border}` : "bg-white border-gray-100 hover:border-gray-200"}`}>
            <div className={`text-3xl font-bold ${c.color} mb-1`}>{c.count}</div>
            <div className="text-sm text-gray-600 font-medium">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Verification table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Antrian Verifikasi</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{filtered.length} perlu ditinjau</span>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" Icon={Filter}>Filter</Btn>
            <Btn variant="outline" size="sm" Icon={RefreshCw}>Refresh</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Usaha / Pemilik", "NIB", "Kategori", "Kecamatan", "Tgl. Diajukan", "Dokumen", "Status", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(activeTab === "pending" || activeTab === "revision" ? filtered : safeQueue.slice(0, 3)).map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.owner}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{item.nib}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{item.category}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{item.district}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{item.submitted}</td>
                  <td className="px-4 py-3.5">
                    <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      <FileText size={12} />
                      {item.docs} file
                    </button>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleAction(item.id, "Aktif")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors">
                        <Check size={11} /> Setujui
                      </button>
                      <button onClick={() => handleAction(item.id, "Revision")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit size={11} /> Revisi
                      </button>
                      <button onClick={() => handleAction(item.id, "Ditolak")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                        <X size={11} /> Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(activeTab === "approved" || activeTab === "rejected") && (
          <div className="p-8 text-center text-gray-400">
            <CheckCircle size={36} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Tampilkan riwayat verifikasi sebelumnya</p>
          </div>
        )}
      </Card>
    </div>
  );
}
