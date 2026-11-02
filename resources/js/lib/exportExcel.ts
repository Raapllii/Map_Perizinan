import axios from "axios";

export function showExportToast(message: string, type: "success" | "error") {
  const toast = document.createElement("div");
  const bgClass =
    type === "success"
      ? "bg-emerald-600 text-white border border-emerald-500/30"
      : "bg-destructive text-destructive-foreground border border-destructive/30";
  toast.className = `fixed bottom-4 right-4 ${bgClass} px-4 py-2.5 rounded-lg shadow-lg z-[150] font-medium text-xs sm:text-sm flex items-center gap-2 transition-all animate-in slide-in-from-bottom-5`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

export async function downloadRekapitulasiExcel(params: Record<string, any> = {}): Promise<boolean> {
  try {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "" && v !== "Semua") {
        cleanParams[k] = String(v).trim();
      }
    });

    const response = await axios.get("/api/admin/dashboard/export/excel", {
      params: cleanParams,
      responseType: "blob",
    });

    // Extract filename from Content-Disposition if available
    const disposition = response.headers?.["content-disposition"] || "";
    const today = new Date().toISOString().slice(0, 10);
    let filename = `Rekapitulasi_Data_Perizinan_${today}.xlsx`;

    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, "").trim();
    }

    const blob = new Blob([response.data], {
      type:
        response.headers?.["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    showExportToast(`Berhasil mengekspor ${filename}`, "success");
    return true;
  } catch (error: any) {
    console.error("Gagal mengekspor Excel:", error);
    showExportToast(
      error?.response?.data?.message || "Gagal mengekspor data rekapitulasi ke Excel.",
      "error"
    );
    return false;
  }
}

export async function downloadRekapitulasiSurveiExcel(params: Record<string, any> = {}): Promise<boolean> {
  try {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "" && v !== "Semua") {
        cleanParams[k] = String(v).trim();
      }
    });

    const response = await axios.get("/api/admin/service-surveys/export", {
      params: cleanParams,
      responseType: "blob",
    });

    // Extract filename from Content-Disposition if available
    const disposition = response.headers?.["content-disposition"] || "";
    const today = new Date().toISOString().slice(0, 10);
    let filename = `Rekapitulasi_Survei_Pelayanan_${today}.xlsx`;

    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, "").trim();
    }

    const blob = new Blob([response.data], {
      type:
        response.headers?.["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    showExportToast(`Berhasil mengekspor ${filename}`, "success");
    return true;
  } catch (error: any) {
    console.error("Gagal mengekspor Excel survei:", error);
    showExportToast(
      error?.response?.data?.message || "Gagal mengekspor data rekapitulasi survei ke Excel.",
      "error"
    );
    return false;
  }
}

