import { LayoutDashboard, Map, Plus, Database, CheckSquare, Activity, FileText, Settings, Users, Briefcase } from "lucide-react";

export const MENU_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { id: "peta-usaha", icon: Map, label: "Peta Usaha", badge: null },
  { id: "data-usaha", icon: Database, label: "Data Usaha", badge: null },
  { id: "monitoring", icon: Activity, label: "Monitoring", badge: null },
  { id: "laporan", icon: FileText, label: "Laporan", badge: null },
  { id: "rekapitulasi-akses", icon: Users, label: "Rekapitulasi Akses", badge: null },
  { id: "pengaturan", icon: Settings, label: "Pengaturan", badge: null },
];

export const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "dashboard": { title: "Dashboard", subtitle: "Ringkasan informasi sistem NIB" },
  "peta-usaha": { title: "Peta Usaha", subtitle: "Visualisasi spasial lokasi usaha" },
  "tambah-usaha": { title: "Tambah Usaha", subtitle: "Registrasi usaha baru ke sistem" },
  "data-usaha": { title: "Data Usaha", subtitle: "Manajemen data seluruh usaha" },
  "verifikasi-izin": { title: "Verifikasi Izin", subtitle: "Antrian pengajuan izin usaha" },
  "monitoring": { title: "Monitoring", subtitle: "Pemantauan real-time kondisi usaha" },
  "laporan": { title: "Laporan", subtitle: "Laporan statistik dan distribusi usaha" },
  "rekapitulasi-akses": { title: "Rekapitulasi Akses", subtitle: "Daftar pengguna yang telah mengakses aplikasi Peta PB" },
  "pengaturan": { title: "Pengaturan", subtitle: "Konfigurasi sistem dan preferensi" },
};
