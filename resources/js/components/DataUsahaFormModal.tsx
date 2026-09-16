import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { Btn, InputField, SelectField } from "./ui";

interface DataUsahaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  business?: any | null; // if null, it's Add Mode. If not, Edit Mode
  onSuccess: () => void;
}

interface FormIndicatorItem {
  id?: number;
  judul: string;
  nilai: string;
}

export default function DataUsahaFormModal({ isOpen, onClose, business, onSuccess }: DataUsahaFormModalProps) {
  const isEdit = !!business;
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<FormIndicatorItem[]>([]);
  const [formData, setFormData] = useState({
    id_proyek: "",
    nib: "",
    nama_perusahaan: "",
    nama_proyek: "",
    uraian_jenis_proyek: "",
    tanggal_terbit_oss: "",
    day_of_tanggal_pengajuan_proyek: "",
    kbli: "",
    judul_kbli: "",
    kl_sektor_pembina: "",
    uraian_jenis_perusahaan: "",
    uraian_status_penanaman_modal: "",
    uraian_risiko_proyek: "",
    uraian_skala_usaha: "",
    alamat_usaha: "",
    kab_kota_usaha: "",
    kecamatan_usaha: "",
    kelurahan_usaha: "",
    latitude: "",
    longitude: "",
    luas_tanah: "",
    satuan_tanah: "",
    jumlah_investasi: "",
    tki: "",
    nama_user: "",
    email: "",
    nomor_telp: "",
    status: "Aktif",
    indicator_1: "",
    indicator_2: "",
    indicator_3: "",
    indicator_4: "",
    indicator_5: "",
    indicator_6: "",
    indicator_7: "",
    indicator_8: "",
    indicator_9: "",
    indicator_10: "",
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (business) {
        setFormData({
          id_proyek: business.id_proyek ?? "",
          nib: business.nib ?? "",
          nama_perusahaan: business.nama_perusahaan ?? "",
          nama_proyek: business.nama_proyek ?? "",
          uraian_jenis_proyek: business.uraian_jenis_proyek ?? "",
          tanggal_terbit_oss: business.tanggal_terbit_oss ? business.tanggal_terbit_oss.substring(0, 10) : "",
          day_of_tanggal_pengajuan_proyek: business.day_of_tanggal_pengajuan_proyek ?? "",
          kbli: business.kbli ?? "",
          judul_kbli: business.judul_kbli ?? "",
          kl_sektor_pembina: business.kl_sektor_pembina ?? "",
          uraian_jenis_perusahaan: business.uraian_jenis_perusahaan ?? "",
          uraian_status_penanaman_modal: business.uraian_status_penanaman_modal ?? "",
          uraian_risiko_proyek: business.uraian_risiko_proyek ?? "",
          uraian_skala_usaha: business.uraian_skala_usaha ?? "",
          alamat_usaha: business.alamat_usaha ?? "",
          kab_kota_usaha: business.kab_kota_usaha ?? "",
          kecamatan_usaha: business.kecamatan_usaha ?? "",
          kelurahan_usaha: business.kelurahan_usaha ?? "",
          latitude: business.latitude ?? "",
          longitude: business.longitude ?? "",
          luas_tanah: business.luas_tanah ?? "",
          satuan_tanah: business.satuan_tanah ?? "",
          jumlah_investasi: business.jumlah_investasi ?? "",
          tki: business.tki ?? "",
          nama_user: business.nama_user ?? "",
          email: business.email ?? "",
          nomor_telp: business.nomor_telp ?? "",
          status: business.status ?? "Aktif",
          indicator_1: business.indicator_1 ?? "",
          indicator_2: business.indicator_2 ?? "",
          indicator_3: business.indicator_3 ?? "",
          indicator_4: business.indicator_4 ?? "",
          indicator_5: business.indicator_5 ?? "",
          indicator_6: business.indicator_6 ?? "",
          indicator_7: business.indicator_7 ?? "",
          indicator_8: business.indicator_8 ?? "",
          indicator_9: business.indicator_9 ?? "",
          indicator_10: business.indicator_10 ?? "",
        });

        if (business.indicators && Array.isArray(business.indicators)) {
          setIndicators(business.indicators.map((ind: any) => ({
            id: ind.id,
            judul: ind.judul || "",
            nilai: ind.nilai || "",
          })));
        } else {
          setIndicators([]);
        }
      } else {
        setFormData({
          id_proyek: "",
          nib: "",
          nama_perusahaan: "",
          nama_proyek: "",
          uraian_jenis_proyek: "",
          tanggal_terbit_oss: "",
          day_of_tanggal_pengajuan_proyek: "",
          kbli: "",
          judul_kbli: "",
          kl_sektor_pembina: "",
          uraian_jenis_perusahaan: "",
          uraian_status_penanaman_modal: "",
          uraian_risiko_proyek: "",
          uraian_skala_usaha: "",
          alamat_usaha: "",
          kab_kota_usaha: "",
          kecamatan_usaha: "",
          kelurahan_usaha: "",
          latitude: "",
          longitude: "",
          luas_tanah: "",
          satuan_tanah: "",
          jumlah_investasi: "",
          tki: "",
          nama_user: "",
          email: "",
          nomor_telp: "",
          status: "Aktif",
          indicator_1: "",
          indicator_2: "",
          indicator_3: "",
          indicator_4: "",
          indicator_5: "",
          indicator_6: "",
          indicator_7: "",
          indicator_8: "",
          indicator_9: "",
          indicator_10: "",
        });
        setIndicators([]);
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddIndicator = () => {
    setIndicators(prev => [...prev, { judul: "", nilai: "" }]);
  };

  const handleRemoveIndicator = (index: number) => {
    setIndicators(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleIndicatorChange = (index: number, field: "judul" | "nilai", value: string) => {
    setIndicators(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-[110] font-medium text-sm transition-all animate-in slide-in-from-bottom-5 ${
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

    const validIndicators = indicators
      .filter(ind => ind.judul.trim() !== "")
      .map((ind, idx) => ({
        ...(ind.id ? { id: ind.id } : {}),
        judul: ind.judul.trim(),
        nilai: ind.nilai ? ind.nilai.trim() : null,
        sort_order: idx + 1,
      }));
    
    const payload = {
      ...formData,
      indicator_1: formData.indicator_1?.trim() || null,
      indicator_2: formData.indicator_2?.trim() || null,
      indicator_3: formData.indicator_3?.trim() || null,
      indicator_4: formData.indicator_4?.trim() || null,
      indicator_5: formData.indicator_5?.trim() || null,
      indicator_6: formData.indicator_6?.trim() || null,
      indicator_7: formData.indicator_7?.trim() || null,
      indicator_8: formData.indicator_8?.trim() || null,
      indicator_9: formData.indicator_9?.trim() || null,
      indicator_10: formData.indicator_10?.trim() || null,
      indicators: validIndicators,
    };

    axios({ method, url, data: payload })
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-card w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground truncate pr-2 min-w-0 flex-1">
            {isEdit ? "Edit Data Usaha" : "Tambah Data Usaha"}
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="p-2.5 -m-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors shrink-0" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
            
            {/* A. Identitas Proyek */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 border-b border-border pb-2 uppercase tracking-wider">A. Identitas Proyek</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>div]:min-w-0">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">ID Proyek</label>
                  <InputField name="id_proyek" value={formData.id_proyek} onChange={handleChange} placeholder="ID Proyek" disabled={isEdit} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">NIB *</label>
                  <InputField name="nib" value={formData.nib} onChange={handleChange} required placeholder="Nomor Induk Berusaha" disabled={isEdit} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nama Perusahaan *</label>
                  <InputField name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleChange} required placeholder="PT / CV / dll" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nama Proyek</label>
                  <InputField name="nama_proyek" value={formData.nama_proyek} onChange={handleChange} placeholder="Nama Proyek (Jika ada)" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Uraian Jenis Proyek</label>
                  <InputField name="uraian_jenis_proyek" value={formData.uraian_jenis_proyek} onChange={handleChange} placeholder="Misal: Utama / Pendukung" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Terbit OSS</label>
                  <InputField type="date" name="tanggal_terbit_oss" value={formData.tanggal_terbit_oss} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Pengajuan Proyek</label>
                  <InputField name="day_of_tanggal_pengajuan_proyek" value={formData.day_of_tanggal_pengajuan_proyek} onChange={handleChange} placeholder="Hari Tanggal Pengajuan" />
                </div>
              </div>
            </section>

            {/* B. Klasifikasi Usaha */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 border-b border-border pb-2 uppercase tracking-wider">B. Klasifikasi Usaha</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>div]:min-w-0">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kode KBLI</label>
                  <InputField name="kbli" value={formData.kbli} onChange={handleChange} placeholder="Misal: 47111" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sektor Pembina</label>
                  <InputField name="kl_sektor_pembina" value={formData.kl_sektor_pembina} onChange={handleChange} placeholder="Kementerian / Lembaga" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Judul KBLI</label>
                  <InputField name="judul_kbli" value={formData.judul_kbli} onChange={handleChange} placeholder="Kategori Usaha" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Jenis Perusahaan</label>
                  <InputField name="uraian_jenis_perusahaan" value={formData.uraian_jenis_perusahaan} onChange={handleChange} placeholder="Misal: PMA / PMDN" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status Penanaman Modal</label>
                  <InputField name="uraian_status_penanaman_modal" value={formData.uraian_status_penanaman_modal} onChange={handleChange} placeholder="Misal: PMDN" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Risiko Proyek</label>
                  <InputField name="uraian_risiko_proyek" value={formData.uraian_risiko_proyek} onChange={handleChange} placeholder="Misal: Rendah / Tinggi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Skala Usaha</label>
                  <InputField name="uraian_skala_usaha" value={formData.uraian_skala_usaha} onChange={handleChange} placeholder="Misal: Mikro / Kecil" />
                </div>
              </div>
            </section>

            {/* C. Lokasi Usaha */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 border-b border-border pb-2 uppercase tracking-wider">C. Lokasi Usaha</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>div]:min-w-0">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alamat Usaha</label>
                  <InputField name="alamat_usaha" value={formData.alamat_usaha} onChange={handleChange} placeholder="Alamat Lengkap" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kabupaten/Kota</label>
                  <InputField name="kab_kota_usaha" value={formData.kab_kota_usaha} onChange={handleChange} placeholder="Kota/Kabupaten" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kecamatan</label>
                  <InputField name="kecamatan_usaha" value={formData.kecamatan_usaha} onChange={handleChange} placeholder="Kecamatan" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kelurahan</label>
                  <InputField name="kelurahan_usaha" value={formData.kelurahan_usaha} onChange={handleChange} placeholder="Kelurahan" />
                </div>
                <div></div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Latitude</label>
                  <InputField name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="-0.xxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Longitude</label>
                  <InputField name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="117.xxxxxx" />
                </div>
              </div>
            </section>

            {/* D. Kontak / Pengguna */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 border-b border-border pb-2 uppercase tracking-wider">D. Kontak / Pengguna</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>div]:min-w-0">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nama User</label>
                  <InputField name="nama_user" value={formData.nama_user} onChange={handleChange} placeholder="Nama Pendaftar / User" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status Sistem</label>
                  <SelectField name="status" value={formData.status} onChange={handleChange} options={[
                    { value: 'Aktif', label: 'Aktif' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Tidak Aktif', label: 'Tidak Aktif' }
                  ]} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</label>
                  <InputField name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nomor Telepon</label>
                  <InputField name="nomor_telp" value={formData.nomor_telp} onChange={handleChange} placeholder="08123456789" />
                </div>
              </div>
            </section>

            {/* E. Investasi & Tenaga Kerja */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 border-b border-border pb-2 uppercase tracking-wider">E. Investasi & Tenaga Kerja</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>div]:min-w-0">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Jumlah Investasi (Rp)</label>
                  <InputField name="jumlah_investasi" type="number" step="any" value={formData.jumlah_investasi} onChange={handleChange} placeholder="Contoh: 10000000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">TKI (Orang)</label>
                  <InputField name="tki" type="number" step="1" value={formData.tki} onChange={handleChange} placeholder="Jumlah Tenaga Kerja" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Luas Tanah</label>
                  <InputField name="luas_tanah" type="number" step="any" value={formData.luas_tanah} onChange={handleChange} placeholder="Luas Area" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Satuan Tanah</label>
                  <InputField name="satuan_tanah" value={formData.satuan_tanah} onChange={handleChange} placeholder="Contoh: m2, Ha" />
                </div>
              </div>
            </section>

            {/* F. Indikator Tambahan (Dinamis Per Data Usaha) */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                <div>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                    F. Indikator Tambahan
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Data tambahan spesifik untuk usaha ini (contoh: NPWP, nomor PBG, status pajak, catatan survey, dsb).
                  </p>
                </div>
                <Btn
                  type="button"
                  variant="outline"
                  size="sm"
                  Icon={Plus}
                  onClick={handleAddIndicator}
                  className="self-start sm:self-auto shrink-0"
                >
                  Add Indikator
                </Btn>
              </div>

              {indicators.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                  <p className="text-xs text-muted-foreground mb-3">Belum ada indikator tambahan.</p>
                  <Btn
                    type="button"
                    variant="outline"
                    size="sm"
                    Icon={Plus}
                    onClick={handleAddIndicator}
                    className="mx-auto"
                  >
                    Add Indikator
                  </Btn>
                </div>
              ) : (
                <div className="space-y-3">
                  {indicators.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs font-semibold text-foreground">
                          Indikator Tambahan {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIndicator(index)}
                          className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1 font-medium transition-colors cursor-pointer p-1 rounded-sm hover:bg-destructive/10"
                          title="Hapus indikator"
                        >
                          <Trash2 size={14} />
                          <span>Hapus</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Judul / Nama Indikator <span className="text-destructive">*</span>
                          </label>
                          <InputField
                            value={item.judul}
                            onChange={(e: any) => handleIndicatorChange(index, "judul", e.target.value)}
                            placeholder="Contoh: NPWP, Status Pajak, Nomor PBG, Keterangan"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Nilai
                          </label>
                          <textarea
                            value={item.nilai}
                            onChange={(e) => handleIndicatorChange(index, "nilai", e.target.value)}
                            placeholder="Masukkan nilai atau kalimat penjelasan (angka maupun teks bebas)"
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[42px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-1">
                    <Btn
                      type="button"
                      variant="outline"
                      size="sm"
                      Icon={Plus}
                      onClick={handleAddIndicator}
                    >
                      Add Indikator Lagi
                    </Btn>
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
            <Btn variant="outline" type="button" onClick={onClose} disabled={loading} className="w-full sm:w-auto justify-center">Batal</Btn>
            <Btn variant="primary" type="submit" disabled={loading} className="w-full sm:w-auto justify-center">
              {loading ? <Loader2 className="animate-spin" size={16} /> : (isEdit ? "Simpan Perubahan" : "Tambah Data")}
            </Btn>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
