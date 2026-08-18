import { useState, useEffect } from "react";
import axios from 'axios';
import { Eye, Edit, Trash2, Search, Filter, Plus, FileSpreadsheet, Loader2, Inbox } from "lucide-react";
import { Card, StatusBadge, Btn, InputField, SelectField } from "../components/ui";

export default function DataUsahaPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchBusinesses = (pageNumber = 1) => {
    setLoading(true);
    axios.get(`/api/businesses?page=${pageNumber}`)
      .then(res => {
        setBusinesses(res.data.data);
        setTotalPages(res.data.last_page);
        setTotalItems(res.data.total);
        setPage(res.data.current_page);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBusinesses(1);
  }, []);

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data usaha ini?')) {
      axios.delete(`/api/admin/businesses/${id}`)
        .then(() => {
          alert('Data berhasil dihapus');
          fetchBusinesses(page);
        })
        .catch(err => alert('Gagal menghapus data'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Usaha</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola data perizinan usaha yang terdaftar di sistem.</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" Icon={FileSpreadsheet}>Export</Btn>
          <Btn variant="primary" Icon={Plus}>Tambah Usaha</Btn>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card padding="p-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <InputField 
              placeholder="Cari NIB atau Nama Usaha..." 
              className="pl-9 w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <SelectField
              options={[
                { value: "", label: "Semua Kategori" },
                { value: "perdagangan", label: "Perdagangan" },
                { value: "jasa", label: "Jasa" },
              ]}
            />
          </div>
          <div className="w-full md:w-48">
            <SelectField
              options={[
                { value: "", label: "Semua Status" },
                { value: "Aktif", label: "Aktif" },
                { value: "Pending", label: "Pending" },
              ]}
            />
          </div>
          <Btn variant="secondary" Icon={Filter} className="w-full md:w-auto">Filter</Btn>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding="p-0" className="overflow-hidden border-border shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Usaha / NIB</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Pemilik</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Lokasi</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Kategori</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-sm font-medium text-muted-foreground">Memuat data usaha...</p>
                      </div>
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-2">
                          <Inbox size={28} />
                        </div>
                        <p className="text-base font-semibold text-foreground">Tidak ada data</p>
                        <p className="text-sm text-muted-foreground">Belum ada data usaha yang terdaftar atau sesuai kriteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  businesses.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-foreground">{b.nama_perusahaan}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-1 px-1.5 py-0.5 bg-muted rounded w-fit">{b.nib}</div>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{b.nama_pemilik || b.nama_perusahaan}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{b.kecamatan}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground truncate max-w-[200px]" title={b.judul_kbli}>{b.judul_kbli}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Btn variant="ghost" size="xs" Icon={Eye} className="text-info hover:text-info hover:bg-info/10" aria-label="Lihat Detail" />
                          <Btn variant="ghost" size="xs" Icon={Edit} className="text-primary hover:text-primary hover:bg-primary/10" aria-label="Edit Data" />
                          <Btn variant="ghost" size="xs" Icon={Trash2} onClick={() => handleDelete(b.id)} className="text-danger hover:text-danger hover:bg-danger/10" aria-label="Hapus Data" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {!loading && businesses.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-medium text-muted-foreground">
              Menampilkan data <strong className="text-foreground font-semibold">{businesses.length}</strong> dari total <strong className="text-foreground font-semibold">{totalItems}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => fetchBusinesses(page - 1)}
                disabled={page === 1}
              >
                Sebelumnya
              </Btn>
              <div className="px-3 py-1 rounded-md bg-background border border-border text-xs font-bold text-foreground">
                {page} <span className="text-muted-foreground font-normal mx-1">/</span> {totalPages}
              </div>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => fetchBusinesses(page + 1)}
                disabled={page === totalPages}
              >
                Berikutnya
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
