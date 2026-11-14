import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, clearAuth, getApiBaseUrl, getCachedUser, getToken } from './lib/api.js';
import { DirectoryUser, Email, User } from './types.js';
import { useSpeechAssistant } from './hooks/useSpeechAssistant.js';
import { AuthView } from './components/AuthView.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { EmailList } from './components/EmailList.js';
import { EmailDetail } from './components/EmailDetail.js';
import { ComposeModal } from './components/ComposeModal.js';
import { VoiceSettingsView } from './components/VoiceSettingsView.js';
import { NotificationToast } from './components/NotificationToast.js';

export function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(getCachedUser());
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Mail & View states
  const [activeView, setActiveView] = useState<'inbox' | 'sent' | 'voice-settings'>('inbox');
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read' | 'starred'>('all');

  // Directory & Presence
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');

  // Real-time Notification Toast
  const [toastEmail, setToastEmail] = useState<Email | null>(null);

  // Speech Assistant Engine
  const speech = useSpeechAssistant(currentUser?.preferences);
  // Store speech in a ref to avoid infinite re-render / re-connect loop in Socket.IO
  const speechRef = useRef(speech);
  speechRef.current = speech;

  // 1. Initial auth check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticating(false);
      return;
    }

    api
      .getMe()
      .then((res) => {
        setCurrentUser(res.user);
      })
      .catch(() => {
        clearAuth();
        setCurrentUser(null);
      })
      .finally(() => {
        setIsAuthenticating(false);
      });
  }, []);

  // 2. Fetch emails & directory
  const refreshMailbox = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.getEmails();
      setInboxEmails(data.inbox);
      setSentEmails(data.sent);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load emails:', err);
    }
  }, [currentUser]);

  const refreshDirectory = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await api.getDirectory();
      setDirectoryUsers(res.users);
    } catch (err) {
      console.error('Failed to load directory:', err);
    }
  }, [currentUser]);

  const userId = currentUser?.id;
  useEffect(() => {
    if (userId) {
      refreshMailbox();
      refreshDirectory();
    }
  }, [userId, refreshMailbox, refreshDirectory]);

  // 3. Socket.IO Real-time Connection & Event Handling
  const userEmail = currentUser?.email;
  useEffect(() => {
    if (!userId || !userEmail) {
      setIsSocketConnected(false);
      return;
    }

    const token = getToken();
    if (!token) return;

    const socketUrl = getApiBaseUrl() || window.location.origin;
    console.log(`[Socket.IO] Initializing connection to ${socketUrl} for ${userEmail}...`);

    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected successfully with ID:', socket.id);
      setIsSocketConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
      setIsSocketConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected. Reason:', reason);
      setIsSocketConnected(false);
    });

    // Real-time Presence Updates
    socket.on('presence:update', (onlineList: string[]) => {
      console.log('[Socket.IO] Presence update:', onlineList);
      setDirectoryUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isOnline: onlineList.includes(u.email.toLowerCase()),
        }))
      );
    });

    // Real-time New Mail Received!
    socket.on('mail:received', (payload: { email: Email }) => {
      console.log('[Socket.IO] mail:received event payload:', payload);
      const newMail = payload.email;

      // Update inbox state immediately
      setInboxEmails((prev) => [newMail, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Trigger visual toast
      setToastEmail(newMail);

      // Trigger Voice Assistant automatic announcement safely via ref!
      if (speechRef.current.autoAnnounce && !speechRef.current.isMuted) {
        speechRef.current.announceNewEmail(newMail.fromName, newMail.subject);
      }
    });

    // Real-time Sent Mail Updated
    socket.on('mail:sent', (payload: { email: Email }) => {
      setSentEmails((prev) => [payload.email, ...prev]);
    });

    // Real-time Read Status Changed
    socket.on('mail:updated', (payload: { email: Email }) => {
      const updated = payload.email;
      setInboxEmails((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSentEmails((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelectedEmail((prev) => (prev?.id === updated.id ? updated : prev));
      setInboxEmails((all) => {
        setUnreadCount(all.filter((m) => !m.isRead).length);
        return all;
      });
    });

    // Real-time Email Deleted
    socket.on('mail:deleted', (payload: { id: string }) => {
      const { id } = payload;
      setInboxEmails((prev) => prev.filter((m) => m.id !== id));
      setSentEmails((prev) => prev.filter((m) => m.id !== id));
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
      setInboxEmails((all) => {
        setUnreadCount(all.filter((m) => !m.isRead).length);
        return all;
      });
    });

    return () => {
      console.log('[Socket.IO] Disconnecting socket on unmount or user change');
      socket.disconnect();
    };
  }, [userId, userEmail]);

  // 4. Handlers
  const handleLogout = () => {
    speech.stop();
    clearAuth();
    setCurrentUser(null);
    setSelectedEmail(null);
    setIsSocketConnected(false);
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    // If unread in inbox, mark as read
    if (!email.isRead && activeView === 'inbox') {
      try {
        const res = await api.markEmailAsRead(email.id, true);
        setInboxEmails((prev) => prev.map((m) => (m.id === email.id ? res.email : m)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  const handleToggleRead = async (id: string, currentReadStatus: boolean) => {
    try {
      const res = await api.markEmailAsRead(id, !currentReadStatus);
      setInboxEmails((prev) => prev.map((m) => (m.id === id ? res.email : m)));
      if (selectedEmail?.id === id) {
        setSelectedEmail(res.email);
      }
      setUnreadCount((prev) => (currentReadStatus ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error('Failed to toggle read:', err);
    }
  };

  const handleToggleStar = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.toggleStar(id);
      setInboxEmails((prev) => prev.map((m) => (m.id === id ? res.email : m)));
      setSentEmails((prev) => prev.map((m) => (m.id === id ? res.email : m)));
      if (selectedEmail?.id === id) {
        setSelectedEmail(res.email);
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleDeleteEmail = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteEmail(id);
      setInboxEmails((prev) => prev.filter((m) => m.id !== id));
      setSentEmails((prev) => prev.filter((m) => m.id !== id));
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
      setInboxEmails((all) => {
        setUnreadCount(all.filter((m) => !m.isRead).length);
        return all;
      });
    } catch (err) {
      console.error('Failed to delete email:', err);
    }
  };

  const handleQuickListen = (email: Email, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const speechText = `Email from ${email.fromName}. Subject: ${email.subject}. Message: ${email.body}`;
    speech.speak(speechText);
  };

  const handleReply = (email: Email) => {
    setComposeRecipient(email.from);
    setComposeSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`);
    setIsComposeOpen(true);
  };

  const handleOpenCompose = (recipientEmail?: string) => {
    setComposeRecipient(recipientEmail || '');
    setComposeSubject('');
    setIsComposeOpen(true);
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    await api.sendEmail(to, subject, body);
    await refreshMailbox();
  };

  const handleSaveVoicePreferences = async () => {
    const updated = await api.updatePreferences({
      autoAnnounce: speech.autoAnnounce,
      muted: speech.isMuted,
      voiceRate: speech.rate,
      voicePitch: speech.pitch,
      selectedVoiceURI: speech.selectedVoice?.voiceURI || '',
    });
    setCurrentUser(updated.user);
  };

  const handleTestVoice = () => {
    speech.speak(
      'Hello! This is Daisy, your smart voice assistant. Real-time notifications and speech synthesis are fully functional for your hackathon presentation.'
    );
  };

  // Filtered emails based on active view, search query, and filter tab
  const activeList = activeView === 'sent' ? sentEmails : inboxEmails;

  const filteredEmails = useMemo(() => {
    return activeList.filter((email) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSubject = email.subject.toLowerCase().includes(query);
        const matchBody = email.body.toLowerCase().includes(query);
        const matchFrom = email.fromName.toLowerCase().includes(query) || email.from.toLowerCase().includes(query);
        const matchTo = email.toName.toLowerCase().includes(query) || email.to.toLowerCase().includes(query);
        if (!matchSubject && !matchBody && !matchFrom && !matchTo) return false;
      }

      // 2. Tab Filter
      if (filterMode === 'unread') return !email.isRead;
      if (filterMode === 'read') return email.isRead;
      if (filterMode === 'starred') return Boolean(email.isStarred);
      return true;
    });
  }, [activeList, searchQuery, filterMode]);

  // If user not authenticated, render AuthView
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F2FF] to-[#F8FBFF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-sky-400 border-t-transparent animate-spin"></div>
          <span className="text-sm font-semibold text-sky-800">Starting Daisy...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E6F2FF] via-[#EEF6FF] to-[#F8FBFF]">
      {/* 1. Top Navbar */}
      <Navbar
        user={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSocketConnected={isSocketConnected}
        isMuted={speech.isMuted}
        onToggleMute={speech.toggleMute}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-5 items-start">
        {/* Left Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          onSelectView={(view) => {
            setActiveView(view);
            setSelectedEmail(null);
          }}
          unreadCount={unreadCount}
          sentCount={sentEmails.length}
          onOpenCompose={handleOpenCompose}
          directoryUsers={directoryUsers}
          autoAnnounce={speech.autoAnnounce}
          onToggleAutoAnnounce={() => speech.setAutoAnnounce((prev) => !prev)}
        />

        {/* Center / Right Content Pane */}
        <section className="flex-1 w-full min-w-0">
          {activeView === 'voice-settings' ? (
            <VoiceSettingsView
              preferences={currentUser.preferences}
              availableVoices={speech.availableVoices}
              selectedVoice={speech.selectedVoice}
              onSelectVoice={speech.setSelectedVoice}
              rate={speech.rate}
              onChangeRate={speech.setRate}
              pitch={speech.pitch}
              onChangePitch={speech.setPitch}
              isMuted={speech.isMuted}
              onToggleMute={speech.toggleMute}
              autoAnnounce={speech.autoAnnounce}
              onToggleAutoAnnounce={() => speech.setAutoAnnounce((prev) => !prev)}
              onTestVoice={handleTestVoice}
              onSavePreferences={handleSaveVoicePreferences}
            />
          ) : selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onToggleRead={handleToggleRead}
              onToggleStar={handleToggleStar}
              onDelete={handleDeleteEmail}
              onReply={handleReply}
              speechState={{
                isPlaying: speech.isPlaying,
                isPaused: speech.isPaused,
                isMuted: speech.isMuted,
                rate: speech.rate,
                currentSentence: speech.currentSentence,
                currentSentenceIndex: speech.currentSentenceIndex,
                totalSentences: speech.totalSentences,
                progressPercent: speech.progressPercent,
                onPlay: () => {
                  const fullText = `Email from ${selectedEmail.fromName}. Subject: ${selectedEmail.subject}. ${selectedEmail.body}`;
                  speech.speak(fullText);
                },
                onPause: speech.pause,
                onResume: speech.resume,
                onStop: speech.stop,
                onToggleMute: speech.toggleMute,
                onChangeRate: speech.setRate,
              }}
            />
          ) : (
            <EmailList
              emails={filteredEmails}
              selectedEmailId={null}
              onSelectEmail={handleSelectEmail}
              onToggleStar={handleToggleStar}
              onDeleteEmail={handleDeleteEmail}
              onQuickListen={handleQuickListen}
              filterMode={filterMode}
              onFilterChange={setFilterMode}
              activeView={activeView}
            />
          )}
        </section>
      </main>

      {/* 3. Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        currentUser={currentUser}
        directoryUsers={directoryUsers}
        initialRecipient={composeRecipient}
        initialSubject={composeSubject}
      />

      {/* 4. Real-time Incoming Mail Notification Toast */}
      <NotificationToast
        email={toastEmail}
        onClose={() => setToastEmail(null)}
        onOpen={(email) => {
          setSelectedEmail(email);
          setActiveView('inbox');
          setToastEmail(null);
        }}
        onListen={(email) => {
          handleQuickListen(email);
          setToastEmail(null);
        }}
      />
    </div>
  );
}
