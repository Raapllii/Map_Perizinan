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
        alert("Data usaha berhasil disimpan!");
        setUploading(false);
        setStep(1);
      })
      .catch(err => {
        console.error(err);
        alert("Gagal menyimpan data.");
        setUploading(false);
      });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step indicator */}
      <Card padding="px-6 py-4" className="mb-5">
        <div className="flex items-center gap-0">
          {["Informasi Usaha", "Lokasi & Koordinat", "Dokumen & Foto", "Konfirmasi"].map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${step > i + 1 ? "bg-[#2E7D32] text-white" : step === i + 1 ? "bg-[#2E7D32] text-white ring-4 ring-green-100" : "bg-gray-100 text-gray-400"}`}>
                  {step > i + 1 ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? "text-[#2E7D32]" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-3 ${step > i + 1 ? "bg-[#2E7D32]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Form */}
        <div className="col-span-2 space-y-5">
          {step === 1 && (
            <Card>
              <SectionHeader title="Informasi Dasar Usaha" subtitle="Isi data identitas dan informasi umum usaha" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Nama Usaha" placeholder="Contoh: Toko Maju Bersama" required
                  value={form.namaUsaha} onChange={(e: any) => setForm({ ...form, namaUsaha: e.target.value })} className="col-span-2" />
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
                  value={form.alamat} onChange={(e: any) => setForm({ ...form, alamat: e.target.value })} className="col-span-2" />
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
              <div className="grid grid-cols-2 gap-4">
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
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#2E7D32] hover:bg-green-50/30 transition-all cursor-pointer">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-[#2E7D32]" />
                        <span className="text-sm text-[#2E7D32]">Mengupload...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Klik untuk upload foto</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP maks. 5MB</p>
                      </>
                    )}
                  </div>
                </div>
                {["Surat Izin Usaha (SIUP)", "Kartu Tanda Penduduk (KTP) Pemilik", "NPWP Perusahaan", "Sertifikat Tanah / Surat Sewa"].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-[#2E7D32] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText size={15} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc}</p>
                        <p className="text-xs text-gray-400">PDF, JPG — maks. 10MB</p>
                      </div>
                    </div>
                    <Btn variant="outline" size="sm" Icon={Upload}>Upload</Btn>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <SectionHeader title="Konfirmasi Data" subtitle="Periksa kembali data sebelum menyimpan" />
              <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Data siap disimpan</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nama Usaha", value: form.namaUsaha || "Belum diisi" },
                    { label: "NIB", value: form.nib || "Belum diisi" },
                    { label: "Kategori", value: form.kategori },
                    { label: "Kecamatan", value: form.kecamatan },
                    { label: "Koordinat", value: `${form.lat}, ${form.lng}` },
                    { label: "Dokumen", value: "4 file siap upload" },
                  ].map((f) => (
                    <div key={f.label} className="text-xs">
                      <span className="text-gray-500">{f.label}: </span>
                      <span className="font-medium text-gray-800">{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-green-100 flex justify-end">
                  <Btn variant="primary" type="submit" Icon={Save} disabled={uploading}>
                    {uploading ? "Menyimpan..." : "Simpan Usaha"}
                  </Btn>
                </div>
              </form>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {step > 1 && (
                <Btn variant="outline" Icon={ChevronLeft} onClick={() => setStep((s: number) => s - 1)}>Sebelumnya</Btn>
              )}
              <Btn variant="ghost" Icon={RotateCcw}>Reset Form</Btn>
            </div>
            <div className="flex gap-2">
              <Btn variant="outline">Batal</Btn>
              {step < 4 && (
                <Btn variant="primary" onClick={() => setStep((s: number) => s + 1)}>
                  Lanjut <ChevronRight size={15} />
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* Right: Info + tips */}
        <div className="space-y-4">
          <Card padding="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Panduan Pengisian</h4>
            <div className="space-y-2.5">
              {[
                { n: 1, t: "NIB terdiri dari 12 digit angka yang diperoleh dari OSS" },
                { n: 2, t: "Koordinat dapat diambil dari Google Maps dengan klik kanan pada lokasi" },
                { n: 3, t: "Foto usaha harus menampilkan papan nama dan tampak depan" },
                { n: 4, t: "Semua dokumen harus masih berlaku dan dapat dibaca jelas" },
              ].map((p) => (
                <div key={p.n} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#2E7D32]">{p.n}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{p.t}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Dokumen Wajib</h4>
            <div className="space-y-2">
              {["NIB dari OSS", "KTP Pemilik", "NPWP", "SIUP/TDP", "Foto Usaha"].map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle size={13} className="text-[#2E7D32] flex-shrink-0" />
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
