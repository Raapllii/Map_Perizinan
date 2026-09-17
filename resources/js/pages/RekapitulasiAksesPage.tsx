import React, { useState, useEffect, useCallback, useId, useRef } from "react";
import axios from "axios";
import {
  Users,
  Eye,
  Clock,
  Building2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  ListFilter,
  CircleX,
  Filter,
  Inbox,
  Loader2,
  MessageSquareHeart,
  Smile,
  Meh,
  Frown,
  Sparkles,
} from "lucide-react";
import { cn } from "../lib/utils";
import { PublicMapAccessLog } from "../types";

// Shadcn UI components matching DataUsahaPage
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "../components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { StatCard } from "../components/ui";

// Inline Table Components matching DataUsahaPage exact implementation
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <thead ref={ref} className={cn(className)} {...props} />);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-3 text-left align-middle font-medium text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3 align-middle",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export default function RekapitulasiAksesPage() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [logs, setLogs] = useState<PublicMapAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    total_access: 0,
    total_visitors: 0,
    today_access: 0,
    total_agencies: 0,
    total_feedbacks: 0,
    agencies_list: [] as string[],
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    instansi: "Semua",
    startDate: "",
    endDate: "",
  });

  const [localFilters, setLocalFilters] = useState({
    instansi: "Semua",
    startDate: "",
    endDate: "",
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params: any = {
      page,
      per_page: perPage,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (activeFilters.instansi && activeFilters.instansi !== "Semua") params.instansi = activeFilters.instansi;
    if (activeFilters.startDate) params.start_date = activeFilters.startDate;
    if (activeFilters.endDate) params.end_date = activeFilters.endDate;

    axios
      .get("/api/admin/public-map-access-logs", { params })
      .then((res) => {
        const responseData = res.data?.data;
        setLogs(responseData?.data || []);
        setPage(responseData?.current_page || 1);
        setTotalPages(responseData?.last_page || 1);
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
  }, [page, perPage, debouncedSearch, activeFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyFilters = () => {
    setActiveFilters(localFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const resetLocalFilters = () => {
    const emptyFilters = {
      instansi: "Semua",
      startDate: "",
      endDate: "",
    };
    setLocalFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setSearchTerm("");
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    (activeFilters.instansi && activeFilters.instansi !== "Semua") ||
    activeFilters.startDate ||
    activeFilters.endDate
  );

  const activeFiltersCount = [
    activeFilters.instansi && activeFilters.instansi !== "Semua",
    Boolean(activeFilters.startDate),
    Boolean(activeFilters.endDate),
  ].filter(Boolean).length;

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formattedDate = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
      const formattedTime = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d).replace(/\./g, ":");
      return `${formattedDate}, ${formattedTime}`;
    } catch {
      return dateStr;
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "happy":
        return (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <Sparkles size={12} className="shrink-0 text-emerald-500" />
            <span>Amazing</span>
          </span>
        );
      case "neutral":
        return (
          <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <Smile size={12} className="shrink-0 text-sky-500" />
            <span>Okay</span>
          </span>
        );
      case "sad":
        return (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <Meh size={12} className="shrink-0 text-amber-500" />
            <span>Bad</span>
          </span>
        );
      case "very-sad":
        return (
          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <Frown size={12} className="shrink-0 text-rose-500" />
            <span>Terrible</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full text-[11px] font-medium">
            <span>{rating || "Feedback"}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto min-w-0">
      {/* 1. KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-2">
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
          label="Total Instansi"
          value={meta.total_agencies.toLocaleString("id-ID")}
          icon={Building2}
          colorClass="text-secondary"
          bgClass="bg-secondary/10"
        />
        <StatCard
          label="Feedback Masuk"
          value={(meta.total_feedbacks || 0).toLocaleString("id-ID")}
          icon={MessageSquareHeart}
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="bg-purple-500/10"
        />
      </div>

      {/* 2. Modern Filter Toolbar matching DataUsahaPage */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 w-full min-w-0">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto min-w-0">
          {/* Search Bar */}
          <div className="relative min-w-0 flex-1 sm:flex-none w-full sm:w-auto">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-0 sm:min-w-64 w-full sm:w-64 ps-9 text-xs sm:text-sm",
                "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
                Boolean(searchTerm) && "pe-9",
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nama Pengguna..."
              type="search"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              {loading ? (
                <Loader2
                  className="animate-spin"
                  size={16}
                  strokeWidth={2}
                  role="status"
                  aria-label="Loading..."
                />
              ) : (
                <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </div>
            {Boolean(searchTerm) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  setSearchTerm("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                type="button"
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Popover Filter matching DataUsahaPage */}
          <Popover
            open={isFilterOpen}
            onOpenChange={(open) => {
              setIsFilterOpen(open);
              if (open) {
                setLocalFilters(activeFilters);
              } else {
                setLocalFilters(activeFilters);
              }
            }}
          >
            <PopoverTrigger render={<Button variant="outline" />}>
              <Filter
                className="-ms-1 me-2 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Filter
              {activeFiltersCount > 0 && (
                <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                  {activeFiltersCount}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Instansi</div>
                  <Select
                    value={localFilters.instansi}
                    onValueChange={(val) => setLocalFilters((prev) => ({ ...prev, instansi: val }))}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Semua Instansi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semua">Semua Instansi</SelectItem>
                      {(meta.agencies_list || []).map((ag) => (
                        <SelectItem key={ag} value={ag}>
                          {ag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Rentang Tanggal</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Tanggal Mulai</label>
                      <Input
                        type="date"
                        className="text-xs"
                        value={localFilters.startDate}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Tanggal Akhir</label>
                      <Input
                        type="date"
                        className="text-xs"
                        value={localFilters.endDate}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button variant="outline" className="flex-1 text-xs" onClick={resetLocalFilters}>
                    Reset
                  </Button>
                  <Button variant="default" className="flex-1 text-xs" onClick={applyFilters}>
                    Terapkan
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right Side Refresh Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
          <Button variant="outline" onClick={handleRefresh}>
            <RotateCcw className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 3. Table Section matching DataUsahaPage exact styling */}
      <div className="w-full min-w-0 rounded-lg border border-border bg-background overflow-hidden relative transition-opacity duration-200">
        <div className="w-full overflow-x-auto">
          <Table className="table-fixed min-w-[860px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 w-[60px] text-center">No</TableHead>
                <TableHead className="h-11 w-[220px]">Nama Pengguna</TableHead>
                <TableHead className="h-11 w-[200px]">Instansi / Asal</TableHead>
                <TableHead className="h-11 w-[180px]">Waktu Akses</TableHead>
                <TableHead className="h-11 w-[220px]">Feedback & Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={loading && logs.length > 0 ? "opacity-75 pointer-events-none transition-opacity" : ""}>
              {loading && logs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="px-4 py-4 align-middle text-center">
                      <div className="h-4 w-6 mx-auto bg-muted/60 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="h-4 w-2/3 bg-muted/60 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="h-4 w-1/2 bg-muted/60 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="h-4 w-1/2 bg-muted/60 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mb-1">
                        <Inbox size={20} strokeWidth={1.5} />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {hasActiveFilters
                          ? "Tidak ditemukan pengguna yang sesuai dengan filter."
                          : "Belum ada data pengguna yang mengakses aplikasi."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hasActiveFilters
                          ? "Coba ubah kata pencarian atau filter yang digunakan."
                          : "Data pengguna yang mengakses peta publik akan tercatat di sini."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => {
                  const rowNumber = (page - 1) * perPage + index + 1;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {rowNumber}
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-sm font-medium text-foreground truncate max-w-[220px]"
                          title={log.nama || "-"}
                        >
                          {log.nama || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-sm font-normal text-muted-foreground truncate max-w-[200px]"
                          title={log.instansi || "-"}
                        >
                          {log.instansi || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-normal text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.accessed_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.feedback ? (
                          <Popover>
                            <PopoverTrigger
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border/80 hover:bg-muted/70 transition-colors cursor-pointer group"
                              title="Klik untuk melihat detail masukan"
                            >
                              {getRatingBadge(log.feedback.rating)}
                              <span className="text-[11px] text-muted-foreground group-hover:text-foreground underline decoration-dotted">
                                Detail
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3.5 space-y-2.5 text-xs shadow-xl border-border bg-card" align="end">
                              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                <div className="flex items-center gap-1.5">
                                  {getRatingBadge(log.feedback.rating)}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDateTime(log.feedback.created_at)}
                                </span>
                              </div>
                              <div className="bg-muted/40 p-2.5 rounded-lg text-foreground/90 whitespace-pre-wrap leading-relaxed border border-border/40 font-normal text-xs">
                                "{log.feedback.feedback}"
                              </div>
                              {log.feedback.business && (
                                <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5 border-t border-border/50">
                                  <Building2 size={13} className="shrink-0 text-primary/70" />
                                  <span className="truncate">Terkait: <strong className="text-foreground">{log.feedback.business.nama_perusahaan}</strong></span>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic font-mono">- Belum ada -</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Pagination matching DataUsahaPage exact implementation */}
      {!loading && logs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 pt-3 w-full">
          {/* Results per page */}
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <Label
                htmlFor={id}
                className="max-sm:sr-only text-xs sm:text-sm text-muted-foreground font-normal"
              >
                Baris per halaman
              </Label>
              <Select
                value={perPage.toString()}
                disabled={loading}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger id={id} className="w-fit whitespace-nowrap h-8 text-xs">
                  <SelectValue placeholder="Pilih jumlah data" />
                </SelectTrigger>
                <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                  {[10, 15, 25, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page number information */}
            <p className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground" aria-live="polite">
              <span className="text-foreground font-medium">
                {totalRecords > 0 ? (page - 1) * perPage + 1 : 0}-
                {Math.min(page * perPage, totalRecords)}
              </span>{" "}
              dari <span className="text-foreground font-medium">{totalRecords}</span>
            </p>
          </div>

          {/* Pagination buttons */}
          <div className="flex justify-center sm:justify-end w-full sm:w-auto">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
                    onClick={() => setPage(1)}
                    disabled={page === 1 || loading}
                    aria-label="First page"
                  >
                    <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || loading}
                    aria-label="Last page"
                  >
                    <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
