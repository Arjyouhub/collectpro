import React from 'react';
import { IndianRupee, TrendingUp, CheckCircle, Clock, ShieldAlert, Award, FileSpreadsheet, MapPin, Sparkles, Target, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardKPIs, PortfolioSummary } from '../../types';

interface ExecutiveDashboardProps {
  kpis?: DashboardKPIs;
  portfolios?: PortfolioSummary[];
  onNavigateTab: (tab: string) => void;
  openExcelModal: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  kpis = {
    totalCases: 248,
    totalPOS: 18450000,
    totalCollected: 4620000,
    ptpCasesCount: 42,
    paidCasesCount: 68,
    recoveryPercentage: 25.0
  },
  portfolios = [
    { _id: '1', name: 'HDFC Credit Cards', totalCases: 95, totalPOS: 6800000 },
    { _id: '2', name: 'SBI Personal Loans', totalCases: 80, totalPOS: 7200000 },
    { _id: '3', name: 'Bajaj Finance Two Wheeler', totalCases: 73, totalPOS: 4450000 }
  ],
  onNavigateTab,
  openExcelModal
}) => {
  const bucketData = [
    { name: '1-30 DPD', count: 92, amount: 4200000, color: '#3b82f6' },
    { name: '31-60 DPD', count: 64, amount: 5100000, color: '#06b6d4' },
    { name: '61-90 DPD', count: 48, amount: 4800000, color: '#f59e0b' },
    { name: '90+ NPA', count: 44, amount: 4350000, color: '#ef4444' }
  ];

  const completionPercentage = Math.round((kpis.paidCasesCount / Math.max(1, kpis.totalCases)) * 100);

  return (
    <div className="space-y-4 pb-24 md:pb-8 max-w-full overflow-x-hidden">
      
      {/* Material 3 AI Insights Card Stack (Inspired by Google Maps & PhonePe) */}
      <div className="glass-panel p-4 rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Field Operations Hub</span>
          </div>
          <span className="text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full">
            Live AI Feed
          </span>
        </div>

        {/* Completion % Progress Bar */}
        <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Quarterly Target Progress</span>
            <span className="text-cyan-400">{completionPercentage}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completionPercentage)}%` }}
            />
          </div>
        </div>

        {/* 2-Column AI Intelligence Widgets */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          
          {/* Widget 1: Today's Route */}
          <div
            onClick={() => onNavigateTab('map')}
            className="glass-card p-3 rounded-2xl border border-slate-800 cursor-pointer hover:border-cyan-500/50 space-y-1"
          >
            <div className="flex items-center space-x-1 text-cyan-400 font-bold text-[11px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Today's Route</span>
            </div>
            <div className="text-sm font-black text-white">12 Stops (18.4 km)</div>
            <div className="text-[10px] text-slate-400">Sequenced by TSP AI</div>
          </div>

          {/* Widget 2: PTP Due Today */}
          <div
            onClick={() => onNavigateTab('cases')}
            className="glass-card p-3 rounded-2xl border border-slate-800 cursor-pointer hover:border-cyan-500/50 space-y-1"
          >
            <div className="flex items-center space-x-1 text-amber-400 font-bold text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>PTP Due Today</span>
            </div>
            <div className="text-sm font-black text-amber-400">{kpis.ptpCasesCount} Commitments</div>
            <div className="text-[10px] text-slate-400">Expected ₹1.2L collection</div>
          </div>

        </div>
      </div>

      {/* KPI Cards Grid (Stacks Vertically 1-Col on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total POS */}
        <div className="glass-card p-3.5 rounded-[20px] border border-slate-800 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assigned POS</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            ₹{kpis.totalPOS.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 font-medium"> Across {kpis.totalCases} total cases</p>
        </div>

        {/* Card 2: Total Recovered */}
        <div className="glass-card p-3.5 rounded-[20px] border border-slate-800 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-400">
            ₹{kpis.totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center space-x-2 text-xs text-emerald-300 font-medium">
            <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800/50 font-bold">
              {kpis.recoveryPercentage}%
            </span>
            <span>Target Achieved</span>
          </div>
        </div>

        {/* Card 3: Active PTPs */}
        <div className="glass-card p-3.5 rounded-[20px] border border-slate-800 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Promise To Pay (PTP)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {kpis.ptpCasesCount} <span className="text-xs font-normal text-slate-400">cases</span>
          </div>
          <p className="text-xs text-cyan-400 font-medium">Scheduled for collection</p>
        </div>

        {/* Card 4: Fully Settled */}
        <div className="glass-card p-3.5 rounded-[20px] border border-slate-800 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolved / Paid</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {kpis.paidCasesCount} <span className="text-xs font-normal text-slate-400">cases</span>
          </div>
          <p className="text-xs text-indigo-300 font-medium">Closed with payment</p>
        </div>

      </div>

      {/* Visual Charts Grid (Vertical Stack on Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* DPD Bucket Chart */}
        <div className="glass-panel p-4 rounded-[20px] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">DPD Aging Breakdown</h2>
              <p className="text-[11px] text-slate-400">Distribution of cases by delinquency stage</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'POS Overdue']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {bucketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Portfolios List */}
        <div className="glass-panel p-4 rounded-[20px] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Active Portfolios</h2>
              <p className="text-[11px] text-slate-400">Bank & NBFC breakdown</p>
            </div>
            <button onClick={() => onNavigateTab('cases')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              View All
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {portfolios.map((p) => (
              <div key={p._id} className="glass-card p-3 rounded-xl flex items-center justify-between border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{p.name}</h3>
                  <p className="text-[11px] text-slate-400">{p.totalCases} assigned cases</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-cyan-400">₹{p.totalPOS.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500">Total POS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
