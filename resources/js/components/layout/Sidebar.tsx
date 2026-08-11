import { useNavigate, useLocation } from "react-router";
import { Globe, ChevronRight, LogOut } from "lucide-react";
import axios from 'axios';
import { MENU_ITEMS } from "../../constants";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-[#1B5E20] flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#66BB6A] rounded-xl flex items-center justify-center flex-shrink-0">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">WebGIS NIB</div>
            <div className="text-green-300 text-xs leading-tight">Sistem Informasi Usaha</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <p className="text-green-400 text-xs font-semibold uppercase tracking-wider px-2 pt-1 pb-2">Menu Utama</p>
        {MENU_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button key={item.id} onClick={() => navigate(`/admin/${item.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active ? "bg-[#2E7D32] text-white shadow-sm" : "text-green-100 hover:bg-[#2E7D32]/60 hover:text-white"
                }`}>
              <item.icon size={17} className={active ? "text-white" : "text-green-300 group-hover:text-white"} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight size={13} className="text-green-300" />}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#66BB6A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Dr. Andi Kurniawan</p>
            <p className="text-green-300 text-xs truncate">Super Admin</p>
          </div>
          <button onClick={() => {
            axios.post('/api/admin/logout').finally(() => {
              window.location.href = '/admin/login';
            });
          }} className="text-green-400 hover:text-white transition-colors p-1">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
