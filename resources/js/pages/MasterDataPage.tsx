import { useState, useEffect } from "react";
import axios from 'axios';
import { Search, Plus, Eye, Edit, Trash2, Package, Download, Save } from "lucide-react";
import { Card, Btn, StatusBadge, InputField, SelectField } from "../components/ui";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("kecamatan");
  const [showAddModal, setShowAddModal] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/districts').then(res => setDistricts(res.data)).catch(console.error);
    axios.get('/api/categories').then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const tabs = [
    { id: "kecamatan", label: "Kecamatan", count: 6 },
    { id: "kelurahan", label: "Kelurahan", count: 56 },
    { id: "kategori", label: "Kat. Usaha", count: 12 },
    { id: "jenis-izin", label: "Jenis Izin", count: 8 },
    { id: "status", label: "Status Usaha", count: 5 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${activeTab === t.id ? "bg-[#2E7D32] text-white border-[#2E7D32] shadow-sm" : "bg-white border-gray-200 hover:border-[#2E7D32]/40"}`}>
            <div className={`text-xl font-bold mb-0.5 ${activeTab === t.id ? "text-white" : "text-gray-900"}`}>{t.count}</div>
            <div className={`text-xs font-medium ${activeTab === t.id ? "text-green-100" : "text-gray-600"}`}>{t.label}</div>
          </button>
        ))}
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Manajemen data referensi sistem</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Cari data..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] bg-white w-48" />
            </div>
            <Btn variant="primary" size="sm" Icon={Plus} onClick={() => setShowAddModal(true)}>Tambah Data</Btn>
          </div>
        </div>

        {(activeTab === "kecamatan") && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Kode", "Nama Kecamatan", "Jml. Kelurahan", "Luas Wilayah", "Populasi", "Status", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {districts.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{d.code}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{d.villages}</td>
                  <td className="px-4 py-3.5 text-gray-600">{d.area}</td>
                  <td className="px-4 py-3.5 text-gray-600">{d.population}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                      <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14} /></button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(activeTab === "kategori") && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Kode", "Nama Kategori", "Deskripsi", "Total Usaha", "Status", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{c.code}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{c.desc}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-[#2E7D32]">{c.total.toLocaleString("id")}</span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14} /></button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(activeTab === "kelurahan" || activeTab === "jenis-izin" || activeTab === "status") && (
          <div className="p-12 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Pilih tab untuk mengelola data referensi {tabs.find(t => t.id === activeTab)?.label}</p>
            <Btn variant="primary" size="sm" Icon={Plus} className="mt-4" onClick={() => setShowAddModal(true)}>Tambah Data Pertama</Btn>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">Total: {tabs.find(t => t.id === activeTab)?.count} data</p>
          <Btn variant="outline" size="xs" Icon={Download}>Export CSV</Btn>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[480px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tambah {tabs.find(t => t.id === activeTab)?.label}</h3>
            <div className="space-y-3">
              <InputField label="Kode" placeholder="KEC00X" required />
              <InputField label="Nama" placeholder="Masukkan nama..." required />
              <SelectField label="Status" options={["Aktif", "Nonaktif"]} />
            </div>
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowAddModal(false)}>Batal</Btn>
              <Btn variant="primary" className="flex-1 justify-center" Icon={Save}>Simpan</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
