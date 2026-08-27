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
    alamat_proyek: "",
    kecamatan: "",
    kelurahan: "",
    status: "Aktif",
    lat: "",
    lng: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (business) {
        setFormData({
          nib: business.nib || "",
          nama_perusahaan: business.nama_perusahaan || "",
          nama_proyek: business.nama_proyek || "",
          nama_user: business.nama_pemilik || business.nama_user || "",
          kbli: business.kbli || "",
          judul_kbli: business.judul_kbli || "",
          alamat_proyek: business.alamat_proyek || "",
          kecamatan: business.kecamatan || "",
          kelurahan: business.kelurahan || "",
          status: business.status || "Aktif",
          lat: business.lat || "",
          lng: business.lng || ""
        });
      } else {
        setFormData({
          nib: "",
          nama_perusahaan: "",
          nama_proyek: "",
          nama_user: "",
          kbli: "",
          judul_kbli: "",
          alamat_proyek: "",
          kecamatan: "",
          kelurahan: "",
          status: "Aktif",
          lat: "",
          lng: ""
        });
      }
    }
  }, [isOpen, business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const url = isEdit ? `/api/admin/businesses/${business.id}` : '/api/admin/businesses';
    const method = isEdit ? 'put' : 'post';
    
    axios({ method, url, data: formData })
      .then(() => {
        setLoading(false);
        onSuccess();
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
        alert('Gagal menyimpan data. ' + (err.response?.data?.message || ''));
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
                <InputField name="alamat_proyek" value={formData.alamat_proyek} onChange={handleChange} placeholder="Alamat Lengkap" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kecamatan</label>
                <InputField name="kecamatan" value={formData.kecamatan} onChange={handleChange} placeholder="Kecamatan" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kelurahan</label>
                <InputField name="kelurahan" value={formData.kelurahan} onChange={handleChange} placeholder="Kelurahan" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Latitude</label>
                <InputField name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} placeholder="-0.xxxxxx" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Longitude</label>
                <InputField name="lng" type="number" step="any" value={formData.lng} onChange={handleChange} placeholder="117.xxxxxx" />
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
