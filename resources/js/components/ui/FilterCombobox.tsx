"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ListFilter, RotateCcw, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { getRiskConfig } from "../../lib/riskUtils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PublicMapFilterState {
  risiko: string;    // 'Semua' | 'Rendah' | 'Menengah Rendah' | 'Menengah Tinggi' | 'Tinggi'
  kecamatan: string; // 'Semua' | string
  kelurahan: string; // 'Semua' | string
  kategori: string;  // 'Semua' | string
}

export const DEFAULT_FILTER_STATE: PublicMapFilterState = {
  risiko: "Semua",
  kecamatan: "Semua",
  kelurahan: "Semua",
  kategori: "Semua",
};

export const RISIKO_OPTIONS = [
  { value: "Semua", label: "Semua Risiko" },
  { value: "Rendah", label: "Risiko Rendah" },
  { value: "Menengah Rendah", label: "Risiko Menengah Rendah" },
  { value: "Menengah Tinggi", label: "Risiko Menengah Tinggi" },
  { value: "Tinggi", label: "Risiko Tinggi" },
];

export function computeActiveFilterCount(state: PublicMapFilterState): number {
  let count = 0;
  if (state.risiko && state.risiko !== "Semua") count++;
  if (state.kecamatan && state.kecamatan !== "Semua") count++;
  if (state.kelurahan && state.kelurahan !== "Semua") count++;
  if (state.kategori && state.kategori !== "Semua") count++;
  return count;
}

export function FilterCombobox({ onChange }: { onChange?: (filters: PublicMapFilterState) => void }) {
  const [open, setOpen] = useState(false);
  
  // Applied filter state (synchronized with parent)
  const [appliedFilters, setAppliedFilters] = useState<PublicMapFilterState>(DEFAULT_FILTER_STATE);

  // Draft filter state (editing inside popover before clicking Terapkan)
  const [draftFilters, setDraftFilters] = useState<PublicMapFilterState>(DEFAULT_FILTER_STATE);

  // Dynamic Options from API
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [kelurahanList, setKelurahanList] = useState<string[]>([]);
  const [kategoriList, setKategoriList] = useState<string[]>([]);

  // 1. Fetch initial Kecamatan & Category options
  useEffect(() => {
    let isMounted = true;

    axios.get<string[]>("/api/locations/kecamatan")
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setKecamatanList(res.data);
        }
      })
      .catch((err) => console.error("Gagal mengambil data kecamatan:", err));

    axios.get<any[]>("/api/categories")
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const names = res.data.map((cat: any) => typeof cat === 'string' ? cat : (cat.name || cat.judul_kbli || '')).filter(Boolean);
          setKategoriList(Array.from(new Set(names)));
        }
      })
      .catch((err) => console.error("Gagal mengambil data kategori:", err));

    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Kelurahan options based on selected draft Kecamatan (Cascading)
  useEffect(() => {
    let isMounted = true;

    let url = "/api/locations/kelurahan";
    if (draftFilters.kecamatan && draftFilters.kecamatan !== "Semua") {
      url += `?kecamatan_usaha=${encodeURIComponent(draftFilters.kecamatan)}`;
    }

    axios.get<string[]>(url)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setKelurahanList(res.data);
        }
      })
      .catch((err) => console.error("Gagal mengambil data kelurahan:", err));

    return () => { isMounted = false; };
  }, [draftFilters.kecamatan]);

  // When popover opens, sync draft with currently applied filters
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftFilters(appliedFilters);
    }
    setOpen(nextOpen);
  };

  const handleKecamatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDraftFilters((prev) => ({
      ...prev,
      kecamatan: val,
      kelurahan: "Semua", // Cascading reset
    }));
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    if (onChange) {
      onChange(draftFilters);
    }
    setOpen(false);
  };

  const handleReset = () => {
    setDraftFilters(DEFAULT_FILTER_STATE);
    setAppliedFilters(DEFAULT_FILTER_STATE);
    if (onChange) {
      onChange(DEFAULT_FILTER_STATE);
    }
    setOpen(false);
  };

  const activeCount = computeActiveFilterCount(appliedFilters);

  return (
    <div className="relative inline-flex">
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger
          type="button"
          className={cn(
            "group inline-flex h-9 items-center justify-center gap-2 rounded-full text-sm font-medium transition px-4 relative flex-shrink-0 whitespace-nowrap outline-none border cursor-pointer",
            activeCount > 0
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground shadow-sm"
          )}
        >
          <ListFilter className="size-4 shrink-0 transition-all" />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="center"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            avoidCollisions
            className="z-[70] w-[calc(100vw-24px)] sm:w-[340px] max-w-[360px] p-0 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                Filter Data
                {activeCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-4 flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto">
              {/* 1. Tingkat Risiko */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Tingkat Risiko</label>
                <div className="relative">
                  <select
                    value={draftFilters.risiko}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, risiko: e.target.value }))}
                    className="w-full h-9 pl-3 pr-8 bg-background border border-border rounded-lg text-xs font-medium text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    {RISIKO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
                {/* Visual Risk Indicator Dot */}
                {draftFilters.risiko !== "Semua" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-0.5 mt-0.5">
                    <span className={cn("size-2 rounded-full inline-block", getRiskConfig(draftFilters.risiko).dotClass)} />
                    <span className="font-semibold text-foreground">{draftFilters.risiko}</span>
                  </div>
                )}
              </div>

              {/* 2. Kecamatan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Kecamatan</label>
                <div className="relative">
                  <select
                    value={draftFilters.kecamatan}
                    onChange={handleKecamatanChange}
                    className="w-full h-9 pl-3 pr-8 bg-background border border-border rounded-lg text-xs font-medium text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    <option value="Semua">Semua Kecamatan</option>
                    {kecamatanList.map((kec) => (
                      <option key={kec} value={kec}>
                        {kec}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* 3. Kelurahan/Desa (Cascading) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Kelurahan/Desa</label>
                <div className="relative">
                  <select
                    value={draftFilters.kelurahan}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, kelurahan: e.target.value }))}
                    className="w-full h-9 pl-3 pr-8 bg-background border border-border rounded-lg text-xs font-medium text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    <option value="Semua">Semua Kelurahan/Desa</option>
                    {kelurahanList.map((kel) => (
                      <option key={kel} value={kel}>
                        {kel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
                {draftFilters.kecamatan !== "Semua" && (
                  <span className="text-[10px] text-muted-foreground pl-0.5">
                    Menampilkan kelurahan di <span className="font-semibold text-foreground">{draftFilters.kecamatan}</span>
                  </span>
                )}
              </div>

              {/* 4. Kategori Usaha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Kategori Usaha</label>
                <div className="relative">
                  <select
                    value={draftFilters.kategori}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, kategori: e.target.value }))}
                    className="w-full h-9 pl-3 pr-8 bg-background border border-border rounded-lg text-xs font-medium text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {kategoriList.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Footer Action Button */}
            <div className="p-3 border-t border-border bg-muted/10 flex justify-end">
              <button
                type="button"
                onClick={handleApply}
                className="w-full sm:w-auto px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

export default FilterCombobox;
