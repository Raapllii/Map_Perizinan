"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { ListFilter, X, Check, Tag, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Command } from "cmdk";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export enum FilterType {
  KATEGORI = "Kategori",
  RISIKO = "Risiko",
  STATUS = "Status",
}

export enum FilterOperator {
  IS = "adalah",
  IS_NOT = "bukan",
  IS_ANY_OF = "salah satu dari",
}

export const kategoriOptions = ["PB-UMKU", "Non PB-UMKU", "Proyek Baru"];
export const risikoOptions = ["Sangat Rendah", "Rendah", "Menengah Rendah", "Menengah Tinggi", "Tinggi", "Sangat Tinggi"];
export const statusOptions = ["Aktif", "Non-Aktif", "Dalam Proses"];

export type FilterOption = {
  name: string;
  icon?: React.ReactNode;
};

export type Filter = {
  id: string;
  type: FilterType;
  operator: FilterOperator;
  value: string[];
};

export const filterViewOptions: FilterOption[] = [
  { name: FilterType.KATEGORI, icon: <Tag className="size-3.5" /> },
  { name: FilterType.RISIKO, icon: <AlertTriangle className="size-3.5" /> },
  { name: FilterType.STATUS, icon: <ShieldCheck className="size-3.5" /> },
];

export const filterViewToFilterOptions: Record<FilterType, FilterOption[]> = {
  [FilterType.KATEGORI]: kategoriOptions.map(name => ({ name })),
  [FilterType.RISIKO]: risikoOptions.map(name => ({ name })),
  [FilterType.STATUS]: statusOptions.map(name => ({ name })),
};

/* -------------------------------------------------------------------------- */
/* Filter Operator Dropdown                                                   */
/* -------------------------------------------------------------------------- */

