import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Building2, Briefcase, FileText, CheckCircle2 } from "lucide-react";
import { StatusBadge, Btn } from "./ui";
import { Business } from "../types";

interface DataUsahaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
}

export default function DataUsahaDetailModal({ isOpen, onClose, business }: DataUsahaDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !business) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-card w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0 min-w-0">
          <div className="min-w-0 pr-2 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">Detail Data Usaha</h2>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">NIB: {business.nib}</p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="p-2.5 -m-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
          
          {/* Identitas Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <Building2 size={18} />
              <h3>Identitas Perusahaan</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="Nama Perusahaan" value={business.nama_perusahaan} />
              <DetailItem label="NIB" value={business.nib} />
              <DetailItem label="Nama User" value={business.nama_user} />
              <DetailItem label="Email" value={business.email} />
              <DetailItem label="Telepon" value={business.nomor_telp} />
              <DetailItem label="Jenis Perusahaan" value={business.uraian_jenis_perusahaan} />
            </div>
          </section>

          {/* Informasi Proyek Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <FileText size={18} />
              <h3>Informasi Proyek</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="ID Proyek" value={business.id_proyek} />
              <DetailItem label="Nama Proyek" value={business.nama_proyek} />
              <DetailItem label="Uraian Jenis Proyek" value={business.uraian_jenis_proyek} />
              <DetailItem label="Skala Usaha" value={business.uraian_skala_usaha} />
              <DetailItem label="Tanggal Pengajuan Proyek" value={business.day_of_tanggal_pengajuan_proyek} />
              <DetailItem label="Tanggal Terbit OSS" value={formatDate(business.tanggal_terbit_oss as string)} />
              <DetailItem label="Status Penanaman Modal" value={business.uraian_status_penanaman_modal} />
              <DetailItem label="Risiko Proyek" value={business.uraian_risiko_proyek} />
            </div>
          </section>

          {/* Legalitas & KBLI Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <Briefcase size={18} />
              <h3>Kegiatan Usaha & KBLI</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="KBLI" value={business.kbli} />
              <DetailItem label="Sektor Pembina" value={business.kl_sektor_pembina} />
              <DetailItem label="Judul KBLI / Kategori" value={business.judul_kbli} className="md:col-span-2" />
            </div>
          </section>

          {/* Lokasi Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <MapPin size={18} />
              <h3>Lokasi Usaha</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="Alamat Usaha" value={business.alamat_usaha} className="md:col-span-2" />
              <DetailItem label="Kabupaten / Kota" value={business.kab_kota_usaha} />
              <DetailItem label="Kecamatan" value={business.kecamatan_usaha} />
              <DetailItem label="Kelurahan / Desa" value={business.kelurahan_usaha} />
              <div></div>
              <DetailItem label="Koordinat Latitude" value={business.latitude ? business.latitude : <span className="text-warning italic">Belum dipetakan</span>} />
              <DetailItem label="Koordinat Longitude" value={business.longitude ? business.longitude : <span className="text-warning italic">Belum dipetakan</span>} />
            </div>
          </section>

          {/* Investasi Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <CheckCircle2 size={18} />
              <h3>Tanah, Investasi & Tenaga Kerja</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <DetailItem label="Luas Tanah" value={business.luas_tanah ? `${business.luas_tanah} ${business.satuan_tanah || ''}` : '-'} />
              <DetailItem label="Jumlah Investasi" value={formatCurrency(business.jumlah_investasi)} />
              <DetailItem label="Tenaga Kerja Indonesia (TKI)" value={business.tki ? `${business.tki} Orang` : '-'} />
            </div>
          </section>

          {/* Status Section */}
          <section>
            <div className="flex items-center gap-2 text-primary font-semibold mb-4 border-b border-border pb-2">
              <CheckCircle2 size={18} />
              <h3>Status Sistem</h3>
            </div>
            <div className="grid grid-cols-1 gap-y-4 gap-x-8 items-center">
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status Data</span>
                <StatusBadge status={business.status} />
              </div>
            </div>
          </section>

          {/* Indikator Tambahan Section (Per Usaha) */}
          {business.indicators && business.indicators.length > 0 && (
            <section>
              <div className="flex items-center justify-between text-primary font-semibold mb-4 border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h3>Indikator Tambahan</h3>
                </div>
                <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {business.indicators.length} Indikator
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {business.indicators.map((ind, idx) => (
                  <DetailItem
                    key={ind.id ?? idx}
                    label={ind.judul}
                    value={ind.nilai}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/20 flex justify-end shrink-0">
          <Btn variant="outline" onClick={onClose} className="w-full sm:w-auto justify-center">Tutup</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Helpers
const DetailItem = ({ label, value, className = "" }: { label: string, value: any, className?: string }) => {
  const isInvalid = value === null || value === undefined || value === "" || Number.isNaN(value) || value === "null" || value === "undefined";
  const displayVal = isInvalid ? '-' : value;
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <span className="block text-sm font-medium text-foreground break-words">{displayVal}</span>
    </div>
  );
};

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
