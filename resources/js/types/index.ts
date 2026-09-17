export interface Business {
  id: number;
  id_proyek: string | null;
  uraian_jenis_proyek: string | null;
  nib: string;
  nama_perusahaan: string;
  tanggal_terbit_oss: string | null;
  uraian_status_penanaman_modal: string | null;
  uraian_jenis_perusahaan: string | null;
  uraian_risiko_proyek: string | null;
  nama_proyek: string | null;
  uraian_skala_usaha: string | null;
  alamat_usaha: string | null;
  kab_kota_usaha: string | null;
  kecamatan_usaha: string | null;
  kelurahan_usaha: string | null;
  longitude: number | null;
  latitude: number | null;
  day_of_tanggal_pengajuan_proyek: string | null;
  kbli: string | null;
  judul_kbli: string | null;
  kl_sektor_pembina: string | null;
  nama_user: string | null;
  email: string | null;
  nomor_telp: string | null;
  luas_tanah: number | null;
  satuan_tanah: string | null;
  jumlah_investasi: number | null;
  tki: number | null;
  status: string;
  color: string | null;
  indicators?: BusinessIndicator[];
  indicator_1?: string | null;
  indicator_2?: string | null;
  indicator_3?: string | null;
  indicator_4?: string | null;
  indicator_5?: string | null;
  indicator_6?: string | null;
  indicator_7?: string | null;
  indicator_8?: string | null;
  indicator_9?: string | null;
  indicator_10?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: `indicator_${number}`]: string | null | undefined;
  [key: string]: any;
}

export interface PublicMapFeedback {
  id: number;
  public_map_access_log_id: number;
  business_id?: number | null;
  rating: 'very-sad' | 'sad' | 'neutral' | 'happy' | string;
  feedback: string;
  business?: {
    id: number;
    nama_perusahaan?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface PublicMapAccessLog {
  id: number;
  nama: string;
  instansi: string;
  accessed_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  updated_at?: string;
  feedback?: PublicMapFeedback | null;
}

export interface BusinessIndicator {
  id?: number;
  business_id?: number;
  judul: string;
  nilai?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}



