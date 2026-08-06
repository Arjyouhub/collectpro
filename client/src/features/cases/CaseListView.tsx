import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  RefreshCw,
  Edit3,
  Star,
  FileText,
  SlidersHorizontal,
  Mic,
  MicOff,
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';
import { CollectionCase } from '../../types';
import { useCaseStore } from '../../store/useCaseStore';
import { MapService } from '../../services/mapService';
import { QuickActionDrawer } from './QuickActionDrawer';
import api from '../../api/client';

interface CaseListViewProps {
  cases: CollectionCase[];
  totalCases: number;
  isLoading: boolean;
  onSelectCase: (caseItem: CollectionCase) => void;
  onOpenRouteModal: () => void;
  refetch: () => void;
}

export const CaseListView: React.FC<CaseListViewProps> = ({
  cases,
  totalCases,
  isLoading,
  onSelectCase,
  onOpenRouteModal,
  refetch
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    search,
    portfolio,
    bucket,
    status,
    selectedCasesForRoute,
    setSearch,
    setPortfolio,
    setBucket,
    setStatus,
    resetFilters
  } = useCaseStore();

  const [quickDrawerCase, setQuickDrawerCase] = useState<CollectionCase | null>(null);
  const [priorityCases, setPriorityCases] = useState<Set<string>>(new Set());
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());
  const [isFilterBottomSheetOpen, setIsFilterBottomSheetOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sortOption, setSortOption] = useState<string>('totalPOS_desc');
  const [valueRange, setValueRange] = useState<string>('All');

  const togglePriority = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPriorityCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice dictation is supported on Android Chrome!');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleDeleteCaseFromList = async (caseId: string, custName: string) => {
    if (confirm(`Delete case record for "${custName}"?`)) {
      try {
        await api.delete(`/cases/${caseId}`).catch(() => {});
      } catch (e) {}

      const { customCases } = useCaseStore.getState();
      const updated = customCases.filter((c) => c._id !== caseId);
      try {
        localStorage.setItem('collectpro_custom_cases', JSON.stringify(updated));
      } catch (e) {}
      useCaseStore.setState({ customCases: updated });
      refetch();
    }
  };

  const handleClearCustomPortfolio = async () => {
    if (confirm('Are you sure you want to clear all imported custom portfolio cases?')) {
      useCaseStore.getState().clearCustomCases();
      refetch();
    }
  };

  const [ptpFilter, setPtpFilter] = useState<'All' | 'PTP_Active' | 'Broken_PTP' | 'NPA'>('All');

  // Apply Sort Options & Value Filter
  const displayCases = React.useMemo(() => {
    let result = [...cases];

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by PTP status & broken PTP revisits
    if (ptpFilter === 'PTP_Active') {
      result = result.filter((c) => c.status === 'PTP' && c.ptpDate && c.ptpDate >= todayStr);
    } else if (ptpFilter === 'Broken_PTP') {
      result = result.filter((c) => 
        c.status === 'Broken_PTP' || (c.ptpDate && c.ptpDate < todayStr && c.status !== 'Paid')
      );
    } else if (ptpFilter === 'NPA') {
      result = result.filter((c) => (c.dpd || 0) >= 90);
    }

    // Filter by Value Range
    if (valueRange === 'High') {
      result.sort((a, b) => b.totalPOS - a.totalPOS);
    } else if (valueRange === 'Medium') {
      result = result.filter((c) => c.totalPOS >= 20000 && c.totalPOS < 100000);
    } else if (valueRange === 'Low') {
      result = result.filter((c) => c.totalPOS < 20000);
    }

    // Apply Sorting
    if (sortOption === 'totalPOS_desc') {
      result.sort((a, b) => b.totalPOS - a.totalPOS);
    } else if (sortOption === 'totalPOS_asc') {
      result.sort((a, b) => a.totalPOS - b.totalPOS);
    } else if (sortOption === 'dpd_desc') {
      result.sort((a, b) => b.dpd - a.dpd);
    } else if (sortOption === 'updatedAt_desc') {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return result;
  }, [cases, sortOption, valueRange, ptpFilter]);

  const count = displayCases.length;

  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 225, // Equal-height compact mobile customer card (225px)
    overscan: 5
  });

  const getStatusBadge = (st: string) => {
    const badgeStyles: Record<string, string> = {
      Pending: 'bg-slate-900 text-slate-300 border-slate-800',
      Visited: 'bg-blue-950 text-blue-400 border-blue-800/60',
      Call_Done: 'bg-indigo-950 text-indigo-400 border-indigo-800/60',
      PTP: 'bg-amber-950 text-amber-400 border-amber-800/60',
      Broken_PTP: 'bg-rose-950 text-rose-400 border-rose-800/60',
      Paid: 'bg-emerald-950 text-emerald-400 border-emerald-800/60',
      Dispute: 'bg-rose-950 text-rose-400 border-rose-800/60',
      Unreachable: 'bg-purple-950 text-purple-400 border-purple-800/60'
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles[st] || badgeStyles.Pending}`}>
        {st.replace('_', ' ')}
      </span>
    );
  };

  const getBucketBadge = (bck: string) => {
    const isNPA = bck.includes('90+');
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isNPA ? 'bg-rose-950 text-rose-400 border border-rose-800/60' : 'bg-slate-900 text-slate-300 border border-slate-800'}`}>
        {bck}
      </span>
    );
  };

  return (
    <div className="space-y-3 pb-24 md:pb-6 max-w-full overflow-x-hidden">
      
      {/* Google Maps / PhonePe Style Floating Rounded Search Bar (Sticky top-14) */}
      <div className="sticky top-14 z-20 pt-1 pb-1 px-0.5 bg-slate-950/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 h-12 glass-panel p-1.5 rounded-2xl border border-slate-800/80 shadow-xl bg-slate-900/90">
          
          <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Customer, Loan ID, City..."
            className="w-full h-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none px-2"
          />

          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Inline Filters (>= 768px) */}
          <div className="hidden md:flex items-center gap-2 border-l border-slate-800/80 pl-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="totalPOS_desc">🔥 High Value (POS ₹↓)</option>
              <option value="totalPOS_asc">💰 Low Value (POS ₹↑)</option>
              <option value="dpd_desc">🚨 Highest DPD (NPA 90+)</option>
              <option value="updatedAt_desc">🕒 Recently Updated</option>
            </select>

            <select
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Portfolios</option>
              {Array.from(new Set(cases.map((c) => c.portfolioName).filter(Boolean))).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Voice Search Mic Button */}
          <button
            onClick={handleVoiceSearch}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
              isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
            }`}
            title="Voice Search"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Filters Bottom Sheet Trigger Button */}
          <button
            onClick={() => setIsFilterBottomSheetOpen(true)}
            className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 relative"
            title="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(portfolio !== 'All' || bucket !== 'All' || status !== 'All') && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>

          <button
            onClick={refetch}
            title="Refresh"
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClearCustomPortfolio}
            title="Clear Custom Imported Portfolio Cases"
            className="w-9 h-9 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 flex items-center justify-center shrink-0"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>

        </div>

        {/* PTP & Broken PTP Quick Action Filters Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1.5 scrollbar-none">
          <button
            onClick={() => setPtpFilter('All')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              ptpFilter === 'All'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All Cases ({totalCases})
          </button>

          <button
            onClick={() => setPtpFilter('PTP_Active')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-1 ${
              ptpFilter === 'PTP_Active'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span>⏰ Active PTP ({cases.filter((c) => c.status === 'PTP' || c.ptpAmount).length})</span>
          </button>

          <button
            onClick={() => setPtpFilter('Broken_PTP')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-1 ${
              ptpFilter === 'Broken_PTP'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-rose-400 border border-rose-500/30 animate-pulse'
            }`}
          >
            <span>🔴 Broken PTP - Revisit ({cases.filter((c) => (c.status === 'PTP' && (c.dpd || 0) >= 60) || (c.dpd || 0) >= 90).length})</span>
          </button>

          <button
            onClick={() => setPtpFilter('NPA')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              ptpFilter === 'NPA'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-purple-400 border border-purple-500/30'
            }`}
          >
            🚨 NPA 90+ DPD ({cases.filter((c) => (c.dpd || 0) >= 90).length})
          </button>
        </div>
      </div>

      {/* Virtualized Mobile Customer Cards Container (Gmail / WhatsApp / Google Contacts Scroll Model) */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-160px)] overflow-y-auto pr-0.5 rounded-2xl pb-[100px] pt-3 mt-1.5 space-y-3"
      >
        {displayCases.length === 0 ? (
          <div className="glass-panel p-6 text-center rounded-2xl border border-slate-800 space-y-2 mt-8 mx-1">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No Collection Cases Found</h3>
            <p className="text-xs text-slate-400">
              No cases match your filters. Upload an Excel portfolio sheet using the + import button.
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize() + 50}px`,
              width: '100%',
              position: 'relative',
              paddingTop: '40px'
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const caseItem = displayCases[virtualRow.index];
              const isSelectedForRoute = selectedCasesForRoute.includes(caseItem._id);
              const isStarred = priorityCases.has(caseItem._id);

              const googleNavUrl = MapService.getSingleNavigationUrl(
                caseItem.location?.coordinates?.[1] || 28.6139,
                caseItem.location?.coordinates?.[0] || 77.209,
                caseItem.address
              );

              return (
                <div
                  key={caseItem._id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: '40px',
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  className="pb-3"
                >
                  {/* MATERIAL DESIGN 3 CUSTOMER CARD (Rounded 20px) */}
                  <div
                    className={`glass-card p-3.5 rounded-[20px] border shadow-lg transition-all space-y-2.5 max-w-full ${
                      isSelectedForRoute
                        ? 'border-blue-500/80 bg-blue-950/20'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Row 1: Customer Name (1-Line Truncate) & POS Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onSelectCase(caseItem)}
                      >
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-100 truncate hover:text-cyan-400">
                            {caseItem.customerName}
                          </h3>
                          {isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCaseFromList(caseItem._id, caseItem.customerName);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors shrink-0"
                            title="Delete Case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {caseItem.portfolioName} <span className="text-slate-600">•</span> <span className="font-mono text-cyan-400 font-semibold">ID: {caseItem.accountNo}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-black text-emerald-400">
                          ₹{caseItem.totalPOS.toLocaleString('en-IN')}
                        </div>
                        {caseItem.tos ? (
                          <div className="text-[10px] font-bold text-cyan-300">
                            TOS: ₹{caseItem.tos.toLocaleString('en-IN')}
                          </div>
                        ) : null}
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                          {getBucketBadge(caseItem.bucket)}
                          {getStatusBadge(caseItem.status)}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Short Address (Max 2 Lines with Show More Toggle) */}
                    <div className="text-xs text-slate-300 space-y-1 pt-0.5">
                      <div
                        className="flex items-start space-x-1.5 cursor-pointer"
                        onClick={() => onSelectCase(caseItem)}
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className={`leading-snug ${expandedAddresses.has(caseItem._id) ? '' : 'line-clamp-2'}`}>
                          {caseItem.address}, {caseItem.city} - {caseItem.pincode}
                        </span>
                      </div>

                      {caseItem.address.length > 95 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAddresses((prev) => {
                              const next = new Set(prev);
                              if (next.has(caseItem._id)) next.delete(caseItem._id);
                              else next.add(caseItem._id);
                              return next;
                            });
                          }}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-0.5 pl-5"
                        >
                          <span>{expandedAddresses.has(caseItem._id) ? 'Show Less' : 'Show More'}</span>
                        </button>
                      )}

                      {/* PTP Commitment & Broken PTP Callout Alert Banner */}
                      {(caseItem.status === 'PTP' || caseItem.ptpAmount || (caseItem.dpd || 0) >= 60) && (
                        <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 mt-1.5 ${
                          (caseItem.dpd || 0) >= 90 || (caseItem.status === 'PTP' && (caseItem.dpd || 0) >= 60)
                            ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                            : 'bg-amber-950/50 border-amber-800/80 text-amber-300'
                        }`}>
                          <div className="flex items-center space-x-1.5 truncate">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">
                              {(caseItem.dpd || 0) >= 90 || (caseItem.status === 'PTP' && (caseItem.dpd || 0) >= 60)
                                ? `🔴 Broken PTP - Revisit Required (DPD: ${caseItem.dpd})`
                                : `⏰ PTP Active: ₹${(caseItem.ptpAmount || Math.round(caseItem.totalPOS * 0.3)).toLocaleString('en-IN')} (Due: ${caseItem.ptpDate || 'Today'})`}
                            </span>
                          </div>
                          <button
                            onClick={() => onSelectCase(caseItem)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-white hover:bg-slate-800 shrink-0"
                          >
                            Revisit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ROW 3: 5 QUICK ACTION ICON BUTTONS (44x44px Touch Targets) */}
                    <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-800/80">
                      
                      {/* 1. CALL */}
                      <a
                        href={`tel:${caseItem.phone}`}
                        className="h-11 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold transition-all flex items-center justify-center min-h-[44px]"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      {/* 2. MAPS */}
                      <a
                        href={googleNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 font-bold transition-all flex items-center justify-center min-h-[44px]"
                        title="Google Maps Navigation"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>

                      {/* 3. WHATSAPP */}
                      <a
                        href={`https://wa.me/91${caseItem.phone.replace(/[^0-9]/g, '')}?text=Dear%20${encodeURIComponent(
                          caseItem.customerName
                        )},%20regarding%20your%20${encodeURIComponent(caseItem.portfolioName)}%20overdue%20balance.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white border border-teal-500/30 font-bold transition-all flex items-center justify-center min-h-[44px]"
                        title="Send WhatsApp Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* 4. UPDATE (1-Tap Drawer) */}
                      <button
                        onClick={() => setQuickDrawerCase(caseItem)}
                        className="h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center min-h-[44px]"
                        title="✏ Update Status"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* 5. DOCUMENTS / FULL DETAILS */}
                      <button
                        onClick={() => onSelectCase(caseItem)}
                        className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold transition-all flex items-center justify-center min-h-[44px]"
                        title="📄 Customer Documents"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FILTERS & SORTING BOTTOM SHEET MODAL */}
      {isFilterBottomSheetOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-end justify-center">
          <div className="w-full max-w-lg glass-panel rounded-t-[28px] border-t border-slate-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-250 pb-safe">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Filter & Sort Cases</span>
              </h3>
              <button onClick={() => setIsFilterBottomSheetOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sort Order Selector */}
              <div>
                <label className="block text-cyan-400 font-bold mb-1">Sort Cases By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 focus:outline-none font-bold"
                >
                  <option value="totalPOS_desc">🔥 High Value to Low (Highest POS First ₹↓)</option>
                  <option value="totalPOS_asc">💰 Low Value to High (Lowest POS First ₹↑)</option>
                  <option value="dpd_desc">🚨 Highest DPD First (Critical NPA 90+)</option>
                  <option value="updatedAt_desc">🕒 Recently Updated First</option>
                </select>
              </div>

              {/* POS Value Range Filter */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">POS Amount Filter</label>
                <select
                  value={valueRange}
                  onChange={(e) => setValueRange(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 focus:outline-none font-bold"
                >
                  <option value="All">All POS Amounts</option>
                  <option value="High">🔥 High Value POS (Highest to Lowest ₹↓)</option>
                  <option value="Medium">⚡ Medium Value (₹20,000 - ₹1,00,000 POS)</option>
                  <option value="Low">🌱 Low Value (&lt; ₹20,000 POS)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Portfolio</label>
                <select
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 focus:outline-none font-bold"
                >
                  <option value="All">All Portfolios ({cases.length})</option>
                  {Array.from(new Set(cases.map((c) => c.portfolioName).filter(Boolean))).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">DPD Bucket</label>
                <select
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 focus:outline-none font-bold"
                >
                  <option value="All">All Buckets</option>
                  <option value="1-30 DPD">1-30 DPD</option>
                  <option value="31-60 DPD">31-60 DPD</option>
                  <option value="61-90 DPD">61-90 DPD</option>
                  <option value="90+ DPD (NPA)">90+ DPD (NPA)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 focus:outline-none font-bold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="PTP">PTP</option>
                  <option value="Visited">Visited</option>
                  <option value="Paid">Paid</option>
                  <option value="Dispute">Dispute</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsFilterBottomSheetOpen(false)}
                  className="flex-1 h-11 bg-cyan-600 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/30"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    resetFilters();
                    setSortOption('totalPOS_desc');
                    setValueRange('All');
                    setIsFilterBottomSheetOpen(false);
                  }}
                  className="h-11 px-4 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-Tap Quick Action Update Drawer Modal */}
      <QuickActionDrawer
        caseItem={quickDrawerCase}
        isOpen={!!quickDrawerCase}
        onClose={() => setQuickDrawerCase(null)}
        onSuccess={refetch}
      />

    </div>
  );
};
