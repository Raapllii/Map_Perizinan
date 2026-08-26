import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Home, ChevronRight, Search, Sun, Moon, Bell, ChevronDown, Menu } from "lucide-react";
import { PAGE_TITLES } from "../../constants";

export default function TopBar({ darkMode, setDarkMode, onMenuClick }: any) {
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
    <header className="h-16 flex-shrink-0 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-3 lg:gap-4 relative z-20">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
        <Home size={14} className="text-muted-foreground/70" />
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span>Sistem NIB</span>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="font-medium text-foreground">{pageInfo?.title}</span>
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input placeholder="Cari usaha, NIB..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-md bg-input-background focus:bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
      </div>

      <div className="flex-1 hidden md:block" />

      {/* Date time */}
      <div className="hidden lg:block text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md border border-border font-mono tabular-nums">
        {time.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
        {" "}
        <span className="font-semibold text-foreground">
          {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Dark mode */}
      <button onClick={() => setDarkMode(!darkMode)}
        className="hidden sm:flex p-2 rounded-md border border-input text-muted-foreground hover:bg-muted transition-all hover:text-foreground">
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-md border border-input text-muted-foreground hover:bg-muted transition-all hover:text-foreground">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-card" />
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-[320px] bg-popover border border-border rounded-md shadow-lg overflow-hidden z-50 origin-top-right">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-popover-foreground">Notifikasi</span>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Tandai semua dibaca</span>
            </div>
            <div className="max-h-[calc(100dvh-120px)] sm:max-h-72 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={i} className={`px-4 py-3 border-b border-border/50 hover:bg-muted cursor-pointer transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                    {n.read && <div className="w-1.5 h-1.5 flex-shrink-0" />}
                    <div>
                      <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 text-center border-t border-border bg-muted/30">
              <button className="text-xs text-primary font-medium hover:underline">Lihat semua notifikasi</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-border cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          AK
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-xs font-semibold text-foreground">Dr. Andi K.</p>
          <p className="text-[10px] text-muted-foreground">Super Admin</p>
        </div>
        <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
      </div>
    </header>
  );
}
