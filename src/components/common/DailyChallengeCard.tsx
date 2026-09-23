import React from 'react';
import { UserProgress } from '../../types';
import { getCurrentDailyChallenge, formatSecondsToMinutes } from '../../utils/dailyChallenge';
import { soundFx } from '../../utils/audio';

interface DailyChallengeCardProps {
  progress: UserProgress;
  onNavigate?: (tab: 'literasi' | 'numerasi') => void;
  onStartChallenge: (type: 'literasi' | 'numerasi') => void;
}

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  progress,
  onNavigate,
  onStartChallenge,
}) => {
  const challenge = getCurrentDailyChallenge(progress);
  const hasSpeedBadge = (progress.earnedBadges || []).includes('badge-speed-challenger');

  const completedCount =
    (challenge.literacyCompleted ? 1 : 0) + (challenge.numeracyCompleted ? 1 : 0);

  const handleLaunch = (type: 'literasi' | 'numerasi') => {
    soundFx.playClick();
    if (onStartChallenge) {
      onStartChallenge(type);
    } else if (onNavigate) {
      onNavigate(type);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden border border-indigo-700/40 shadow-md">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-teal-500/20 via-indigo-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-md shadow-amber-500/20 animate-pulse">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Tantangan Kilat Harian
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Target &lt; 5 Menit
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Selesaikan aktivitas literasi & numerasi di bawah 5 menit untuk meraih poin ekstra!
              </p>
            </div>
          </div>

          {/* Points & Progress Pill */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
              <span>⭐</span>
              <span>+{challenge.bonusPointsEarned || 0} Poin Ekstra</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold font-mono">
              {completedCount}/2 Tuntas
            </div>
          </div>
        </div>

        {/* 2 Daily Missions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Mission 1: Literacy */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
              challenge.literacyCompleted
                ? 'bg-teal-900/40 border-teal-500/50 shadow-inner'
                : 'bg-white/5 border-white/10 hover:border-teal-400/40 hover:bg-white/8'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1.5 rounded-xl bg-teal-500/20 border border-teal-400/30">
                  📖
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Misi 1: Literasi Cepat</h4>
                  <p className="text-[11px] text-slate-300">
                    Selesaikan 1 bacaan & kuis dalam &lt; 5:00
                  </p>
                </div>
              </div>

              {challenge.literacyCompleted ? (
                <span className="px-2 py-0.5 rounded-lg bg-teal-500 text-slate-950 font-black text-[10px] uppercase">
                  Tuntas ✅
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-300 text-[10px] font-mono">
                  +40 Poin
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              {challenge.literacyCompleted ? (
                <span className="text-[11px] text-teal-300 font-mono font-semibold">
                  ⏱️ Waktu: {formatSecondsToMinutes(challenge.literacyTimeSeconds || 0)}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Belum diselesaikan hari ini</span>
              )}

              {!challenge.literacyCompleted && (
                <button
                  onClick={() => handleLaunch('literasi')}
                  className="px-3 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>Mulai Latihan Baca →</span>
                </button>
              )}
            </div>
          </div>

          {/* Mission 2: Numeracy */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
              challenge.numeracyCompleted
                ? 'bg-indigo-900/40 border-indigo-500/50 shadow-inner'
                : 'bg-white/5 border-white/10 hover:border-indigo-400/40 hover:bg-white/8'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                  🧮
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Misi 2: Numerasi Kilat</h4>
                  <p className="text-[11px] text-slate-300">
                    Selesaikan 1 soal numerasi dalam &lt; 5:00
                  </p>
                </div>
              </div>

              {challenge.numeracyCompleted ? (
                <span className="px-2 py-0.5 rounded-lg bg-indigo-400 text-slate-950 font-black text-[10px] uppercase">
                  Tuntas ✅
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-300 text-[10px] font-mono">
                  +40 Poin
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              {challenge.numeracyCompleted ? (
                <span className="text-[11px] text-indigo-300 font-mono font-semibold">
                  ⏱️ Waktu: {formatSecondsToMinutes(challenge.numeracyTimeSeconds || 0)}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Belum diselesaikan hari ini</span>
              )}

              {!challenge.numeracyCompleted && (
                <button
                  onClick={() => handleLaunch('numerasi')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-400 hover:bg-indigo-300 text-slate-950 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>Mulai Latihan Soal →</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Combo Footer Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-base">🎁</span>
            <span className="text-slate-300">
              {challenge.allCompleted ? (
                <strong className="text-amber-300 font-bold">
                  Luar biasa! Kedua misi kilat telah tuntas tuntas hari ini (+140 total poin terkumpul)!
                </strong>
              ) : (
                <span>
                  Bonus Combo: Selesaikan keduanya & raih <strong>+60 Poin Tambahan</strong> & lencana{' '}
                  <span className="text-amber-300 font-bold">⚡ Kilat Cerdas</span>!
                </span>
              )}
            </span>
          </div>

          {hasSpeedBadge && (
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <span>🏅</span> Lencana 'Kilat Cerdas' Diraih
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