const FilterOperatorDropdown = ({ filterType, operator, filterValues, setOperator }: any) => {
  const operators = filterValues.length > 1 
    ? [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT]
    : [FilterOperator.IS, FilterOperator.IS_NOT];

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger className="shrink-0 bg-background border border-border px-2 py-1.5 text-foreground transition hover:bg-muted outline-none text-xs font-medium flex items-center rounded-md">
        {operator}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content align="start" className="z-[70] w-32 min-w-fit bg-card border border-border rounded-md shadow-md p-1 outline-none text-sm font-medium">
          {operators.map((item) => (
            <DropdownMenuPrimitive.Item
              key={item}
              onClick={() => setOperator(item)}
              className="px-2 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-muted/50 focus:bg-muted/50 text-foreground"
            >
              {item}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

/* -------------------------------------------------------------------------- */
/* Filter Value Combobox                                                      */
/* -------------------------------------------------------------------------- */

const FilterValueCombobox = ({ filterType, filterValues, setFilterValues }: any) => {
  const [open, setOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const nonSelected = filterViewToFilterOptions[filterType as FilterType]?.filter((f: any) => !filterValues.includes(f.name)) || [];

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setTimeout(() => setCommandInput(""), 200); }}>
      <PopoverPrimitive.Trigger className="shrink-0 rounded-md bg-background border border-border px-2 py-1.5 text-foreground transition hover:bg-muted outline-none text-xs font-medium flex items-center">
        {filterValues.length === 1 ? filterValues[0] : `${filterValues.length} dipilih`}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content className="z-[70] w-[200px] p-0 bg-card border border-border rounded-md shadow-md overflow-hidden">
          <Command className="w-full flex flex-col bg-transparent">
            <Command.Input
              placeholder={filterType}
              value={commandInput}
              onValueChange={setCommandInput}
              className="h-9 px-3 border-b border-border bg-transparent outline-none text-sm w-full"
            />
            <Command.List className="max-h-[200px] overflow-y-auto p-1">
              <Command.Empty className="py-2 text-center text-xs text-muted-foreground">Tidak ditemukan.</Command.Empty>
              
              {filterValues.length > 0 && (
                <Command.Group>
                  {filterValues.map((value: string) => (
                    <Command.Item
                      key={value}
                      value={value}
                      onSelect={() => {
                        setFilterValues(filterValues.filter((item: string) => item !== value));
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer aria-selected:bg-muted/50 group"
                    >
                      <div className="w-4 h-4 rounded-sm border border-primary bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="size-3" />
                      </div>
                      <span className="text-foreground">{value}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              
              {nonSelected.length > 0 && (
                <>
                  {filterValues.length > 0 && <div className="h-px bg-border my-1" />}
                  <Command.Group>
                    {nonSelected.map((filter: any) => (
                      <Command.Item
                        key={filter.name}
                        value={filter.name}
                        onSelect={() => {
                          setFilterValues([...filterValues, filter.name]);
                          setOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer aria-selected:bg-muted/50 group"
                      >
                        <div className="w-4 h-4 rounded-sm border border-border group-aria-selected:border-primary flex items-center justify-center" />
                        <span className="text-foreground">{filter.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

/* -------------------------------------------------------------------------- */
/* Active Filters Container                                                   */
/* -------------------------------------------------------------------------- */

const ActiveFilters = ({ filters, setFilters }: any) => {
  return (
    <div className="flex flex-col gap-4">
      {filters.filter((f: any) => f.value?.length > 0).map((filter: any) => {
        const icon = filterViewOptions.find(o => o.name === filter.type)?.icon;
        return (
          <div key={filter.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              {icon} {filter.type}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <FilterOperatorDropdown
                filterType={filter.type}
                operator={filter.operator}
                filterValues={filter.value}
                setOperator={(operator: any) => {
                  setFilters((prev: any) => prev.map((item: any) => item.id === filter.id ? { ...item, operator } : item));
                }}
              />
              
              <FilterValueCombobox
                filterType={filter.type}
                filterValues={filter.value}
                setFilterValues={(val: any) => {
                  setFilters((prev: any) => prev.map((item: any) => item.id === filter.id ? { ...item, value: val } : item));
                }}
              />
              
              <button
                onClick={() => setFilters((prev: any) => prev.filter((item: any) => item.id !== filter.id))}
                className="flex items-center justify-center h-7 w-7 shrink-0 rounded-md bg-muted text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Hapus Filter"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Combobox Demo                                                         */
/* -------------------------------------------------------------------------- */

export function FilterCombobox({ onChange }: { onChange?: (filters: Filter[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<FilterType | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    if (onChange) {
      onChange(filters);
    }
  }, [filters, onChange]);

  const activeFilters = filters.filter((f) => f.value?.length > 0);

  return (
    <div className="relative inline-flex">
      <PopoverPrimitive.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setTimeout(() => { setSelectedView(null); setCommandInput(""); }, 200); }}>
        <PopoverPrimitive.Trigger className={cn("group inline-flex h-9 items-center justify-center gap-2 rounded-full text-sm font-medium transition px-4 relative flex-shrink-0 whitespace-nowrap outline-none", activeFilters.length > 0 ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground")}>
          <ListFilter className="size-4 shrink-0 transition-all" />
          <span>Filter</span>
          {activeFilters.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilters.length}
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
            className="z-[70] w-[calc(100vw-24px)] md:w-[340px] max-w-[360px] p-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                Filter
                {activeFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilters.length}
                  </span>
                )}
              </span>
              {activeFilters.length > 0 && (
                <button onClick={() => setFilters([])} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Reset Semua
                </button>
              )}
            </div>

            {/* Active Filters list */}
            {activeFilters.length > 0 && (
              <div className="p-4 border-b border-border max-h-[40vh] overflow-y-auto bg-card">
                <ActiveFilters filters={filters} setFilters={setFilters} />
              </div>
            )}

            <Command className="w-full flex flex-col bg-transparent">
              <Command.Input
                placeholder={selectedView ? selectedView : "Tambah filter..."}
                value={commandInput}
                onValueChange={setCommandInput}
                className="h-11 px-4 border-b border-border bg-transparent outline-none text-sm w-full"
              />
              <Command.List className="max-h-[250px] overflow-y-auto p-1.5">
                <Command.Empty className="py-3 text-center text-xs text-muted-foreground">Tidak ditemukan.</Command.Empty>

                {selectedView ? (
                  <Command.Group>
                    {filterViewToFilterOptions[selectedView].map((filter) => (
                      <Command.Item
                        key={filter.name}
                        value={filter.name}
                        onSelect={() => {
                          setFilters(prev => {
                            // Cek jika filter dengan tipe yang sama sudah ada
                            const existing = prev.find(f => f.type === selectedView);
                            if (existing) {
                              if (existing.value.includes(filter.name)) return prev;
                              return prev.map(f => f.type === selectedView ? { ...f, value: [...f.value, filter.name] } : f);
                            }
                            return [
                              ...prev,
                              {
                                id: crypto.randomUUID(),
                                type: selectedView,
                                operator: FilterOperator.IS,
                                value: [filter.name],
                              }
                            ];
                          });
                          setOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer aria-selected:bg-muted/50 group text-muted-foreground"
                      >
                        <span className="text-foreground">{filter.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : (
                  <Command.Group>
                    {filterViewOptions.map((filter) => (
                      <Command.Item
                        key={filter.name}
                        value={filter.name}
                        onSelect={() => {
                          setSelectedView(filter.name as FilterType);
                          setCommandInput("");
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer aria-selected:bg-muted/50 group text-muted-foreground"
                      >
                        {filter.icon}
                        <span className="text-foreground font-medium">{filter.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

export default FilterCombobox;
