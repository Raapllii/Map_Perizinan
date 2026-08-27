import { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/admin/database/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setSuccess(res.data.message || "Berhasil mengimport data.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
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
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
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
            />
          </div>

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
