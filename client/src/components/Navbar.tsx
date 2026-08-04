import React, { useState } from 'react';
import { ShieldCheck, Bell, Sparkles, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openExcelModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openExcelModal }) => {
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-2xl pt-[env(safe-area-inset-top,0px)]">
      {/* Material Design 3 Compact App Bar (Height: 56px / 3.5rem) */}
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

          {/* Notifications Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
            </button>

            {/* Notification Dropdown Card */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 glass-panel p-3.5 rounded-2xl border border-slate-800 shadow-2xl space-y-2 z-50 text-xs animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Field Notifications</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-bold">2 New</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                    <div className="font-bold text-slate-200">PTP Commitment Alert</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Sajid Haris committed ₹15,000 for today 4:00 PM.</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                    <div className="font-bold text-slate-200">Optimal Route Updated</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">TSP AI sequenced 12 field visits (18.4 km total).</div>
                  </div>
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
