import React, { useState, useEffect, useRef } from "react";
import { MapPinned, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FilterCombobox from "./FilterCombobox";

export type NavbarProps = {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onFocus?: () => void;
  onFilterChange?: (filters: any[]) => void;
  searchResults?: any[];
  isSearching?: boolean;
  searchError?: string;
  onSelectResult?: (result: any) => void;
};

export function Navbar({ 
  onSearch, 
  searchQuery = "", 
  onFocus, 
  onFilterChange,
  searchResults = [],
  isSearching = false,
  searchError = "",
  onSelectResult
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
    if (searchQuery.length > 0 && !isSearchExpanded) {
      setIsSearchExpanded(true);
    }
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setLocalQuery("");
    onSearch?.("");
  };

  useEffect(() => {
    if (isSearchExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchExpanded]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none">
      <motion.nav
        layout
        className="pointer-events-auto bg-card border border-border shadow-md rounded-full px-4 py-2 flex items-center justify-between gap-4 w-auto min-h-[52px]"
      >
        {/* Logo */}
        <motion.div layout className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-primary/10 p-1.5 rounded-full text-primary flex items-center justify-center">
            <MapPinned size={18} />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight hidden sm:block whitespace-nowrap">Map Perizinan</span>
        </motion.div>

        {/* Search Container */}
        <motion.div
          layout
          className={`flex items-center rounded-full overflow-hidden transition-colors duration-300 ${isSearchExpanded ? 'bg-muted/30 border border-border px-3 py-1.5' : 'px-1.5 py-1.5 border border-transparent'}`}
        >
          <motion.div
            layout
            initial={false}
            animate={{ width: isSearchExpanded ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 280) : 32 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="flex items-center overflow-hidden relative h-8"
          >
            {/* Search Icon */}
            <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-8 pointer-events-none">
              <Search size={isSearchExpanded ? 16 : 20} className={`transition-colors duration-300 ${isSearchExpanded ? 'text-muted-foreground' : 'text-muted-foreground hover:text-primary'}`} />
            </div>

            {/* Click target when collapsed */}
            {!isSearchExpanded && (
              <button
                className="absolute inset-0 z-10 w-full h-full cursor-pointer rounded-full"
                onClick={() => setIsSearchExpanded(true)}
                aria-label="Search"
              />
            )}

            {/* Input & Close Button */}
            <div className={`flex items-center gap-2 pl-8 w-full h-full transition-opacity duration-200 ${isSearchExpanded ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari usaha, NIB..."
                value={localQuery}
                onChange={handleSearchChange}
                onFocus={onFocus}
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
              />
              <button
                className="p-1 text-muted-foreground hover:text-foreground rounded-full flex-shrink-0 relative z-10 transition-colors"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Desktop Links & Mobile Toggle */}
        <motion.div layout className="flex items-center flex-shrink-0">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <FilterCombobox onChange={onFilterChange} />
            <a href="/map" className="text-primary font-bold whitespace-nowrap px-2">Peta</a>
          </div>

          <button
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-full transition-colors ml-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </motion.div>
      </motion.nav>

      {/* Search Dropdown */}
      <AnimatePresence>
        {isSearchExpanded && searchQuery.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[calc(100vw-2rem)] max-w-lg bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-50 flex flex-col"
          >
            {isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Mencari data...</div>
            ) : searchError ? (
              <div className="p-4 text-center text-sm text-danger">{searchError}</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm font-semibold text-foreground">Data tidak ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">Tidak ada usaha yang cocok dengan "{searchQuery}"</p>
              </div>
            ) : (
              <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto py-2 flex flex-col">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => {
                      onSelectResult?.(result);
                      setIsSearchExpanded(false);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-muted active:bg-muted/80 transition-colors flex items-start gap-3 border-b border-border/30 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <MapPinned size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{result.nama_perusahaan}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
                        <span className="font-mono text-primary/70 bg-primary/5 px-1 rounded">{result.nib || 'N/A'}</span>
                        <span>&middot;</span>
                        <span className="truncate">{result.kecamatan_usaha || result.judul_kbli}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && !isSearchExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden pointer-events-auto mt-2 w-full bg-card border border-border shadow-lg rounded-2xl p-4 flex flex-col gap-4"
          >
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">Beranda</a>
            <a href="/map" className="text-sm font-bold text-primary">Peta</a>
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase">Filter Map</span>
              <FilterCombobox onChange={onFilterChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navbar;
