import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
import axios from 'axios';
import { Search, X, MessageSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "../components/ui/mini-navbar";
import { BusinessDetailCard, BusinessSidePanel } from "../components/ui";
import { FeedbackWidget } from "../components/ui/feedback";
import { useBusinessSearch } from "../hooks/useBusinessSearch";
import PublicAccessModal from "../components/PublicAccessModal";
import MapRiskLegend from "../components/ui/MapRiskLegend";
import {
  isFeedbackAlreadySubmitted,
  markFeedbackAsSubmitted,
  createFeedbackPayload
} from "../lib/feedbackTriggerUtils";

const CityMapLeaflet = lazy(() => import('../components/CityMapLeaflet'));

export default function PublicMapPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [hoveredBusiness, setHoveredBusiness] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [flyTrigger, setFlyTrigger] = useState<any>(null);

  // Visitor Access State
  const [visitor, setVisitor] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem('public_map_visitor');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.nama && parsed.instansi) {
        return parsed;
      }
      sessionStorage.removeItem('public_map_visitor');
      return null;
    } catch {
      return null;
    }
  });
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(!visitor);

  const handleAccessSuccess = (visitorData: any) => {
    setVisitor(visitorData);
    setIsAccessModalOpen(false);
  };

  const handleGantiIdentitas = () => {
    sessionStorage.removeItem("public_map_visitor");
    sessionStorage.removeItem("public_map_feedback_submitted");
    setVisitor(null);
    setMarkers([]);
    setSelectedBusiness(null);
    setHoveredBusiness(null);
    setIsFeedbackOpen(false);
    setFeedbackSubmitted(false);
    setIsAccessModalOpen(true);
  };

  // Feedback States (User-Initiated via Floating Button)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(() => isFeedbackAlreadySubmitted());

  const handleCloseFeedback = () => {
    setIsFeedbackOpen(false);
  };

  const handleFeedbackSubmit = async (data: { rating: string; feedback: string }) => {
    const accessLogId = visitor?.access_log_id || visitor?.id;
    if (!accessLogId) {
      const msg = "Sesi akses tidak valid. Silakan muat ulang halaman.";
      setToastMsg(msg);
      setTimeout(() => setToastMsg(""), 5000);
      throw new Error(msg);
    }

    try {
      const payload = createFeedbackPayload(
        accessLogId,
        data.rating,
        data.feedback,
        selectedBusiness?.id
      );

      await axios.post('/api/public-map-feedback', payload);

      markFeedbackAsSubmitted();
      setFeedbackSubmitted(true);
      setIsFeedbackOpen(false);
      setToastMsg("Terima kasih atas masukan dan penilaian Anda!");
      setTimeout(() => setToastMsg(""), 6000);
    } catch (err: any) {
      console.error("Gagal mengirim feedback:", err);
      const errResponse = err.response?.data;
      const isAccessLogExpired =
        err.response?.status === 422 &&
        (errResponse?.errors?.access_log_id ||
          errResponse?.message?.toLowerCase().includes("log akses") ||
          errResponse?.message?.toLowerCase().includes("sesi"));

      if (isAccessLogExpired) {
        sessionStorage.removeItem("public_map_visitor");
        sessionStorage.removeItem("public_map_feedback_submitted");
        setVisitor(null);
        setIsFeedbackOpen(false);
        setIsAccessModalOpen(true);
        const expiredMsg = "Sesi akses Anda telah berakhir atau tidak valid. Silakan masukkan kembali identitas Anda.";
        setToastMsg(expiredMsg);
        setTimeout(() => setToastMsg(""), 6000);
        throw new Error(expiredMsg);
      }

      const firstValidationErr = errResponse?.errors
        ? (Object.values(errResponse.errors).flat()[0] as string | undefined)
        : undefined;

      const userFriendlyMsg =
        firstValidationErr ||
        errResponse?.message ||
        "Gagal mengirimkan masukan. Silakan coba kembali.";

      setToastMsg(userFriendlyMsg);
      setTimeout(() => setToastMsg(""), 5000);
      throw new Error(userFriendlyMsg);
    }
  };
  
  const { 
    searchQuery, setSearchQuery, 
    searchResults, setSearchResults, 
    isSearching, 
    searchError 
  } = useBusinessSearch();
  
  const [toastMsg, setToastMsg] = useState("");
  
  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [mapType, setMapType] = useState<'peta' | 'satelit'>('peta');

  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [isFetchingMap, setIsFetchingMap] = useState(false);

  // Debounced Bounds & Zoom
  const [mapBounds, setMapBounds] = useState("");
  const [mapZoom, setMapZoom] = useState(12);
  const debounceTimer = useRef<any>(null);

  const handleBoundsChange = useCallback((bounds: string, zoom: number) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setMapBounds(bounds);
      setMapZoom(zoom);
    }, 400);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const minZoom = 8;
    if (!visitor || mapZoom < minZoom || !mapBounds) {
      setMarkers([]);
      setIsFetchingMap(false);
      return;
    }

    let url = `/api/businesses?map=true&zoom=${mapZoom}`;
    if (mapBounds) url += `&bounds=${mapBounds}`;
    
    activeFilters.forEach((f: any) => {
      let key = f.type.toLowerCase();
      if (key === 'risiko') {
        key = 'uraian_risiko_proyek';
      }
      if (f.value && f.value.length > 0) {
        url += `&${key}=${encodeURIComponent(f.value.join(','))}`;
      }
      if (f.operator === 'bukan') {
        url += `&${key}_operator=bukan`;
      }
    });

    const controller = new AbortController();

    setIsFetchingMap(true);
    axios.get(url, { signal: controller.signal })
      .then(res => {
        setMarkers(res.data.data || []);
        setIsFetchingMap(false);
      })
      .catch(err => {
        if (!axios.isCancel(err)) {
          console.error(err);
          setIsFetchingMap(false);
        }
      });

    return () => controller.abort();
  }, [mapBounds, mapZoom, activeFilters, visitor]);


  const saveToHistory = (item: any) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectBusiness = (b: any, fromSearch: boolean = false) => {
    setSelectedBusiness(b);
    setSearchQuery("");
    setSearchResults([]);

    if (fromSearch) {
      saveToHistory(b);
      if (b.latitude && b.longitude) {
        setFlyTrigger({ lat: parseFloat(b.latitude), lng: parseFloat(b.longitude), zoom: 17, ts: Date.now() });
      } else {
        setToastMsg("Data usaha ditemukan, namun belum memiliki titik koordinat lokasi di peta.");
        setTimeout(() => setToastMsg(""), 5000);
      }
    }
  };

  const resetFilters = () => {
    setActiveFilters([]);
  };

  const selected = selectedBusiness || {};

  return (
    <div className="w-screen h-screen overflow-hidden bg-background flex flex-col md:flex-row font-[Inter,sans-serif]">
      {/* Public Visitor Identification Modal */}
      <PublicAccessModal
        isOpen={isAccessModalOpen}
        onSuccess={handleAccessSuccess}
      />

      {/* Visitor Active Badge */}
      {visitor && !isAccessModalOpen && (
        <div className="fixed top-4 left-4 z-[70] hidden sm:flex items-center gap-2 bg-card/95 backdrop-blur-md border border-border shadow-md px-3.5 py-2 rounded-full text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-bold text-foreground truncate max-w-[130px]">{visitor.nama}</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-muted-foreground text-[11px] truncate max-w-[130px]">{visitor.instansi}</span>
          </div>
          <button
            onClick={handleGantiIdentitas}
            className="ml-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            title="Ganti identitas pengunjung"
          >
            Ganti
          </button>
        </div>
      )}

      <Navbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onFocus={() => { if (!searchQuery && searchHistory.length > 0) setSearchResults(searchHistory) }}
        onFilterChange={setActiveFilters}
        searchResults={searchResults}
        isSearching={isSearching}
        searchError={searchError}
        onSelectResult={(result) => handleSelectBusiness(result, true)}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-sm font-medium w-max max-w-[90vw]"
          >
            <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center text-foreground flex-shrink-0">!</div>
            {toastMsg}
            <button onClick={() => setToastMsg("")} className="ml-2 opacity-70 hover:opacity-100"><X size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>




      {/* Main Map Container */}
      <div className="flex-1 relative h-full min-w-0">
        {/* Side Panel (Desktop overlay) or Bottom Sheet (Mobile fixed drawer) */}
        <BusinessSidePanel 
          business={selectedBusiness}
          isMobile={isMobile}
          onClose={() => {
            setSelectedBusiness(null);
          }}
          onDirectionsClick={() => {
            if (selectedBusiness) {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedBusiness.latitude},${selectedBusiness.longitude}`, '_blank');
            }
          }}
        />

        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground font-medium">Memuat Peta WebGIS...</div>}>
            <CityMapLeaflet
              height="100%"
              selectedMarker={selected}
              onSelectMarker={handleSelectBusiness}
              hoveredMarker={hoveredBusiness}
              onHoverMarker={setHoveredBusiness}
              markers={markers}
              onBoundsChange={handleBoundsChange}
              mapType={mapType}
              flyTrigger={flyTrigger}
              isMobile={isMobile}
              renderPopup={(marker) => (
                <BusinessDetailCard
                  business={marker}
                  onClose={() => {
                    setSelectedBusiness(null);
                  }}
                  onDirectionsClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}`, '_blank')}
                />
              )}
            />
          </Suspense>
        </div>

        {/* Zoom Overlay */}
        {mapZoom < 8 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-border text-sm font-semibold text-foreground flex items-center gap-2">
              <Search size={18} className="text-primary" />
              Perbesar peta (zoom in) untuk melihat sebaran data usaha.
            </div>
          </div>
        )}

        {/* Empty State Overlay */}
        {mapZoom >= 8 && markers.length === 0 && activeFilters.length > 0 && !isFetchingMap && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md px-6 py-4 rounded-xl shadow-lg border border-border text-sm font-semibold text-foreground flex flex-col items-center gap-2">
              <Search size={24} className="text-muted-foreground" />
              Tidak ada data yang sesuai dengan filter.
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className={`absolute z-20 flex-col gap-2 transition-opacity duration-300 md:top-4 md:right-4 md:bottom-auto md:left-auto top-auto right-auto left-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] ${isMobile && selectedBusiness ? 'hidden md:flex' : 'flex'}`}>
          <div className="bg-card shadow-sm border border-border flex overflow-hidden p-0.5 md:p-1 gap-1 rounded-lg md:rounded-xl">
            <button onClick={() => setMapType('peta')} className={`px-3 md:px-4 py-1.5 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold transition-colors relative z-10 ${mapType === 'peta' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {mapType === 'peta' && <motion.div layoutId="map-tab" className="absolute inset-0 bg-primary z-[-1] rounded-md md:rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              Peta
            </button>
            <button onClick={() => setMapType('satelit')} className={`px-3 md:px-4 py-1.5 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold transition-colors relative z-10 ${mapType === 'satelit' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {mapType === 'satelit' && <motion.div layoutId="map-tab" className="absolute inset-0 bg-primary z-[-1] rounded-md md:rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              Satelit
            </button>
          </div>
        </div>

        {/* Risk Legend */}
        <MapRiskLegend />

        {/* Floating Feedback Button */}
        <button
          type="button"
          onClick={() => {
            if (!feedbackSubmitted) {
              setIsFeedbackOpen(true);
            }
          }}
          disabled={feedbackSubmitted}
          title={feedbackSubmitted ? "Feedback telah terkirim" : "Beri Feedback"}
          className={`fixed z-[50] bottom-20 right-4 md:bottom-6 md:right-16 flex items-center gap-2 border shadow-lg px-3.5 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
            feedbackSubmitted
              ? "bg-card/80 text-muted-foreground border-border cursor-not-allowed opacity-90"
              : "bg-card/95 hover:bg-card text-foreground border-border shadow-md hover:shadow-xl"
          }`}
        >
          {feedbackSubmitted ? (
            <>
              <Check size={16} className="text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Feedback Terkirim</span>
              <span className="sm:hidden">Terkirim</span>
            </>
          ) : (
            <>
              <MessageSquare size={16} className="text-primary shrink-0" />
              <span>Feedback</span>
            </>
          )}
        </button>

        {/* Centered Feedback Modal Popup */}
        <AnimatePresence>
          {isFeedbackOpen && !feedbackSubmitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer overflow-y-auto"
              onClick={handleCloseFeedback}
            >
              <div
                className="relative w-full max-w-[420px] mx-auto cursor-default flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >

                <FeedbackWidget
                  onClose={handleCloseFeedback}
                  onSubmit={handleFeedbackSubmit}
                  label="Bagaimana pengalaman peta Anda?"
                  placeholder="Tulis masukan atau pengalaman Anda..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Search Overlay (only when searching on mobile) */}
      </div>
    </div>
  );
}

