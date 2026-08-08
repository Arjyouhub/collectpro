import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Navigation, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Download, 
  Share2, 
  IndianRupee, 
  ShieldCheck, 
  Target, 
  ChevronRight,
  Zap,
  Filter
} from 'lucide-react';
import { CollectionCase } from '../../types';
import { AIPriorityEngine } from '../../services/aiPriorityEngine';

interface DailyAIVisitPalanProps {
  cases: CollectionCase[];
  onSelectCase?: (caseId: string) => void;
  onOpenMap?: () => void;
}

export const DailyAIVisitPalan: React.FC<DailyAIVisitPalanProps> = ({
  cases,
  onSelectCase,
  onOpenMap
}) => {
  const [dailyCapacity, setDailyCapacity] = useState<number>(10);
  const [focusFilter, setFocusFilter] = useState<'ALL' | 'PENDING' | 'PTP' | 'CRITICAL' | 'HIGH_POS'>('PENDING');
  const [sortBy, setSortBy] = useState<'LOCATION' | 'PRIORITY'>('LOCATION');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Total Pending Visits Count
  const pendingCasesCount = useMemo(() => {
    return cases.filter(c => c.status === 'Pending' || c.status !== 'Paid').length;
  }, [cases]);

  // Target Completion Deadline State (Default: 5 days from today)
  const defaultTargetDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  }, []);

  const [targetDeadlineDate, setTargetDeadlineDate] = useState<string>(defaultTargetDateStr);
  const [selectedDayTab, setSelectedDayTab] = useState<number | null>(null);

  // Days remaining calculation
  const daysRemaining = useMemo(() => {
    if (!targetDeadlineDate) return 5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDeadlineDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [targetDeadlineDate]);

  // Target Daily Capacity needed to complete all pending visits before deadline
  const targetRequiredDailyCapacity = useMemo(() => {
    return Math.max(1, Math.ceil(pendingCasesCount / Math.max(1, daysRemaining)));
  }, [pendingCasesCount, daysRemaining]);

  // Multi-day Route Plan computed for target completion date
  const targetMultiDayPlan = useMemo(() => {
    const pendingCases = cases.filter(c => c.status === 'Pending' || c.status !== 'Paid');
    return AIPriorityEngine.generateMultiDayPlan(pendingCases, targetRequiredDailyCapacity);
  }, [cases, targetRequiredDailyCapacity]);

  // Total Days Needed for complete pending portfolio
  const totalDaysNeeded = Math.max(1, Math.ceil(pendingCasesCount / Math.max(1, dailyCapacity)));

  // Calculate distance in KM from reference origin (Kozhikode / GPS center)
  const calculateDistanceKm = (c: CollectionCase, refLat = 11.2588, refLng = 75.7804) => {
    const lat = c.location?.coordinates?.[1] || 11.2588;
    const lng = c.location?.coordinates?.[0] || 75.7804;
    const R = 6371;
    const dLat = ((lat - refLat) * Math.PI) / 180;
    const dLon = ((lng - refLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((refLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const cVal = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * cVal).toFixed(1));
  };

  // Filter cases based on executive choices
  const filteredCases = useMemo(() => {
    let result = [...cases];

    if (focusFilter === 'PENDING') {
      result = result.filter(c => c.status === 'Pending' || c.status !== 'Paid');
    } else if (focusFilter === 'PTP') {
      result = result.filter(c => c.status === 'PTP' || c.ptpDate);
    } else if (focusFilter === 'CRITICAL') {
      result = result.filter(c => (c.dpd || 0) >= 60 || c.bucket === '61-90 DPD' || c.bucket === '90+ DPD (NPA)');
    } else if (focusFilter === 'HIGH_POS') {
      result = result.filter(c => (c.totalPOS || 0) >= 50000);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.customerName?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.accountNo?.toLowerCase().includes(q)
      );
    }

    // Sort by Location Proximity (Nearest first) OR AI Priority Score
    return result.sort((a, b) => {
      if (sortBy === 'LOCATION') {
        return calculateDistanceKm(a) - calculateDistanceKm(b);
      }
      const scoreA = AIPriorityEngine.calculatePriorityScore(a).score;
      const scoreB = AIPriorityEngine.calculatePriorityScore(b).score;
      return scoreB - scoreA;
    });
  }, [cases, focusFilter, sortBy, searchTerm]);

  // Selected Daily Itinerary (up to capacity or selected day tab)
  const todayVisits = useMemo(() => {
    if (selectedDayTab !== null && targetMultiDayPlan.dayPlans[selectedDayTab - 1]) {
      return targetMultiDayPlan.dayPlans[selectedDayTab - 1].cases;
    }
    return filteredCases.slice(0, Math.max(dailyCapacity, targetRequiredDailyCapacity));
  }, [filteredCases, dailyCapacity, targetRequiredDailyCapacity, selectedDayTab, targetMultiDayPlan]);

  // Metrics & Data Yield Calculations
  const yieldMetrics = useMemo(() => {
    const totalPOSInSchedule = todayVisits.reduce((sum, c) => sum + (c.totalPOS || 0), 0);
    
    // Expected recovery yield (average 28% to 45% based on recovery likelihood scores)
    const averageScore = todayVisits.length > 0 
      ? Math.round(todayVisits.reduce((sum, c) => sum + (c.recoveryLikelihoodScore || AIPriorityEngine.calculatePriorityScore(c).recoveryChancePct), 0) / todayVisits.length)
      : 75;

    const expectedRecoveryYield = Math.round(totalPOSInSchedule * (averageScore / 100) * 0.45);
    const estimatedDistanceKm = Math.round(todayVisits.length * 2.8 + 8);
    const fuelCostEst = Math.round(estimatedDistanceKm * 3.8); // ₹3.8 / km
    const fuelSavedYield = Math.round(estimatedDistanceKm * 0.35 * 105 / 15); // Saved fuel value via TSP route

    const ptpCount = todayVisits.filter(c => c.status === 'PTP').length;
    const criticalCount = todayVisits.filter(c => (c.dpd || 0) >= 60).length;

    return {
      totalPOSInSchedule,
      expectedRecoveryYield,
      averageScore,
      estimatedDistanceKm,
      fuelCostEst,
      fuelSavedYield,
      ptpCount,
      criticalCount
    };
  }, [todayVisits]);

  const handleCopyScript = (caseItem: CollectionCase, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(caseItem._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsAppSend = (phone: string, customerName: string, amount: number, address: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '') || '919876543210';
    const msg = `Dear ${customerName}, CollectPro Field Operations Alert. A direct field visit is scheduled for your overdue balance of ₹${amount.toLocaleString('en-IN')} today at ${address}. Please reply for instant settlement receipt.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const timeSlots = [
    '09:00 AM - 09:45 AM',
    '09:50 AM - 10:30 AM',
    '10:45 AM - 11:30 AM',
    '11:35 AM - 12:15 PM',
    '01:30 PM - 02:15 PM',
    '02:20 PM - 03:00 PM',
    '03:15 PM - 04:00 PM',
    '04:10 PM - 04:50 PM',
    '05:00 PM - 05:40 PM',
    '05:45 PM - 06:25 PM',
    '06:30 PM - 07:10 PM',
    '07:15 PM - 07:55 PM'
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      
      {/* Top Banner: AI Visit & Data Yield Dashboard */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Daily AI Visit & Recovery Yield Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Today's AI Visit Route & Recovery Yield Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              AI algorithms analyze DPD urgency, POS volume, customer location, and past response logs to maximize today's field collection outcome.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Launch GPS Map</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Yield Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          
          {/* KPI 1: Estimated Recovery Yield */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
              <span className="uppercase tracking-wider">Estimated Recovery Yield</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ₹{yieldMetrics.expectedRecoveryYield.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Target Recovery out of ₹{yieldMetrics.totalPOSInSchedule.toLocaleString('en-IN')} POS
            </p>
          </div>

          {/* KPI 2: Today's AI Priority Schedule */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/30 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400">
              <span className="uppercase tracking-wider">Today's Visits Schedule</span>
              <Target className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">
              {todayVisits.length} <span className="text-xs text-slate-400 font-normal">Stops</span>
            </div>
            <p className="text-[10px] text-cyan-300 font-medium">
              {yieldMetrics.ptpCount} PTP Due Today | {yieldMetrics.criticalCount} High DPD
            </p>
          </div>

          {/* KPI 3: AI Recovery Success Rate */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
              <span className="uppercase tracking-wider">AI Success Probability</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {yieldMetrics.averageScore}%
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Weighted collection confidence score
            </p>
          </div>

          {/* KPI 4: Fuel & Route Efficiency Yield */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/30 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400">
              <span className="uppercase tracking-wider">Distance & Fuel Savings</span>
              <Navigation className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-indigo-300">
              {yieldMetrics.estimatedDistanceKm} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Est. Fuel: ₹{yieldMetrics.fuelCostEst} | Saved ₹{yieldMetrics.fuelSavedYield} via TSP AI
            </p>
          </div>

        </div>
      </div>

      {/* Target Completion Deadline AI Planner Card */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Target Completion Deadline Visit Planner
              </h2>
              <p className="text-xs text-slate-400">
                Set deadline date to automatically compute daily visit pace & multi-day route schedule before target date.
              </p>
            </div>
          </div>

          {/* Date Picker Input & Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deadline:</span>
              <input
                type="date"
                value={targetDeadlineDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setTargetDeadlineDate(e.target.value);
                  setSelectedDayTab(null);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  setTargetDeadlineDate(d.toISOString().split('T')[0]);
                  setSelectedDayTab(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-cyan-300 transition-all"
              >
                ⚡ 3-Day Sprint
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 5);
                  setTargetDeadlineDate(d.toISOString().split('T')[0]);
                  setSelectedDayTab(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-cyan-300 transition-all"
              >
                📅 5-Day Pace
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  setTargetDeadlineDate(d.toISOString().split('T')[0]);
                  setSelectedDayTab(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-cyan-300 transition-all"
              >
                🏁 7-Day Target
              </button>
            </div>
          </div>
        </div>

        {/* AI Deadline Velocity Metrics Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Timeframe</span>
              <p className="text-sm font-black text-cyan-400">{daysRemaining} Days Available</p>
            </div>
            <Clock className="w-5 h-5 text-cyan-400/60" />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Required Daily Pace</span>
              <p className="text-sm font-black text-emerald-400">{targetRequiredDailyCapacity} Visits / Day</p>
            </div>
            <Zap className="w-5 h-5 text-emerald-400/60" />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">100% Pending Clearance</span>
              <p className="text-sm font-black text-teal-400">{pendingCasesCount} Visits Scheduled</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-teal-400/60" />
          </div>
        </div>

        {/* Day-Wise Route Selection Tabs */}
        {targetMultiDayPlan.dayPlans && targetMultiDayPlan.dayPlans.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Automated Route Schedule by Day (Select day tab to view itinerary)
              </div>
              {selectedDayTab !== null && (
                <span className="text-xs font-bold text-cyan-400">
                  Viewing Day {selectedDayTab} Schedule ({targetMultiDayPlan.dayPlans[selectedDayTab - 1]?.totalCases || 0} Visits)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedDayTab(null)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDayTab === null
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Combined ({todayVisits.length})
              </button>

              {targetMultiDayPlan.dayPlans.map((dp) => (
                <button
                  key={dp.dayNumber}
                  onClick={() => setSelectedDayTab(dp.dayNumber)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    selectedDayTab === dp.dayNumber
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>Day {dp.dayNumber}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-cyan-300 border border-slate-700">
                    {dp.totalCases} Stops
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control & Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        
        {/* Daily Capacity Slider */}
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-xs font-bold text-slate-300 whitespace-nowrap">
            Max Visits Today: <span className="text-cyan-400 font-black">{dailyCapacity}</span>
          </div>
          <input
            type="range"
            min="3"
            max="25"
            value={dailyCapacity}
            onChange={(e) => setDailyCapacity(Number(e.target.value))}
            className="w-24 sm:w-32 accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Focus Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFocusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              focusFilter === 'PENDING'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🎯 Pending Visits ({pendingCasesCount})
          </button>

          <button
            onClick={() => setFocusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              focusFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Portfolio ({cases.length})
          </button>

          <button
            onClick={() => setFocusFilter('PTP')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              focusFilter === 'PTP'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🎯 PTP Due Today
          </button>

          <button
            onClick={() => setFocusFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              focusFilter === 'CRITICAL'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🔥 High DPD (60+)
          </button>

          <button
            onClick={() => setFocusFilter('HIGH_POS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              focusFilter === 'HIGH_POS'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            💰 High POS (&gt; ₹50k)
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px]">
          <input
            type="text"
            placeholder="Search customer, city, account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

      {/* Location Proximity Sort & Automation Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Location Automation: Total <strong className="text-cyan-400">{pendingCasesCount}</strong> Pending Visits scheduled into <strong className="text-teal-400">{totalDaysNeeded} Days</strong> ({dailyCapacity} visits/day cluster).
          </span>
        </div>

        {/* Sort Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setSortBy('LOCATION')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              sortBy === 'LOCATION'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>📍 Nearest First</span>
          </button>
          <button
            onClick={() => setSortBy('PRIORITY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              sortBy === 'PRIORITY'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⭐ AI Priority</span>
          </button>
        </div>
      </div>

      {/* Main Daily AI Visit Schedule List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>AI Optimized Daily Itinerary</span>
          </h2>
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{todayVisits.length}</strong> of {filteredCases.length} prioritized cases
          </span>
        </div>

        {todayVisits.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Matching Cases Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your focus filters or search terms to load available collection cases.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayVisits.map((item, idx) => {
              const priorityInfo = AIPriorityEngine.calculatePriorityScore(item);
              const slotTime = timeSlots[idx % timeSlots.length];
              const expectedCaseYield = Math.round((item.totalPOS || 0) * (priorityInfo.recoveryChancePct / 100) * 0.45);

              const aiEnglishInsight = item.aiSummary || (item.status === 'PTP'
                ? `1. Customer committed PTP (₹${(item.ptpAmount || item.totalPOS).toLocaleString('en-IN')}). 2. Morning visit recommended. 3. Issue digital payment receipt.`
                : (item.dpd || 0) >= 90
                ? `1. NPA account (${item.dpd} DPD). 2. Offer 50% penalty waiver on token settlement.`
                : `1. Regular field visit recommended. 2. Balance ₹${(item.totalPOS || 0).toLocaleString('en-IN')}. 3. Visit before 4 PM.`);

              const talkTrack = `Hello ${item.customerName}, I am visiting from CollectPro desk regarding account ${item.accountNo}. We can offer instant penalty waiver on digital settlement today.`;

              return (
                <div 
                  key={item._id}
                  className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 shadow-xl group"
                >
                  {/* Card Top Info Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center space-x-3">
                      {/* Stop Sequence Badge */}
                      <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-black text-xs shrink-0">
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 
                            onClick={() => onSelectCase && onSelectCase(item._id)}
                            className="font-bold text-white text-sm sm:text-base hover:text-cyan-400 cursor-pointer transition-colors"
                          >
                            {item.customerName}
                          </h3>
                          
                          {/* Priority Badge */}
                          <span 
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                            style={{ 
                              backgroundColor: `${priorityInfo.badgeColor}20`, 
                              color: priorityInfo.badgeColor,
                              border: `1px solid ${priorityInfo.badgeColor}50` 
                            }}
                          >
                            {priorityInfo.badge} ({priorityInfo.score} pts)
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>{item.accountNo}</span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">{item.portfolioName || 'General Portfolio'}</span>
                          <span>•</span>
                          <span className="text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/80 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>{calculateDistanceKm(item)} km away</span>
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Time Slot & Expected Yield */}
                    <div className="flex items-center space-x-3 text-right">
                      <div className="hidden sm:block">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center justify-end space-x-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Slot: {slotTime}</span>
                        </div>
                        <div className="text-xs font-black text-emerald-400">
                          Yield: ₹{expectedCaseYield.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', ' + (item.city || 'Kozhikode'))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold transition-all flex items-center space-x-1 shrink-0"
                      >
                        <Navigation className="w-4 h-4 text-cyan-400" />
                        <span className="hidden sm:inline">Navigate</span>
                      </a>
                    </div>
                  </div>

                  {/* Card Middle Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total POS Overdue</span>
                      <span className="text-sm font-black text-white">₹{(item.totalPOS || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">DPD Aging Stage</span>
                      <span className="text-sm font-black text-amber-400">{item.dpd || 45} Days ({item.bucket || '31-60 DPD'})</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Current Status</span>
                      <span className={`text-sm font-bold ${item.status === 'PTP' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {item.status || 'Pending'}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Location / City</span>
                      <span className="text-xs font-semibold text-slate-200 truncate block">{item.address}, {item.city}</span>
                    </div>
                  </div>

                  {/* AI Insights & Palan Strategy Box */}
                  <div className="bg-slate-950/90 p-3 rounded-xl border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Visit Outcome & Strategy</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Recovery Chance: {priorityInfo.recoveryChancePct}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {aiEnglishInsight}
                    </p>
                  </div>

                  {/* Action Buttons Row: WhatsApp, Call, Copy Script */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleWhatsAppSend(item.phone, item.customerName, item.totalPOS, item.address)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Notice</span>
                      </button>

                      <a
                        href={`tel:${item.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                        <span>Call Customer</span>
                      </a>
                    </div>

                    <button
                      onClick={() => handleCopyScript(item, talkTrack)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      {copiedId === item._id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy Talk Track</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
