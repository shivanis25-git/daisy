import React from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Sparkles, FastForward } from 'lucide-react';

interface VoiceAssistantBarProps {
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
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  isPlaying,
  isPaused,
  isMuted,
  rate,
  currentSentence,
  currentSentenceIndex,
  totalSentences,
  progressPercent,
  onPlay,
  onPause,
  onResume,
  onStop,
  onToggleMute,
  onChangeRate,
}) => {
  const speedOptions = [0.8, 1.0, 1.25, 1.5];

  return (
    <div className="w-full rounded-2xl p-3.5 bg-gradient-to-r from-sky-50/90 via-blue-50/80 to-cyan-50/90 border border-sky-200/80 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Play/Pause/Stop Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={onPlay}
              className="aqua-jelly-btn px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen to Email</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="aqua-jelly-btn px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="aqua-soft-btn px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {isPlaying && (
            <button
              onClick={onStop}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors"
              title="Stop playback"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Audio Wave Visualizer */}
          {isPlaying && !isPaused && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-100/60">
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="text-[10px] text-blue-700 font-mono-numeric font-medium ml-1">
                Reading aloud...
              </span>
            </div>
          )}
        </div>

        {/* Middle / Right: Speed Pills & Mute */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Rate / Speed Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-sky-200/60">
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => onChangeRate(s)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono-numeric transition-colors ${
                  rate === s
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-sky-50'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                : 'bg-white/70 text-slate-600 border-sky-200/60 hover:text-blue-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Spoken Text Feedback & Progress Bar */}
      {isPlaying && (
        <div className="mt-3 pt-2.5 border-t border-sky-200/50 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-numeric">
            <span className="truncate pr-4 text-blue-900 font-medium italic">
              "{currentSentence || 'Preparing speech...'}"
            </span>
            <span className="flex-shrink-0">
              {currentSentenceIndex + 1} / {totalSentences} sentences ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-sky-200/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
