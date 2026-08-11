import { useState, useEffect } from "react";
import axios from 'axios';
import { Eye, Edit, Trash2 } from "lucide-react";
import { Card, StatusBadge } from "../components/ui";

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
    <div className="space-y-4">
      {/* Toolbar */}
      <Card padding="px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Data Usaha</h3>
        </div>
      </Card>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading Data Usaha...</div>
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Usaha / NIB</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pemilik</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lokasi</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-gray-900">{b.nama_perusahaan}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{b.nib}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.nama_perusahaan}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.kecamatan}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.judul_kbli}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-[#2E7D32] hover:bg-green-50 rounded-lg transition-colors" title="Detail">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">Menampilkan {businesses.length} data (Total: {totalItems})</span>
            <div className="flex gap-1">
              <button
                onClick={() => fetchBusinesses(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-gray-700">Halaman {page} dari {totalPages}</span>
              <button
                onClick={() => fetchBusinesses(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
