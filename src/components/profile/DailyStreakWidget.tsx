import React from 'react';
import { UserProgress } from '../../types';
import { getCurrentWeekStatus } from '../../utils/streak';
import { soundFx } from '../../utils/audio';

interface DailyStreakWidgetProps {
  progress: UserProgress;
  onSimulateNextDay?: () => void;
}

export const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({
  progress,
  onSimulateNextDay,
}) => {
  const streakCount = progress.streakCount || 0;
  const longestStreak = Math.max(streakCount, progress.longestStreak || 0);
  const bonusPoints = progress.streakBonusPointsEarned || 0;
  const hasLoyalBadge = (progress.earnedBadges || []).includes('badge-loyal-streak');
  const weekDays = getCurrentWeekStatus(progress.activityHistoryDates || []);

  const todayStatus = weekDays.find((d) => d.isToday);
  const isCompletedToday = todayStatus ? todayStatus.isCompleted : false;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header with Warm Flame Accent */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
            🔥
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold tracking-wider uppercase">
              Konsistensi Belajar
            </div>
            <h3 className="text-xl font-black text-white">
              Streak Harian: {streakCount} Hari
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {isCompletedToday ? (
            <span className="px-3 py-1 rounded-xl bg-white text-orange-900 font-bold text-xs shadow-xs flex items-center gap-1.5">
              <span>✅</span> Aktivitas Hari Ini Tuntas
            </span>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-black/30 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 animate-pulse">
              <span>⏳</span> Kerjakan 1 Aktivitas Hari Ini!
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Weekly Check-in Trackers */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-700">Pelacak Aktivitas Pekan Ini:</span>
            <span className="text-slate-400 font-medium">Senin — Minggu</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              return (
                <div
                  key={day.dateString}
                  className={`p-2.5 rounded-xl text-center flex flex-col items-center justify-between border transition-all ${
                    day.isCompleted
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-xs'
                      : day.isToday
                      ? 'bg-slate-50 border-orange-400 ring-2 ring-orange-400/30'
                      : 'bg-slate-50/60 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    {day.dayName}
                  </span>
                  <span className="text-base my-1">
                    {day.isCompleted ? '🔥' : day.isToday ? '🎯' : '⚪'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    {day.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Streak Sekarang</div>
            <div className="text-xl font-black text-orange-600 mt-0.5">
              🔥 {streakCount} Hari
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Rekor Terpanjang</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              ⚡ {longestStreak} Hari
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Total Bonus Poin Streak</div>
            <div className="text-xl font-black text-teal-700 font-mono mt-0.5">
              ⭐ +{bonusPoints}
            </div>
          </div>
        </div>

        {/* Special 'Pengguna Setia' Badge Target Box */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            hasLoyalBadge
              ? 'bg-amber-50/80 border-amber-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
                hasLoyalBadge
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-200 text-slate-400 border-slate-300'
              }`}
            >
              {hasLoyalBadge ? '🔥' : '🔒'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Lencana Khusus: Pengguna Setia
                </h4>
                {hasLoyalBadge && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Terbuka
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasLoyalBadge
                  ? 'Hebat! Kamu telah membuka lencana Pengguna Setia berkat konsistensi belajarmu!'
                  : `Capai minimal 3 hari berturut-turut untuk membuka lencana ini (Progres saat ini: ${streakCount}/3 hari).`}
              </p>
            </div>
          </div>

          {/* Progress gauge on the right if not yet achieved */}
          {!hasLoyalBadge && (
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-xs font-black font-mono text-slate-700">
                {Math.min(streakCount, 3)} / 3 Hari
              </span>
              <div className="w-24 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((streakCount / 3) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Demo Simulation Trigger for teacher/evaluator */}
        {onSimulateNextDay && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Uji coba simulasi hari berturut-turut:</span>
            <button
              onClick={() => {
                soundFx.playClick();
                onSimulateNextDay();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>⏩</span> Simulasikan Streak Hari Berikutnya (+1 Hari)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
