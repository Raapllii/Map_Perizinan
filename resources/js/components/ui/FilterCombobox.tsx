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
      <DropdownMenuPrimitive.Trigger className="shrink-0 bg-muted px-1.5 py-1 text-muted-foreground transition hover:bg-muted/50 hover:text-primary outline-none text-xs flex items-center rounded-sm">
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
      <PopoverPrimitive.Trigger className="shrink-0 rounded-none bg-muted px-1.5 py-1 text-muted-foreground transition hover:bg-muted/50 hover:text-primary outline-none text-xs flex items-center">
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
    <div className="flex flex-wrap gap-2">
      {filters.filter((f: any) => f.value?.length > 0).map((filter: any) => {
        const icon = filterViewOptions.find(o => o.name === filter.type)?.icon;
        return (
          <div key={filter.id} className="flex items-center gap-px text-xs">
            <div className="flex shrink-0 items-center gap-1.5 rounded-l bg-muted px-1.5 py-1 text-muted-foreground border-r border-border/50">
              {icon}
              <span className="font-medium text-foreground">{filter.type}</span>
            </div>
            
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
              className="flex items-center justify-center h-6 w-6 shrink-0 rounded-r-sm bg-muted text-muted-foreground transition hover:bg-muted/50 hover:text-foreground border-l border-border/50"
            >
              <X className="size-3" />
            </button>
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
    <div className="flex flex-wrap gap-2 items-center">
      <ActiveFilters filters={filters} setFilters={setFilters} />

      {activeFilters.length > 0 && (
        <button
          className="h-6 px-2 rounded-sm text-xs font-medium bg-muted text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          onClick={() => setFilters([])}
        >
          Reset
        </button>
      )}

      <PopoverPrimitive.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setTimeout(() => { setSelectedView(null); setCommandInput(""); }, 200); }}>
        <PopoverPrimitive.Trigger className={cn("group flex h-6 items-center justify-center gap-1.5 rounded-sm text-xs transition px-2 hover:bg-muted/50", activeFilters.length > 0 ? "w-6 px-0" : "text-muted-foreground")}>
          <ListFilter className="size-3.5 shrink-0 transition-all group-hover:text-primary" />
          {!activeFilters.length && <span className="font-medium text-foreground">Filter</span>}
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content align="start" className="z-[70] w-[200px] p-0 bg-card border border-border rounded-md shadow-md overflow-hidden">
            <Command className="w-full flex flex-col bg-transparent">
              <Command.Input
                placeholder={selectedView ? selectedView : "Tambah Filter..."}
                value={commandInput}
                onValueChange={setCommandInput}
                className="h-9 px-3 border-b border-border bg-transparent outline-none text-sm w-full"
              />
              <Command.List className="max-h-[250px] overflow-y-auto p-1">
                <Command.Empty className="py-2 text-center text-xs text-muted-foreground">Tidak ditemukan.</Command.Empty>

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
