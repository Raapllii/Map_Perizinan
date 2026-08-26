import { useState } from "react";
import axios from 'axios';
import { Check, Upload, RefreshCw, FileText, CheckCircle, Save, ChevronLeft, RotateCcw, ChevronRight } from "lucide-react";
import { Card, SectionHeader, InputField, SelectField, Btn } from "../components/ui";

export default function TambahUsahaPage() {
  const [form, setForm] = useState({
    namaUsaha: "", nib: "", pemilik: "", kategori: "Perdagangan Umum",
    kecamatan: "Kec. Pusat", kelurahan: "Kel. Merdeka", alamat: "",
    telepon: "", email: "", lat: "-6.2088", lng: "106.8456",
  });
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  const handleUploadDemo = () => {
    setUploading(true);
    setTimeout(() => setUploading(false), 1500);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setUploading(true);
    const payload = {
      nama_perusahaan: form.namaUsaha,
      nib: form.nib,
      alamat_proyek: form.alamat,
      kecamatan: form.kecamatan,
      kelurahan: form.kelurahan,
      judul_kbli: form.kategori,
      lat: form.lat,
      lng: form.lng,
      status: "Aktif",
      tgl_terbit: new Date().toISOString().split('T')[0],
      color: "#2E7D32"
    };

    axios.post('/api/admin/businesses', payload)
      .then(res => {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-success text-success-foreground px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm';
        toast.innerText = 'Data usaha berhasil disimpan!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        setUploading(false);
        setStep(1);
      })
      .catch(err => {
        console.error(err);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-danger text-danger-foreground px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm';
        toast.innerText = 'Gagal menyimpan data.';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        setUploading(false);
      });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step indicator */}
      <Card padding="p-0" className="mb-5 overflow-hidden">
        <div className="overflow-x-auto w-full min-w-0">
          <div className="flex items-center gap-0 min-w-max px-6 py-4">
            {["Informasi Usaha", "Lokasi & Koordinat", "Dokumen & Foto", "Konfirmasi"].map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none mr-2 lg:mr-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all flex-shrink-0
                    ${step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}>
                    {step > i + 1 ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${step === i + 1 ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                </div>
                {i < 3 && <div className={`w-8 lg:flex-1 h-0.5 mx-3 flex-shrink-0 ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Left: Form */}
        <div className="lg:col-span-2 min-w-0 space-y-5">
          {step === 1 && (
            <Card>
              <SectionHeader title="Informasi Dasar Usaha" subtitle="Isi data identitas dan informasi umum usaha" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Nama Usaha" placeholder="Contoh: Toko Maju Bersama" required
                  value={form.namaUsaha} onChange={(e: any) => setForm({ ...form, namaUsaha: e.target.value })} className="sm:col-span-2" />
                <InputField label="Nomor Induk Berusaha (NIB)" placeholder="12 digit NIB" required
                  value={form.nib} onChange={(e: any) => setForm({ ...form, nib: e.target.value })} />
                <InputField label="Nama Pemilik" placeholder="Nama lengkap pemilik" required
                  value={form.pemilik} onChange={(e: any) => setForm({ ...form, pemilik: e.target.value })} />
                <SelectField label="Kategori Usaha" required options={["Perdagangan Umum", "Jasa & Layanan", "Kuliner & F&B", "Industri Kecil", "Properti & Konstruksi"]}
                  value={form.kategori} onChange={(e: any) => setForm({ ...form, kategori: e.target.value })} />
                <SelectField label="Kecamatan" required options={["Kec. Pusat", "Kec. Utara", "Kec. Barat", "Kec. Timur", "Kec. Selatan", "Kec. Tenggara"]}
                  value={form.kecamatan} onChange={(e: any) => setForm({ ...form, kecamatan: e.target.value })} />
                <SelectField label="Kelurahan" required options={["Kel. Merdeka", "Kel. Damai", "Kel. Sejahtera", "Kel. Makmur"]}
                  value={form.kelurahan} onChange={(e: any) => setForm({ ...form, kelurahan: e.target.value })} />
                <InputField label="Alamat Lengkap" placeholder="Jl., No., RT/RW" required
                  value={form.alamat} onChange={(e: any) => setForm({ ...form, alamat: e.target.value })} className="sm:col-span-2" />
                <InputField label="Nomor Telepon" type="tel" placeholder="+62 812 xxxx xxxx"
                  value={form.telepon} onChange={(e: any) => setForm({ ...form, telepon: e.target.value })} />
                <InputField label="Email Usaha" type="email" placeholder="usaha@email.com"
                  value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <SectionHeader title="Lokasi & Koordinat" subtitle="Tandai lokasi usaha pada peta atau masukkan koordinat secara manual" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Latitude" value={form.lat} onChange={(e: any) => setForm({ ...form, lat: e.target.value })} placeholder="-6.2088" />
                <InputField label="Longitude" value={form.lng} onChange={(e: any) => setForm({ ...form, lng: e.target.value })} placeholder="106.8456" />
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <SectionHeader title="Upload Dokumen & Foto" subtitle="Unggah foto usaha dan dokumen perizinan yang diperlukan" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto Usaha <span className="text-red-500">*</span></label>
                  <div onClick={handleUploadDemo}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-primary" />
                        <span className="text-sm text-primary">Mengupload...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Klik untuk upload foto</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP maks. 5MB</p>
                      </>
                    )}
                  </div>
                </div>
                {["Surat Izin Usaha (SIUP)", "Kartu Tanda Penduduk (KTP) Pemilik", "NPWP Perusahaan", "Sertifikat Tanah / Surat Sewa"].map((doc) => (
                  <div key={doc} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded-xl hover:border-primary transition-all gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc}</p>
                        <p className="text-xs text-muted-foreground">PDF, JPG — maks. 10MB</p>
                      </div>
                    </div>
                    <Btn variant="outline" size="sm" Icon={Upload} className="w-full sm:w-auto justify-center">Upload</Btn>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <SectionHeader title="Konfirmasi Data" subtitle="Periksa kembali data sebelum menyimpan" />
              <form onSubmit={handleSubmit} className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">Data siap disimpan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Nama Usaha", value: form.namaUsaha || "Belum diisi" },
                    { label: "NIB", value: form.nib || "Belum diisi" },
                    { label: "Kategori", value: form.kategori },
                    { label: "Kecamatan", value: form.kecamatan },
                    { label: "Koordinat", value: `${form.lat}, ${form.lng}` },
                    { label: "Dokumen", value: "4 file siap upload" },
                  ].map((f) => (
                    <div key={f.label} className="text-xs min-w-0">
                      <span className="text-muted-foreground">{f.label}: </span>
                      <span className="font-medium text-foreground break-words">{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-primary/10 flex justify-end">
                  <Btn variant="primary" type="submit" Icon={Save} disabled={uploading} className="w-full sm:w-auto justify-center">
                    {uploading ? "Menyimpan..." : "Simpan Usaha"}
                  </Btn>
                </div>
              </form>
            </Card>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 mt-4">
            <div className="grid grid-cols-2 sm:flex gap-2">
              {step > 1 ? (
                <Btn variant="outline" Icon={ChevronLeft} onClick={() => setStep((s: number) => s - 1)} className="w-full justify-center">Sebelumnya</Btn>
              ) : (
                <div className="hidden sm:block"></div>
              )}
              <Btn variant="ghost" Icon={RotateCcw} className="w-full justify-center col-start-2 sm:col-auto">Reset Form</Btn>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Btn variant="outline" className="w-full justify-center">Batal</Btn>
              {step < 4 && (
                <Btn variant="primary" onClick={() => setStep((s: number) => s + 1)} className="w-full justify-center">
                  Lanjut <ChevronRight size={15} />
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* Right: Info + tips */}
        <div className="lg:col-span-1 min-w-0 space-y-4">
          <Card padding="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Panduan Pengisian</h4>
            <div className="space-y-2.5">
              {[
                { n: 1, t: "NIB terdiri dari 12 digit angka yang diperoleh dari OSS" },
                { n: 2, t: "Koordinat dapat diambil dari Google Maps dengan klik kanan pada lokasi" },
                { n: 3, t: "Foto usaha harus menampilkan papan nama dan tampak depan" },
                { n: 4, t: "Semua dokumen harus masih berlaku dan dapat dibaca jelas" },
              ].map((p) => (
                <div key={p.n} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">{p.n}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.t}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Dokumen Wajib</h4>
            <div className="space-y-2">
              {["NIB dari OSS", "KTP Pemilik", "NPWP", "SIUP/TDP", "Foto Usaha"].map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={13} className="text-primary flex-shrink-0" />
                  {d}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
