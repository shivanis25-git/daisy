import React from 'react';
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Star,
  Trash2,
  Reply,
  ShieldCheck,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';
import { Email } from '../types.js';
import { VoiceAssistantBar } from './VoiceAssistantBar.js';

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onToggleRead: (id: string, currentReadStatus: boolean) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (email: Email) => void;
  speechState: {
    isPlaying: boolean;
    isPaused: boolean;
    isMuted: boolean;
    rate: number;
    currentSentence: string;
    currentSentenceIndex: number;
    totalSentences: number;
    progressPercent: number;
    onPlay: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onToggleMute: () => void;
    onChangeRate: (rate: number) => void;
  };
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onBack,
  onToggleRead,
  onToggleStar,
  onDelete,
  onReply,
  speechState,
}) => {
  const formattedDate = new Date(email.createdAt).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="aqua-glass-card rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-5 min-h-[500px]">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-sky-200/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono-numeric text-slate-400 hidden sm:inline">
            Message View
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reply */}
          <button
            onClick={() => onReply(email)}
            className="aqua-soft-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reply</span>
          </button>

          {/* Mark Read/Unread */}
          <button
            onClick={() => onToggleRead(email.id, email.isRead)}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-white/80 transition-colors"
            title={email.isRead ? 'Mark as Unread' : 'Mark as Read'}
          >
            {email.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
          </button>

          {/* Star */}
          <button
            onClick={() => onToggleStar(email.id)}
            className={`p-2 rounded-xl transition-colors ${
              email.isStarred
                ? 'text-amber-500 hover:bg-amber-50'
                : 'text-slate-400 hover:text-amber-500 hover:bg-white/80'
            }`}
            title={email.isStarred ? 'Unstar' : 'Star message'}
          >
            <Star className={`w-4 h-4 ${email.isStarred ? 'fill-current' : ''}`} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(email.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete email"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subject Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
          {email.subject}
        </h2>
      </div>

      {/* Sender & Recipient Information */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/50 border border-sky-100">
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${email.from}`}
            alt={email.fromName}
            className="w-10 h-10 rounded-full border border-sky-200 bg-white shadow-xs"
          />
          <div>
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>{email.fromName}</span>
              <span className="text-xs font-mono-numeric text-slate-400 font-normal">
                &lt;{email.from}&gt;
              </span>
            </div>
            <div className="text-xs text-slate-500">
              to <span className="font-medium text-slate-700">{email.toName}</span> &lt;{email.to}&gt;
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono-numeric">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Voice Assistant Embedded Audio Bar */}
      <VoiceAssistantBar
        isPlaying={speechState.isPlaying}
        isPaused={speechState.isPaused}
        isMuted={speechState.isMuted}
        rate={speechState.rate}
        currentSentence={speechState.currentSentence}
        currentSentenceIndex={speechState.currentSentenceIndex}
        totalSentences={speechState.totalSentences}
        progressPercent={speechState.progressPercent}
        onPlay={speechState.onPlay}
        onPause={speechState.onPause}
        onResume={speechState.onResume}
        onStop={speechState.onStop}
        onToggleMute={speechState.onToggleMute}
        onChangeRate={speechState.onChangeRate}
      />

      {/* Email Body Content */}
      <div className="prose prose-slate max-w-none py-2 px-1 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
        {email.body}
      </div>

      {/* Nodemailer / SMTP Delivery Proof Accordion / Badge */}
      <div className="mt-auto pt-4 border-t border-sky-200/40">
        <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-blue-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Nodemailer SMTP Delivery Verification
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-numeric bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium">
              250 OK Delivered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono-numeric text-slate-600">
            <div className="truncate">
              <span className="text-slate-400">MIME Message-ID: </span>
              <span className="text-blue-700 font-semibold select-all">{email.messageId}</span>
            </div>
            <div className="truncate">
              <span className="text-slate-400">SMTP Response: </span>
              <span className="text-slate-700">{email.smtpResponse}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
