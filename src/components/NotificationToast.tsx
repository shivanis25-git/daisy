import React from 'react';
import { Mail, Volume2, X, BellRing, Sparkles } from 'lucide-react';
import { Email } from '../types.js';

interface NotificationToastProps {
  email: Email | null;
  onClose: () => void;
  onOpen: (email: Email) => void;
  onListen: (email: Email) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  email,
  onClose,
  onOpen,
  onListen,
}) => {
  if (!email) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-short">
      <div className="aqua-glass rounded-2xl p-4 shadow-2xl border-2 border-sky-300/80 bg-white/90 backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-3">
          {/* Pulsing Alert Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
              <BellRing className="w-5 h-5 animate-wiggle" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-sky-100 px-1.5 py-0.5 rounded-md font-mono-numeric">
                New Mail Arrived!
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
              {email.fromName}
            </h4>
            <p className="text-xs text-slate-600 truncate font-medium">
              {email.subject}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {email.body.replace(/\n/g, ' ')}
            </p>

            {/* Actions: Open and Listen */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onOpen(email)}
                className="aqua-jelly-btn px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
              >
                Open Message
              </button>

              <button
                onClick={() => onListen(email)}
                className="aqua-soft-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Listen Now</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
