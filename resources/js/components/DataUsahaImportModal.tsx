import { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { Btn } from "./ui";

interface DataUsahaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DataUsahaImportModal({ isOpen, onClose, onSuccess }: DataUsahaImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading" | "importing" | "completed" | "error">("idle");
  const [progress, setProgress] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === "text/csv" || selected.name.endsWith(".csv")) {
        setFile(selected);
      } else {
        setFile(null);
        setError("File harus berformat CSV.");
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Pilih file CSV terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setPhase("uploading");
    setProgress(null);

    const importId = Date.now().toString() + Math.random().toString(36).substring(7);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_id", importId);

    // Start polling after 1s (giving time for upload to commence)
    setTimeout(() => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`/api/admin/database/import-progress/${importId}`);
          if (res.data) {
            setPhase("importing");
            setProgress(res.data);
            if (res.data.status === 'completed' || res.data.status === 'failed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        } catch (e) {
          // Ignore 404s or errors during early polling
        }
      }, 1000);
    }, 1000);

    try {
      const res = await axios.post("/api/admin/database/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setPhase("completed");
      setProgress((prev: any) => ({
        ...prev, 
        percentage: 100, 
        status: 'completed',
        total_rows: prev?.total_rows || res.data.imported + res.data.updated,
        elapsed_seconds: prev?.elapsed_seconds || 0
      }));
      setSuccess(res.data.message || "Berhasil mengimport data.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess("");
        setPhase("idle");
        setProgress(null);
      }, 2500);
    } catch (err: any) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      console.error(err);
      setPhase("error");
      setError(err.response?.data?.message || "Terjadi kesalahan saat mengupload file.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Import Data OSS (CSV)</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Unggah file CSV DP Proyek OSS 2024 untuk memperbarui atau menambahkan data usaha ke dalam sistem.
          </p>

          <div 
            className={`border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${loading ? 'opacity-50 pointer-events-none' : 'hover:bg-muted/30 cursor-pointer'}`}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <FileText className="text-primary mb-3" size={40} />
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <Upload className="text-muted-foreground mb-3" size={40} />
                <p className="text-sm font-semibold text-foreground">Klik untuk memilih file CSV</p>
                <p className="text-xs text-muted-foreground mt-1">Maksimal 50MB</p>
              </>
            )}
            <input 
              type="file" 
              accept=".csv,text/csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {phase === "uploading" && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-semibold mb-2">Mengupload file...</p>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div className="bg-primary h-2.5 rounded-full w-[100%] animate-pulse"></div>
              </div>
            </div>
          )}

          {phase === "importing" && progress && progress.status === 'processing' && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold">Mengimport data...</p>
                <p className="text-sm font-bold text-primary">{progress.percentage}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-3">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress.percentage}%` }}></div>
              </div>
              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-1">
                <span>{(progress.processed_rows || 0).toLocaleString("id-ID")} / {(progress.total_rows || 0).toLocaleString("id-ID")} data</span>
                <span>Kecepatan: {(progress.rows_per_second || 0).toLocaleString("id-ID")} data/detik</span>
              </div>
              {progress.estimated_remaining_seconds > 0 ? (
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  Perkiraan selesai: ± {progress.estimated_remaining_seconds > 60 ? `${Math.floor(progress.estimated_remaining_seconds / 60)} menit ${progress.estimated_remaining_seconds % 60} detik` : `${progress.estimated_remaining_seconds} detik`}
                </div>
              ) : (progress.processed_rows === 0) ? (
                <div className="text-xs text-muted-foreground mt-2 font-medium">Memperkirakan waktu...</div>
              ) : null}
            </div>
          )}

          {phase === "completed" && (
            <div className="bg-success/10 p-4 rounded-xl border border-success/20 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-success flex items-center gap-2"><CheckCircle size={16} /> Import selesai</p>
                <p className="text-sm font-bold text-success">100%</p>
              </div>
              <div className="w-full bg-success/20 rounded-full h-2.5 mb-3">
                <div className="bg-success h-2.5 rounded-full w-full"></div>
              </div>
              {progress && (
                <div className="text-xs text-success/80 flex flex-col sm:flex-row justify-between gap-1 font-medium">
                  <span>{(progress.total_rows || 0).toLocaleString("id-ID")} / {(progress.total_rows || 0).toLocaleString("id-ID")} data</span>
                  <span>Waktu: {progress.elapsed_seconds > 60 ? `${Math.floor(progress.elapsed_seconds / 60)} menit ${progress.elapsed_seconds % 60} detik` : `${progress.elapsed_seconds || 0} detik`}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-danger/10 text-danger px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-success/10 text-success px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
              <CheckCircle className="shrink-0 mt-0.5" size={16} />
              <p>{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose} disabled={loading}>Batal</Btn>
          <Btn variant="primary" onClick={handleImport} disabled={!file || loading}>
            {loading ? (
              <><Loader2 className="animate-spin mr-2" size={16} /> Memproses...</>
            ) : "Mulai Import"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
