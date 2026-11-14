import { useState, useEffect, useRef, useCallback } from 'react';
import { UserPreferences } from '../types.js';

export interface SpeechAssistantState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  currentSentenceIndex: number;
  totalSentences: number;
  progressPercent: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  isMuted: boolean;
  autoAnnounce: boolean;
}

export function useSpeechAssistant(initialPreferences?: UserPreferences) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const [rate, setRate] = useState(initialPreferences?.voiceRate ?? 1.0);
  const [pitch, setPitch] = useState(initialPreferences?.voicePitch ?? 1.0);
  const [isMuted, setIsMuted] = useState(initialPreferences?.muted ?? false);
  const [autoAnnounce, setAutoAnnounce] = useState(initialPreferences?.autoAnnounce ?? true);

  // Keep references to prevent garbage collection bugs in Web Speech API
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  const sentenceIndexRef = useRef(0);
  const sentencesListRef = useRef<string[]>([]);

  // Load available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);

        // Try to match preferred voice URI, or pick an English natural/good voice
        if (initialPreferences?.selectedVoiceURI) {
          const match = voices.find((v) => v.voiceURI === initialPreferences.selectedVoiceURI);
          if (match) {
            setSelectedVoice(match);
            return;
          }
        }

        // Pick preferred default voice: Google UK/US, Microsoft, or English
        const preferred =
          voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];

        setSelectedVoice(preferred || null);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [initialPreferences?.selectedVoiceURI]);

  // Sync with preferences when they change
  useEffect(() => {
    if (initialPreferences) {
      if (typeof initialPreferences.voiceRate === 'number') setRate(initialPreferences.voiceRate);
      if (typeof initialPreferences.voicePitch === 'number') setPitch(initialPreferences.voicePitch);
      if (typeof initialPreferences.muted === 'boolean') setIsMuted(initialPreferences.muted);
      if (typeof initialPreferences.autoAnnounce === 'boolean') setAutoAnnounce(initialPreferences.autoAnnounce);
    }
  }, [initialPreferences]);

  // Cancel any ongoing speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Split long email text into manageable sentences to prevent Web Speech API halting
  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    // Clean markdown, multiple newlines, special characters
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/[^\s]+/g, 'link')
      .replace(/\n+/g, '. ');

    const rawChunks = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    return rawChunks
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
    sentenceIndexRef.current = 0;
  }, []);

  const speakChunk = useCallback(
    (index: number) => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        !isPlayingRef.current ||
        isMuted
      ) {
        return;
      }

      const list = sentencesListRef.current;
      if (index >= list.length) {
        // Finished speaking all sentences
        stop();
        return;
      }

      sentenceIndexRef.current = index;
      setCurrentSentenceIndex(index);

      const sentence = list[index];
      const utterance = new SpeechSynthesisUtterance(sentence);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.pitch = Math.max(0.5, Math.min(1.5, pitch));

      utterance.onend = () => {
        if (isPlayingRef.current) {
          speakChunk(index + 1);
        }
      };

      utterance.onerror = (err) => {
        console.warn('[Daisy Speech Assistant] Utterance error:', err);
        if (isPlayingRef.current && index + 1 < list.length) {
          speakChunk(index + 1);
        } else {
          stop();
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [isMuted, selectedVoice, rate, pitch, stop]
  );

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser.');
        return;
      }

      if (isMuted) {
        console.log('[Daisy Speech Assistant] Audio is muted.');
        return;
      }

      // Stop any existing speech
      window.speechSynthesis.cancel();

      const chunks = splitIntoSentences(text);
      if (chunks.length === 0) return;

      sentencesListRef.current = chunks;
      setSentences(chunks);
      setCurrentText(text);
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
      speakChunk(0);
    },
    [isMuted, speakChunk]
  );

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else if (isPlayingRef.current && sentenceIndexRef.current < sentencesListRef.current.length) {
        speakChunk(sentenceIndexRef.current);
        setIsPaused(false);
      }
    }
  }, [speakChunk]);

  // Quick announcement helper for new email arrival
  const announceNewEmail = useCallback(
    (senderName: string, subject: string) => {
      if (isMuted || !autoAnnounce) return;
      const announcement = `You have received a new email from ${senderName}. Subject: ${subject}.`;
      speak(announcement);
    },
    [isMuted, autoAnnounce, speak]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stop();
      }
      return next;
    });
  }, [stop]);

  const progressPercent =
    sentences.length > 0 ? Math.round(((currentSentenceIndex + 1) / sentences.length) * 100) : 0;

  return {
    isPlaying,
    isPaused,
    currentText,
    currentSentence: sentences[currentSentenceIndex] || '',
    currentSentenceIndex,
    totalSentences: sentences.length,
    progressPercent,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    isMuted,
    setIsMuted,
    toggleMute,
    autoAnnounce,
    setAutoAnnounce,
    speak,
    pause,
    resume,
    stop,
    announceNewEmail,
  };
}
