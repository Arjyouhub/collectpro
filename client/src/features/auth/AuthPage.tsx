import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, UserCheck, Lock, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/client';

export const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password, phone } : { email, password };
      const { data } = await api.post(endpoint, payload);

      setAuth(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setError('');
    setAuth(
      {
        id: 'demo-user-123',
        name: 'Rajesh Kumar (Field Exec)',
        email: 'executive@collectpro.ai',
        agentCode: 'AG-9042',
        role: 'Executive'
      },
      'demo-jwt-token-standalone-mode'
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-3 py-3 sm:py-12 relative overflow-y-auto">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-4 sm:space-y-6 z-10 py-2">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">CollectPro <span className="text-cyan-400">AI</span></h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Field Collection Executive Workspace & Route Optimizer</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">
              {isRegister ? 'Executive Registration' : 'Executive Sign In'}
            </h2>
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              {isRegister ? 'Already registered? Sign In' : 'New Executive? Register'}
            </button>
          </div>

          {error && (
            <div className="flex items-start space-x-2 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Executive Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@collectpro.ai"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>⚡ Instant Demo Workspace Login</span>
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">No setup needed. Instant 1-click evaluation mode.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
