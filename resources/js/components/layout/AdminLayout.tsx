import { useState } from "react";
import { useLocation, Navigate } from "react-router";
import { RefreshCw, Download } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Btn } from "../ui";
import { PAGE_TITLES } from "../../constants";

import DashboardPage from "../../pages/DashboardPage";
import PetaUsahaPage from "../../pages/PetaUsahaPage";
import TambahUsahaPage from "../../pages/TambahUsahaPage";
import DataUsahaPage from "../../pages/DataUsahaPage";
import VerifikasiIzinPage from "../../pages/VerifikasiIzinPage";
import MonitoringPage from "../../pages/MonitoringPage";
import LaporanPage from "../../pages/LaporanPage";
import MasterDataPage from "../../pages/MasterDataPage";
import PenggunaPage from "../../pages/PenggunaPage";
import PengaturanPage from "../../pages/PengaturanPage";

export default function AdminLayout({ darkMode, setDarkMode, setUser }: any) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const activePage = location.pathname.split('/').pop() || 'dashboard';
  const pageInfo = PAGE_TITLES[activePage as keyof typeof PAGE_TITLES] || PAGE_TITLES['dashboard'];

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "peta-usaha": return <PetaUsahaPage />;
      case "tambah-usaha": return <TambahUsahaPage />;
      case "data-usaha": return <DataUsahaPage />;
      case "verifikasi-izin": return <VerifikasiIzinPage />;
      case "monitoring": return <MonitoringPage />;
      case "laporan": return <LaporanPage />;
      case "master-data": return <MasterDataPage />;
      case "pengguna": return <PenggunaPage />;
      case "pengaturan": return <PengaturanPage darkMode={darkMode} setDarkMode={setDarkMode} />;
      default: return <Navigate to="/admin/dashboard" replace />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted font-sans text-foreground">
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[900] lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-0">
        <TopBar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-auto">
          {/* Page header */}
          <div className="px-4 md:px-6 pt-5 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{pageInfo?.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{pageInfo?.subtitle}</p>
              </div>
              {activePage === "dashboard" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Btn 
                    variant="outline" 
                    size="sm" 
                    Icon={RefreshCw} 
                    className="flex-1 sm:flex-none justify-center"
                    onClick={() => window.dispatchEvent(new Event('refreshDashboard'))}
                  >
                    Refresh
                  </Btn>
                  <Btn 
                    variant="primary" 
                    size="sm" 
                    Icon={Download} 
                    className="flex-1 sm:flex-none justify-center"
                    onClick={() => window.open('/api/admin/dashboard/export/excel', '_blank')}
                  >
                    Export
                  </Btn>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 md:px-6 pb-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
