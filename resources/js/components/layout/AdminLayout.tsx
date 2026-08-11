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
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA] font-[Inter,sans-serif]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-auto">
          {/* Page header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{pageInfo?.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{pageInfo?.subtitle}</p>
              </div>
              {activePage === "dashboard" && (
                <div className="flex items-center gap-2">
                  <Btn variant="outline" size="sm" Icon={RefreshCw}>Refresh</Btn>
                  <Btn variant="primary" size="sm" Icon={Download}>Export Laporan</Btn>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 pb-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
