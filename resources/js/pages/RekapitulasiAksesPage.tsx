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
  ClipboardCheck,
  Award,
  TrendingUp,
  BarChart3,
  Calendar,
  Shield,
  CheckCircle2,
  FileText,
  Search,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { cn } from "../lib/utils";
import { PublicMapAccessLog } from "../types";
import SurveyRespondentDetailModal from "../components/SurveyRespondentDetailModal";
import { SERVICE_SURVEY_QUESTIONS } from "../constants/surveyQuestions";

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

  // Tab & Survey Recapitulation states
  const [activeTab, setActiveTab] = useState<"logs" | "surveys">("logs");

  // 4 Survey Sub-Tabs: "detail" (Detail Jawaban) | "rekap" (Rekap Jawaban) | "ikm_unsur" (IKM Per Unsur) | "ikm_bulan" (IKM Per Bulan)
  const [surveySubTab, setSurveySubTab] = useState<"detail" | "rekap" | "ikm_unsur" | "ikm_bulan">("detail");
  const [surveyRecap, setSurveyRecap] = useState<any>(null);
  const [loadingSurvey, setLoadingSurvey] = useState(false);

  // Survey Detail Responses State (Server-side paginated list of actual respondent answers)
  const [detailResponses, setDetailResponses] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPerPage, setDetailPerPage] = useState(15);
  const [detailTotalPages, setDetailTotalPages] = useState(1);
  const [detailTotalRecords, setDetailTotalRecords] = useState(0);
  const [detailSearch, setDetailSearch] = useState("");
  const [debouncedDetailSearch, setDebouncedDetailSearch] = useState("");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("Semua");

  // Survey Filters (Year, Date range, Instansi)
  const [surveyFilters, setSurveyFilters] = useState({
    year: "Semua",
    startDate: "",
    endDate: "",
    instansi: "Semua",
  });
  const [localSurveyFilters, setLocalSurveyFilters] = useState({
    year: "Semua",
    startDate: "",
    endDate: "",
    instansi: "Semua",
  });
  const [isSurveyFilterOpen, setIsSurveyFilterOpen] = useState(false);

  // Modal Detail 1 Sesi Responden (9 Jawaban Utuh)
  const [activeModalSurveyId, setActiveModalSurveyId] = useState<number | null>(null);

  // Debounce survey detail search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDetailSearch(detailSearch);
      setDetailPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [detailSearch]);

  const fetchSurveyRecap = useCallback(() => {
    setLoadingSurvey(true);
    const params: any = {};
    if (surveyFilters.year && surveyFilters.year !== "Semua") params.year = surveyFilters.year;
    if (surveyFilters.startDate) params.start_date = surveyFilters.startDate;
    if (surveyFilters.endDate) params.end_date = surveyFilters.endDate;
    if (surveyFilters.instansi && surveyFilters.instansi !== "Semua") params.instansi = surveyFilters.instansi;

    axios
      .get("/api/admin/service-surveys/recap", { params })
      .then((res) => {
        if (res.data?.status === "success") {
          setSurveyRecap(res.data);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat rekapitulasi survei pelayanan:", err);
      })
      .finally(() => {
        setLoadingSurvey(false);
      });
  }, [surveyFilters]);

  const fetchDetailResponses = useCallback(() => {
    setDetailLoading(true);
    const params: any = {
      page: detailPage,
      per_page: detailPerPage,
    };
    if (debouncedDetailSearch) params.search = debouncedDetailSearch;
    if (selectedIndicator && selectedIndicator !== "Semua") params.indicator_key = selectedIndicator;
    if (surveyFilters.year && surveyFilters.year !== "Semua") params.year = surveyFilters.year;
    if (surveyFilters.startDate) params.start_date = surveyFilters.startDate;
    if (surveyFilters.endDate) params.end_date = surveyFilters.endDate;
    if (surveyFilters.instansi && surveyFilters.instansi !== "Semua") params.instansi = surveyFilters.instansi;

    axios
      .get("/api/admin/service-surveys/responses", { params })
      .then((res) => {
        const resp = res.data?.data;
        setDetailResponses(resp?.data || []);
        setDetailPage(resp?.current_page || 1);
        setDetailTotalPages(resp?.last_page || 1);
        setDetailTotalRecords(resp?.total || 0);
      })
      .catch((err) => {
        console.error("Gagal memuat detail jawaban responden:", err);
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }, [detailPage, detailPerPage, debouncedDetailSearch, selectedIndicator, surveyFilters]);

  useEffect(() => {
    fetchSurveyRecap();
  }, [fetchSurveyRecap]);

  useEffect(() => {
    if (activeTab === "surveys") {
      fetchDetailResponses();
    }
  }, [fetchDetailResponses, activeTab]);

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
    if (activeTab === "logs") {
      fetchLogs();
    } else {
      fetchSurveyRecap();
      fetchDetailResponses();
    }
  };

  const applySurveyFilters = () => {
    setSurveyFilters(localSurveyFilters);
    setDetailPage(1);
    setIsSurveyFilterOpen(false);
  };

  const resetSurveyFilters = () => {
    const emptyFilters = {
      year: "Semua",
      startDate: "",
      endDate: "",
      instansi: "Semua",
    };
    setLocalSurveyFilters(emptyFilters);
    setSurveyFilters(emptyFilters);
    setSelectedIndicator("Semua");
    setDetailSearch("");
    setDetailPage(1);
    setIsSurveyFilterOpen(false);
  };

  const hasActiveSurveyFilters = Boolean(
    detailSearch ||
    (selectedIndicator && selectedIndicator !== "Semua") ||
    (surveyFilters.year && surveyFilters.year !== "Semua") ||
    (surveyFilters.instansi && surveyFilters.instansi !== "Semua") ||
    surveyFilters.startDate ||
    surveyFilters.endDate
  );

  const activeSurveyFiltersCount = [
    selectedIndicator && selectedIndicator !== "Semua",
    surveyFilters.year && surveyFilters.year !== "Semua",
    surveyFilters.instansi && surveyFilters.instansi !== "Semua",
    Boolean(surveyFilters.startDate),
    Boolean(surveyFilters.endDate),
  ].filter(Boolean).length;

  const getScoreBadgeClass = (score: number) => {
    switch (score) {
      case 4:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case 3:
        return "bg-primary/10 text-primary border-primary/20";
      case 2:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
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
      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-border/60">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "logs"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users size={14} className={activeTab === "logs" ? "text-primary" : "text-muted-foreground"} />
            <span>Log Akses & Feedback Pengunjung</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("surveys");
              if (!surveyRecap) fetchSurveyRecap();
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "surveys"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardCheck size={14} className={activeTab === "surveys" ? "text-emerald-500" : "text-muted-foreground"} />
            <span>Rekapitulasi Survei Pelayanan (9 Indikator)</span>
            {surveyRecap?.meta?.total_surveys !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {surveyRecap.meta.total_surveys}
              </span>
            )}
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || loadingSurvey}>
          <RotateCcw className={cn("-ms-1 me-2 opacity-60", (loading || loadingSurvey) && "animate-spin")} size={14} strokeWidth={2} aria-hidden="true" />
          Segarkan
        </Button>
      </div>

      {/* TAB 1: LOG AKSES & FEEDBACK */}
      {activeTab === "logs" && (
        <div className="space-y-4">
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
      )}

      {/* TAB 2: REKAPITULASI SURVEI PELAYANAN (9 INDIKATOR) */}
      {activeTab === "surveys" && (
        <div className="space-y-4">
          {/* Survey KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <StatCard
              label="Total Pengisian Survei"
              value={(surveyRecap?.meta?.total_surveys || 0).toLocaleString("id-ID")}
              icon={ClipboardCheck}
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgClass="bg-emerald-500/10"
            />
            <StatCard
              label="Total Jawaban Masuk"
              value={(surveyRecap?.meta?.total_responses || 0).toLocaleString("id-ID")}
              icon={FileText}
              colorClass="text-sky-600 dark:text-sky-400"
              bgClass="bg-sky-500/10"
            />
            <StatCard
              label="Nilai IKM Konversi"
              value={`${Number(surveyRecap?.meta?.ikm_konversi || 0).toFixed(2)} / 100`}
              icon={TrendingUp}
              colorClass="text-primary"
              bgClass="bg-primary/10"
            />
            <StatCard
              label="Mutu Kualitas Pelayanan"
              value={
                surveyRecap?.meta?.mutu_pelayanan && surveyRecap.meta.mutu_pelayanan !== "-"
                  ? `Mutu ${surveyRecap.meta.mutu_pelayanan} (${surveyRecap.meta.kategori_mutu})`
                  : "Belum Ada Data"
              }
              icon={Award}
              colorClass="text-amber-600 dark:text-amber-400"
              bgClass="bg-amber-500/10"
            />
          </div>

          {/* Sub-Tab Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-muted/40 rounded-xl border border-border/60">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSurveySubTab("detail")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  surveySubTab === "detail"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText size={14} className={surveySubTab === "detail" ? "text-primary" : "text-muted-foreground"} />
                <span>Detail Jawaban Responden</span>
                {detailTotalRecords > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
                    {detailTotalRecords}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSurveySubTab("rekap")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  surveySubTab === "rekap"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 size={14} className={surveySubTab === "rekap" ? "text-emerald-500" : "text-muted-foreground"} />
                <span>Rekap Pilihan Jawaban</span>
              </button>

              <button
                type="button"
                onClick={() => setSurveySubTab("ikm_unsur")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  surveySubTab === "ikm_unsur"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Award size={14} className={surveySubTab === "ikm_unsur" ? "text-amber-500" : "text-muted-foreground"} />
                <span>Nilai IKM Per Unsur</span>
              </button>

              <button
                type="button"
                onClick={() => setSurveySubTab("ikm_bulan")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  surveySubTab === "ikm_bulan"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TrendingUp size={14} className={surveySubTab === "ikm_bulan" ? "text-sky-500" : "text-muted-foreground"} />
                <span>Nilai IKM Per Bulan</span>
              </button>
            </div>

            {/* Filter Popover for Survey Data */}
            <div className="flex items-center gap-2 ms-auto">
              <Popover
                open={isSurveyFilterOpen}
                onOpenChange={(open) => {
                  setIsSurveyFilterOpen(open);
                  if (open) {
                    setLocalSurveyFilters(surveyFilters);
                  }
                }}
              >
                <PopoverTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
                  <Filter className="-ms-0.5 me-1.5 opacity-60" size={13} strokeWidth={2} aria-hidden="true" />
                  Filter Survei
                  {activeSurveyFiltersCount > 0 && (
                    <span className="-me-0.5 ms-1.5 inline-flex h-4 px-1 items-center rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">
                      {activeSurveyFiltersCount}
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-xs font-bold text-foreground">Filter Data Survei</span>
                      {hasActiveSurveyFilters && (
                        <button
                          type="button"
                          onClick={resetSurveyFilters}
                          className="text-[11px] text-destructive hover:underline cursor-pointer font-medium"
                        >
                          Reset Semua
                        </button>
                      )}
                    </div>

                    {/* Filter: Tahun */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Tahun Survei</label>
                      <Select
                        value={localSurveyFilters.year}
                        onValueChange={(val) => setLocalSurveyFilters((prev) => ({ ...prev, year: val }))}
                      >
                        <SelectTrigger className="w-full text-xs h-8">
                          <SelectValue placeholder="Pilih Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semua">Semua Tahun</SelectItem>
                          {(surveyRecap?.filters?.years_list || [new Date().getFullYear()]).map((yr: number) => (
                            <SelectItem key={yr} value={yr.toString()}>
                              Tahun {yr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter: Instansi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Instansi / Asal Responden</label>
                      <Select
                        value={localSurveyFilters.instansi}
                        onValueChange={(val) => setLocalSurveyFilters((prev) => ({ ...prev, instansi: val }))}
                      >
                        <SelectTrigger className="w-full text-xs h-8">
                          <SelectValue placeholder="Pilih Instansi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semua">Semua Instansi</SelectItem>
                          {(surveyRecap?.filters?.instansi_list || meta.agencies_list || []).map((ag: string) => (
                            <SelectItem key={ag} value={ag}>
                              {ag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter: Rentang Tanggal */}
                    <div className="space-y-2 pt-1 border-t border-border/50">
                      <label className="text-xs font-medium text-muted-foreground block">Rentang Tanggal</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">Mulai</span>
                          <Input
                            type="date"
                            className="text-xs h-8"
                            value={localSurveyFilters.startDate}
                            onChange={(e) =>
                              setLocalSurveyFilters((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">Sampai</span>
                          <Input
                            type="date"
                            className="text-xs h-8"
                            value={localSurveyFilters.endDate}
                            onChange={(e) =>
                              setLocalSurveyFilters((prev) => ({ ...prev, endDate: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={resetSurveyFilters}>
                        Reset
                      </Button>
                      <Button variant="default" size="sm" className="flex-1 text-xs h-8" onClick={applySurveyFilters}>
                        Terapkan
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* SUB-TAB 1: DETAIL JAWABAN HASIL ISIAN RESPONDEN (PAGINATED & FILTERED) */}
          {surveySubTab === "detail" && (
            <div className="space-y-3.5">
              {/* Filter Toolbar Detail Jawaban */}
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1 min-w-0">
                  {/* Search Bar */}
                  <div className="relative min-w-0 w-full sm:w-72">
                    <Input
                      className={cn(
                        "ps-8 pe-8 text-xs h-9",
                        Boolean(detailSearch) && "pe-8"
                      )}
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      placeholder="Cari responden, instansi, atau jawaban..."
                      type="search"
                    />
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2.5 text-muted-foreground/80">
                      {detailLoading ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Search size={14} />
                      )}
                    </div>
                    {Boolean(detailSearch) && (
                      <button
                        type="button"
                        onClick={() => setDetailSearch("")}
                        className="absolute inset-y-0 end-0 flex items-center justify-center pe-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label="Bersihkan pencarian"
                      >
                        <CircleX size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filter Pertanyaan / Unsur */}
                  <div className="w-full sm:w-72 min-w-0">
                    <Select
                      value={selectedIndicator}
                      onValueChange={(val) => {
                        setSelectedIndicator(val);
                        setDetailPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full text-xs h-9">
                        <SelectValue placeholder="Pilih Pertanyaan / Unsur" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <SelectItem value="Semua">Semua Pertanyaan & Unsur (9 Unsur)</SelectItem>
                        {SERVICE_SURVEY_QUESTIONS.map((q) => (
                          <SelectItem key={q.key} value={q.key}>
                            U{q.number}. {q.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveSurveyFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSurveyFilters}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <RotateCcw size={12} className="me-1.5" />
                    Reset Filter
                  </Button>
                )}
              </div>

              {/* Context Banner if Specific Indicator Selected */}
              {selectedIndicator !== "Semua" && (() => {
                const currentQuestion = SERVICE_SURVEY_QUESTIONS.find((q) => q.key === selectedIndicator);
                if (!currentQuestion) return null;
                return (
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-mono text-[10px] font-bold">
                          U{currentQuestion.number}
                        </span>
                        <span className="font-bold text-foreground text-sm">
                          {currentQuestion.name}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        "{currentQuestion.question}"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIndicator("Semua")}
                      className="text-xs font-semibold text-primary hover:underline shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      Tampilkan Semua Unsur &rarr;
                    </button>
                  </div>
                );
              })()}

              {/* Detail Jawaban Table */}
              <div className="w-full min-w-0 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-[11px]">
                        <th className="py-3 px-3 text-center w-12">No</th>
                        <th className="py-3 px-3 text-left min-w-[180px]">Nama Responden</th>
                        <th className="py-3 px-3 text-left min-w-[140px]">Instansi</th>
                        <th className="py-3 px-3 text-left min-w-[240px]">Unsur Pelayanan & Pertanyaan</th>
                        <th className="py-3 px-3 text-left min-w-[150px]">Jawaban Dipilih</th>
                        <th className="py-3 px-3 text-center w-20">Nilai</th>
                        <th className="py-3 px-3 text-left min-w-[160px]">Usaha Terkait</th>
                        <th className="py-3 px-3 text-left min-w-[140px]">Waktu Pengisian</th>
                        <th className="py-3 px-3 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y divide-border/40", detailLoading && "opacity-60 pointer-events-none")}>
                      {detailLoading && detailResponses.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={`skeleton-${i}`}>
                            <td className="py-3.5 px-3 text-center">
                              <div className="h-4 w-5 mx-auto bg-muted rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                              <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="h-4 w-40 bg-muted rounded animate-pulse mb-1" />
                              <div className="h-3 w-52 bg-muted/60 rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="h-5 w-8 mx-auto bg-muted rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="h-6 w-20 mx-auto bg-muted rounded animate-pulse" />
                            </td>
                          </tr>
                        ))
                      ) : detailResponses.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <Inbox size={20} />
                              </div>
                              <p className="text-sm font-semibold text-foreground">
                                {hasActiveSurveyFilters
                                  ? "Tidak ditemukan jawaban survei yang cocok dengan filter."
                                  : "Belum ada jawaban survei yang tersimpan."}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {hasActiveSurveyFilters
                                  ? "Coba sesuaikan kata pencarian atau pilih unsur pelayanan yang lain."
                                  : "Setiap responden yang mengisi survei sebelum unduh detail usaha akan tercatat di sini secara real-time."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        detailResponses.map((res: any, idx: number) => {
                          const rowNumber = (detailPage - 1) * detailPerPage + idx + 1;
                          return (
                            <tr key={res.id} className="hover:bg-muted/40 transition-colors">
                              <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                                {rowNumber}
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-foreground truncate max-w-[180px]" title={res.nama_responden}>
                                  {res.nama_responden}
                                </div>
                                {res.nik_masked && (
                                  <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Shield size={10} className="text-emerald-500 shrink-0" />
                                    <span>{res.nik_masked}</span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <div className="text-muted-foreground truncate max-w-[140px]" title={res.instansi}>
                                  {res.instansi}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-foreground">
                                  {res.indicator_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground line-clamp-1 leading-normal mt-0.5" title={res.question}>
                                  {res.question}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-muted text-xs font-semibold text-foreground border border-border/60">
                                  {res.answer_label}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className={cn(
                                  "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold border",
                                  getScoreBadgeClass(res.score)
                                )}>
                                  {res.score}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground truncate max-w-[160px]" title={res.business_name}>
                                  {res.business_name}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="text-muted-foreground whitespace-nowrap text-[11px]">
                                  {formatDateTime(res.created_at)}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setActiveModalSurveyId(res.survey_id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Lihat seluruh 9 jawaban yang diisi responden ini"
                                >
                                  <Eye size={12} />
                                  <span>9 Jawaban</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Detail Jawaban */}
              {!detailLoading && detailResponses.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="detail-per-page" className="text-xs text-muted-foreground font-normal">
                      Baris per halaman:
                    </Label>
                    <Select
                      value={detailPerPage.toString()}
                      onValueChange={(val) => {
                        setDetailPerPage(Number(val));
                        setDetailPage(1);
                      }}
                    >
                      <SelectTrigger id="detail-per-page" className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 15, 25, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-muted-foreground font-medium">
                      Menampilkan <span className="text-foreground">{(detailPage - 1) * detailPerPage + 1}</span>-
                      <span className="text-foreground">{Math.min(detailPage * detailPerPage, detailTotalRecords)}</span> dari{" "}
                      <span className="text-foreground">{detailTotalRecords}</span> jawaban
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setDetailPage(1)}
                      disabled={detailPage === 1 || detailLoading}
                      aria-label="Halaman pertama"
                    >
                      <ChevronFirst size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                      disabled={detailPage === 1 || detailLoading}
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <span className="px-2.5 text-xs font-semibold text-muted-foreground">
                      Hal. {detailPage} / {detailTotalPages}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))}
                      disabled={detailPage === detailTotalPages || detailLoading}
                      aria-label="Halaman berikutnya"
                    >
                      <ChevronRight size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setDetailPage(detailTotalPages)}
                      disabled={detailPage === detailTotalPages || detailLoading}
                      aria-label="Halaman terakhir"
                    >
                      <ChevronLast size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: REKAP PILIHAN JAWABAN (AGGREGATION PER QUESTION) */}
          {surveySubTab === "rekap" && (
            <div className="space-y-4">
              {loadingSurvey ? (
                <div className="flex items-center justify-center py-16 bg-card border border-border rounded-xl">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    Memuat data rekapitulasi survei...
                  </span>
                </div>
              ) : !surveyRecap?.indicators || surveyRecap.indicators.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 bg-card border border-border rounded-xl">
                  <Inbox size={28} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Belum ada data rekapitulasi survei.</p>
                  <p className="text-xs text-muted-foreground">Survei pelayanan akan tercatat setiap kali user mengunduh detail usaha.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveyRecap.indicators.map((item: any) => (
                    <div key={item.key} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                              U{item.no}
                            </span>
                            <h4 className="text-sm font-bold text-foreground tracking-tight">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {item.question}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-muted-foreground border border-border/50">
                            {item.total_responses} Respon
                          </div>
                          <div className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">
                            Rata-rata: {Number(item.average_score).toFixed(2)} / 4.00
                          </div>
                        </div>
                      </div>

                      {/* Table: No | Pilihan Jawaban | Nilai | Jumlah | Grafik */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/50 text-muted-foreground font-semibold text-[11px]">
                              <th className="py-2 px-2 text-center w-10">No</th>
                              <th className="py-2 px-3 text-left">Pilihan Jawaban</th>
                              <th className="py-2 px-3 text-center w-20">Nilai</th>
                              <th className="py-2 px-3 text-center w-28">Jumlah Responden</th>
                              <th className="py-2 px-3 text-left min-w-[200px]">Grafik Distribusi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {item.distribution.map((opt: any, optIdx: number) => (
                              <tr key={opt.label} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2 px-2 text-center font-mono text-muted-foreground">{optIdx + 1}</td>
                                <td className="py-2 px-3 font-medium text-foreground">{opt.label}</td>
                                <td className="py-2 px-3 text-center font-mono font-semibold text-primary">{opt.score}</td>
                                <td className="py-2 px-3 text-center font-semibold text-foreground">
                                  {opt.count} <span className="text-[10px] text-muted-foreground font-normal">({opt.percentage}%)</span>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden border border-border/40">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all duration-500",
                                          opt.score === 4 ? "bg-emerald-500" :
                                          opt.score === 3 ? "bg-primary" :
                                          opt.score === 2 ? "bg-amber-500" : "bg-rose-500"
                                        )}
                                        style={{ width: `${Math.max(opt.percentage, opt.count > 0 ? 3 : 0)}%` }}
                                      />
                                    </div>
                                    <span className="font-mono text-[11px] text-muted-foreground w-12 text-right">
                                      {opt.percentage}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: NILAI IKM PER UNSUR PELAYANAN (PERMENPAN-RB NO. 14 TAHUN 2017) */}
          {surveySubTab === "ikm_unsur" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      <span>Tabel Perhitungan Nilai IKM Per Unsur Pelayanan</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sesuai pedoman Peraturan Menteri PAN-RB No. 14 Tahun 2017 tentang Penyusunan Survei Kepuasan Masyarakat
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20 shrink-0">
                    Bobot per Unsur: 1 / 9 = 0.111
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-[11px]">
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3 text-center w-16">Kode</th>
                        <th className="py-2.5 px-3 text-left min-w-[220px]">Unsur Pelayanan</th>
                        <th className="py-2.5 px-3 text-center w-28">Total Nilai</th>
                        <th className="py-2.5 px-3 text-center w-28">Jumlah Responden</th>
                        <th className="py-2.5 px-3 text-center w-28">NRR (Skala 4)</th>
                        <th className="py-2.5 px-3 text-center w-24">Bobot</th>
                        <th className="py-2.5 px-3 text-center w-32">NRR Tertimbang</th>
                        <th className="py-2.5 px-3 text-center w-24">Mutu</th>
                        <th className="py-2.5 px-3 text-center w-32">Kinerja Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(surveyRecap?.ikm_per_unsur?.elements || []).map((elem: any) => (
                        <tr key={elem.key} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{elem.no}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">{elem.unsur_code}</td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">{elem.name}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-foreground">{elem.total_nilai}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{elem.jumlah_responden}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-foreground">
                            {Number(elem.nrr).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">0.111</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {Number(elem.nrr_tertimbang).toFixed(4)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded text-[11px] font-bold border",
                              elem.mutu === "A" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                              elem.mutu === "B" ? "bg-primary/10 text-primary border-primary/20" :
                              elem.mutu === "C" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}>
                              Mutu {elem.mutu}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium text-foreground">
                            {elem.kategori}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/50 font-bold">
                        <td colSpan={7} className="py-3 px-3 text-right text-xs text-foreground">
                          Total NRR Tertimbang (IKM Skala 4):
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          {Number(surveyRecap?.ikm_per_unsur?.total_nrr_tertimbang || 0).toFixed(4)}
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-center text-xs text-muted-foreground">
                          dari maks 4.0000
                        </td>
                      </tr>
                      <tr className="bg-primary/5 font-bold border-t border-primary/20">
                        <td colSpan={7} className="py-3 px-3 text-right text-xs text-primary font-bold">
                          Nilai IKM Konversi (Total NRR Tertimbang &times; 25):
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-base text-primary">
                          {Number(surveyRecap?.ikm_per_unsur?.ikm_konversi || 0).toFixed(2)}
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-center text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold">
                            Mutu {surveyRecap?.ikm_per_unsur?.mutu || "-"} ({surveyRecap?.ikm_per_unsur?.kategori || "-"})
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Pedoman PermenPAN-RB Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Mutu A (Sangat Baik)</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">88.31 - 100.00</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Nilai NRR Tertimbang: 3.532 - 4.000</p>
                </div>

                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Mutu B (Baik)</span>
                    <span className="font-mono text-xs font-bold text-primary">76.61 - 88.30</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Nilai NRR Tertimbang: 3.064 - 3.532</p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Mutu C (Kurang Baik)</span>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">65.00 - 76.60</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Nilai NRR Tertimbang: 2.600 - 3.064</p>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Mutu D (Tidak Baik)</span>
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">25.00 - 64.99</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Nilai NRR Tertimbang: 1.000 - 2.599</p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: NILAI IKM PER BULAN (GRAFIK & TABEL BULANAN) */}
          {surveySubTab === "ikm_bulan" && (
            <div className="space-y-4">
              {/* Graphic Chart */}
              <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary" />
                      <span>Grafik Tren Nilai IKM Bulanan (Skala 100)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Perkembangan kepuasan masyarakat berdasarkan pengisian survei setiap bulan pada tahun {surveyRecap?.filters?.selected_year || new Date().getFullYear()}
                    </p>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                    Tahun {surveyRecap?.filters?.selected_year || new Date().getFullYear()}
                  </div>
                </div>

                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={surveyRecap?.ikm_per_bulan || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorIkm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary, #0ea5e9)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary, #0ea5e9)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="short_name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs space-y-1">
                                <span className="font-bold text-foreground block">{data.month_name}</span>
                                <div className="text-primary font-mono font-bold text-sm">
                                  IKM: {data.ikm_konversi} / 100
                                </div>
                                <div className="text-muted-foreground">
                                  Rata-rata: {data.overall_average} / 4.00
                                </div>
                                <div className="text-muted-foreground">
                                  Responden: {data.total_surveys} orang
                                </div>
                                {data.total_surveys > 0 && (
                                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/50">
                                    Mutu {data.mutu} ({data.kategori})
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ikm_konversi"
                        stroke="var(--color-primary, #0ea5e9)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorIkm)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Table */}
              <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Rincian Data IKM Bulanan
                </h4>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-[11px]">
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3 text-left">Bulan</th>
                        <th className="py-2.5 px-3 text-center w-36">Jumlah Responden</th>
                        <th className="py-2.5 px-3 text-center w-40">Rata-rata Skor (Skala 4)</th>
                        <th className="py-2.5 px-3 text-center w-40">IKM Konversi (Skala 100)</th>
                        <th className="py-2.5 px-3 text-center w-28">Mutu</th>
                        <th className="py-2.5 px-3 text-center w-36">Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(surveyRecap?.ikm_per_bulan || []).map((m: any) => (
                        <tr key={m.month} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{m.month}</td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">{m.month_name}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-foreground">
                            {m.total_surveys > 0 ? (
                              <span className="font-bold text-foreground">{m.total_surveys} orang</span>
                            ) : (
                              <span className="text-muted-foreground/60 italic">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-foreground">
                            {m.total_surveys > 0 ? Number(m.overall_average).toFixed(2) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                            {m.total_surveys > 0 ? Number(m.ikm_konversi).toFixed(2) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {m.total_surveys > 0 ? (
                              <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[11px] font-bold border",
                                m.mutu === "A" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                m.mutu === "B" ? "bg-primary/10 text-primary border-primary/20" :
                                m.mutu === "C" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                                "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              )}>
                                Mutu {m.mutu}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium text-foreground">
                            {m.kategori}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail 1 Sesi Survei Responden Utuh (9 Jawaban) */}
      <SurveyRespondentDetailModal
        isOpen={Boolean(activeModalSurveyId)}
        surveyId={activeModalSurveyId}
        onClose={() => setActiveModalSurveyId(null)}
      />
    </div>
  );
}
