import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Home, ChevronRight, Search, Sun, Moon, Bell, ChevronDown, Menu, RefreshCw, Store } from "lucide-react";
import { PAGE_TITLES } from "../../constants";
import { useBusinessSearch } from "../../hooks/useBusinessSearch";
import { useAuth } from "../../contexts/AuthContext";

export default function TopBar({ darkMode, setDarkMode, onMenuClick }: any) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.split('/').pop() || 'dashboard';
  const { user } = useAuth();

  // Global Search State via Hook
  const { 
    searchQuery, setSearchQuery, 
    searchResults, 
    isSearching, 
    searchError 
  } = useBusinessSearch();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchResults]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: any) => {
    setShowDropdown(false);
    setSearchQuery(""); // clear query on select
    
    if (result.latitude && result.longitude) {
      navigate('/admin/peta-usaha', { state: { flyTo: { lat: result.latitude, lng: result.longitude, id: result.id } } });
    } else {
      navigate('/admin/data-usaha', { state: { highlightId: result.id, noCoord: true } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < searchResults.length) {
        handleSelectResult(searchResults[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const pageInfo = PAGE_TITLES[activePage as keyof typeof PAGE_TITLES];

  const notifications = [
    { title: "Izin baru menunggu verifikasi", desc: "Toko Serba Ada Jaya · 10 Jul 2025", read: false },
    { title: "Izin CV. Bangunan Kokoh disetujui", desc: "Terverifikasi · 09 Jul 2025", read: false },
    { title: "5 izin akan kadaluarsa minggu ini", desc: "Lihat daftar lengkap", read: false },
    { title: "Backup database berhasil", desc: "Otomatis · 21 Jul 2025 03:00", read: true },
    { title: "Pembaruan sistem tersedia", desc: "Versi 2.4.1 · Lihat detail", read: true },
  ];

  return (
    <header className="h-16 flex-shrink-0 bg-card border-b border-border flex items-center px-3 sm:px-4 lg:px-6 gap-2.5 sm:gap-3 lg:gap-4 relative z-[1100]">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden p-2 -ml-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
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
      <div className="relative flex-1 min-w-0" ref={searchRef}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input 
          placeholder="Cari usaha, NIB..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => { if (searchQuery) setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 sm:pr-4 py-2 text-xs sm:text-sm border border-input rounded-lg bg-input-background focus:bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
        />
        
        {/* Dropdown Results */}
        {showDropdown && searchQuery.length >= 2 && (
          <div className="fixed inset-x-3 top-[72px] md:absolute md:inset-auto md:top-full md:left-0 md:mt-1 md:w-full md:max-w-[480px] bg-card border border-border rounded-xl shadow-xl md:shadow-md overflow-hidden z-[1100] flex flex-col max-h-[min(360px,calc(100dvh-5.5rem))]">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Mencari data...
              </div>
            ) : searchError ? (
              <div className="p-4 text-center text-sm text-danger">{searchError}</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm font-semibold text-foreground">Data tidak ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">Tidak ada usaha yang cocok dengan "{searchQuery}"</p>
              </div>
            ) : (
              <div className="py-1 overflow-y-auto flex-1">
                {searchResults.slice(0, 8).map((result, i) => (
                  <div 
                    key={result.id} 
                    onClick={() => handleSelectResult(result)}
                    className={`px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors ${activeIndex === i ? 'bg-primary/10' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                        <Store size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {result.nama_perusahaan}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-mono text-primary/70">{result.nib}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="truncate">{result.kecamatan_usaha || result.judul_kbli}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {searchResults.length > 8 && (
                  <div className="px-4 py-2 text-center border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                    Menampilkan 8 dari {searchResults.length} hasil
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
          <div className="fixed inset-x-3 top-[72px] md:absolute md:inset-auto md:right-0 md:top-12 md:w-[320px] bg-popover border border-border rounded-xl shadow-xl md:shadow-md overflow-hidden z-50 md:origin-top-right flex flex-col max-h-[min(420px,calc(100dvh-5.5rem))]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-popover-foreground">Notifikasi</span>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Tandai semua dibaca</span>
            </div>
            <div className="overflow-y-auto flex-1">
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
        {user ? (
          <>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold overflow-hidden">
              {user.avatar && user.avatar.length > 2 ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
              )}
            </div>
            <div className="hidden sm:block leading-tight min-w-0 max-w-[120px]">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block flex-shrink-0" />
          </>
        ) : (
          <div className="flex items-center gap-2.5 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="hidden sm:block space-y-1 w-20">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-2 bg-muted rounded w-2/3" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
