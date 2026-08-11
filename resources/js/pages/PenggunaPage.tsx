import { useState, useEffect } from "react";
import axios from 'axios';
import { Award, Shield, UserCheck, Navigation, Search, Plus, Eye, Edit, Key, UserX, User, Save } from "lucide-react";
import { Card, Btn, StatusBadge, InputField, SelectField, SectionHeader } from "../components/ui";

export default function PenggunaPage() {
  const [activeRole, setActiveRole] = useState("semua");
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsers(res.data)).catch(console.error);
  }, []);

  const roles = [
    { id: "super-admin", label: "Super Admin", color: "bg-purple-100 text-purple-700", icon: Award },
    { id: "administrator", label: "Administrator", color: "bg-indigo-100 text-indigo-700", icon: Shield },
    { id: "verifier", label: "Verifier", color: "bg-teal-100 text-teal-700", icon: UserCheck },
    { id: "surveyor", label: "Surveyor", color: "bg-sky-100 text-sky-700", icon: Navigation },
  ];

  const roleSummary = roles.map(r => ({
    ...r,
    count: users.filter(u => u.role?.toLowerCase() === r.id.toLowerCase()).length
  }));

  const filtered = activeRole === "semua" ? users
    : users.filter(u => u.role.toLowerCase() === activeRole.toLowerCase());

  return (
    <div className="space-y-5">
      {/* Role summary */}
      <div className="grid grid-cols-5 gap-4">
        <button onClick={() => setActiveRole("semua")}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${activeRole === "semua" ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 hover:border-gray-300"}`}>
          <div className={`text-2xl font-bold mb-1 ${activeRole === "semua" ? "text-white" : "text-gray-900"}`}>{users.length}</div>
          <div className={`text-xs font-medium ${activeRole === "semua" ? "text-gray-300" : "text-gray-500"}`}>Semua Pengguna</div>
        </button>
        {roleSummary.map(r => (
          <button key={r.id} onClick={() => setActiveRole(r.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${activeRole === r.id ? "border-[#2E7D32] bg-[#E8F5E9]" : "bg-white border-gray-100 hover:border-[#2E7D32]/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${r.color}`}>
                <r.icon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{r.count}</div>
            <div className="text-xs text-gray-500">{r.label}</div>
          </button>
        ))}
      </div>

      {/* Users table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Daftar Pengguna</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{filtered.length} pengguna</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Cari pengguna..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] bg-white w-48" />
            </div>
            <Btn variant="primary" size="sm" Icon={Plus} onClick={() => setShowAddUser(true)}>Tambah Pengguna</Btn>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Pengguna", "Email", "Peran", "Status", "Login Terakhir", "Aktivitas", "Aksi"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xs font-semibold">
                      {u.avatar}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{u.email}</td>
                <td className="px-4 py-3.5"><StatusBadge status={u.role} /></td>
                <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{u.lastLogin}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E7D32] rounded-full" style={{ width: `${(u.actions / 350) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{u.actions}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                    <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Key size={14} /></button>
                    <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><UserX size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
          Menampilkan {filtered.length} dari {users.length} pengguna aktif dalam sistem
        </div>
      </Card>

      {/* Activity log */}
      <Card padding="p-5">
        <SectionHeader title="Log Aktivitas Terkini" subtitle="Rekam jejak tindakan pengguna dalam sistem" />
        <div className="space-y-2">
          {[
            { user: "Dr. Andi Kurniawan", action: "Mengubah konfigurasi sistem", time: "14:32", ip: "192.168.1.10" },
            { user: "Siti Rahayu, SE", action: "Menverifikasi izin CV. Sukses Jaya", time: "14:15", ip: "192.168.1.12" },
            { user: "Budi Hartono", action: "Menolak pengajuan Bengkel Las Putra", time: "13:58", ip: "192.168.1.15" },
            { user: "Fitriani Dewi", action: "Menambahkan koordinat Toko Sumber Rejeki", time: "13:45", ip: "192.168.1.18" },
            { user: "Rahmat Hidayat", action: "Login ke sistem", time: "13:30", ip: "192.168.1.20" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800">
                  <span className="font-medium">{log.user}</span>
                  <span className="text-gray-500"> — {log.action}</span>
                </p>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">{log.time}</div>
              <div className="text-xs text-gray-300 font-mono flex-shrink-0">{log.ip}</div>
            </div>
          ))}
        </div>
      </Card>

      {showAddUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAddUser(false)}>
          <div className="bg-white rounded-2xl p-6 w-[520px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tambah Pengguna Baru</h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Nama Lengkap" placeholder="Nama dengan gelar" required className="col-span-2" />
              <InputField label="Email" type="email" placeholder="nama@pemkab.go.id" required />
              <SelectField label="Peran" required options={["Super Admin", "Administrator", "Verifier", "Surveyor"]} />
              <InputField label="Password Awal" type="password" placeholder="Min. 8 karakter" required />
              <SelectField label="Status" options={["Aktif", "Nonaktif"]} />
            </div>
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowAddUser(false)}>Batal</Btn>
              <Btn variant="primary" className="flex-1 justify-center" Icon={Save}>Buat Pengguna</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
