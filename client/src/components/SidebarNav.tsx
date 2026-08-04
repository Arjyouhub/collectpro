import React from 'react';
import { LayoutDashboard, Database, MapPin, Sparkles, User, FileSpreadsheet, PlusCircle, LogOut } from 'lucide-react';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openExcelModal: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  openExcelModal
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Cases CRM', icon: Database },
    { id: 'map', label: 'Route Map', icon: MapPin },
    { id: 'ai', label: 'AI Copilot', icon: Sparkles },
    { id: 'profile', label: 'Profile & Settings', icon: User }
  ];

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* DESKTOP & TABLET LEFT SIDEBAR (>= 768px)                       */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-64 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 p-4 z-40 space-y-6 shadow-2xl">
        {/* Quick Action: Import Excel Button */}
        <button
          onClick={openExcelModal}
          className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center space-x-2 text-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>+ Import Excel Portfolio</span>
        </button>

        {/* Navigation Items List */}
        <div className="space-y-1.5 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
            Workspace Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 text-xs font-bold ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Executive Status Card */}
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 space-y-1 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300">CollectPro AI Enterprise</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-500">Connected • Real-time Sync Active</p>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE FAB & BOTTOM NAVIGATION (< 768px)                       */}
      {/* ------------------------------------------------------------- */}
      <button
        onClick={openExcelModal}
        className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 text-slate-950 p-4 rounded-2xl shadow-2xl shadow-cyan-500/40 border border-cyan-300/30 active:scale-95 transition-transform flex items-center justify-center min-h-[52px] min-w-[52px]"
        title="Import Excel Portfolio"
      >
        <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* Material Design 3 Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 min-h-[48px] ${
            activeTab === 'dashboard'
              ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-[22px] h-[22px]" />
          <span className="text-[11px] mt-1 font-medium leading-none">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 min-h-[48px] ${
            activeTab === 'cases'
              ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-[22px] h-[22px]" />
          <span className="text-[11px] mt-1 font-medium leading-none">Cases</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 min-h-[48px] ${
            activeTab === 'map'
              ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-[22px] h-[22px]" />
          <span className="text-[11px] mt-1 font-medium leading-none">Map</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 min-h-[48px] ${
            activeTab === 'ai'
              ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-[22px] h-[22px]" />
          <span className="text-[11px] mt-1 font-medium leading-none">AI</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 min-h-[48px] ${
            activeTab === 'profile'
              ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-[22px] h-[22px]" />
          <span className="text-[11px] mt-1 font-medium leading-none">Profile</span>
        </button>
      </nav>
    </>
  );
};
