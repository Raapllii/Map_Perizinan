import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import axios from "axios";
import { Btn, InputField, SelectField } from "./ui";

interface DataUsahaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  business?: any | null; // if null, it's Add Mode. If not, Edit Mode
  onSuccess: () => void;
}

export default function DataUsahaFormModal({ isOpen, onClose, business, onSuccess }: DataUsahaFormModalProps) {
  const isEdit = !!business;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nib: "",
    nama_perusahaan: "",
    nama_proyek: "",
    nama_user: "",
    kbli: "",
    judul_kbli: "",
    alamat_usaha: "",
    kecamatan_usaha: "",
    kelurahan_usaha: "",
    status: "Aktif",
    latitude: "",
    longitude: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (business) {
        setFormData({
          nib: business.nib ?? "",
          nama_perusahaan: business.nama_perusahaan ?? "",
          nama_proyek: business.nama_proyek ?? "",
          nama_user: business.nama_user ?? "",
          kbli: business.kbli ?? "",
          judul_kbli: business.judul_kbli ?? "",
          alamat_usaha: business.alamat_usaha ?? "",
          kecamatan_usaha: business.kecamatan_usaha ?? "",
          kelurahan_usaha: business.kelurahan_usaha ?? "",
          status: business.status ?? "Aktif",
          latitude: business.latitude ?? "",
          longitude: business.longitude ?? ""
        });
      } else {
        setFormData({
          nib: "",
          nama_perusahaan: "",
          nama_proyek: "",
          nama_user: "",
          kbli: "",
          judul_kbli: "",
          alamat_usaha: "",
          kecamatan_usaha: "",
          kelurahan_usaha: "",
          status: "Aktif",
          latitude: "",
          longitude: ""
        });
      }
    }
  }, [isOpen, business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm transition-all animate-in slide-in-from-bottom-5 ${
      type === 'success' ? 'bg-success text-success-foreground' : 'bg-danger text-danger-foreground'
    }`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit

    if (!formData.nib || !formData.nama_perusahaan) {
      showToast("NIB dan Nama Perusahaan wajib diisi.", "error");
      return;
    }

    setLoading(true);
    
    const url = isEdit ? `/api/admin/businesses/${business.id}` : '/api/admin/businesses';
    const method = isEdit ? 'put' : 'post';
    
    axios({ method, url, data: formData })
      .then((res) => {
        showToast(isEdit ? "✓ Perubahan data usaha berhasil disimpan." : "✓ Data usaha berhasil disimpan ke database.", "success");
        setLoading(false);
        onSuccess();
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
        
        const status = err.response?.status;
        let errMsg = "Data usaha tidak berhasil disimpan. Periksa kembali data yang dimasukkan.";
        
        if (status === 422) {
          errMsg = "Data yang dimasukkan belum valid. " + (err.response?.data?.message || "");
        } else if (status === 401 || status === 403) {
          errMsg = "Anda tidak memiliki izin untuk menambahkan/mengubah data usaha.";
        } else if (status === 409) {
          errMsg = "Data usaha sudah terdaftar.";
        } else if (status >= 500) {
          errMsg = "Terjadi kesalahan pada server. Data belum berhasil disimpan.";
        } else if (!err.response) {
          errMsg = "Tidak dapat terhubung ke server.";
        } else {
          errMsg = err.response?.data?.message || errMsg;
        }

        showToast("✕ " + errMsg, "error");
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Data Usaha" : "Tambah Data Usaha"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-4 custom-scrollbar">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">NIB *</label>
                <InputField name="nib" value={formData.nib} onChange={handleChange} required placeholder="Nomor Induk Berusaha" disabled={isEdit} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nama Perusahaan *</label>
                <InputField name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleChange} required placeholder="PT / CV / dll" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nama Proyek</label>
                <InputField name="nama_proyek" value={formData.nama_proyek} onChange={handleChange} placeholder="Nama Proyek (Jika ada)" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nama Pemilik/User</label>
                <InputField name="nama_user" value={formData.nama_user} onChange={handleChange} placeholder="Nama Pemilik" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                <SelectField name="status" value={formData.status} onChange={handleChange} options={[
                  { value: 'Aktif', label: 'Aktif' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Tidak Aktif', label: 'Tidak Aktif' }
                ]} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kode KBLI</label>
                <InputField name="kbli" value={formData.kbli} onChange={handleChange} placeholder="Misal: 47111" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Judul KBLI</label>
                <InputField name="judul_kbli" value={formData.judul_kbli} onChange={handleChange} placeholder="Kategori Usaha" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alamat Proyek</label>
                <InputField name="alamat_usaha" value={formData.alamat_usaha} onChange={handleChange} placeholder="Alamat Lengkap" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kecamatan</label>
                <InputField name="kecamatan_usaha" value={formData.kecamatan_usaha} onChange={handleChange} placeholder="Kecamatan" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kelurahan</label>
                <InputField name="kelurahan_usaha" value={formData.kelurahan_usaha} onChange={handleChange} placeholder="Kelurahan" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Latitude</label>
                <InputField name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="-0.xxxxxx" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Longitude</label>
                <InputField name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="117.xxxxxx" />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2 mt-auto">
            <Btn variant="outline" type="button" onClick={onClose} disabled={loading}>Batal</Btn>
            <Btn variant="primary" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : (isEdit ? "Simpan Perubahan" : "Tambah Data")}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}
