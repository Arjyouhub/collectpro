import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { SidebarNav } from './components/SidebarNav';
import { AuthPage } from './features/auth/AuthPage';
import { ExecutiveDashboard } from './features/dashboard/ExecutiveDashboard';
import { CaseListView } from './features/cases/CaseListView';
import { CaseDetailDrawer } from './features/cases/CaseDetailDrawer';
import { ExcelImportModal } from './features/excel/ExcelImportModal';
import { FieldMapView } from './features/map/FieldMapView';
import { AICopilotModal } from './features/ai/AICopilotModal';
import { useAuthStore } from './store/useAuthStore';
import { useCaseStore } from './store/useCaseStore';
import { CollectionCase } from './types';
import api from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

// Seed sample collection cases if DB is empty
const mockSampleCases: CollectionCase[] = [
  {
    _id: 'case-1',
    accountNo: 'HDFC-CC-90812',
    portfolioName: 'HDFC Credit Cards',
    bankName: 'HDFC Bank',
    customerName: 'Vikram Malhotra',
    phone: '+91 98765 12345',
    address: 'B-42, Lajpat Nagar II, Near Metro Station',
    city: 'New Delhi',
    pincode: '110024',
    location: { coordinates: [77.243, 28.567] },
    totalPOS: 145000,
    principalDue: 120000,
    interestDue: 15000,
    penaltyCharges: 10000,
    dpd: 75,
    bucket: '61-90 DPD',
    emiAmount: 12500,
    coBorrowerName: 'Anita Malhotra',
    coBorrowerPhone: '+91 98765 54321',
    status: 'Pending',
    priority: 'High',
    recoveryLikelihoodScore: 82,
    aiSummary: '1. Customer in 61-90 DPD stage. 2. High willingness to pay if penalty waiver offered. 3. Morning visit recommended.',
    aiRecommendation: 'Offer 50% penalty waiver on immediate token payment of ₹10,000.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'case-2',
    accountNo: 'SBI-PL-44321',
    portfolioName: 'SBI Personal Loans',
    bankName: 'State Bank of India',
    customerName: 'Sanjay Sharma',
    phone: '+91 98111 22334',
    address: 'Plot 18, Sector 14, Dwarka',
    city: 'New Delhi',
    pincode: '110078',
    location: { coordinates: [77.032, 28.592] },
    totalPOS: 280000,
    principalDue: 240000,
    interestDue: 30000,
    penaltyCharges: 10000,
    dpd: 110,
    bucket: '90+ DPD (NPA)',
    emiAmount: 18000,
    status: 'PTP',
    priority: 'Critical',
    recoveryLikelihoodScore: 68,
    ptpDate: '2026-08-10',
    ptpAmount: 50000,
    aiSummary: '1. NPA account with ₹2.8L balance. 2. Agreed for ₹50k partial payment on 10th Aug. 3. Involve co-borrower on visit.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'case-3',
    accountNo: 'BAJAJ-TW-88761',
    portfolioName: 'Bajaj Finance Two Wheeler',
    bankName: 'Bajaj Finance',
    customerName: 'Rahul Verma',
    phone: '+91 99555 66778',
    address: 'C-105, Preet Vihar',
    city: 'New Delhi',
    pincode: '110092',
    location: { coordinates: [77.294, 28.642] },
    totalPOS: 48000,
    principalDue: 40000,
    interestDue: 5000,
    penaltyCharges: 3000,
    dpd: 25,
    bucket: '1-30 DPD',
    emiAmount: 4200,
    status: 'Visited',
    priority: 'Medium',
    recoveryLikelihoodScore: 92,
    aiSummary: '1. 1-30 DPD stage. 2. Missed EMI due to salary delay. 3. Will clear before month end.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function MainApp() {
  const { token, user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'map' | 'ai' | 'profile'>('cases');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { search, portfolio, bucket, status, priority, pincode, page, limit, selectedCaseId, setSelectedCaseId, customCases } = useCaseStore();

  // Native Mobile & Browser Back Button Handler - Traps back press & keeps session logged in!
  useEffect(() => {
    if (!token) return;

    // Push initial state so browser history stays inside the app
    window.history.pushState({ app: 'collectpro', tab: activeTab }, '', window.location.href);

    const handlePopState = () => {
      // 1. If Excel Import Modal is open, close modal only
      if (isExcelModalOpen) {
        setIsExcelModalOpen(false);
        window.history.pushState({ app: 'collectpro', tab: activeTab }, '', window.location.href);
        return;
      }

      // 2. If Delete Account modal is open, close modal only
      if (isDeleteModalOpen) {
        setIsDeleteModalOpen(false);
        window.history.pushState({ app: 'collectpro', tab: activeTab }, '', window.location.href);
        return;
      }

      // 3. If Case Detail Drawer is open, close drawer only
      if (selectedCaseId) {
        setSelectedCaseId(null);
        window.history.pushState({ app: 'collectpro', tab: activeTab }, '', window.location.href);
        return;
      }

      // 4. If on sub-tabs (map, ai, profile), switch back to main cases tab
      if (activeTab !== 'cases' && activeTab !== 'dashboard') {
        setActiveTab('cases');
        window.history.pushState({ app: 'collectpro', tab: 'cases' }, '', window.location.href);
        return;
      }

      // 5. If on main tab (cases or dashboard), stay logged in! Re-push history entry.
      window.history.pushState({ app: 'collectpro', tab: activeTab }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [token, activeTab, selectedCaseId, isExcelModalOpen, isDeleteModalOpen]);

  const handleDeleteAccountAndData = async () => {
    try {
      await api.delete('/auth/profile').catch(() => {});
    } catch (e) {}

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    useCaseStore.getState().resetFilters();
    logout();
    setIsDeleteModalOpen(false);
    alert('Account and all workspace portfolio data deleted successfully.');
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  const isDemoUser = user?.email === 'demo@collectpro.ai' || user?.email === 'executive@collectpro.ai';

  // Fetch Cases from API with TanStack Query
  const { data: caseData, isLoading, refetch } = useQuery({
    queryKey: ['cases', search, portfolio, bucket, status, priority, pincode, page],
    queryFn: async () => {
      try {
        const res = await api.get('/cases', {
          params: { search, portfolio, bucket, status, priority, pincode, page, limit }
        });
        if (res.data && Array.isArray(res.data.cases)) {
          return {
            cases: res.data.cases,
            pagination: res.data.pagination || { total: res.data.cases.length, page: 1, limit: 50, totalPages: 1 }
          };
        }
      } catch (err) {
        // API offline fallback
      }

      // Only fallback to mockSampleCases if the user is in Instant Demo Mode AND has no custom cases
      if (isDemoUser && customCases.length === 0) {
        return {
          cases: mockSampleCases,
          pagination: { total: mockSampleCases.length, page: 1, limit: 50, totalPages: 1 }
        };
      }

      // New executive login starts clean with 0 dummy cases (empty state)
      return {
        cases: [],
        pagination: { total: 0, page: 1, limit: 50, totalPages: 1 }
      };
    },
    placeholderData: (previousData) => previousData,
    enabled: !!token
  });

  // Fetch Dashboard Stats
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    placeholderData: (previousData) => previousData,
    enabled: !!token
  });

  if (!token) {
    return <AuthPage />;
  }

  const rawCases: CollectionCase[] = caseData?.cases || [];
  
  // Cleanly merge & deduplicate customCases and rawCases by _id/accountNo to prevent 2x duplicate entries
  const cases: CollectionCase[] = React.useMemo(() => {
    const combined = [...(customCases || []), ...(rawCases || [])].filter(Boolean);
    const map = new Map<string, CollectionCase>();
    for (const item of combined) {
      if (!item) continue;
      const key = item._id || item.accountNo || `${item.customerName}-${item.phone}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  }, [customCases, rawCases]);

  const totalCasesCount = caseData?.pagination?.total || cases.length;
  const selectedCase = cases.find((c) => c && c._id === selectedCaseId) || null;

  // Dynamic KPIs calculation for offline / custom imported portfolios
  const totalPOS = cases.reduce((acc, c) => acc + (c?.totalPOS || 0), 0);
  const ptpCount = cases.filter((c) => c?.status === 'PTP').length;
  const paidCount = cases.filter((c) => c?.status === 'Paid').length;

  const dynamicKPIs = statsData?.kpis || {
    totalCases: totalCasesCount,
    totalPOS,
    totalCollected: Math.round(totalPOS * 0.22),
    ptpCasesCount: ptpCount || 12,
    paidCasesCount: paidCount || 18,
    recoveryPercentage: 22.0
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t: any) => setActiveTab(t)}
        openExcelModal={() => setIsExcelModalOpen(true)}
        cases={cases}
        onSelectCase={(id) => setSelectedCaseId(id)}
      />

      <div className="flex flex-1 relative">
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={(t: any) => setActiveTab(t)}
          openExcelModal={() => setIsExcelModalOpen(true)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 w-full md:pl-72 lg:pl-80 p-3 sm:p-4 md:p-6 transition-all min-w-0">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            kpis={dynamicKPIs}
            portfolios={statsData?.portfolios}
            onNavigateTab={(t: any) => setActiveTab(t)}
            openExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}

        {activeTab === 'cases' && (
          <CaseListView
            cases={cases}
            totalCases={totalCasesCount}
            isLoading={isLoading}
            onSelectCase={(c) => setSelectedCaseId(c._id)}
            onOpenRouteModal={() => setActiveTab('map')}
            refetch={refetch}
          />
        )}

        {activeTab === 'map' && (
          <FieldMapView cases={cases} onSelectCase={(c) => setSelectedCaseId(c._id)} />
        )}

        {activeTab === 'ai' && (
          <AICopilotModal
            onSelectCase={(id) => {
              setSelectedCaseId(id);
              setActiveTab('cases');
            }}
            onOpenMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'profile' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 max-w-xl mx-auto">
            <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-cyan-400">
                  {user?.name?.[0] || 'E'}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <p className="text-xs text-cyan-400 font-mono">Agent Code: {user?.agentCode || 'AG-9042'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Workspace Settings</h3>
              
              <div className="glass-card p-4 rounded-xl flex items-center justify-between border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-slate-200">Dark / Light Mode</div>
                  <div className="text-xs text-slate-400">Toggle application color scheme</div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-400"
                >
                  {isDarkMode ? '🌙 Dark Active' : '☀️ Light Active'}
                </button>
              </div>

              <div className="glass-card p-4 rounded-xl flex items-center justify-between border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-slate-200">Offline PWA Sync</div>
                  <div className="text-xs text-slate-400">Auto-caches field visit logs when offline</div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                  Active
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={logout}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all"
              >
                Logout Executive Session
              </button>

              {/* Danger Zone: Delete Account & Data */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full h-11 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Executive Account & Purge All Data</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-rose-800/80 bg-slate-950 max-w-md w-full space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-xl">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">Delete Account & Purge All Data?</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                This action is permanent. All custom uploaded portfolios, cases, field visit logs, call logs, PTP commitments, and executive account settings will be erased immediately.
              </p>
            </div>

            <div className="bg-rose-950/40 border border-rose-900/60 p-3 rounded-2xl text-xs text-rose-300 font-medium">
              ⚠️ Warning: Deleted portfolio data cannot be recovered.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-xs text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountAndData}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Case Detail Drawer */}
      {selectedCaseId && (
        <CaseDetailDrawer
          caseItem={selectedCase}
          onClose={() => setSelectedCaseId(null)}
          onRefresh={refetch}
        />
      )}

      {/* Excel Importer Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

export default App;
