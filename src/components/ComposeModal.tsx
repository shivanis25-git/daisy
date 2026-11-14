import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { DirectoryUser, User } from '../types.js';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
  currentUser: User;
  directoryUsers: DirectoryUser[];
  initialRecipient?: string;
  initialSubject?: string;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSend,
  currentUser,
  directoryUsers,
  initialRecipient = '',
  initialSubject = '',
}) => {
  const [to, setTo] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(initialRecipient);
      setSubject(initialSubject);
      setError(null);
    }
  }, [isOpen, initialRecipient, initialSubject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setError('Please specify a recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide an email subject.');
      return;
    }
    if (!body.trim()) {
      setError('Please enter a message body.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend(to.trim(), subject.trim(), body.trim());
      setTo('');
      setSubject('');
      setBody('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="aqua-glass-card w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-sky-200/80 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-200/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New Message</h3>
              <p className="text-[11px] text-slate-500">
                Dispatched via Nodemailer & Socket.IO real-time notification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Recipient Fill Chips */}
        <div>
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
            Quick fill recipient:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* Quick send to oneself for testing */}
            <button
              type="button"
              onClick={() => setTo(currentUser.email)}
              className="px-2.5 py-1 rounded-lg text-xs bg-sky-100 text-blue-700 hover:bg-sky-200 transition-colors font-mono-numeric font-medium"
            >
              ⚡ Myself (Test Alert)
            </button>

            {directoryUsers
              .filter((u) => u.email.toLowerCase() !== currentUser.email.toLowerCase())
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setTo(u.email)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white/70 hover:bg-sky-50 text-slate-700 border border-sky-200/60 transition-colors flex items-center gap-1"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      u.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span>{u.name}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To (Recipient Email)
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="e.g. priya@daisy.mail or any email"
              className="w-full px-3.5 py-2 text-xs font-mono-numeric rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Project Demo Review / Team Sync"
              className="w-full px-3.5 py-2 text-xs rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Body
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here. The recipient's Daisy Voice Assistant will read this aloud sentence by sentence..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl aqua-glass-input text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-mono-numeric">
              From: {currentUser.email}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white/60 transition-colors"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="aqua-jelly-btn px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending via Nodemailer...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
