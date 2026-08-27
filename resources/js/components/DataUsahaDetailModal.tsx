import { X, MapPin, Building2, Briefcase, FileText, CheckCircle2 } from "lucide-react";
import { StatusBadge, Btn } from "./ui";

interface DataUsahaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: any;
}

export default function DataUsahaDetailModal({ isOpen, onClose, business }: DataUsahaDetailModalProps) {
  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Detail Data Usaha</h2>
            <p className="text-sm text-muted-foreground mt-0.5">NIB: {business.nib}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Identitas Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <Building2 size={18} />
              <h3>Identitas Perusahaan</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="Nama Perusahaan" value={business.nama_perusahaan} />
              <DetailItem label="Nama Pemilik / User" value={business.nama_pemilik || business.nama_user} />
              <DetailItem label="NIB" value={business.nib} />
              <DetailItem label="Nama Proyek" value={business.nama_proyek} />
              <DetailItem label="Jenis Perusahaan" value={business.jenis_perusahaan || business.uraian_jenis_perusahaan} />
              <DetailItem label="Email" value={business.email} />
              <DetailItem label="Telepon" value={business.telp} />
              <DetailItem label="Profile Name" value={business.profile_name} />
            </div>
          </section>

          {/* Legalitas & KBLI Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <Briefcase size={18} />
              <h3>Kegiatan Usaha & KBLI</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="KBLI" value={business.kbli} />
              <DetailItem label="Judul KBLI / Kategori" value={business.judul_kbli} className="md:col-span-2" />
              <DetailItem label="Sektor Pembina" value={business.sektor} />
              <DetailItem label="Uraian Jenis Proyek" value={business.uraian_jenis_proyek} className="md:col-span-2" />
              <DetailItem label="Risiko Proyek" value={business.risiko} />
              <DetailItem label="Skala Usaha" value={business.skala_usaha} />
            </div>
          </section>

          {/* Lokasi Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <MapPin size={18} />
              <h3>Lokasi Proyek</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="Alamat Proyek" value={business.alamat_proyek} className="md:col-span-2" />
              <DetailItem label="Provinsi" value={business.propinsi} />
              <DetailItem label="Kabupaten / Kota" value={business.kabupaten} />
              <DetailItem label="Kecamatan" value={business.kecamatan} />
              <DetailItem label="Kelurahan / Desa" value={business.kelurahan} />
              <DetailItem label="Koordinat Latitude" value={business.lat ? business.lat : <span className="text-warning italic">Belum dipetakan</span>} />
              <DetailItem label="Koordinat Longitude" value={business.lng ? business.lng : <span className="text-warning italic">Belum dipetakan</span>} />
            </div>
          </section>

          {/* Investasi Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <FileText size={18} />
              <h3>Data Investasi & Lainnya</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="Jumlah Investasi" value={formatCurrency(business.jumlah_investasi)} />
              <DetailItem label="Tenaga Kerja Indonesia (TKI)" value={business.tki ? `${business.tki} Orang` : '-'} />
              <DetailItem label="Luas Tanah" value={business.luasan_pd ? `${business.luasan_pd} ${business.satuan_luasan_pd || ''}` : '-'} />
              <DetailItem label="Mesin & Peralatan Impor" value={formatCurrency(business.mesin_peralatan_impor)} />
              <DetailItem label="Mesin & Peralatan Lokal" value={formatCurrency(business.mesin_peralatan_lokal)} />
              <DetailItem label="Pembelian/Pematangan Tanah" value={formatCurrency(business.pembelian_pematangan_tanah)} />
              <DetailItem label="Bangunan/Gedung" value={formatCurrency(business.bangunan_gedung)} />
              <DetailItem label="Modal Kerja" value={formatCurrency(business.modal_kerja)} />
            </div>
          </section>

          {/* Status Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <CheckCircle2 size={18} />
              <h3>Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 items-center">
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status Sistem</span>
                <StatusBadge status={business.status} />
              </div>
              <DetailItem label="Status Penanaman Modal" value={business.status_pm} />
              <DetailItem label="Tanggal Terbit OSS" value={formatDate(business.tgl_terbit)} />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <Btn variant="outline" onClick={onClose}>Tutup</Btn>
        </div>
      </div>
    </div>
  );
}

// Helpers
const DetailItem = ({ label, value, className = "" }: { label: string, value: any, className?: string }) => (
  <div className={className}>
    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
    <span className="block text-sm font-medium text-foreground">{value || '-'}</span>
  </div>
);

const formatCurrency = (val: any) => {
  if (!val || isNaN(val)) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(d);
  } catch(e) {
    return dateStr;
  }
};
