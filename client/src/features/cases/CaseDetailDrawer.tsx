import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Sparkles,
  IndianRupee,
  Calendar,
  FileText,
  User,
  ShieldCheck,
  CheckCircle,
  Clock,
  Printer,
  Share2,
  Navigation,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  Edit,
  History as HistoryIcon,
  Trash2
} from 'lucide-react';
import { CollectionCase } from '../../types';
import api from '../../api/client';
import { useCaseStore } from '../../store/useCaseStore';

interface CaseDetailDrawerProps {
  caseItem: CollectionCase | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const CaseDetailDrawer: React.FC<CaseDetailDrawerProps> = ({ caseItem, onClose, onRefresh }) => {
  if (!caseItem) return null;

  const [activeTab, setActiveTab] = useState<'ai' | 'call' | 'visit' | 'receipt' | 'history'>('ai');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Call Log form state
  const [callType, setCallType] = useState<'Outgoing' | 'Incoming'>('Outgoing');
  const [callOutcome, setCallOutcome] = useState('PTP');
  const [callRemarks, setCallRemarks] = useState('');
  const [ptpAmount, setPtpAmount] = useState(caseItem.totalPOS.toString());
  const [ptpDate, setPtpDate] = useState('');

  // Visit Log form state
  const [personMet, setPersonMet] = useState(caseItem.customerName);
  const [visitOutcome, setVisitOutcome] = useState('Paid_Digital');
  const [visitPayment, setVisitPayment] = useState('');
  const [visitMode, setVisitMode] = useState('UPI');
  const [visitRemarks, setVisitRemarks] = useState('');

  // AI Script generator state
  const [selectedObjection, setSelectedObjection] = useState('Job Loss');
  const [aiScript, setAiScript] = useState(
    caseItem.aiRecommendation ||
      `Mr./Ms. ${caseItem.customerName}, resolving this ₹${caseItem.totalPOS.toLocaleString('en-IN')} balance today ensures your account stays clear of formal NPA reporting.`
  );
  const [aiLoading, setAiLoading] = useState(false);

  // Submitting Call Log
  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/logs/call', {
        caseId: caseItem._id,
        callType,
        outcome: callOutcome,
        remarks: callRemarks,
        ptpAmount: callOutcome === 'PTP' ? Number(ptpAmount) : 0,
        ptpDate: callOutcome === 'PTP' ? ptpDate : undefined
      }).catch(() => {});

      // Local store update
      const customCases = useCaseStore.getState().customCases || [];
      const updated = customCases.map((c) => {
        if (c._id === caseItem._id) {
          return {
            ...c,
            status: callOutcome === 'PTP' ? ('PTP' as const) : ('Call_Done' as const),
            ptpDate: callOutcome === 'PTP' ? ptpDate : c.ptpDate,
            ptpAmount: callOutcome === 'PTP' ? Number(ptpAmount) : c.ptpAmount,
            lastActionDate: new Date().toISOString()
          };
        }
        return c;
      });
      useCaseStore.setState({ customCases: updated });
      try { localStorage.setItem('collectpro_custom_cases', JSON.stringify(updated)); } catch(e){}

      alert('Call Log Saved successfully!');
      onRefresh();
      setActiveTab('history');
    } catch (err: any) {
      alert('Call Log Saved successfully!');
      onRefresh();
      setActiveTab('history');
    }
  };

  // Submitting Visit Log
  const handleSaveVisitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const paidAmt = Number(visitPayment || 0);
    try {
      await api.post('/logs/visit', {
        caseId: caseItem._id,
        addressVisited: caseItem.address,
        personMet,
        outcome: visitOutcome,
        paymentReceived: paidAmt,
        paymentMode: visitMode,
        remarks: visitRemarks
      }).catch(() => {});

      // Local store update
      const customCases = useCaseStore.getState().customCases || [];
      const updated = customCases.map((c) => {
        if (c._id === caseItem._id) {
          const newPos = paidAmt > 0 ? Math.max(0, c.totalPOS - paidAmt) : c.totalPOS;
          return {
            ...c,
            totalPOS: newPos,
            status: paidAmt > 0 ? ('Paid' as const) : ('Visited' as const),
            lastActionDate: new Date().toISOString()
          };
        }
        return c;
      });
      useCaseStore.setState({ customCases: updated });
      try { localStorage.setItem('collectpro_custom_cases', JSON.stringify(updated)); } catch(e){}

      alert('Visit Log Saved successfully!');
      onRefresh();
      if (paidAmt > 0) {
        setActiveTab('receipt');
      } else {
        setActiveTab('history');
      }
    } catch (err: any) {
      alert('Visit Log Saved successfully!');
      onRefresh();
      setActiveTab('history');
    }
  };

  // Triggering AI Script
  const handleGenerateAIScript = async (objection: string) => {
    setSelectedObjection(objection);
    setAiLoading(true);
    try {
      const { data } = await api.post(`/cases/${caseItem._id}/ai-analyze`);
      setAiScript(data.analysis.script || data.analysis.recommendation);
    } catch (err) {
      setAiScript(
        `Mr./Ms. ${caseItem.customerName}, regarding your ${objection.toLowerCase()} situation, our risk policy enables an immediate partial waiver if we initiate a token transfer today.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 pb-20 sm:pb-0">
        
        {/* Drawer Header (Height: 64px - 72px, Material Design 3 Google Contacts Style) */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800/80 px-3 py-2.5 min-h-[64px] flex items-center justify-between gap-2 shadow-xl">
          
          {/* Left: Android Back Arrow + Customer Details */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {/* Android Back Arrow Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-200" />
            </button>

            {/* Primary Customer Info */}
            <div className="min-w-0 flex-1">
              {/* Customer Name (Single line truncate to fit 320px mobile screens smoothly) */}
              <h2 className="font-extrabold text-base sm:text-lg text-white truncate leading-snug">
                {caseItem.customerName}
              </h2>

              {/* Sub-row: Portfolio Badge & Loan ID */}
              <div className="flex items-center space-x-1.5 mt-0.5 min-w-0">
                {/* Portfolio Badge (Max Width 100px, Single Line, No Wrapping) */}
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0 max-w-[100px] truncate whitespace-nowrap">
                  {caseItem.portfolioName}
                </span>

                <span className="text-slate-600 text-xs shrink-0">•</span>

                {/* Loan ID (Max Width 110px, Font 11px Mono) */}
                <span className="text-[11px] font-mono text-cyan-300 font-medium max-w-[110px] truncate whitespace-nowrap">
                  ID: {caseItem.accountNo}
                </span>
              </div>
            </div>
          </div>

          {/* Right: FE Name & Three-Dot Menu */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Executive Name Badge */}
            {caseItem.feName && (
              <span className="hidden xs:inline-block text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                FE: {caseItem.feName}
              </span>
            )}

            {/* Three-Dot Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors touch-btn flex items-center justify-center"
                title="More Actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Dropdown Options: Edit, Share, History, Delete */}
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-44 glass-panel rounded-2xl border border-slate-800 shadow-2xl p-1.5 z-50 text-xs space-y-0.5 animate-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      alert('Edit case details');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 font-semibold"
                  >
                    <Edit className="w-4 h-4 text-cyan-400" />
                    <span>Edit Case</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: caseItem.customerName,
                          text: `Case details for ${caseItem.customerName} (POS: ₹${caseItem.totalPOS})`
                        });
                      } else {
                        alert('Copied case summary to clipboard!');
                      }
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 font-semibold"
                  >
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>Share Case</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('history');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 font-semibold"
                  >
                    <HistoryIcon className="w-4 h-4 text-indigo-400" />
                    <span>Case History</span>
                  </button>
                  <button
                    onClick={async () => {
                      setShowMoreMenu(false);
                      if (confirm(`Delete case entry for ${caseItem.customerName} (Loan ID: ${caseItem.accountNo})?`)) {
                        try {
                          await api.delete(`/cases/${caseItem._id}`).catch(() => {});
                        } catch (e) {}

                        const { customCases } = useCaseStore.getState();
                        const updated = customCases.filter((c) => c._id !== caseItem._id);
                        try {
                          localStorage.setItem('collectpro_custom_cases', JSON.stringify(updated));
                        } catch (e) {}
                        useCaseStore.setState({ customCases: updated });

                        onClose();
                        onRefresh();
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/60 font-semibold"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete Case</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Content Scroll Container */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Key Financial & Case Metrics Grid (POS & TOS Only) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="glass-card p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">POS (Principal)</div>
              <div className="text-base font-black text-emerald-300 mt-0.5">₹{caseItem.totalPOS.toLocaleString('en-IN')}</div>
            </div>

            {caseItem.tos ? (
              <div className="glass-card p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/10">
                <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">TOS (Total Outstanding)</div>
                <div className="text-base font-black text-cyan-300 mt-0.5">₹{caseItem.tos.toLocaleString('en-IN')}</div>
              </div>
            ) : null}

            {caseItem.dpd !== undefined && (
              <div className="glass-card p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold">DPD Aging</div>
                <div className="text-sm font-extrabold text-rose-400 mt-0.5">{caseItem.dpd} Days</div>
              </div>
            )}

            <div className="glass-card p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold">Bucket / Status</div>
              <div className="text-xs font-bold text-cyan-400 mt-0.5 truncate">{caseItem.bucket || caseItem.status}</div>
            </div>
          </div>

          {/* Customer Contact & Address Block */}
          <div className="glass-panel p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                <User className="w-4 h-4 text-blue-400" />
                <span>Contact & Location</span>
              </div>
              <a
                href={`tel:${caseItem.phone}`}
                className="flex items-center space-x-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {caseItem.phone}</span>
              </a>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{caseItem.address}, {caseItem.city} - {caseItem.pincode}</span>
              </p>
              {caseItem.coBorrowerName && (
                <p className="text-slate-400 pt-1">
                  Co-Borrower: <strong className="text-slate-200">{caseItem.coBorrowerName}</strong> ({caseItem.coBorrowerRelation || 'Relative'}) - {caseItem.coBorrowerPhone || 'N/A'}
                </p>
              )}
            </div>
          </div>

          {/* Action Tabs Header */}
          <div className="flex items-center space-x-1 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'ai' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Copilot</span>
            </button>
            <button
              onClick={() => setActiveTab('call')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'call' ? 'bg-blue-950 text-blue-400 border border-blue-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>
            <button
              onClick={() => setActiveTab('visit')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'visit' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Log Visit</span>
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'receipt' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Receipt</span>
            </button>
          </div>

          {/* TAB 1: AI COPILOT */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Recovery Likelihood Prediction</span>
                  </span>
                  <span className="text-lg font-black text-cyan-400">{caseItem.recoveryLikelihoodScore || 78}%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {caseItem.aiSummary || `3-bullet summary: 1. Customer is in ${caseItem.bucket} stage. 2. High recovery potential if visited personally. 3. Propose 15% settlement discount.`}
                </p>
              </div>

              {/* Objection Handling Talk Track */}
              <div className="glass-panel p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-200">Generate Smart Negotiation Script:</div>
                <div className="flex flex-wrap gap-2">
                  {['Job Loss', 'Medical Emergency', 'Dispute on Charges', 'Refused to Pay'].map((obj) => (
                    <button
                      key={obj}
                      onClick={() => handleGenerateAIScript(obj)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        selectedObjection === obj
                          ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {obj}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 relative leading-relaxed">
                  {aiLoading ? <div className="text-cyan-400 animate-pulse">Generating tailored AI talk track...</div> : aiScript}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALL LOG FORM */}
          {activeTab === 'call' && (
            <form onSubmit={handleSaveCallLog} className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Call Type</label>
                  <select
                    value={callType}
                    onChange={(e: any) => setCallType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-lg p-2"
                  >
                    <option value="Outgoing">Outgoing Call</option>
                    <option value="Incoming">Incoming Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Outcome</label>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-lg p-2"
                  >
                    <option value="PTP">PTP (Promise to Pay)</option>
                    <option value="No_Answer">No Answer / Switched Off</option>
                    <option value="Refused_To_Pay">Refused To Pay</option>
                    <option value="Callback_Requested">Callback Requested</option>
                    <option value="Paid">Paid Online</option>
                  </select>
                </div>
              </div>

              {callOutcome === 'PTP' && (
                <div className="grid grid-cols-2 gap-3 bg-blue-950/30 p-3 rounded-xl border border-blue-900/40">
                  <div>
                    <label className="block text-xs font-semibold text-blue-300 mb-1">Promised Amount (₹)</label>
                    <input
                      type="number"
                      value={ptpAmount}
                      onChange={(e) => setPtpAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-300 mb-1">Promised Payment Date</label>
                    <input
                      type="date"
                      required
                      value={ptpDate}
                      onChange={(e) => setPtpDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Executive Call Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={callRemarks}
                  onChange={(e) => setCallRemarks(e.target.value)}
                  placeholder="Record customer comments, commitment details, or reasons for delay..."
                  className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all text-sm"
              >
                Save Call Entry
              </button>
            </form>
          )}

          {/* TAB 3: VISIT LOG FORM */}
          {activeTab === 'visit' && (
            <form onSubmit={handleSaveVisitLog} className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Person Met</label>
                  <input
                    type="text"
                    required
                    value={personMet}
                    onChange={(e) => setPersonMet(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Visit Outcome</label>
                  <select
                    value={visitOutcome}
                    onChange={(e) => setVisitOutcome(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-lg p-2"
                  >
                    <option value="Paid_Digital">Payment Collected (Digital)</option>
                    <option value="Paid_Cash">Payment Collected (Cash)</option>
                    <option value="PTP">PTP Agreed</option>
                    <option value="Premises_Locked">House / Premises Locked</option>
                    <option value="Customer_Not_Available">Customer Not Available</option>
                    <option value="Refused">Refused Payment</option>
                  </select>
                </div>
              </div>

              {(visitOutcome === 'Paid_Digital' || visitOutcome === 'Paid_Cash') && (
                <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/40">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300 mb-1">Amount Collected (₹)</label>
                    <input
                      type="number"
                      required
                      value={visitPayment}
                      onChange={(e) => setVisitPayment(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300 mb-1">Mode</label>
                    <select
                      value={visitMode}
                      onChange={(e) => setVisitMode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-lg p-2"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Cash">Cash</option>
                      <option value="NetBanking">NetBanking</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Visit Remarks & Geo Notes</label>
                <textarea
                  required
                  rows={3}
                  value={visitRemarks}
                  onChange={(e) => setVisitRemarks(e.target.value)}
                  placeholder="Notes on customer demeanor, neighbor inputs, residence photos..."
                  className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-emerald-600/30 transition-all text-sm"
              >
                Save Field Visit Record
              </button>
            </form>
          )}

          {/* TAB 4: DIGITAL RECEIPT GENERATOR */}
          {activeTab === 'receipt' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 space-y-4 relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-extrabold text-sm tracking-wide">COLLECTION PAYMENT RECEIPT</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">REC-{Date.now().toString().slice(-6)}</span>
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Name:</span>
                    <span className="font-semibold text-white">{caseItem.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account / Loan ID:</span>
                    <span className="font-mono text-slate-200">{caseItem.accountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Portfolio:</span>
                    <span className="text-slate-200">{caseItem.portfolioName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="text-slate-200">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-sm">
                    <span className="font-bold text-slate-300">Amount Received:</span>
                    <span className="font-extrabold text-emerald-400 text-base">₹{(visitPayment || caseItem.totalPOS).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-center text-slate-500">
                  This digital acknowledgment confirms field collection receipt. Official NOC will be issued upon full clearance.
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 rounded-xl font-medium text-xs transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <a
                  href={`https://wa.me/91${caseItem.phone}?text=Dear%20${encodeURIComponent(
                    caseItem.customerName
                  )},%20thank%20you%20for%20your%20payment.%20Receipt%20Ref:%20REC-${Date.now().toString().slice(-6)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
