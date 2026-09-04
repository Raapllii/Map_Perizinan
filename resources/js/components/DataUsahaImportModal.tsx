import { useState, useRef, useEffect } from "react";
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { Btn } from "./ui";

interface DataUsahaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportProgressData {
  import_id?: string;
  status?: "processing" | "completed" | "failed" | "not_found";
  total_rows?: number;
  processed_rows?: number;
  percentage?: number;
  started_at?: number;
  elapsed_seconds?: number;
  rows_per_second?: number;
  estimated_remaining_seconds?: number;
  message?: string;
  imported?: number;
  updated?: number;
  failed?: number;
}

export default function DataUsahaImportModal({ isOpen, onClose, onSuccess }: DataUsahaImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading" | "importing" | "completed" | "error">("idle");
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [progress, setProgress] = useState<ImportProgressData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const resetModalState = () => {
    stopPolling();
    setFile(null);
    setLoading(false);
    setError("");
    setSuccess("");
    setPhase("idle");
    setUploadPercent(0);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (loading && phase !== "completed" && phase !== "error") {
      if (!confirm("Proses import sedang berjalan di latar belakang. Yakin ingin menutup modal?")) {
        return;
      }
    }
    resetModalState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();

      if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
        setFile(null);
        setError("Format file harus berupa CSV atau Excel (.csv / .xlsx).");
        return;
      }

      if (selected.size > 50 * 1024 * 1024) {
        setFile(null);
        setError("Ukuran file terlalu besar. Maksimal 50MB.");
        return;
      }

      setFile(selected);
    }
  };

  const startPolling = (importId: string) => {
    stopPolling();

    const checkProgress = async () => {
      try {
        const res = await axios.get(`/api/admin/database/import-progress/${importId}`);
        if (!res.data) return;

        const data: ImportProgressData = res.data;
        setProgress(data);

        if (data.status === "completed") {
          stopPolling();
          setPhase("completed");
          setSuccess(data.message || "Import data selesai.");
          setLoading(false);
          onSuccess();
        } else if (data.status === "failed") {
          stopPolling();
          setPhase("error");
          setError(data.message || "Gagal mengimport data.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error polling import progress:", err);
        // If server returns error, don't immediately abort unless it's a 404
        if (err.response?.status === 404) {
          stopPolling();
          setPhase("error");
          setError("Proses import tidak ditemukan atau telah kadaluarsa.");
          setLoading(false);
        }
      }
    };

    // Run first check after a slight delay, then interval 800ms
    timeoutRef.current = setTimeout(() => {
      checkProgress();
      pollIntervalRef.current = setInterval(checkProgress, 800);
    }, 400);
  };

  const handleImport = async () => {
    if (!file) {
      setError("Pilih file CSV atau Excel terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setPhase("uploading");
    setUploadPercent(0);
    setProgress(null);

    const importId = "import_" + Date.now().toString() + "_" + Math.random().toString(36).substring(2, 9);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_id", importId);

    try {
      // PHASE 1: Upload with Axios onUploadProgress
      const res = await axios.post("/api/admin/database/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
            setUploadPercent(percent);
          }
        }
      });

      // Upload finished, backend dispatched background process
      setPhase("importing");
      const targetImportId = res.data?.import_id || importId;
      startPolling(targetImportId);

    } catch (err: any) {
      stopPolling();
      console.error(err);
      setPhase("error");
      setError(err.response?.data?.message || "Terjadi kesalahan saat mengupload file.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Import Data OSS (CSV / Excel)</h2>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" 
            disabled={loading && phase !== "completed" && phase !== "error"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Unggah file CSV atau Excel (.xlsx) data OSS untuk memperbarui atau menambahkan data usaha ke dalam sistem.
          </p>

          <div 
            className={`border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${loading ? 'opacity-50 pointer-events-none' : 'hover:bg-muted/30 cursor-pointer'}`}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <FileSpreadsheet className="text-primary mb-3" size={40} />
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <Upload className="text-muted-foreground mb-3" size={40} />
                <p className="text-sm font-semibold text-foreground">Klik untuk memilih file CSV atau Excel</p>
                <p className="text-xs text-muted-foreground mt-1">Mendukung format .csv dan .xlsx (Maksimal 50MB)</p>
              </>
            )}
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {/* PHASE 1: Uploading */}
          {phase === "uploading" && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-foreground">Uploading...</p>
                <p className="text-sm font-bold text-primary">{uploadPercent}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-200" 
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Mengunggah file ke server...</p>
            </div>
          )}

          {/* PHASE 2: Importing / Processing */}
          {phase === "importing" && progress && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-foreground">Mengimport data...</p>
                <p className="text-sm font-bold text-primary">{progress.percentage || 0}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-3 overflow-hidden">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.percentage || 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-1">
                <span>{(progress.processed_rows || 0).toLocaleString("id-ID")} / {(progress.total_rows || 0).toLocaleString("id-ID")} data</span>
                <span>Kecepatan: {(progress.rows_per_second || 0).toLocaleString("id-ID")} data/detik</span>
              </div>
              {progress.estimated_remaining_seconds !== undefined && progress.estimated_remaining_seconds > 0 ? (
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  Perkiraan selesai: ± {progress.estimated_remaining_seconds > 60 
                    ? `${Math.floor(progress.estimated_remaining_seconds / 60)} menit ${progress.estimated_remaining_seconds % 60} detik` 
                    : `${progress.estimated_remaining_seconds} detik`}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2 font-medium">Memperkirakan waktu...</div>
              )}
            </div>
          )}

          {/* PHASE 3: Completed */}
          {phase === "completed" && (
            <div className="bg-success/10 p-4 rounded-xl border border-success/20 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-success flex items-center gap-2">
                  <CheckCircle size={16} /> Import selesai
                </p>
                <p className="text-sm font-bold text-success">100%</p>
              </div>
              <div className="w-full bg-success/20 rounded-full h-2.5 mb-3 overflow-hidden">
                <div className="bg-success h-2.5 rounded-full w-full" />
              </div>
              {progress && (
                <div className="text-xs text-success/80 flex flex-col sm:flex-row justify-between gap-1 font-medium">
                  <span>{(progress.processed_rows || progress.total_rows || 0).toLocaleString("id-ID")} / {(progress.total_rows || 0).toLocaleString("id-ID")} data</span>
                  <span>Waktu: {progress.elapsed_seconds && progress.elapsed_seconds > 60 
                    ? `${Math.floor(progress.elapsed_seconds / 60)} menit ${progress.elapsed_seconds % 60} detik` 
                    : `${progress?.elapsed_seconds || 0} detik`}
                  </span>
                </div>
              )}
              {progress && (progress.imported !== undefined || progress.updated !== undefined) && (
                <div className="mt-2 pt-2 border-t border-success/20 text-xs text-success/90 flex gap-3 font-medium">
                  <span>Baru: {(progress.imported || 0).toLocaleString("id-ID")}</span>
                  <span>Diupdate: {(progress.updated || 0).toLocaleString("id-ID")}</span>
                  {progress.failed ? <span>Gagal: {(progress.failed).toLocaleString("id-ID")}</span> : null}
                </div>
              )}
            </div>
          )}

          {/* Error Feedback */}
          {error && (
            <div className="bg-danger/10 text-danger px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <p className="whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Success Feedback */}
          {success && (
            <div className="bg-success/10 text-success px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
              <CheckCircle className="shrink-0 mt-0.5" size={16} />
              <p>{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          {phase === "completed" ? (
            <Btn variant="primary" onClick={handleClose}>
              Selesai
            </Btn>
          ) : (
            <>
              <Btn variant="outline" onClick={handleClose} disabled={loading && phase !== "error"}>
                Batal
              </Btn>
              <Btn variant="primary" onClick={handleImport} disabled={!file || loading}>
                {loading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Memproses...</>
                ) : "Mulai Import"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
