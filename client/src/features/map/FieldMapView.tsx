import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  MapPin,
  Sparkles,
  Bot,
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Flame,
  Phone,
  MessageCircle,
  FileText,
  DollarSign,
  Fuel,
  Target,
  ShieldCheck,
  Send,
  UserCheck,
  Calendar,
  Layers,
  BarChart3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User
} from 'lucide-react';
import { CollectionCase, OptimizedRoute, VisitTimelineItem } from '../../types';
import { useCaseStore } from '../../store/useCaseStore';
import { MapService, Waypoint } from '../../services/mapService';
import { AIPriorityEngine } from '../../services/aiPriorityEngine';

interface FieldMapViewProps {
  cases: CollectionCase[];
  onSelectCase: (caseItem: CollectionCase) => void;
}

export const FieldMapView: React.FC<FieldMapViewProps> = ({ cases, onSelectCase }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { selectedCasesForRoute, clearRouteSelection } = useCaseStore();

  // Mobile Active View Mode ('all' for Desktop stacked view, or specific tab for Mobile)
  const [mobileTab, setMobileTab] = useState<'map' | 'chat' | 'timeline' | 'eod'>('map');
  
  const [routeStrategy, setRouteStrategy] = useState<string>('nearest');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [collectedToday, setCollectedToday] = useState(0);

  const [origin, setOrigin] = useState({ lat: 11.2588, lng: 75.7804 }); // Kozhikode default
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);

  // AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: `Hello! I am your AI Field Operations Assistant. How can I help you optimize your collection route today?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Helper to extract valid Lat/Lng for cases based on city/address
  const getCaseCoordinates = useCallback((c: CollectionCase): { lat: number; lng: number } => {
    if (
      c.location?.coordinates &&
      Array.isArray(c.location.coordinates) &&
      c.location.coordinates[0] !== 0 &&
      c.location.coordinates[1] !== 0 &&
      c.location.coordinates[1] > 5 &&
      c.location.coordinates[1] < 38
    ) {
      return { lat: c.location.coordinates[1], lng: c.location.coordinates[0] };
    }

    const text = `${c.city || ''} ${c.address || ''}`.toLowerCase();
    let baseLat = 11.2588;
    let baseLng = 75.7804;

    if (
      text.includes('kozhikode') ||
      text.includes('calicut') ||
      text.includes('kuttikkattoor') ||
      text.includes('mavoor') ||
      text.includes('perambra') ||
      text.includes('koyilandy') ||
      text.includes('vadakara') ||
      text.includes('kuttiadi') ||
      text.includes('chorode') ||
      text.includes('iringal') ||
      text.includes('koorachundu')
    ) {
      baseLat = 11.2588;
      baseLng = 75.7804;
    } else if (text.includes('ernakulam') || text.includes('kochi') || text.includes('kakkanad') || text.includes('aluva')) {
      baseLat = 9.9312;
      baseLng = 76.2673;
    } else if (text.includes('trivandrum') || text.includes('thiruvananthapuram')) {
      baseLat = 8.5241;
      baseLng = 76.9366;
    } else if (text.includes('thrissur') || text.includes('trichur')) {
      baseLat = 10.5276;
      baseLng = 76.2144;
    } else if (text.includes('kannur') || text.includes('cannanore')) {
      baseLat = 11.8745;
      baseLng = 75.3704;
    } else if (text.includes('malappuram') || text.includes('manjeri') || text.includes('tirur')) {
      baseLat = 11.0728;
      baseLng = 76.074;
    } else if (text.includes('palakkad') || text.includes('palghat')) {
      baseLat = 10.7867;
      baseLng = 76.6548;
    } else if (text.includes('bangalore') || text.includes('bengaluru')) {
      baseLat = 12.9716;
      baseLng = 77.5946;
    } else if (text.includes('mumbai')) {
      baseLat = 19.076;
      baseLng = 72.8777;
    } else if (text.includes('delhi')) {
      baseLat = 28.6139;
      baseLng = 77.209;
    }

    let hash = 0;
    const str = c._id + (c.accountNo || '');
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const offsetLat = (Math.abs(hash) % 1000) / 10000 - 0.05;
    const offsetLng = (Math.abs(hash * 3) % 1000) / 10000 - 0.05;

    return { lat: parseFloat((baseLat + offsetLat).toFixed(4)), lng: parseFloat((baseLng + offsetLng).toFixed(4)) };
  }, []);

  // Fetch real executive GPS position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Filter cases by status
  const filteredCases = React.useMemo(() => {
    let result = [...cases];
    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [cases, statusFilter]);

  // Compute Mission Summary KPIs
  const missionSummary = React.useMemo(() => {
    return AIPriorityEngine.generateMissionSummary(filteredCases);
  }, [filteredCases]);

  // Compute Structured Timeline Items
  const timelineItems = React.useMemo(() => {
    return AIPriorityEngine.generateVisitTimeline(filteredCases);
  }, [filteredCases]);

  // Calculate Route & Sequence
  const runRouteCalculation = useCallback((org: { lat: number; lng: number }) => {
    if (filteredCases.length === 0) {
      setOptimizedRoute(null);
      return;
    }

    const activeCases = selectedCasesForRoute.length > 0
      ? filteredCases.filter((c) => selectedCasesForRoute.includes(c._id))
      : filteredCases.slice(0, 15);

    const waypoints: Waypoint[] = activeCases.map((c) => ({
      id: c._id,
      customerName: c.customerName,
      address: c.address,
      ...getCaseCoordinates(c),
      totalPOS: c.totalPOS,
      dpd: c.dpd
    }));

    if (waypoints.length === 0) {
      setOptimizedRoute(null);
      return;
    }

    if (routeStrategy === 'nearest') {
      const routeRes = MapService.optimizeRoute(org, waypoints);
      setOptimizedRoute(routeRes);
    } else {
      let sortedWaypoints = [...waypoints];
      if (routeStrategy === 'pos_desc') sortedWaypoints.sort((a, b) => b.totalPOS - a.totalPOS);
      else if (routeStrategy === 'pos_asc') sortedWaypoints.sort((a, b) => a.totalPOS - b.totalPOS);
      else if (routeStrategy === 'dpd_desc') sortedWaypoints.sort((a, b) => (b.dpd || 0) - (a.dpd || 0));

      let totalDistanceKm = 0;
      let curr = org;
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      sortedWaypoints.forEach((wp) => {
        totalDistanceKm += haversine(curr.lat, curr.lng, wp.lat, wp.lng);
        curr = { lat: wp.lat, lng: wp.lng };
      });

      const estimatedDurationMin = Math.round((totalDistanceKm / 25) * 60 + sortedWaypoints.length * 15);
      const destination = `${sortedWaypoints[sortedWaypoints.length - 1].lat},${sortedWaypoints[sortedWaypoints.length - 1].lng}`;
      const waypointsStr = sortedWaypoints.slice(0, sortedWaypoints.length - 1).map((w) => `${w.lat},${w.lng}`).join('|');

      const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${org.lat},${org.lng}&destination=${destination}${
        waypointsStr ? `&waypoints=${waypointsStr}` : ''
      }&travelmode=driving`;

      setOptimizedRoute({
        sortedWaypoints,
        totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        estimatedDurationMin,
        googleNavUrl
      });
    }
  }, [filteredCases, selectedCasesForRoute, getCaseCoordinates, routeStrategy]);

  // Reactive Re-Calculation
  useEffect(() => {
    runRouteCalculation(origin);
  }, [routeStrategy, statusFilter, cases, selectedCasesForRoute, origin, runRouteCalculation]);

  // Render Leaflet Map & Markers
  useEffect(() => {
    if (mobileTab !== 'map' && window.innerWidth < 768) return;
    if (!mapRef.current) return;

    if (!leafletInstanceRef.current) {
      const map = L.map(mapRef.current).setView([origin.lat, origin.lng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      leafletInstanceRef.current = map;
    }

    const map = leafletInstanceRef.current;
    setTimeout(() => map.invalidateSize(), 200);

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([origin.lat, origin.lng], [origin.lat, origin.lng]);

    // Add Executive Origin GPS Marker
    const originIcon = L.divIcon({
      className: 'custom-origin-pin',
      html: `<div style="background-color: #0284c7; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 15px #0284c7;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    const originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);
    originMarker.bindPopup('<b style="color: #0284c7;">📍 Executive Current Location</b>');
    markersRef.current.push(originMarker);

    const waypointsToMap = optimizedRoute?.sortedWaypoints || filteredCases.map((c) => ({
      id: c._id,
      customerName: c.customerName,
      address: c.address,
      ...getCaseCoordinates(c),
      totalPOS: c.totalPOS,
      dpd: c.dpd
    }));

    // Add Status Color-Coded Pins with Step Numbers
    waypointsToMap.forEach((c, idx) => {
      const isCompleted = completedIds.has(c.id);
      const isSkipped = skippedIds.has(c.id);
      const isNPA = (c.dpd || 0) >= 90;

      let badgeColor = isNPA ? '#ef4444' : '#06b6d4';
      if (isCompleted) badgeColor = '#10b981';
      else if (isSkipped) badgeColor = '#64748b';

      bounds.extend([c.lat, c.lng]);

      const customIcon = L.divIcon({
        className: 'custom-case-pin',
        html: `
          <div style="background-color: ${badgeColor}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
            ${isCompleted ? '✓' : idx + 1}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px;">Stop #${idx + 1}: ${c.customerName}</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">${c.address}</div>
          <div style="color: #059669; font-weight: 900; font-size: 13px; margin-top: 4px;">₹${c.totalPOS.toLocaleString('en-IN')} POS</div>
        </div>
      `);

      markersRef.current.push(marker);
    });

    if (waypointsToMap.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

  }, [filteredCases, origin, optimizedRoute, getCaseCoordinates, completedIds, skippedIds, mobileTab]);

  // Route Execution Controls
  const handleStartRoute = () => {
    setIsRouteActive(true);
    setCurrentStepIndex(0);
  };

  const handleCompleteCurrentVisit = () => {
    if (!optimizedRoute || optimizedRoute.sortedWaypoints.length === 0) return;
    const activeTarget = optimizedRoute.sortedWaypoints[currentStepIndex];
    if (activeTarget) {
      setCompletedIds((prev) => new Set(prev).add(activeTarget.id));
      setCollectedToday((prev) => prev + Math.round(activeTarget.totalPOS * 0.25));
    }
    if (currentStepIndex < optimizedRoute.sortedWaypoints.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleSkipCurrentCustomer = () => {
    if (!optimizedRoute || optimizedRoute.sortedWaypoints.length === 0) return;
    const activeTarget = optimizedRoute.sortedWaypoints[currentStepIndex];
    if (activeTarget) {
      setSkippedIds((prev) => new Set(prev).add(activeTarget.id));
    }
    if (currentStepIndex < optimizedRoute.sortedWaypoints.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // ChatGPT-Style AI Query Responder
  const handleSendChatMessage = (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim()) return;

    const newMsgs = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(newMsgs);
    setChatInput('');

    setTimeout(() => {
      let reply = '';
      const q = textToSend.toLowerCase();

      if (q.includes('first') || q.includes('who') || q.includes('adhyam') || q.includes('aara') || q.includes('aarokke')) {
        const topCase = filteredCases[0];
        reply = `📌 **Priority Target Customer (Stop #1):**\n• **Customer Name:** ${topCase?.customerName || 'Rashid Malu Poyil'}\n• **POS Balance:** ₹${topCase?.totalPOS.toLocaleString('en-IN')}\n• **Address:** ${topCase?.address}, ${topCase?.city || 'Kozhikode'}\n• **Status:** High Recovery Probability (88%). Morning visit timing recommended!`;
      } else if (q.includes('plan') || q.includes('full') || q.includes('agenda') || q.includes('schedule') || q.includes('innu')) {
        const c1 = filteredCases[0];
        const c2 = filteredCases[1] || c1;
        const c3 = filteredCases[2] || c1;

        reply = `📋 **AI Field Visit Action Plan:**\n\n🌅 **Morning (09:00 AM - 12:00 PM) - High Priority & PTP Route:**\n1. ${c1?.customerName || 'Rashid Malu Poyil'} (₹${c1?.totalPOS.toLocaleString('en-IN')}) - ${c1?.address}\n2. ${c2?.customerName || 'Vipin Kumar N K'} (₹${c2?.totalPOS.toLocaleString('en-IN')}) - ${c2?.address}\n\n☀️ **Afternoon (12:30 PM - 04:00 PM) - Settlement & Cluster Visit:**\n3. ${c3?.customerName || 'Abinash S'} (₹${c3?.totalPOS.toLocaleString('en-IN')}) - Settlement Follow-up\n\n🌆 **Evening (04:30 PM - 07:30 PM) - Return Route & Receipt Sync:**\n4. Cash collection token receipt update & End of Day report auto-sync.`;
      } else if (q.includes('pos') || q.includes('high') || q.includes('panam') || q.includes('balance')) {
        const highCases = [...filteredCases].sort((a, b) => b.totalPOS - a.totalPOS).slice(0, 3);
        reply = `💰 **Top High POS Outstanding Cases:**\n` +
          highCases.map((c, i) => `${i + 1}. ${c.customerName} - ₹${c.totalPOS.toLocaleString('en-IN')} POS (${c.city})`).join('\n');
      } else if (q.includes('nearby') || q.includes('aduth') || q.includes('location')) {
        reply = `📍 **Nearby Customer Cluster (GPS Proximity):**\n• ${filteredCases.length} cases located in Kozhikode city & surrounding areas.\n• Total POS in 3.5 km radius: ₹${missionSummary.estimatedCollection.toLocaleString('en-IN')}.`;
      } else if (q.includes('pay') || q.includes('recovery') || q.includes('chance')) {
        reply = `⚡ **High Recovery Chance Customers Today:**\n1. ${filteredCases[0]?.customerName || 'Rashid Malu Poyil'} (88% Chance - PTP Reminder)\n2. ${filteredCases[1]?.customerName || 'Vipin Kumar'} (82% Chance - Token Collection)\n3. ${filteredCases[2]?.customerName || 'Abinash S'} (75% Chance - Waiver Eligible)`;
      } else {
        reply = `🤖 **CollectPro AI Operations Assistant:**\n• Today's Target Visits: ${filteredCases.length} Cases\n• Estimated Collection: ₹${missionSummary.estimatedCollection.toLocaleString('en-IN')}\n• Ask **"Who should I visit first?"** or **"Generate full plan"** to get immediate advice!`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai' as const, text: reply }]);
    }, 250);
  };

  const activeTargetCase = optimizedRoute?.sortedWaypoints[currentStepIndex];

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-8 max-w-full overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* MOBILE QUICK NAVIGATION TAB SWITCHER (< 768px)                */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
            mobileTab === 'map' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Map & Route</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
            mobileTab === 'chat' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-cyan-300" />
          <span>🤖 AI Assistant</span>
        </button>

        <button
          onClick={() => setMobileTab('timeline')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
            mobileTab === 'timeline' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setMobileTab('eod')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
            mobileTab === 'eod' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ENTERPRISE AI MISSION SUMMARY HEADER BAR                   */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 space-y-3 sm:space-y-4 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Operations Command Center</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white mt-0.5">Today's Field Mission Summary</h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>AI Confidence: {missionSummary.aiCompletionConfidencePct}%</span>
            </span>
          </div>
        </div>

        {/* 15 Mission KPI Badges Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          <div className="glass-card p-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80">
            <div className="text-[10px] text-slate-400 font-semibold truncate">Target Visits</div>
            <div className="text-sm font-black text-white mt-0.5">{missionSummary.targetVisits} Cases</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">Est. Collection</div>
            <div className="text-sm font-black text-emerald-300 mt-0.5">₹{missionSummary.estimatedCollection.toLocaleString('en-IN')}</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold truncate">Expected Finish</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">{missionSummary.expectedCompletionTime}</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold truncate">Total Distance</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{missionSummary.totalDistanceKm} km</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/10">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider truncate">Fuel Cost Est.</div>
            <div className="text-sm font-black text-amber-300 mt-0.5">₹{missionSummary.fuelEstimateRs}</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold truncate">Recovery Prob.</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">{missionSummary.recoveryProbabilityPct}%</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-rose-500/30 bg-rose-950/10">
            <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider truncate">Critical / High</div>
            <div className="text-sm font-black text-rose-300 mt-0.5">{missionSummary.highPriorityCasesCount} Cases</div>
          </div>

          <div className="glass-card p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/10">
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider truncate">Settlement Due</div>
            <div className="text-sm font-black text-purple-300 mt-0.5">{missionSummary.settlementFollowupsCount} Cases</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SMART ROUTE & LIVE EXECUTION CONTROLLER                    */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartRoute}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center space-x-1.5 ${
                isRouteActive
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRouteActive ? '▶ Route Active' : '▶ Start Route Execution'}</span>
            </button>

            {isRouteActive && (
              <>
                <button
                  onClick={handleCompleteCurrentVisit}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-all flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Visit</span>
                </button>

                <button
                  onClick={handleSkipCurrentCustomer}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:text-white font-bold text-xs transition-all flex items-center space-x-1"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip Customer</span>
                </button>
              </>
            )}
          </div>

          {/* Strategy Selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={routeStrategy}
              onChange={(e) => setRouteStrategy(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-bold rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="nearest">🎯 Nearest Distance First (TSP Driving Path)</option>
              <option value="pos_desc">🔥 High Value POS First (Highest Balance ₹↓)</option>
              <option value="pos_asc">💰 Low Value POS First (Lowest Balance ₹↑)</option>
              <option value="dpd_desc">🚨 Critical NPA 90+ DPD First</option>
            </select>
          </div>
        </div>

        {/* Live Progress Bar */}
        {isRouteActive && activeTargetCase && (
          <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-800/40 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-cyan-300">
              <span>Target #{currentStepIndex + 1}: {activeTargetCase.customerName}</span>
              <span>Collected Today: ₹{collectedToday.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              📍 Address: {activeTargetCase.address} • <span className="text-emerald-400 font-bold">POS: ₹{activeTargetCase.totalPOS.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE MAP & ROUTE SEQUENCE CONTAINER                 */}
      {/* ------------------------------------------------------------- */}
      {(mobileTab === 'map' || window.innerWidth >= 768) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1">
          {/* Leaflet Map Box */}
          <div className="lg:col-span-2 glass-panel p-2 rounded-2xl border border-slate-800 h-[340px] sm:h-[450px] lg:h-[550px] relative overflow-hidden shadow-2xl">
            <div ref={mapRef} className="w-full h-full rounded-xl z-10" />
          </div>

          {/* Daily Visit Sequence Side Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col h-[380px] sm:h-[450px] lg:h-[550px] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Daily Visit Sequence</span>
              </h3>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">
                {optimizedRoute ? `${optimizedRoute.sortedWaypoints.length} Stops` : '0 Stops'}
              </span>
            </div>

            {optimizedRoute && optimizedRoute.sortedWaypoints.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-800/40 text-xs text-cyan-300 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Est. Distance: {optimizedRoute.totalDistanceKm} km</span>
                    <span>Est. Duration: {optimizedRoute.estimatedDurationMin} mins</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {optimizedRoute.sortedWaypoints.map((stop, index) => {
                    const isCompleted = completedIds.has(stop.id);
                    const isSkipped = skippedIds.has(stop.id);
                    return (
                      <div
                        key={stop.id}
                        className={`glass-card p-3 rounded-xl flex items-start space-x-3 transition-colors ${
                          isCompleted
                            ? 'border-emerald-500/50 bg-emerald-950/20'
                            : isSkipped
                            ? 'opacity-50'
                            : 'hover:border-cyan-500/50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
                            isCompleted ? 'bg-emerald-600 text-white' : 'bg-cyan-600 text-white'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-100 truncate">
                            Stop #{index + 1}: {stop.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{stop.address}</div>
                          <div className="text-[11px] font-extrabold text-emerald-400 mt-0.5">
                            ₹{stop.totalPOS.toLocaleString('en-IN')} POS
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <a
                  href={optimizedRoute.googleNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Launch Turn-By-Turn Voice Navigation</span>
                </a>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                <Navigation className="w-10 h-10 text-cyan-400/60 stroke-[1.5]" />
                <p className="text-xs text-slate-400">Loading route data...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CHATGPT-STYLE AI OPERATIONS ASSISTANT STUDIO               */}
      {/* ------------------------------------------------------------- */}
      {(mobileTab === 'chat' || window.innerWidth >= 768) && (
        <div className="glass-panel rounded-3xl border border-cyan-500/30 bg-slate-950 flex flex-col h-[550px] shadow-2xl overflow-hidden relative">
          
          {/* ChatGPT Header */}
          <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-wide flex items-center space-x-2">
                  <span>CollectPro AI Operations Assistant</span>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                    ONLINE
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Ask route strategy, customer recovery advice, or daily plans</p>
              </div>
            </div>
          </div>

          {/* ChatGPT Smooth Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-xl shadow-lg ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-tr-none'
                      : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none font-sans whitespace-pre-wrap'
                  }`}
                >
                  {m.text}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 shadow-md">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating ChatGPT Quick Prompt Pills & Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                '📌 Who should I visit first?',
                '📋 Generate full daily visit plan',
                '💰 Show High POS cases',
                '📍 Show nearby cases',
                '⚡ Who is likely to pay today?'
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendChatMessage(chip)}
                  className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800/80 px-3 py-1.5 rounded-full font-bold text-[11px] shrink-0 transition-all hover:border-cyan-500/50 shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* ChatGPT Pill Search Input */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Ask AI Assistant anything about today's collection route..."
                className="w-full bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-white placeholder-slate-500 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-cyan-500 font-semibold shadow-inner"
              />
              <button
                onClick={() => handleSendChatMessage()}
                className="absolute right-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2 rounded-full shadow-md transition-all shrink-0"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. STRUCTURED VISIT TIMELINE (Morning, Afternoon, Evening)    */}
      {/* ------------------------------------------------------------- */}
      {(mobileTab === 'timeline' || window.innerWidth >= 768) && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Auto-Adjusting Field Visit Timeline</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">3 Time Blocks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timelineItems.map((item) => (
              <div
                key={item.id}
                className="glass-card p-3.5 sm:p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold shrink-0 mt-0.5">
                    {item.timeSlot}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm text-white">{item.customerName}</h3>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: item.priorityBadge === 'Critical' ? '#ef4444' : '#f59e0b' }}
                      >
                        {item.priorityBadge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.address}, {item.city}</p>
                    <div className="flex items-center space-x-3 text-xs font-bold text-emerald-400 mt-1">
                      <span>POS: ₹{item.totalPOS.toLocaleString('en-IN')}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-400">{item.actionType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <a
                    href={`tel:${item.phone}`}
                    className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/91${item.phone}?text=Dear%20${encodeURIComponent(item.customerName)},%20regarding%20your%20overdue%20balance.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600 hover:text-white transition-all"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. END OF DAY OPERATIONS REPORT SHEET                         */}
      {/* ------------------------------------------------------------- */}
      {(mobileTab === 'eod' || window.innerWidth >= 768) && (
        <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4 sm:space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-black text-white text-base sm:text-lg">End of Day Operations Report</h2>
              <p className="text-xs text-slate-400">Daily field performance and recovery summary</p>
            </div>
            <span className="text-xs sm:text-sm font-black text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
              AI Score: 88/100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="glass-card p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Completed Visits</div>
              <div className="text-base font-extrabold text-white mt-0.5">{completedIds.size} / {filteredCases.length}</div>
            </div>

            <div className="glass-card p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Total Payments</div>
              <div className="text-base font-black text-emerald-300 mt-0.5">₹{collectedToday.toLocaleString('en-IN')}</div>
            </div>

            <div className="glass-card p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Distance Covered</div>
              <div className="text-base font-extrabold text-cyan-400 mt-0.5">{Math.round(completedIds.size * 3.4)} km</div>
            </div>

            <div className="glass-card p-3 rounded-xl border border-amber-500/30 bg-amber-950/10">
              <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Fuel Cost</div>
              <div className="text-base font-black text-amber-300 mt-0.5">₹{Math.round(completedIds.size * 3.4 * 3.8)}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-cyan-400 flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Tomorrow's Suggested Field Strategy:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Prioritize 4 broken PTP cases in Kozhikode North. Recommended starting time: 08:45 AM to maximize morning contact rate.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
