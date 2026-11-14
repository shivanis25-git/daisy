import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { User as UserType } from '../types.js';

interface AuthViewProps {
  onAuthSuccess: (user: UserType) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('BCA Student');
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        onAuthSuccess(res.user);
      } else {
        const res = await api.register(name.trim(), email.trim(), password, role);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // One-click quick login for instant 2-user demo
  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    setLoadingEmail(demoEmail);
    try {
      const res = await api.login(demoEmail, 'daisy123');
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
      setLoadingEmail(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-br from-[#E6F2FF] via-[#EEF6FF] to-[#F8FBFF]">
      {/* Background ambient decorative glowing orbs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand & Hero Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 shadow-xl shadow-cyan-500/25 mb-1">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3.5" fill="#FDE047" stroke="#F59E0B" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2" />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 bg-clip-text text-transparent">
            Daisy Mail
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Smart Mail Notification & Voice Assistant System
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px] font-mono-numeric">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>BCA Student Hackathon Edition</span>
          </div>
        </div>

        {/* Quick Demo 1-Click Login Card */}
        <div className="aqua-glass-card rounded-2xl p-4 shadow-sm space-y-2.5 border border-sky-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              ⚡ Quick 1-Click Demo Login
            </span>
            <span className="text-[10px] text-slate-400 font-mono-numeric">password: daisy123</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('arjun@daisy.mail')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/80 hover:bg-sky-50 border border-sky-200/70 text-left transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                  alt="Arjun"
                  className="w-7 h-7 rounded-full border border-sky-300 object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {loadingEmail === 'arjun@daisy.mail' ? 'Signing in...' : 'Arjun Verma'}
                  </div>
                  <div className="text-[10px] text-sky-600 font-mono-numeric truncate">arjun@daisy.mail</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleQuickLogin('priya@daisy.mail')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/80 hover:bg-sky-50 border border-sky-200/70 text-left transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                  alt="Priya"
                  className="w-7 h-7 rounded-full border border-sky-300 object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {loadingEmail === 'priya@daisy.mail' ? 'Signing in...' : 'Priya Sharma'}
                  </div>
                  <div className="text-[10px] text-sky-600 font-mono-numeric truncate">priya@daisy.mail</div>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={() => handleQuickLogin('mentor@daisy.mail')}
            disabled={loading}
            className="w-full p-2.5 rounded-xl bg-white/60 hover:bg-sky-50 border border-sky-200/50 text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80"
                alt="Mentor"
                className="w-6 h-6 rounded-full border border-sky-300 object-cover"
              />
              <span className="text-xs font-semibold text-slate-700">
                {loadingEmail === 'mentor@daisy.mail' ? 'Signing in...' : 'Prof. Rohan Nair'}{' '}
                <span className="text-[10px] text-slate-400 font-mono-numeric">(mentor@daisy.mail)</span>
              </span>
            </div>
            {loadingEmail === 'mentor@daisy.mail' ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
            )}
          </button>
        </div>

        {/* Main Authentication Card */}
        <div className="aqua-glass rounded-3xl p-6 shadow-xl border border-sky-200/80 space-y-4">
          {/* Tabs */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Daisy Student"
                      required
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role / Class
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. BCA 3rd Year"
                    className="w-full px-3.5 py-2 text-xs rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daisy Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. arjun@daisy.mail"
                  required
                  className="w-full pl-9 pr-4 py-2 text-xs font-mono-numeric rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="aqua-jelly-btn w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Hackathon Info */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>Dual DB: MongoDB Atlas + Local JSON Store Fallback</p>
          <p>Real-time Nodemailer + Socket.IO + Web Speech Synthesis</p>
        </div>
      </div>
    </div>
  );
};
