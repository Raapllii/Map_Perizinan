import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users,
  Eye,
  Calendar,
  Building2,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Clock,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  FileSpreadsheet,
  Download
} from "lucide-react";
import { Card, Btn, InputField, SelectField, StatCard } from "../components/ui";
import { PublicMapAccessLog } from "../types";

export default function RekapitulasiAksesPage() {
  const [logs, setLogs] = useState<PublicMapAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    total_access: 0,
    total_visitors: 0,
    today_access: 0,
    total_agencies: 0,
    agencies_list: [] as string[],
  });

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedInstansi, setSelectedInstansi] = useState("Semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params: any = {
      page: currentPage,
      per_page: perPage,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedInstansi && selectedInstansi !== "Semua") params.instansi = selectedInstansi;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axios
      .get("/api/admin/public-map-access-logs", { params })
      .then((res) => {
        const responseData = res.data?.data;
        setLogs(responseData?.data || []);
        setCurrentPage(responseData?.current_page || 1);
        setLastPage(responseData?.last_page || 1);
        setTotalRecords(responseData?.total || 0);

        if (res.data?.meta) {
          setMeta(res.data.meta);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat rekapitulasi akses:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, perPage, debouncedSearch, selectedInstansi, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedInstansi("Semua");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date).replace(/\./g, ":");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto min-w-0">
      {/* 1. KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          label="Total Akses Peta"
          value={meta.total_access.toLocaleString("id-ID")}
          icon={Eye}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <StatCard
          label="Total Pengguna / Visitor"
          value={meta.total_visitors.toLocaleString("id-ID")}
          icon={Users}
          colorClass="text-success"
          bgClass="bg-success/10"
        />
        <StatCard
          label="Akses Hari Ini"
          value={meta.today_access.toLocaleString("id-ID")}
          icon={Clock}
          colorClass="text-info"
          bgClass="bg-info/10"
        />
        <StatCard
          label="Total Instansi Terdaftar"
          value={meta.total_agencies.toLocaleString("id-ID")}
          icon={Building2}
          colorClass="text-secondary"
          bgClass="bg-secondary/10"
        />
      </div>

      {/* 2. Filter and Action Bar */}
      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">Daftar Pengunjung Peta PB</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pencatatan real-time identitas nama dan instansi pengguna yang mengakses WebGIS publik.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <Btn
                variant="outline"
                size="sm"
                Icon={RotateCcw}
                onClick={handleResetFilters}
                className="justify-center"
              >
                Reset Filter
              </Btn>
              <Btn
                variant="primary"
                size="sm"
                Icon={Eye}
                onClick={() => fetchLogs()}
                className="justify-center"
              >
                Segarkan
              </Btn>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Nama & Instansi */}
            <div className="relative">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Cari Nama / Instansi
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <InputField
                  name="search"
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  placeholder="Ketik nama atau instansi..."
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {/* Filter Instansi */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Filter Instansi
              </label>
              <SelectField
                name="instansi"
                value={selectedInstansi}
                onChange={(e: any) => {
                  setSelectedInstansi(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "Semua", label: "Semua Instansi" },
                  ...(meta.agencies_list || []).map((ag) => ({
                    value: ag,
                    label: ag,
                  })),
                ]}
                className="text-xs"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Dari Tanggal
              </label>
              <InputField
                type="date"
                name="start_date"
                value={startDate}
                onChange={(e: any) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Sampai Tanggal
              </label>
              <InputField
                type="date"
                name="end_date"
                value={endDate}
                onChange={(e: any) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Table Rekapitulasi Akses */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-14 text-center">No</th>
                <th className="py-3 px-4 min-w-[180px]">Nama Pengguna</th>
                <th className="py-3 px-4 min-w-[180px]">Instansi / Asal</th>
                <th className="py-3 px-4 min-w-[160px]">Waktu Akses</th>
                <th className="py-3 px-4 min-w-[120px]">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Memuat data rekapitulasi akses...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 opacity-30" />
                      <p className="text-sm font-semibold text-foreground">Belum ada riwayat akses</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Tidak ada log akses yang sesuai dengan kriteria filter saat ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const rowNumber = (currentPage - 1) * perPage + index + 1;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {log.nama.charAt(0)}
                          </div>
                          <span className="truncate max-w-[220px]" title={log.nama}>
                            {log.nama}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground/90 font-medium text-xs border border-border/60">
                          <Building2 size={12} className="text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[200px]" title={log.instansi}>
                            {log.instansi}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-foreground/80 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-muted-foreground shrink-0" />
                          <span>{formatDateTime(log.accessed_at)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {log.ip_address || "127.0.0.1"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination */}
        {!loading && totalRecords > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>dari <strong>{totalRecords}</strong> total entri akses</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                title="Halaman Pertama"
              >
                <ChevronFirst size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium text-foreground">
                Halaman {currentPage} dari {lastPage}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(lastPage)}
                disabled={currentPage === lastPage}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                title="Halaman Terakhir"
              >
                <ChevronLast size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
