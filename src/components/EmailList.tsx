import React, { useState } from 'react';
import {
  Mail,
  MailOpen,
  Star,
  Play,
  Trash2,
  Inbox,
  Filter,
  CheckCircle,
  Volume2,
} from 'lucide-react';
import { Email } from '../types.js';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onDeleteEmail: (id: string, e: React.MouseEvent) => void;
  onQuickListen: (email: Email, e: React.MouseEvent) => void;
  filterMode: 'all' | 'unread' | 'read' | 'starred';
  onFilterChange: (mode: 'all' | 'unread' | 'read' | 'starred') => void;
  activeView: 'inbox' | 'sent';
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onToggleStar,
  onDeleteEmail,
  onQuickListen,
  filterMode,
  onFilterChange,
  activeView,
}) => {
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="aqua-glass-card rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col gap-3 min-h-[500px]">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-200/50">
        <div className="flex items-center gap-1.5 bg-white/70 p-1 rounded-xl border border-sky-200/60 text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
            }`}
          >
            All ({emails.length})
          </button>

          {activeView === 'inbox' && (
            <button
              onClick={() => onFilterChange('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'unread'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
              }`}
            >
              Unread ({emails.filter((m) => !m.isRead).length})
            </button>
          )}

          <button
            onClick={() => onFilterChange('starred')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filterMode === 'starred'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
            }`}
          >
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>Starred</span>
          </button>
        </div>

        <div className="text-[11px] font-mono-numeric text-slate-400">
          Showing {emails.length} message{emails.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Email List Items */}
      <div className="space-y-1.5 overflow-y-auto max-h-[640px] pr-0.5">
        {emails.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-100/60 flex items-center justify-center text-sky-400 mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="text-sm font-semibold text-slate-700">No emails found</div>
            <div className="text-xs text-slate-400 mt-1">
              Your {activeView === 'inbox' ? 'inbox' : 'sent box'} is clear. Compose a new email or wait for incoming messages.
            </div>
          </div>
        ) : (
          emails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const displayName = activeView === 'inbox' ? email.fromName : `To: ${email.toName}`;
            const displayEmail = activeView === 'inbox' ? email.from : email.to;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-300/80 shadow-xs'
                    : !email.isRead && activeView === 'inbox'
                    ? 'bg-white/95 border-sky-300/70 shadow-xs'
                    : 'bg-white/50 border-sky-100/70 hover:bg-white/80'
                }`}
              >
                {/* Left: Star + Unread Indicator + Sender & Subject */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Unread droplet indicator */}
                  <div className="flex items-center justify-center w-3">
                    {!email.isRead && activeView === 'inbox' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    )}
                  </div>

                  {/* Star Button */}
                  <button
                    onClick={(e) => onToggleStar(email.id, e)}
                    className={`p-1 rounded-lg transition-colors ${
                      email.isStarred
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-slate-300 hover:text-amber-500'
                    }`}
                    title={email.isStarred ? 'Unstar' : 'Star message'}
                  >
                    <Star className={`w-4 h-4 ${email.isStarred ? 'fill-current' : ''}`} />
                  </button>

                  {/* Avatar */}
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${displayEmail}`}
                    alt={displayName}
                    className="w-8 h-8 rounded-full border border-sky-200 bg-white flex-shrink-0"
                  />

                  {/* Content: Sender, Subject, Preview */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div
                        className={`text-xs truncate ${
                          !email.isRead && activeView === 'inbox'
                            ? 'font-bold text-slate-900'
                            : 'font-semibold text-slate-700'
                        }`}
                      >
                        {displayName}
                      </div>
                      <div className="text-[11px] font-mono-numeric text-slate-400 flex-shrink-0">
                        {formatTime(email.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className={`text-xs truncate ${
                          !email.isRead && activeView === 'inbox'
                            ? 'font-semibold text-blue-950'
                            : 'font-normal text-slate-800'
                        }`}
                      >
                        {email.subject}
                      </div>
                      <span className="text-slate-300 text-xs hidden sm:inline">·</span>
                      <div className="text-xs text-slate-400 truncate hidden sm:inline">
                        {email.body.replace(/\n/g, ' ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Hover Actions: Quick Listen & Delete */}
                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                  <button
                    onClick={(e) => onQuickListen(email, e)}
                    className="p-1.5 rounded-lg text-blue-600 bg-sky-50 hover:bg-blue-600 hover:text-white transition-colors"
                    title="Quick Listen with Daisy Voice"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    onClick={(e) => onDeleteEmail(email.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
