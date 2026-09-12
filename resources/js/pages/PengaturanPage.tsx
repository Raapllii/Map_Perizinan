import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import axios from 'axios';
import { User, Users, Lock, Sun, Bell, Map, Database, Upload, Save, RotateCcw, Moon, Globe, CheckCircle, FileText, Download, FileSpreadsheet, FileUp, AlertTriangle, Loader2 } from "lucide-react";
import { Card, Btn, InputField, SelectField, SectionHeader } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import PenggunaPage from "./PenggunaPage";

export default function PengaturanPage({ darkMode, setDarkMode }: any) {
  const location = useLocation();
  const defaultSection = location.hash ? location.hash.replace('#', '') : "profil";
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // User Profile State
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: '', email: '', position: '', phone: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [securityForm, setSecurityForm] = useState({ old_password: '', new_password: '', new_password_confirmation: '' });

  // Settings State
  const [settings, setSettings] = useState<any>({
    theme: 'system',
    font_size: 'base',
    map_provider: 'OpenStreetMap',
    map_crs: 'WGS 84 (EPSG:4326)',
    map_tile: 'Standard',
    map_lat: '-6.2088',
    map_lng: '106.8456',
    map_zoom: '13',
    notif_email: true,
    notif_browser: true,
    notif_expired: true,
    notif_new: true,
    notif_system: false
  });

  // DB State
  const [dbStatus, setDbStatus] = useState({ database_size: '...', total_records: '...', last_backup: '...', available_backups: 0, backups: [] });

  useEffect(() => {
    if (location.hash) {
      setActiveSection(location.hash.replace('#', ''));
    }
  }, [location.hash]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const userRes = await axios.get('/api/admin/user');
      const userData = userRes.data.user;
      setUser(userData);
      setProfileForm({
        name: userData.name || '',
        email: userData.email || '',
        position: userData.position || '',
        phone: userData.phone || ''
      });

      if (userData.settings) {
        setSettings({ ...settings, ...userData.settings });
      }

      if (userData.role === 'Super Admin') {
        fetchDbStatus();
      }
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await axios.get('/api/admin/database/status');
      setDbStatus(res.data.data);
    } catch (error) {
      console.error("Failed to fetch DB status", error);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Profile Actions
  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      await axios.put('/api/admin/user/profile', profileForm);
      showMessage('Profil berhasil diperbarui', 'success');
      await fetchInitialData();
      setIsEditMode(false);
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to user's saved data
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        position: user.position || '',
        phone: user.phone || ''
      });
    }
    setIsEditMode(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);
    
    setIsLoading(true);
    try {
      await axios.post('/api/admin/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('Foto profil berhasil diperbarui', 'success');
      fetchInitialData();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal mengupload foto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Security Actions
  const handlePasswordSave = async () => {
    if (securityForm.new_password !== securityForm.new_password_confirmation) {
      showMessage('Konfirmasi password tidak cocok', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await axios.put('/api/admin/user/password', securityForm);
      showMessage('Password berhasil diubah', 'success');
      setSecurityForm({ old_password: '', new_password: '', new_password_confirmation: '' });
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal mengubah password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Settings Actions
  const handleSettingsSave = async (customSettings = null) => {
    setIsLoading(true);
    try {
      const dataToSave = customSettings || settings;
      await axios.put('/api/admin/user/settings', { settings: dataToSave });
      showMessage('Pengaturan berhasil disimpan', 'success');
      if (customSettings) setSettings(customSettings);
      
      const themeToApply = dataToSave.theme;
      if (themeToApply === 'dark' || (themeToApply === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
      
      if (dataToSave.font_size) {
        document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
        document.documentElement.classList.add(`text-${dataToSave.font_size}`);
      }
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // DB Actions
  const handleBackup = async () => {
    setIsLoading(true);
    showMessage('Sedang membuat backup...', 'success');
    try {
      await axios.post('/api/admin/database/backup');
      showMessage('Backup berhasil dibuat', 'success');
      fetchDbStatus();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal membuat backup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    window.open('/api/admin/database/export', '_blank');
  };

  const handleImportClick = () => {
    const el = document.getElementById('import-file');
    if(el) el.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    
    setIsLoading(true);
    showMessage('Sedang mengimpor data...', 'success');
    try {
      const res = await axios.post('/api/admin/database/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage(res.data.message || 'Data berhasil diimpor', 'success');
      fetchDbStatus();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal mengimpor data', 'error');
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const getAvatarContent = () => {
    if (!user) return "U";
    if (user.avatar && user.avatar.length > 2) {
      return <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />;
    }
    return user.avatar || "U";
  };

  return (
    <div className="w-full space-y-5 relative">
      {message.text && (
        <div className={`absolute top-0 right-0 z-50 p-4 rounded-xl shadow-lg border ${message.type === 'success' ? 'bg-success/15 border-success/30 text-success' : 'bg-danger/15 border-danger/30 text-danger'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* In-page responsive horizontal navigation tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs sm:text-sm custom-scrollbar">
        {[
          { id: "profil", label: "Profil & Akun", icon: User },
          ...(user?.role === "Super Admin" ? [{ id: "pengguna", label: "Manajemen Pengguna", icon: Users }] : []),
          { id: "keamanan", label: "Keamanan", icon: Lock },
          { id: "tampilan", label: "Tampilan & Tema", icon: Sun },
          { id: "peta", label: "Konfigurasi Peta", icon: Map },
          ...(user?.role === "Super Admin" ? [{ id: "database", label: "Database & Backup", icon: Database }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                window.location.hash = tab.id;
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? "bg-[#2E7D32] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeSection === "profil" && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <SectionHeader title="Profil & Akun" subtitle="Kelola informasi akun Anda" />
            {!isEditMode && (
              <Btn variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                Edit Profil
              </Btn>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6 pb-5 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
              {getAvatarContent()}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{user?.name || 'Memuat...'}</h4>
              <p className="text-sm text-gray-500 truncate">{user?.role} · {user?.email}</p>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <Btn variant="outline" size="sm" Icon={isLoading ? Loader2 : Upload} className="sm:ml-auto w-full sm:w-auto justify-center" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              Ganti Foto
            </Btn>
          </div>

          {!isEditMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Nama Lengkap</p>
                <p className="text-sm text-gray-900">{user?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Jabatan</p>
                <p className="text-sm text-gray-900">{user?.position || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                <p className="text-sm text-gray-900">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">No. Telepon</p>
                <p className="text-sm text-gray-900">{user?.phone || '-'}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nama Lengkap" value={profileForm.name} onChange={(e: any) => setProfileForm({...profileForm, name: e.target.value})} placeholder="" />
                <InputField label="Jabatan" value={profileForm.position} onChange={(e: any) => setProfileForm({...profileForm, position: e.target.value})} placeholder="" />
                <InputField label="Email" type="email" value={profileForm.email} onChange={(e: any) => setProfileForm({...profileForm, email: e.target.value})} placeholder="" />
                <InputField label="No. Telepon" type="tel" value={profileForm.phone} onChange={(e: any) => setProfileForm({...profileForm, phone: e.target.value})} placeholder="" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5 border-t border-gray-100">
                <Btn variant="primary" Icon={isLoading ? Loader2 : Save} onClick={handleProfileSave} disabled={isLoading} className="justify-center">Simpan Perubahan</Btn>
                <Btn variant="outline" onClick={handleCancelEdit} disabled={isLoading} className="justify-center">Batal</Btn>
              </div>
            </>
          )}
        </Card>
      )}

      {activeSection === "pengguna" && (
        <PenggunaPage />
      )}

      {activeSection === "tampilan" && (
        <Card>
          <SectionHeader title="Tampilan & Tema" subtitle="Sesuaikan tampilan antarmuka sistem" />
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Mode Tampilan</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Terang", icon: Sun, value: 'light' },
                  { label: "Gelap", icon: Moon, value: 'dark' },
                  { label: "Sistem", icon: Globe, value: 'system' },
                ].map((m) => (
                  <button key={m.label} onClick={() => {
                    const newSettings = {...settings, theme: m.value};
                    setSettings(newSettings);
                    handleSettingsSave(newSettings);
                  }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.theme === m.value ? "border-[#2E7D32] bg-[#E8F5E9]" : "border-gray-200 hover:border-gray-300"}`}
                    disabled={isLoading}>
                    <m.icon size={20} className={settings.theme === m.value ? "text-[#2E7D32]" : "text-gray-400"} />
                    <span className={`text-sm font-medium ${settings.theme === m.value ? "text-[#2E7D32]" : "text-gray-600"}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Ukuran Font</label>
              <div className="flex gap-3">
                {[
                  { label: "Kecil", value: "sm" },
                  { label: "Normal", value: "base" },
                  { label: "Besar", value: "lg" }
                ].map((f) => (
                  <button key={f.value} 
                    onClick={() => {
                      const newSettings = {...settings, font_size: f.value};
                      setSettings(newSettings);
                      handleSettingsSave(newSettings);
                    }}
                    className={`px-4 py-2 rounded-xl border-2 text-sm transition-all ${settings.font_size === f.value ? "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]" : "border-gray-200 text-gray-600"}`}
                    disabled={isLoading}>
                    {f.label}
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

      {activeSection === "notifikasi" && (
        <Card>
          <SectionHeader title="Pengaturan Notifikasi" subtitle="Pilih pemberitahuan yang ingin Anda terima" />
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h5 className="font-medium text-gray-900">Notifikasi Email</h5>
                <p className="text-sm text-gray-500">Terima pemberitahuan melalui email yang terdaftar</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notif_email} onChange={(e: any) => setSettings({...settings, notif_email: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h5 className="font-medium text-gray-900">Notifikasi Browser</h5>
                <p className="text-sm text-gray-500">Munculkan popup notifikasi pada browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notif_browser} onChange={(e: any) => setSettings({...settings, notif_browser: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h5 className="font-medium text-gray-900">Izin Kadaluarsa</h5>
                <p className="text-sm text-gray-500">Pemberitahuan jika ada izin usaha yang mendekati kadaluarsa</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notif_expired} onChange={(e: any) => setSettings({...settings, notif_expired: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <h5 className="font-medium text-gray-900">Pemeliharaan Sistem</h5>
                <p className="text-sm text-gray-500">Info terkait maintenance dan update sistem (Super Admin)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notif_system} onChange={(e: any) => setSettings({...settings, notif_system: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
              </label>
            </div>
          </div>
          <Btn variant="primary" Icon={isLoading ? Loader2 : Save} className="mt-5" onClick={() => handleSettingsSave()} disabled={isLoading}>Simpan Pengaturan</Btn>
        </Card>
      )}

      {activeSection === "peta" && (
        <Card>
          <SectionHeader title="Konfigurasi Peta" subtitle="Atur penyedia peta dan sistem koordinat default" />
          <div className="space-y-4">
            <SelectField label="Penyedia Peta" options={["OpenStreetMap", "Google Maps", "Mapbox", "ArcGIS Online"]}
              value={settings.map_provider} onChange={(e: any) => setSettings({...settings, map_provider: e.target.value})} />
            <SelectField label="Sistem Koordinat" options={["WGS 84 (EPSG:4326)", "Web Mercator (EPSG:3857)", "TM-3 Indonesia"]}
              value={settings.map_crs} onChange={(e: any) => setSettings({...settings, map_crs: e.target.value})} />
            <SelectField label="Tile Layer Default" options={["Standard", "Satellite", "Terrain", "Hybrid"]}
              value={settings.map_tile} onChange={(e: any) => setSettings({...settings, map_tile: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Pusat Peta (Latitude)" value={settings.map_lat} onChange={(e: any) => setSettings({...settings, map_lat: e.target.value})} placeholder="-6.2088" />
              <InputField label="Pusat Peta (Longitude)" value={settings.map_lng} onChange={(e: any) => setSettings({...settings, map_lng: e.target.value})} placeholder="106.8456" />
            </div>
            <InputField label="Zoom Default" value={settings.map_zoom} onChange={(e: any) => setSettings({...settings, map_zoom: e.target.value})} placeholder="13" />
          </div>
          <Btn variant="primary" Icon={isLoading ? Loader2 : Save} className="mt-5" onClick={() => handleSettingsSave()} disabled={isLoading}>Simpan Konfigurasi</Btn>
        </Card>
      )}

      {activeSection === "database" && (
        <div className="space-y-4">
          <Card>
            <SectionHeader title="Backup Database" subtitle="Buat cadangan data sistem (Hanya Super Admin)" />
            {user?.role === 'Super Admin' ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: "Backup Terakhir", value: dbStatus.last_backup, icon: CheckCircle, color: "text-green-600" },
                    { label: "Ukuran Database", value: dbStatus.database_size, icon: Database, color: "text-blue-600" },
                    { label: "Total Record", value: dbStatus.total_records, icon: FileText, color: "text-purple-600" },
                    { label: "Backup Tersedia", value: `${dbStatus.available_backups} file`, icon: Download, color: "text-teal-600" },
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
                  <Btn variant="primary" Icon={isLoading ? Loader2 : Download} onClick={handleBackup} disabled={isLoading}>Backup Sekarang</Btn>
                  <Btn variant="outline" Icon={Upload} onClick={() => showMessage('Silakan pilih file backup dari daftar untuk restore.', 'success')}>Info Restore</Btn>
                  <Btn variant="outline" Icon={FileSpreadsheet} onClick={handleExport}>Export Data</Btn>
                </div>
                
                {dbStatus.backups && dbStatus.backups.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <h5 className="font-medium text-sm mb-3">Daftar File Backup</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dbStatus.backups.map((backup: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium">{backup.name}</p>
                            <p className="text-xs text-gray-500">{backup.date} · {backup.size}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => window.open(`/api/admin/database/backup/${backup.name}`, '_blank')} className="text-blue-600 hover:text-blue-800 p-1">
                              Unduh
                            </button>
                            <button onClick={async () => {
                              if(confirm('Restore database akan menimpa data saat ini. Lanjutkan?')) {
                                setIsLoading(true);
                                try {
                                  await axios.post('/api/admin/database/restore', { filename: backup.name });
                                  showMessage('Database berhasil direstore', 'success');
                                } catch(e: any) {
                                  showMessage(e.response?.data?.message || 'Restore gagal', 'error');
                                } finally {
                                  setIsLoading(false);
                                }
                              }
                            }} className="text-orange-600 hover:text-orange-800 p-1">
                              Restore
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl">
                Fitur ini hanya tersedia untuk akun Super Admin.
              </div>
            )}
          </Card>
          <Card>
            <SectionHeader title="Import Data" subtitle="Impor data dari file CSV/Excel" />
            <input type="file" id="import-file" className="hidden" accept=".csv,.xlsx,.json" onChange={handleImport} />
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isLoading ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-gray-200 hover:border-[#2E7D32]'}`}
              onClick={() => !isLoading && handleImportClick()}
            >
              {isLoading ? (
                <Loader2 size={28} className="text-gray-400 mx-auto mb-2 animate-spin" />
              ) : (
                <FileUp size={28} className="text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-sm font-medium text-gray-600">{isLoading ? 'Sedang memproses...' : 'Seret file atau klik untuk upload'}</p>
              <p className="text-xs text-gray-400 mt-1">CSV, XLSX, JSON — maks. 50MB</p>
            </div>
          </Card>
        </div>
      )}

      {activeSection === "keamanan" && (
        <Card>
          <SectionHeader title="Keamanan Akun" subtitle="Kelola password dan keamanan akun" />
          <div className="space-y-4">
            <InputField label="Password Saat Ini" type="password" placeholder="••••••••" value={securityForm.old_password} onChange={(e: any) => setSecurityForm({...securityForm, old_password: e.target.value})} />
            <InputField label="Password Baru" type="password" placeholder="Min. 8 karakter" value={securityForm.new_password} onChange={(e: any) => setSecurityForm({...securityForm, new_password: e.target.value})} />
            <InputField label="Konfirmasi Password Baru" type="password" placeholder="Ulangi password baru" value={securityForm.new_password_confirmation} onChange={(e: any) => setSecurityForm({...securityForm, new_password_confirmation: e.target.value})} />
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <AlertTriangle size={13} />
                Password harus mengandung huruf besar, angka, dan karakter khusus minimal 8 karakter.
              </p>
            </div>
            <Btn variant="primary" Icon={isLoading ? Loader2 : Lock} onClick={handlePasswordSave} disabled={isLoading}>Perbarui Password</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
