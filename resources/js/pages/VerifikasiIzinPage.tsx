import { useState, useEffect } from "react";
import axios from 'axios';
import { Filter, RefreshCw, FileText, Check, Edit, X, CheckCircle, Search, Inbox, Loader2 } from "lucide-react";
import { Card, Btn, StatusBadge, InputField } from "../components/ui";

export default function VerifikasiIzinPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    setLoading(true);
    axios.get('/api/admin/businesses')
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
          district: item.kecamatan_usaha || "-",
          submitted: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : "-",
          docs: item.docs || 3,
          status: item.status || "Pending"
        }));
        
        setQueue(formattedData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, []);
  
  const [activeTab, setActiveTab] = useState("pending");
  const [processing, setProcessing] = useState<number | null>(null);

  const handleAction = (id: number, action: string) => {
    if (!window.confirm(`Anda yakin ingin mengubah status menjadi ${action}?`)) return;
    
    setProcessing(id);
    axios.put(`/api/admin/businesses/${id}/verify`, { status: action })
      .then(res => {
        setQueue(q => q.map(item => item.id === id ? { ...item, status: action } : item));
        setProcessing(null);
      })
      .catch(err => {
        alert(err.response?.data?.message || "Gagal memperbarui status verifikasi");
        console.error(err);
        setProcessing(null);
      });
  };

  const statusMap: Record<string, string> = { pending: "Pending", approved: "Aktif", rejected: "Ditolak", revision: "Revision" };
  const safeQueue = Array.isArray(queue) ? queue : [];
  const filtered = safeQueue.filter(q => q.status === statusMap[activeTab]);

  const summaryCards = [
    { label: "Menunggu Review", count: safeQueue.filter(q => q.status === "Pending").length, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", tab: "pending" },
    { label: "Disetujui", count: safeQueue.filter(q => q.status === "Aktif").length, color: "text-success", bg: "bg-success/10", border: "border-success/20", tab: "approved" },
    { label: "Ditolak", count: safeQueue.filter(q => q.status === "Ditolak").length, color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", tab: "rejected" },
    { label: "Perlu Revisi", count: safeQueue.filter(q => q.status === "Revision").length, color: "text-info", bg: "bg-info/10", border: "border-info/20", tab: "revision" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Verifikasi Izin</h2>
          <p className="text-sm text-muted-foreground mt-1">Periksa dan setujui pengajuan izin usaha baru.</p>
        </div>
      </div>

      {/* Summary cards / Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <button key={c.tab} onClick={() => setActiveTab(c.tab)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${activeTab === c.tab ? `${c.bg} ${c.border} shadow-sm ring-2 ring-primary/20 ring-offset-2 ring-offset-background` : "bg-card border-border hover:border-primary/30 hover:shadow-sm opacity-80 hover:opacity-100"}`}>
            <div className={`text-3xl font-bold ${c.color} mb-1 tracking-tight`}>{c.count}</div>
            <div className="text-sm text-muted-foreground font-semibold">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Verification table */}
      <Card padding="p-0" className="overflow-hidden border-border flex flex-col shadow-sm">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-foreground">
              {activeTab === 'pending' ? 'Antrian Verifikasi' : 
               activeTab === 'approved' ? 'Riwayat Disetujui' : 
               activeTab === 'rejected' ? 'Riwayat Ditolak' : 'Antrian Revisi'}
            </h3>
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wide">
              {filtered.length} Data
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <InputField placeholder="Cari pemohon..." className="pl-9 w-full !py-1.5 !text-sm" />
            </div>
            <Btn variant="outline" size="sm" Icon={Filter} className="hidden sm:inline-flex">Filter</Btn>
            <Btn variant="secondary" size="sm" Icon={RefreshCw} onClick={fetchQueue} disabled={loading}>Refresh</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Usaha / Pemilik", "NIB", "Kategori", "Kecamatan", "Tgl. Diajukan", "Dokumen", "Status", "Aksi"].map((h, i) => (
                    <th key={h} className={`px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-sm font-medium text-muted-foreground">Memuat data verifikasi...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-2">
                          {activeTab === 'approved' || activeTab === 'rejected' ? <CheckCircle size={28} /> : <Inbox size={28} />}
                        </div>
                        <p className="text-base font-semibold text-foreground">Tidak ada data</p>
                        <p className="text-sm text-muted-foreground">Tidak ada pengajuan dalam status {statusMap[activeTab]}.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (activeTab === "pending" || activeTab === "revision" ? filtered : filtered.slice(0, 5)).map(item => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-bold text-foreground">{item.name}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.owner}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">{item.nib}</span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{item.category}</td>
                      <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{item.district}</td>
                      <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{item.submitted}</td>
                      <td className="px-4 py-4">
                        <button className="flex items-center gap-1.5 text-xs text-info hover:text-primary font-bold transition-colors">
                          <FileText size={14} />
                          {item.docs} file
                        </button>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-4">
                        {activeTab === "pending" || activeTab === "revision" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Btn size="xs" variant="ghost" disabled={processing === item.id} onClick={() => handleAction(item.id, "Aktif")} className="text-success hover:bg-success/10 hover:text-success" Icon={Check}>Setujui</Btn>
                            <Btn size="xs" variant="ghost" disabled={processing === item.id} onClick={() => handleAction(item.id, "Revision")} className="text-info hover:bg-info/10 hover:text-info" Icon={Edit}>Revisi</Btn>
                            <Btn size="xs" variant="ghost" disabled={processing === item.id} onClick={() => handleAction(item.id, "Ditolak")} className="text-danger hover:bg-danger/10 hover:text-danger" Icon={X}>Tolak</Btn>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Btn size="xs" variant="outline" className="opacity-70">Detail</Btn>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Helper footer for history tabs */}
        {(activeTab === "approved" || activeTab === "rejected") && filtered.length > 5 && (
          <div className="p-4 text-center border-t border-border bg-muted/10">
            <button className="text-sm font-semibold text-primary hover:underline">Lihat semua riwayat {statusMap[activeTab].toLowerCase()} →</button>
          </div>
        )}
      </Card>
    </div>
  );
}
