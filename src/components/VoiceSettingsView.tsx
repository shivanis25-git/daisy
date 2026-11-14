import React, { useState } from 'react';
import {
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Check,
  Sparkles,
  Mic,
  Settings,
  Languages,
} from 'lucide-react';
import { UserPreferences } from '../types.js';

interface VoiceSettingsViewProps {
  preferences: UserPreferences;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  rate: number;
  onChangeRate: (rate: number) => void;
  pitch: number;
  onChangePitch: (pitch: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  autoAnnounce: boolean;
  onToggleAutoAnnounce: () => void;
  onTestVoice: () => void;
  onSavePreferences: () => Promise<void>;
}

export const VoiceSettingsView: React.FC<VoiceSettingsViewProps> = ({
  preferences,
  availableVoices,
  selectedVoice,
  onSelectVoice,
  rate,
  onChangeRate,
  pitch,
  onChangePitch,
  isMuted,
  onToggleMute,
  autoAnnounce,
  onToggleAutoAnnounce,
  onTestVoice,
  onSavePreferences,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePreferences();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="aqua-glass-card rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sky-200/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Voice Assistant Preferences
            </h2>
            <p className="text-xs text-slate-500">
              Configure Web Speech Synthesis parameters and real-time audio announcements
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="aqua-jelly-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Settings className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="space-y-5">
        {/* Toggle 1: Auto-Announcement */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-sky-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100 text-blue-600">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Automatic Arrival Announcement
              </div>
              <div className="text-xs text-slate-500">
                Daisy automatically speaks: "You have received a new email from [Sender]..." when a mail arrives via Socket.IO
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoAnnounce}
              onChange={onToggleAutoAnnounce}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Toggle 2: Master Mute */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-sky-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isMuted ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Master Voice Mute</div>
              <div className="text-xs text-slate-500">
                Temporarily silence all voice notifications and speech playback across the app
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMuted}
              onChange={onToggleMute}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Speech Voice Selection */}
        <div className="p-4 rounded-xl bg-white/60 border border-sky-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Languages className="w-4 h-4 text-blue-600" />
              <span>Speech Synthesizer Voice</span>
            </label>
            <span className="text-xs text-slate-400 font-mono-numeric">
              {availableVoices.length} browser voices detected
            </span>
          </div>

          <select
            value={selectedVoice?.voiceURI || ''}
            onChange={(e) => {
              const voice = availableVoices.find((v) => v.voiceURI === e.target.value);
              if (voice) onSelectVoice(voice);
            }}
            className="w-full px-3.5 py-2.5 text-xs font-mono-numeric rounded-xl aqua-glass-input text-slate-800 focus:outline-none cursor-pointer"
          >
            {availableVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}) {v.default ? '— Default' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Speed / Rate Slider */}
        <div className="p-4 rounded-xl bg-white/60 border border-sky-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">
              Speech Reading Speed (Rate)
            </label>
            <span className="text-xs font-mono-numeric font-bold px-2 py-0.5 rounded-md bg-sky-100 text-blue-700">
              {rate.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={rate}
            onChange={(e) => onChangeRate(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono-numeric">
            <span>0.5x (Slow)</span>
            <span>1.0x (Normal)</span>
            <span>2.0x (Fast)</span>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="p-4 rounded-xl bg-white/60 border border-sky-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">
              Voice Tone & Pitch
            </label>
            <span className="text-xs font-mono-numeric font-bold px-2 py-0.5 rounded-md bg-sky-100 text-blue-700">
              {pitch.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={pitch}
            onChange={(e) => onChangePitch(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono-numeric">
            <span>0.5 (Deeper)</span>
            <span>1.0 (Standard)</span>
            <span>1.5 (Higher)</span>
          </div>
        </div>

        {/* Test Speech Sample Button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={onTestVoice}
            className="aqua-soft-btn px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Daisy Voice Now</span>
          </button>

          <span className="text-xs text-slate-400">
            Powered by Browser Web Speech Synthesis API
          </span>
        </div>
      </div>
    </div>
  );
};
