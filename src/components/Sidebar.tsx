import React from 'react';
import {
  Inbox,
  Send,
  Sliders,
  PenSquare,
  Users,
  Mic,
  Bell,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { DirectoryUser, User } from '../types.js';

interface SidebarProps {
  currentUser: User;
  activeView: 'inbox' | 'sent' | 'voice-settings';
  onSelectView: (view: 'inbox' | 'sent' | 'voice-settings') => void;
  unreadCount: number;
  sentCount: number;
  onOpenCompose: (recipientEmail?: string) => void;
  directoryUsers: DirectoryUser[];
  autoAnnounce: boolean;
  onToggleAutoAnnounce: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onSelectView,
  unreadCount,
  sentCount,
  onOpenCompose,
  directoryUsers,
  autoAnnounce,
  onToggleAutoAnnounce,
}) => {
  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col gap-4">
      {/* 1. Compose Button */}
      <button
        onClick={() => onOpenCompose()}
        className="aqua-jelly-btn w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer group"
      >
        <PenSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
        <span>Compose Email</span>
      </button>

      {/* 2. Navigation Section */}
      <div className="aqua-glass-card rounded-2xl p-2.5 shadow-sm space-y-1">
        <button
          onClick={() => onSelectView('inbox')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'inbox'
              ? 'bg-sky-500/15 text-blue-700 font-semibold shadow-inner border border-sky-300/40'
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Inbox className={`w-4 h-4 ${activeView === 'inbox' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Inbox</span>
          </div>
          {unreadCount > 0 && (
            <span className="font-mono-numeric text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectView('sent')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'sent'
              ? 'bg-sky-500/15 text-blue-700 font-semibold shadow-inner border border-sky-300/40'
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Send className={`w-4 h-4 ${activeView === 'sent' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Sent Mail</span>
          </div>
          {sentCount > 0 && (
            <span className="font-mono-numeric text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {sentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectView('voice-settings')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'voice-settings'
              ? 'bg-sky-500/15 text-blue-700 font-semibold shadow-inner border border-sky-300/40'
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sliders
              className={`w-4 h-4 ${activeView === 'voice-settings' ? 'text-blue-600' : 'text-slate-400'}`}
            />
            <span>Voice Settings</span>
          </div>
          <span className="text-[10px] font-mono-numeric px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 uppercase font-semibold">
            TTS
          </span>
        </button>
      </div>

      {/* 3. Quick Toggle: Auto Voice Announcement */}
      <div className="aqua-glass-card rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100/80 text-blue-600">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Auto-Announce</div>
              <div className="text-[10px] text-slate-500">Read new mail arrivals</div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoAnnounce}
              onChange={onToggleAutoAnnounce}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* 4. Daisy Directory: Registered Users & Live Presence */}
      <div className="aqua-glass-card rounded-2xl p-3.5 shadow-sm flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-sky-200/40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wide uppercase">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Daisy Directory</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono-numeric">
            {directoryUsers.filter((u) => u.isOnline).length} online
          </span>
        </div>

        <p className="text-[11px] text-slate-500 mb-2">
          Click any member to quick-compose an email:
        </p>

        <div className="space-y-1 overflow-y-auto max-h-56 pr-1">
          {directoryUsers.map((user) => {
            const isSelf = user.email.toLowerCase() === currentUser.email.toLowerCase();
            return (
              <button
                key={user.id}
                onClick={() => onOpenCompose(user.email)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all group ${
                  isSelf
                    ? 'bg-blue-50/50 hover:bg-blue-100/60 border border-blue-200/40'
                    : 'hover:bg-white/70'
                }`}
                title={`Click to email ${user.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-sky-200 bg-white"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div className="truncate min-w-0">
                    <div className="text-xs font-medium text-slate-800 truncate flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {isSelf && (
                        <span className="text-[9px] text-blue-600 font-semibold px-1 rounded bg-blue-100">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-numeric truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                  <PenSquare className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
