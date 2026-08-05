import React, { useState } from 'react';
import { ShieldCheck, Bell, Sparkles, User, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { CollectionCase } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openExcelModal: () => void;
  cases?: CollectionCase[];
  onSelectCase?: (caseId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openExcelModal, cases = [], onSelectCase }) => {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  // Compute Active PTP & Broken PTP Notification Items
  const ptpActiveCases = cases.filter((c) => c.status === 'PTP' || c.ptpAmount);
  const brokenPtpCases = cases.filter((c) => (c.status === 'PTP' && (c.dpd || 0) >= 60) || (c.dpd || 0) >= 90);

  const totalNotifCount = ptpActiveCases.length + brokenPtpCases.length;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-2xl pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: App Logo & Title */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('cases')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-0.5 shadow-md shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">
              CollectPro <span className="text-cyan-400 font-black">AI</span>
            </span>
          </div>
        </div>

        {/* Right: AI Shortcut, Notifications Bell, Profile Avatar */}
        <div className="flex items-center space-x-2">
          
          {/* AI Shortcut Button */}
          <button
            onClick={() => setActiveTab('ai')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'ai'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800'
            }`}
            title="Open AI Copilot"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Notifications Icon with Dynamic PTP Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors relative"
              title="PTP & Field Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalNotifCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="absolute top-1 right-1 bg-rose-500 text-white font-black text-[9px] px-1 rounded-full">
                    {totalNotifCount}
                  </span>
                </>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel p-4 rounded-2xl border border-slate-800 shadow-2xl space-y-3 z-50 text-xs animate-in zoom-in-95 duration-150 bg-slate-950/95 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-white flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>PTP & Revisit Notifications</span>
                  </span>
                  <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full font-bold">
                    {totalNotifCount} Alerts
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {/* Broken PTP Notifications */}
                  {brokenPtpCases.map((c) => (
                    <div key={'broken-' + c._id} className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-1">
                      <div className="flex items-center justify-between font-bold text-rose-300">
                        <span className="truncate">🔴 Broken PTP: {c.customerName}</span>
                        <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded">DPD {c.dpd}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Address: {c.address} • <span className="text-emerald-400 font-bold">₹{c.totalPOS.toLocaleString('en-IN')} POS</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveTab('cases');
                          onSelectCase?.(c._id);
                        }}
                        className="w-full mt-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all"
                      >
                        Revisit Immediately
                      </button>
                    </div>
                  ))}

                  {/* Active PTP Due Today Notifications */}
                  {ptpActiveCases.map((c) => (
                    <div key={'ptp-' + c._id} className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-1">
                      <div className="flex items-center justify-between font-bold text-cyan-300">
                        <span className="truncate">⏰ PTP Due: {c.customerName}</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">
                          ₹{(c.ptpAmount || Math.round(c.totalPOS * 0.3)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Promised Date: {c.ptpDate || 'Today'} • {c.address}
                      </div>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveTab('cases');
                          onSelectCase?.(c._id);
                        }}
                        className="w-full mt-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all"
                      >
                        Call / Collect PTP
                      </button>
                    </div>
                  ))}

                  {totalNotifCount === 0 && (
                    <div className="text-center p-4 text-slate-500">
                      <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <div>No pending broken PTP alerts</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 transition-all ${
              activeTab === 'profile' ? 'ring-2 ring-cyan-400' : ''
            }`}
            title="Executive Profile"
          >
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-black text-xs text-cyan-400">
              {user?.name?.[0] || <User className="w-4 h-4 text-slate-300" />}
            </div>
          </button>

        </div>

      </div>
    </header>
  );
};
