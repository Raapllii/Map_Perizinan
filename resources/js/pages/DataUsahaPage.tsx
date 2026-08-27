import React, { useState, useEffect, useRef, useMemo, useId } from "react";
import { useLocation } from "react-router";
import axios from 'axios';
import { 
  Eye, Edit, Trash2, Plus, FileSpreadsheet, 
  Inbox, AlertCircle, Upload, X, Filter, 
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast,
  ListFilter, CircleX, Columns3, Trash, CircleAlert, Ellipsis, ChevronDown, ChevronUp, MapPinOff
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  RowSelectionState
} from "@tanstack/react-table";

// Shadcn UI components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "../components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";

// Modals
import DataUsahaDetailModal from "../components/DataUsahaDetailModal";
import DataUsahaFormModal from "../components/DataUsahaFormModal";
import DataUsahaImportModal from "../components/DataUsahaImportModal";

// Custom UI
import { Card, StatusBadge, Btn, InputField, SelectField } from "../components/ui";

// Inline Table Component
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
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

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

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
      "h-12 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:w-px [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
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
      "p-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";


export default function DataUsahaPage() {
  const id = useId();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ref for scroll target and pagination action tracker
  const pageTopRef = useRef<HTMLDivElement>(null);
  const isPaginationAction = useRef(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortType, setSortType] = useState("terbaru");

  // Filter State
  const [activeFilters, setActiveFilters] = useState({
    kecamatan: "",
    kelurahan: "",
    kategori: "",
    status: "",
  });
  
  // Local Filter State for Popover
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  // Table internal state for Demo features
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  const [alertMsg, setAlertMsg] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).noCoord) {
      setAlertMsg("Data usaha ini belum memiliki titik koordinat lokasi di peta, sehingga dialihkan ke tabel data.");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    axios.get('/api/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to load categories', err));
      
    axios.get('/api/locations/kecamatan')
      .then(res => setKecamatanOptions(res.data))
      .catch(err => console.error('Failed to load kecamatan', err));
  }, []);

  useEffect(() => {
    const targetKecamatan = isFilterOpen ? localFilters.kecamatan : activeFilters.kecamatan;
    if (targetKecamatan && targetKecamatan !== "Semua") {
      axios.get(`/api/locations/kelurahan?kecamatan=${encodeURIComponent(targetKecamatan)}`)
        .then(res => setKelurahanOptions(res.data))
        .catch(err => console.error(err));
    } else {
      setKelurahanOptions([]);
    }
  }, [isFilterOpen ? localFilters.kecamatan : activeFilters.kecamatan, isFilterOpen]);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchBusinesses = (pageNumber = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams();
    params.append('page', pageNumber.toString());
    params.append('per_page', perPage.toString());
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (activeFilters.kategori) params.append('kategori', activeFilters.kategori);
    if (activeFilters.status) params.append('status', activeFilters.status);
    if (activeFilters.kecamatan && activeFilters.kecamatan !== "Semua") params.append('kecamatan', activeFilters.kecamatan);
    if (activeFilters.kelurahan && activeFilters.kelurahan !== "Semua") params.append('kelurahan', activeFilters.kelurahan);
    
    if (sortType === 'terlama') {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_az') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_za') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'desc');
    } else {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'desc');
    }
    
    axios.get(`/api/businesses?${params.toString()}`)
      .then(res => {
        setBusinesses(res.data.data);
        setTotalPages(res.data.last_page);
        setTotalItems(res.data.total);
        setLoading(false);
        
        if (isPaginationAction.current && pageTopRef.current) {
          pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          isPaginationAction.current = false;
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        isPaginationAction.current = false;
      });
  };

  useEffect(() => {
    fetchBusinesses(page);
  }, [debouncedSearch, activeFilters, sortType, page, perPage, refreshTrigger]);

  // Handle Multi-Status Checkbox
  const selectedStatuses = localFilters.status ? localFilters.status.split(',').filter(Boolean) : [];
  
  const handleLocalStatusChange = (checked: boolean, value: string) => {
    let newStatuses = [...selectedStatuses];
    if (checked) {
      newStatuses.push(value);
    } else {
      newStatuses = newStatuses.filter(s => s !== value);
    }
    setLocalFilters(prev => ({ ...prev, status: newStatuses.join(',') }));
  };

  const setLocalSingleFilter = (field: keyof typeof localFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value, ...(field === 'kecamatan' ? { kelurahan: "" } : {}) }));
  };

  const applyFilters = () => {
    setActiveFilters(localFilters);
    setPage(1);
    setRefreshTrigger(p => p + 1);
    setIsFilterOpen(false);
  };

  const resetLocalFilters = () => {
    const emptyFilters = {
      kecamatan: "",
      kelurahan: "",
      kategori: "",
      status: "",
    };
    setLocalFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setSearchTerm("");
    setSortType("terbaru");
    setPage(1);
    setRefreshTrigger(p => p + 1);
    setIsFilterOpen(false);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (activeFilters.kategori) params.append('kategori', activeFilters.kategori);
    if (activeFilters.status) params.append('status', activeFilters.status);
    if (activeFilters.kecamatan && activeFilters.kecamatan !== "Semua") params.append('kecamatan', activeFilters.kecamatan);
    if (activeFilters.kelurahan && activeFilters.kelurahan !== "Semua") params.append('kelurahan', activeFilters.kelurahan);
    
    if (sortType === 'terlama') {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_az') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'asc');
    } else if (sortType === 'nama_za') {
      params.append('sort_by', 'nama_perusahaan');
      params.append('sort_direction', 'desc');
    } else {
      params.append('sort_by', 'created_at');
      params.append('sort_direction', 'desc');
    }
    
    window.location.href = `/api/admin/database/export?${params.toString()}`;
  };

  const openAddModal = () => {
    setSelectedBusiness(null);
    setIsFormOpen(true);
  };

  const openEditModal = (business: any) => {
    axios.get(`/api/admin/businesses/${business.id}`)
      .then(res => {
        setSelectedBusiness(res.data);
        setIsFormOpen(true);
      })
      .catch(err => {
        setSelectedBusiness(business);
        setIsFormOpen(true);
      });
  };

  const openDetailModal = (business: any) => {
    axios.get(`/api/admin/businesses/${business.id}`)
      .then(res => {
        setSelectedBusiness(res.data);
        setIsDetailOpen(true);
      })
      .catch(err => {
        setSelectedBusiness(business);
        setIsDetailOpen(true);
      });
  };

  const handleDelete = (id: string | number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      axios.delete(`/api/admin/businesses/${id}`)
        .then(() => {
          setRefreshTrigger(prev => prev + 1);
          setRowSelection({});
        })
        .catch(err => console.error(err));
    }
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const ids = selectedRows.map(row => row.original.id);
    if (ids.length === 0) return;
    
    Promise.all(ids.map(id => axios.delete(`/api/admin/businesses/${id}`)))
      .then(() => {
        setRowSelection({});
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => console.error(err));
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "nama_perusahaan",
      header: "Nama Usaha / NIB",
      size: 250,
      cell: ({ row }: any) => {
        const b = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-foreground truncate max-w-[250px]" title={b.nama_perusahaan}>{b.nama_perusahaan}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[250px]">{b.nib}</div>
          </div>
        );
      }
    },
    {
      accessorKey: "nama_pemilik",
      header: "Pemilik / User",
      size: 200,
      cell: ({ row }: any) => {
        const b = row.original;
        return (
          <div className="text-sm text-muted-foreground font-normal line-clamp-2 max-w-[200px]" title={b.nama_pemilik || b.nama_user || b.nama_perusahaan}>
            {b.nama_pemilik || b.nama_user || b.nama_perusahaan || '-'}
          </div>
        );
      }
    },
    {
      accessorKey: "kecamatan",
      header: "Lokasi",
      size: 200,
      cell: ({ row }: any) => {
        const b = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm text-foreground truncate max-w-[200px]" title={`${b.kecamatan}${b.kelurahan ? ` / ${b.kelurahan}` : ''}`}>
              {b.kecamatan} {b.kelurahan ? `/ ${b.kelurahan}` : ''}
            </div>
            {(!b.lat || !b.lng) && (
              <div className="text-[11px] text-warning flex items-center gap-1 font-medium">
                <MapPinOff size={10} strokeWidth={2} /> Belum dipetakan
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "judul_kbli",
      header: "Kategori (KBLI)",
      size: 180,
      cell: ({ row }: any) => {
        const b = row.original;
        return (
          <div className="text-sm font-normal text-muted-foreground line-clamp-2 max-w-[180px]" title={b.judul_kbli}>{b.judul_kbli || '-'}</div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }: any) => {
        const b = row.original;
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              b.status === "Aktif" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
              b.status === "Pending" && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
              (b.status === "Tidak Aktif" || !b.status) && "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20"
            )}
          >
            {b.status || 'Tidak Aktif'}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 60,
      enableHiding: false,
      cell: ({ row }: any) => {
        const b = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="ml-auto flex items-center justify-center h-8 w-8 p-0 rounded-md shadow-none hover:bg-muted/50 data-[state=open]:bg-muted/50 cursor-pointer" aria-label="Aksi" />}>
              <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openDetailModal(b)}>
                <Eye className="mr-2 opacity-60" size={16} strokeWidth={2} />
                <span>Lihat Detail</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditModal(b)}>
                <Edit className="mr-2 opacity-60" size={16} strokeWidth={2} />
                <span>Edit Data</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(b.id)}>
                <Trash2 className="mr-2 opacity-60" size={16} strokeWidth={2} />
                <span>Hapus</span>
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ], []);

  const table = useReactTable({
    data: businesses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      rowSelection,
      columnVisibility,
    }
  });

  const activeFiltersCount = Object.values(activeFilters).filter(val => val !== "").length;
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-5" ref={pageTopRef}>
      {alertMsg && (
        <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            <p className="font-semibold">Perhatian</p>
            <p className="opacity-90 mt-0.5">{alertMsg}</p>
          </div>
        </div>
      )}

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Usaha</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola data perizinan usaha yang terdaftar di sistem.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" Icon={Upload} onClick={() => setIsImportOpen(true)}>Import CSV</Btn>
          <Btn variant="outline" Icon={FileSpreadsheet} onClick={handleExport}>Export</Btn>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Contextual Action Button */}
          {table.getSelectedRowModel().rows.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" className="whitespace-nowrap" />}>
                <Trash className="-ms-1 me-2 opacity-80" size={16} strokeWidth={2} aria-hidden="true" />
                Hapus ({table.getSelectedRowModel().rows.length})
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                  >
                    <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Ini akan menghapus secara permanen{" "}
                      {table.getSelectedRowModel().rows.length} data usaha yang dipilih.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" onClick={openAddModal} className="whitespace-nowrap">
              <Plus className="-ms-1 me-2 opacity-80" size={16} strokeWidth={2} aria-hidden="true" />
              Tambah Usaha
            </Button>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(searchTerm) && "pe-9",
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari NIB, Nama Usaha..."
              type="text"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
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
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          
          {/* Popover Filters */}
          <Popover 
            open={isFilterOpen} 
            onOpenChange={(open) => {
              setIsFilterOpen(open);
              if (open) setLocalFilters(activeFilters);
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
              {hasActiveFilters && (
                <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                  {activeFiltersCount}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="space-y-3">
                  {["Aktif", "Pending", "Tidak Aktif"].map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleLocalStatusChange(checked, value)}
                      />
                      <Label
                        htmlFor={`${id}-${i}`}
                        className="flex grow justify-between gap-2 font-normal cursor-pointer"
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="h-px bg-border/50" />
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Lokasi</div>
                  <SelectField
                    value={localFilters.kecamatan}
                    onChange={(e: any) => setLocalSingleFilter('kecamatan', e.target.value)}
                    options={[
                      { value: "", label: "Semua Kecamatan" },
                      ...kecamatanOptions.map(k => ({ value: k, label: k }))
                    ]}
                  />
                  <SelectField
                    value={localFilters.kelurahan}
                    onChange={(e: any) => setLocalSingleFilter('kelurahan', e.target.value)}
                    disabled={!localFilters.kecamatan || localFilters.kecamatan === "Semua"}
                    options={[
                      { value: "", label: "Semua Kelurahan" },
                      ...kelurahanOptions.map(k => ({ value: k, label: k }))
                    ]}
                  />
                </div>
                
                <div className="h-px bg-border/50" />
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Kategori</div>
                  <SelectField
                    value={localFilters.kategori}
                    onChange={(e: any) => setLocalSingleFilter('kategori', e.target.value)}
                    options={[
                      { value: "", label: "Semua Kategori" },
                      ...categories.map(c => ({ value: c.nama, label: c.nama }))
                    ]}
                  />
                </div>
                
                <div className="flex gap-2 mt-4 pt-2">
                  <Button variant="outline" className="flex-1" onClick={resetLocalFilters}>
                    Reset
                  </Button>
                  <Button variant="default" className="flex-1" onClick={applyFilters}>
                    Terapkan
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <Columns3
                className="-ms-1 me-2 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              View
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id === 'nama_perusahaan' ? 'Nama Usaha' : 
                       column.id === 'nama_pemilik' ? 'Pemilik' :
                       column.id === 'kecamatan' ? 'Lokasi' :
                       column.id === 'judul_kbli' ? 'Kategori' :
                       column.id === 'status' ? 'Status' : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>

      {/* Data Table */}
      <div className={cn(
        "overflow-hidden rounded-lg border border-border bg-background transition-opacity duration-200 relative",
        loading && businesses.length > 0 ? "opacity-60 pointer-events-none" : "opacity-100"
      )}>
        {loading && businesses.length > 0 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 overflow-hidden z-10">
            <div className="h-full bg-primary animate-[progress_1.5s_ease-in-out_infinite] w-1/3" />
          </div>
        )}
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header: any) => (
                  <TableHead 
                    key={header.id} 
                    style={{ width: `${header.getSize()}px` }}
                    className="h-11"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && businesses.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col, j) => (
                    <TableCell key={`skeleton-${i}-${j}`} className="px-4 py-4 align-middle">
                      <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center align-middle">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mb-1">
                      <Inbox size={20} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-foreground">Belum ada data usaha</p>
                    <p className="text-xs text-muted-foreground">Coba ubah kata pencarian atau filter yang digunakan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="last:py-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {!loading && businesses.length > 0 && (
        <div className="flex items-center justify-between gap-8 pt-2">
          {/* Results per page */}
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="max-sm:sr-only text-muted-foreground font-normal">
              Baris per halaman
            </Label>
            <Select
              value={perPage.toString()}
              disabled={loading}
              onValueChange={(value) => {
                setPerPage(Number(value));
                isPaginationAction.current = true;
                setPage(1);
              }}
            >
              <SelectTrigger id={id} className="w-fit whitespace-nowrap h-8">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                {[5, 10, 25, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Page number information */}
          <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
            <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
              <span className="text-foreground">
                {(page - 1) * perPage + 1}-
                {Math.min(page * perPage, totalItems)}
              </span>{" "}
              dari <span className="text-foreground">{totalItems}</span>
            </p>
          </div>

          {/* Pagination buttons */}
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
                    onClick={() => {
                      isPaginationAction.current = true;
                      setPage(1);
                    }}
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
                    onClick={() => {
                      isPaginationAction.current = true;
                      setPage(p => Math.max(1, p - 1));
                    }}
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
                    onClick={() => {
                      isPaginationAction.current = true;
                      setPage(p => Math.min(totalPages, p + 1));
                    }}
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
                    onClick={() => {
                      isPaginationAction.current = true;
                      setPage(totalPages);
                    }}
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

      {/* Modals */}
      <DataUsahaDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        business={selectedBusiness} 
      />
      <DataUsahaFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        business={selectedBusiness}
        onSuccess={() => {
          setIsFormOpen(false);
          setRefreshTrigger(p => p + 1);
        }}
      />
      <DataUsahaImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => {
          if (page === 1) {
            setRefreshTrigger(p => p + 1);
          } else {
            setPage(1);
          }
        }} 
      />
    </div>
  );
}
