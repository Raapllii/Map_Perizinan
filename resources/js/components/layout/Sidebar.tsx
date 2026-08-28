import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Globe, ChevronRight, LogOut, X } from "lucide-react";
import axios from 'axios';
import { MENU_ITEMS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

const PENGATURAN_SUBMENU = [
  { id: "profil", label: "Profil & Akun" },
  { id: "pengguna", label: "Manajemen Pengguna" },
  { id: "keamanan", label: "Keamanan" },
  { id: "tampilan", label: "Tampilan & Tema" },
  { id: "peta", label: "Konfigurasi Peta" },
  { id: "database", label: "Database & Backup" },
];

export default function Sidebar({ isOpen = false, setIsOpen = () => { } }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';
  const [isSettingsOpen, setIsSettingsOpen] = useState(activePage === 'pengaturan');
  const { user } = useAuth();

  useEffect(() => {
    setIsSettingsOpen(activePage === 'pengaturan');
  }, [activePage]);

  const handleNav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-[1000] w-[min(20rem,88vw)] lg:w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200 ease-in-out flex-shrink-0 h-full bg-sidebar flex flex-col overflow-hidden border-r border-sidebar-border lg:shadow-none`}>
      {/* Mobile Close Button */}
      <button
        onClick={() => setIsOpen(false)}
        className="lg:hidden absolute top-4 right-4 p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md z-10"
        aria-label="Close menu"
      >
        <X size={20} />
      </button>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-md flex items-center justify-center flex-shrink-0">
            <Globe size={20} className="text-sidebar-primary-foreground" />
          </div>
          <div className="pr-6 lg:pr-0">
            <div className="text-sidebar-foreground font-bold text-[15px] leading-tight tracking-wide">WebGIS NIB</div>
            <div className="text-sidebar-foreground/70 text-xs leading-tight font-medium mt-0.5">Sistem Informasi Usaha</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-sidebar-foreground/50 text-[11px] font-bold uppercase tracking-wider px-3 pt-2 pb-2">Menu Utama</p>
        {MENU_ITEMS.map((item) => {
          const active = activePage === item.id;
          const isPengaturan = item.id === "pengaturan";

          return (
            <div key={item.id} className="w-full">
              <button
                onClick={() => {
                  if (isPengaturan) {
                    if (!active) {
                      setIsSettingsOpen(true);
                      handleNav(`/admin/pengaturan#profil`);
                    } else {
                      setIsSettingsOpen(!isSettingsOpen);
                    }
                  } else {
                    handleNav(`/admin/${item.id}`);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group min-h-[44px] ${active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90"} />
                  <span className="flex-1 text-left">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="bg-warning text-warning-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {isPengaturan ? (
                    <ChevronRight size={14} className={`text-sidebar-foreground/50 transition-transform duration-200 ${isSettingsOpen ? "rotate-90" : ""}`} />
                  ) : active && (
                    <ChevronRight size={14} className="text-sidebar-foreground/50" />
                  )}
                </div>
              </button>

              {isPengaturan && (
                <div
                  className="overflow-hidden transition-all duration-200 ease-in-out"
                  style={{
                    height: isSettingsOpen ? `${PENGATURAN_SUBMENU.length * 36 + 8}px` : "0px",
                    opacity: isSettingsOpen ? 1 : 0
                  }}
                >
                  <div className="pt-2 flex flex-col pl-9 pr-2 space-y-0.5">
                    {PENGATURAN_SUBMENU.map((sub) => {
                      const hash = location.hash.replace('#', '') || 'profil';
                      const subActive = active && hash === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleNav(`/admin/pengaturan#${sub.id}`)}
                          className={`w-full text-left py-2 px-3 rounded-md text-xs font-medium transition-colors h-[34px] ${subActive
                            ? "text-sidebar-accent-foreground bg-sidebar-accent/50"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                            }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-bold flex-shrink-0 overflow-hidden">
              {user.avatar && user.avatar.length > 2 ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-sm font-semibold truncate">{user.name}</p>
              <p className="text-sidebar-foreground/60 text-xs truncate">{user.role}</p>
            </div>
            <button onClick={() => {
              axios.post('/api/admin/logout').finally(() => {
                window.location.href = '/admin/login';
              });
            }} className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent p-2 rounded-md transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3 bg-sidebar-accent rounded w-3/4" />
              <div className="h-2 bg-sidebar-accent rounded w-1/2" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
