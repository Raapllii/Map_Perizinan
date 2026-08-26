import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { Award, Shield, UserCheck, Navigation, Search, Plus, Eye, Edit, Key, UserX, User, Save, RefreshCw, Trash2, PowerOff, Power } from "lucide-react";
import { Card, Btn, StatusBadge, InputField, SelectField, SectionHeader } from "../components/ui";

export default function PenggunaPage() {
  const [activeRole, setActiveRole] = useState("semua");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: "", onConfirm: () => {} });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Super Admin",
    password: "",
    status: "Aktif"
  });

  // Reset Password Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetData, setResetData] = useState({ old_password: "", new_password: "", new_password_confirmation: "" });
  const [resetErrors, setResetErrors] = useState<any>({});

  const fetchUsers = useCallback(() => {
    setLoading(true);
    axios.get('/api/admin/users', { params: { role: activeRole, search } })
      .then(res => setUsers(res.data))
      .catch(err => {
        console.error(err);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-danger text-danger-foreground px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm transition-all animate-in slide-in-from-bottom-5';
        toast.innerText = err.response?.data?.message || "Gagal memuat pengguna";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      })
      .finally(() => setLoading(false));
  }, [activeRole, search]);

  const fetchLogs = () => {
    axios.get('/api/admin/activity-logs')
      .then(res => setLogs(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchUsers();
    }
  };

  const handleSaveUser = () => {
    if (!formData.name || !formData.email || (!editingId && !formData.password)) {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-warning text-warning-foreground px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm transition-all animate-in slide-in-from-bottom-5';
      toast.innerText = "Harap lengkapi semua kolom wajib!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }
    setLoading(true);
    const request = editingId
      ? axios.put(`/api/admin/users/${editingId}`, formData)
      : axios.post('/api/admin/users', formData);

    request.then(res => {
      setShowFormModal(false);
      setEditingId(null);
      fetchUsers();
      fetchLogs();
    }).catch(err => {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-danger text-danger-foreground px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm transition-all animate-in slide-in-from-bottom-5';
      toast.innerText = err.response?.data?.message || "Gagal menyimpan pengguna";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }).finally(() => {
      setLoading(false);
    });
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "", // password is left blank when editing unless resetting
      status: user.status
    });
    setShowFormModal(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", role: "Super Admin", password: "", status: "Aktif" });
    setShowFormModal(true);
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Aktif" ? "Nonaktif" : "Aktif";
    
    setConfirmDialog({
      isOpen: true,
      message: `Yakin ingin mengubah status menjadi ${newStatus}?`,
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setProcessing(id);
        axios.put(`/api/admin/users/${id}/status`, { status: newStatus })
          .then(res => {
            fetchUsers();
            fetchLogs();
          })
          .catch(err => {
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-danger text-danger-foreground px-4 py-2 rounded-md shadow-lg z-[100] font-medium text-sm transition-all animate-in slide-in-from-bottom-5';
            toast.innerText = err.response?.data?.message || "Gagal mengubah status";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
          })
          .finally(() => setProcessing(null));
      }
    });
  };

  const openResetPassword = (id: number) => {
    setResetUserId(id);
    setResetData({ old_password: "", new_password: "", new_password_confirmation: "" });
    setResetErrors({});
    setShowResetModal(true);
  };

  const submitResetPassword = () => {
    setResetErrors({});
    if (!resetData.old_password) return setResetErrors({ old_password: ["Password lama wajib diisi."] });
    if (!resetData.new_password) return setResetErrors({ new_password: ["Password baru wajib diisi."] });
    if (resetData.new_password.length < 8) return setResetErrors({ new_password: ["Password baru minimal 8 karakter."] });
    if (!resetData.new_password_confirmation) return setResetErrors({ new_password_confirmation: ["Konfirmasi password wajib diisi."] });
    if (resetData.new_password !== resetData.new_password_confirmation) return setResetErrors({ new_password_confirmation: ["Konfirmasi password baru tidak cocok."] });
    if (resetData.new_password === resetData.old_password) return setResetErrors({ new_password: ["Password baru tidak boleh sama dengan password lama."] });

    setLoading(true);
    axios.post(`/api/admin/users/${resetUserId}/reset-password`, resetData)
      .then(res => {
        setShowResetModal(false);
        setResetUserId(null);

        // Custom success notification replacing alert
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[100] font-medium text-sm transition-all animate-in slide-in-from-bottom-5';
        toast.innerText = 'Password berhasil diubah.';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        fetchLogs();
      })
      .catch(err => {
        if (err.response?.status === 422) {
          setResetErrors(err.response.data.errors || {});
        } else {
          setResetErrors({ general: [err.response?.data?.message || "Gagal mereset password"] });
        }
      })
      .finally(() => setLoading(false));
  };

  const roles = [
    { id: "super admin", label: "Super Admin", color: "bg-purple-100 text-purple-700", icon: Award },
    { id: "administrator", label: "Administrator", color: "bg-indigo-100 text-indigo-700", icon: Shield },
    { id: "verifier", label: "Verifier", color: "bg-teal-100 text-teal-700", icon: UserCheck },
    { id: "surveyor", label: "Surveyor", color: "bg-sky-100 text-sky-700", icon: Navigation },
  ];

  const roleSummary = roles.map(r => ({
    ...r,
    count: users.filter(u => u.role?.toLowerCase() === r.id.toLowerCase()).length
  }));

  return (
    <div className="space-y-5">
      {/* Role summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button onClick={() => setActiveRole("semua")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${activeRole === "semua" ? "bg-foreground border-foreground text-background" : "bg-card border-border hover:border-primary/50"}`}>
          <div className={`text-2xl font-bold mb-1 ${activeRole === "semua" ? "text-background" : "text-foreground"}`}>{users.length}</div>
          <div className={`text-xs font-medium ${activeRole === "semua" ? "text-background/70" : "text-muted-foreground"}`}>Semua Pengguna</div>
        </button>
        {roles.map(r => (
          <button key={r.id} onClick={() => setActiveRole(r.label)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${activeRole === r.label ? "border-primary bg-primary/10" : "bg-card border-border hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${r.color}`}>
                <r.icon size={14} />
              </div>
            </div>
            {/* The count will only be accurate if 'semua' is selected since backend paginates. 
                For real apps, we'd fetch aggregate stats from backend. But for this audit, we use filtered. */}
            <div className="text-2xl font-bold text-foreground mb-0.5">-</div>
            <div className="text-xs text-muted-foreground">{r.label}</div>
          </button>
        ))}
      </div>

      {/* Users table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Daftar Pengguna</h3>
            {loading && <RefreshCw size={14} className="text-gray-400 animate-spin" />}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Cari pengguna (Enter)"
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] bg-white w-full sm:w-48"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <Btn variant="primary" size="sm" Icon={Plus} onClick={openAddModal}>Tambah Pengguna</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Pengguna", "Email", "Peran", "Status", "Aktivitas", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada pengguna ditemukan.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-muted/50 group transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
                        {u.avatar || u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={u.role || "User"} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={u.status || "Aktif"} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((u.actions / 100) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{u.actions || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(u)} disabled={processing === u.id} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => openResetPassword(u.id)} disabled={processing === u.id} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Reset Password">
                        <Key size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        disabled={processing === u.id}
                        className={`p-1.5 ${u.status === 'Aktif' ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'} rounded-lg`}
                        title={u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.status === 'Aktif' ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Activity log */}
      <Card padding="p-5">
        <SectionHeader title="Log Aktivitas Terkini" subtitle="Rekam jejak tindakan pengguna dalam sistem" />
        <div className="space-y-2 mt-4">
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">Belum ada aktivitas.</div>
          ) : logs.map((log, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="hidden sm:flex w-7 h-7 rounded-full bg-gray-100 items-center justify-center flex-shrink-0">
                <User size={13} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800">
                  <span className="font-medium">{log.user}</span>
                  <span className="text-gray-500"> — {log.action}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-400 flex-shrink-0">{log.time}</div>
                <div className="text-xs text-gray-300 font-mono flex-shrink-0">{log.ip}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => !loading && setShowFormModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-[520px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{editingId ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <InputField
                  label="Nama Lengkap" placeholder="Nama dengan gelar" required
                  value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <InputField
                  label="Email" type="email" placeholder="nama@pemkab.go.id" required
                  value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <SelectField
                label="Peran" required options={["Super Admin", "Administrator", "Verifier", "Surveyor"]}
                value={formData.role} onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
              />
              <SelectField
                label="Status" options={["Aktif", "Nonaktif"]}
                value={formData.status} onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              />
              {!editingId && (
                <div className="sm:col-span-2">
                  <InputField
                    label="Password Awal" type="password" placeholder="Min. 8 karakter" required
                    value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowFormModal(false)} disabled={loading}>Batal</Btn>
              <Btn variant="primary" className="flex-1 justify-center" Icon={Save} onClick={handleSaveUser} disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Pengguna"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Password */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4"
          onClick={() => !loading && setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-1">Ubah Password</h3>
            <p className="text-sm text-gray-500 mb-5">Konfirmasi password lama sebelum membuat password baru.</p>

            {resetErrors.general && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {resetErrors.general[0]}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <InputField
                  label="Password Lama"
                  type="password"
                  placeholder="Masukkan password lama"
                  required
                  value={resetData.old_password}
                  onChange={(e: any) => setResetData({ ...resetData, old_password: e.target.value })}
                  disabled={loading}
                  error={resetErrors.old_password?.[0]}
                />
              </div>

              <div>
                <InputField
                  label="Password Baru"
                  type="password"
                  placeholder="Masukkan password baru"
                  required
                  value={resetData.new_password}
                  onChange={(e: any) => setResetData({ ...resetData, new_password: e.target.value })}
                  disabled={loading}
                  error={resetErrors.new_password?.[0]}
                />
                {!resetErrors.new_password && <p className="text-xs text-gray-400 mt-1.5">Min. 8 karakter</p>}
              </div>

              <div>
                <InputField
                  label="Konfirmasi Password Baru"
                  type="password"
                  placeholder="Ulangi password baru"
                  required
                  value={resetData.new_password_confirmation}
                  onChange={(e: any) => setResetData({ ...resetData, new_password_confirmation: e.target.value })}
                  disabled={loading}
                  error={resetErrors.new_password_confirmation?.[0]}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowResetModal(false)} disabled={loading}>
                Batal
              </Btn>
              <Btn variant="primary" className="flex-1 justify-center" Icon={Save} onClick={submitResetPassword} disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Password"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
          <div className="bg-card rounded-md p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground mb-2">Konfirmasi Aksi</h3>
            <p className="text-sm text-muted-foreground mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>Batal</Btn>
              <Btn variant="primary" className="flex-1 justify-center" onClick={confirmDialog.onConfirm}>Ya, Lanjutkan</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
