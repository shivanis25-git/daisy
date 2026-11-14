import React from 'react';
import { Search, Volume2, VolumeX, LogOut, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSocketConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  searchQuery,
  onSearchChange,
  isSocketConnected,
  isMuted,
  onToggleMute,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full aqua-glass border-b border-sky-200/50 px-4 md:px-6 py-2.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 shadow-md shadow-cyan-500/20 text-white font-bold text-lg select-none">
            <svg
              className="w-6 h-6 text-white drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Daisy flower / water drop glyph */}
              <circle cx="12" cy="12" r="3" fill="#FDE047" stroke="#F59E0B" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 bg-clip-text text-transparent">
                Daisy
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200/60 font-mono-numeric">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5">
              Smart Mail Notification & Voice Assistant
            </p>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by sender, subject or keyword..."
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions: Socket status, Mute toggle, User badge & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Socket.IO status badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isSocketConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}
            title={isSocketConnected ? 'Real-time WebSocket connected' : 'Connecting to Socket.IO server...'}
          >
            {isSocketConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-mono-numeric">Live Socket.IO</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-mono-numeric">Reconnecting...</span>
              </>
            )}
          </div>

          {/* Quick Voice Mute / Unmute Button */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl transition-all border ${
              isMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
            }`}
            title={isMuted ? 'Voice Assistant is Muted. Click to Unmute.' : 'Voice Assistant Active. Click to Mute.'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200/80">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-sky-300 object-cover shadow-sm bg-white"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.name}
              </div>
              <div className="text-[10px] text-sky-600 font-mono-numeric truncate max-w-[120px]">
                {user.email}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-1.5 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
