import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Home, ChevronRight, Search, Sun, Moon, Bell, ChevronDown } from "lucide-react";
import { PAGE_TITLES } from "../../constants";

export default function TopBar({ darkMode, setDarkMode }: any) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pageInfo = PAGE_TITLES[activePage as keyof typeof PAGE_TITLES];

  const notifications = [
    { title: "Izin baru menunggu verifikasi", desc: "Toko Serba Ada Jaya · 10 Jul 2025", read: false },
    { title: "Izin CV. Bangunan Kokoh disetujui", desc: "Terverifikasi · 09 Jul 2025", read: false },
    { title: "5 izin akan kadaluarsa minggu ini", desc: "Lihat daftar lengkap", read: false },
    { title: "Backup database berhasil", desc: "Otomatis · 21 Jul 2025 03:00", read: true },
    { title: "Pembaruan sistem tersedia", desc: "Versi 2.4.1 · Lihat detail", read: true },
  ];

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-6 gap-4 relative z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-4">
        <Home size={13} className="text-gray-400" />
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-gray-400">Sistem NIB</span>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="font-medium text-gray-700">{pageInfo?.title}</span>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Cari usaha, NIB, atau lokasi..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#2E7D32] transition-all" />
      </div>

      <div className="flex-1" />

      {/* Date time */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 font-mono tabular-nums">
        {time.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
        {" "}
        <span className="font-semibold text-gray-700">
          {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Dark mode */}
      <button onClick={() => setDarkMode(!darkMode)}
        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all hover:text-gray-700">
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all hover:text-gray-700">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Notifikasi</span>
              <span className="text-xs text-[#2E7D32] font-medium cursor-pointer hover:underline">Tandai semua dibaca</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={i} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? "bg-green-50/30" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />}
                    {n.read && <div className="w-1.5 h-1.5 flex-shrink-0" />}
                    <div>
                      <p className={`text-xs ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 text-center">
              <button className="text-xs text-[#2E7D32] font-medium hover:underline">Lihat semua notifikasi</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#66BB6A] flex items-center justify-center text-white text-xs font-bold">
          AK
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-gray-900">Dr. Andi K.</p>
          <p className="text-xs text-gray-400">Super Admin</p>
        </div>
        <ChevronDown size={13} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </header>
  );
}
