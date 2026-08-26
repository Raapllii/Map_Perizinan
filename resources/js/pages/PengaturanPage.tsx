import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { User, Lock, Sun, Bell, Map, Database, Upload, Save, RotateCcw, Moon, Globe, CheckCircle, FileText, Download, FileSpreadsheet, FileUp, AlertTriangle } from "lucide-react";
import { Card, Btn, InputField, SelectField, SectionHeader } from "../components/ui";

export default function PengaturanPage({ darkMode, setDarkMode }: any) {
  const location = useLocation();
  const defaultSection = location.hash ? location.hash.replace('#', '') : "profil";
  const [activeSection, setActiveSection] = useState(defaultSection);

  useEffect(() => {
    if (location.hash) {
      setActiveSection(location.hash.replace('#', ''));
    }
  }, [location.hash]);
  const [notifSettings, setNotifSettings] = useState({
    email: true, browser: true, kadaluarsa: true, baru: true, sistem: false,
  });

  const sections = [
    { id: "profil", icon: User, label: "Profil & Akun" },
    { id: "keamanan", icon: Lock, label: "Keamanan" },
    { id: "tampilan", icon: Sun, label: "Tampilan & Tema" },
    { id: "peta", icon: Map, label: "Konfigurasi Peta" },
    { id: "database", icon: Database, label: "Database & Backup" },
  ];

  return (
    <div className="w-full space-y-5">
      {activeSection === "profil" && (
        <Card>
          <SectionHeader title="Profil & Akun" subtitle="Kelola informasi akun Anda" />
          <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xl font-bold">AK</div>
            <div>
              <h4 className="font-semibold text-gray-900">Dr. Andi Kurniawan</h4>
              <p className="text-sm text-gray-500">Super Admin · andi.k@pemkab.go.id</p>
            </div>
            <Btn variant="outline" size="sm" Icon={Upload} className="ml-auto">Ganti Foto</Btn>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nama Depan" value="Dr. Andi" onChange={() => { }} placeholder="" />
            <InputField label="Nama Belakang" value="Kurniawan" onChange={() => { }} placeholder="" />
            <InputField label="Email" type="email" value="andi.k@pemkab.go.id" onChange={() => { }} placeholder="" className="col-span-2" />
            <InputField label="Jabatan" value="Kepala Dinas" onChange={() => { }} placeholder="" />
            <InputField label="No. Telepon" type="tel" value="+62 811 2345 6789" onChange={() => { }} placeholder="" />
          </div>
          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
            <Btn variant="primary" Icon={Save}>Simpan Perubahan</Btn>
            <Btn variant="outline" Icon={RotateCcw}>Reset</Btn>
          </div>
        </Card>
      )}

      {activeSection === "tampilan" && (
        <Card>
          <SectionHeader title="Tampilan & Tema" subtitle="Sesuaikan tampilan antarmuka sistem" />
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Mode Tampilan</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Terang", icon: Sun, value: false },
                  { label: "Gelap", icon: Moon, value: true },
                  { label: "Sistem", icon: Globe, value: null },
                ].map((m) => (
                  <button key={m.label} onClick={() => m.value !== null && setDarkMode(m.value)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${darkMode === m.value ? "border-[#2E7D32] bg-[#E8F5E9]" : "border-gray-200 hover:border-gray-300"}`}>
                    <m.icon size={20} className={darkMode === m.value ? "text-[#2E7D32]" : "text-gray-400"} />
                    <span className={`text-sm font-medium ${darkMode === m.value ? "text-[#2E7D32]" : "text-gray-600"}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Ukuran Font</label>
              <div className="flex gap-3">
                {["Kecil", "Normal", "Besar"].map((f, i) => (
                  <button key={f} className={`px-4 py-2 rounded-xl border-2 text-sm transition-all ${i === 1 ? "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]" : "border-gray-200 text-gray-600"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Perubahan tampilan akan langsung diterapkan ke seluruh halaman sistem.</p>
            </div>
          </div>
        </Card>
      )}

      {activeSection === "peta" && (
        <Card>
          <SectionHeader title="Konfigurasi Peta" subtitle="Atur penyedia peta dan sistem koordinat" />
          <div className="space-y-4">
            <SelectField label="Penyedia Peta" options={["OpenStreetMap", "Google Maps", "Mapbox", "ArcGIS Online"]}
              value="OpenStreetMap" onChange={() => { }} />
            <SelectField label="Sistem Koordinat" options={["WGS 84 (EPSG:4326)", "Web Mercator (EPSG:3857)", "TM-3 Indonesia"]}
              value="WGS 84 (EPSG:4326)" onChange={() => { }} />
            <SelectField label="Tile Layer Default" options={["Standard", "Satellite", "Terrain", "Hybrid"]}
              value="Standard" onChange={() => { }} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Pusat Peta (Latitude)" value="-6.2088" onChange={() => { }} placeholder="" />
              <InputField label="Pusat Peta (Longitude)" value="106.8456" onChange={() => { }} placeholder="" />
            </div>
            <InputField label="Zoom Default" value="13" onChange={() => { }} placeholder="" />
          </div>
          <Btn variant="primary" Icon={Save} className="mt-5">Simpan Konfigurasi</Btn>
        </Card>
      )}

      {activeSection === "database" && (
        <div className="space-y-4">
          <Card>
            <SectionHeader title="Backup Database" subtitle="Buat cadangan data sistem" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "Backup Terakhir", value: "21 Jul 2025 03:00", icon: CheckCircle, color: "text-green-600" },
                { label: "Ukuran Database", value: "2.4 GB", icon: Database, color: "text-blue-600" },
                { label: "Total Record", value: "284.731", icon: FileText, color: "text-purple-600" },
                { label: "Backup Tersedia", value: "14 file", icon: Download, color: "text-teal-600" },
              ].map(s => (
                <div key={s.label} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                  <s.icon size={18} className={s.color} />
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Btn variant="primary" Icon={Download}>Backup Sekarang</Btn>
              <Btn variant="outline" Icon={Upload}>Restore Backup</Btn>
              <Btn variant="outline" Icon={FileSpreadsheet}>Export Data</Btn>
            </div>
          </Card>
          <Card>
            <SectionHeader title="Import Data" subtitle="Impor data dari file CSV/Excel" />
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#2E7D32] transition-all cursor-pointer">
              <FileUp size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Seret file atau klik untuk upload</p>
              <p className="text-xs text-gray-400 mt-1">CSV, XLSX, JSON — maks. 50MB</p>
            </div>
          </Card>
        </div>
      )}

      {activeSection === "keamanan" && (
        <Card>
          <SectionHeader title="Keamanan Akun" subtitle="Kelola password dan keamanan akun" />
          <div className="space-y-4">
            <InputField label="Password Saat Ini" type="password" placeholder="••••••••" />
            <InputField label="Password Baru" type="password" placeholder="Min. 8 karakter" />
            <InputField label="Konfirmasi Password Baru" type="password" placeholder="Ulangi password baru" />
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <AlertTriangle size={13} />
                Password harus mengandung huruf besar, angka, dan karakter khusus minimal 8 karakter.
              </p>
            </div>
            <Btn variant="primary" Icon={Lock}>Perbarui Password</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
