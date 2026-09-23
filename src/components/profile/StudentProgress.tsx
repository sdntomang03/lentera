import React, { useState } from 'react';
import { BADGES_DATA } from '../../data/badgesData';
import { UserProgress } from '../../types';
import { soundFx } from '../../utils/audio';
import { DailyStreakWidget } from './DailyStreakWidget';
import { DailyChallengeCard } from '../common/DailyChallengeCard';

interface StudentProgressProps {
  progress: UserProgress;
  onUpdateName: (name: string) => void;
  onResetProgress: () => void;
  onViewLeaderboard?: () => void;
  onSimulateNextDay?: () => void;
  onNavigateToLearning?: (tab: 'literasi' | 'numerasi') => void;
  onStartChallenge?: (type: 'literasi' | 'numerasi') => void;
  onBack?: () => void;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({
  progress,
  onUpdateName,
  onResetProgress,
  onViewLeaderboard,
  onSimulateNextDay,
  onNavigateToLearning,
  onStartChallenge,
  onBack,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(progress.studentName);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState<boolean>(false);

  const handleSaveName = () => {
    soundFx.playClick();
    onUpdateName(tempName.trim() || 'Siswa Cerdas');
    setIsEditingName(false);
  };

  const totalBadgesCount = BADGES_DATA.length;
  const earnedCount = progress.earnedBadges.length;

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col gap-6 shadow-xs">
        {onBack && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onBack();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200 shadow-2xs group"
              title="Kembali"
            >
              <span className="text-teal-700 font-extrabold text-base group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Kembali</span>
            </button>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Rapor Prestasi Siswa</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-3xl shadow-sm">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-2">
              {!isEditingName ? (
                <>
                  <h2 className="text-2xl font-bold text-slate-900">{progress.studentName}</h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Ubah Nama
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="p-1.5 border border-slate-300 rounded-lg text-sm font-bold"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2.5 py-1 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Peserta Didik Aktif · Portofolio Belajar Literasi & Numerasi
            </p>
          </div>
        </div>

        {/* Level / Total Points & Streak */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Bintang & Poin:</div>
            <div className="text-2xl font-black font-mono text-teal-800">
              ⭐ {progress.totalPoints}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <div className="text-xs text-slate-500 font-medium">Streak Belajar:</div>
            <div className="text-2xl font-black font-mono text-orange-600 flex items-center gap-1">
              <span>🔥</span> {progress.streakCount || 0} Hari
            </div>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <div className="text-xs text-slate-500 font-medium">Lencana Terbuka:</div>
            <div className="text-2xl font-black font-mono text-indigo-800">
              🏅 {earnedCount}/{totalBadgesCount}
            </div>
          </div>

          {onViewLeaderboard && (
            <div className="border-l border-slate-200 pl-4">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onViewLeaderboard();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>🏆</span> Peringkat Global
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Daily Streak & Consistency System Widget */}
      <DailyStreakWidget
        progress={progress}
        onSimulateNextDay={onSimulateNextDay}
      />

      {/* Daily Speed Challenge Widget (< 5 mins) */}
      {(onStartChallenge || onNavigateToLearning) && (
        <DailyChallengeCard
          progress={progress}
          onNavigate={onNavigateToLearning}
          onStartChallenge={onStartChallenge || onNavigateToLearning!}
        />
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Bacaan Literasi Selesai
          </div>
          <div className="text-3xl font-black text-teal-800 font-mono mt-2">
            {progress.completedPassages.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Koleksi cerita dan teks informasi</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Tantangan Numerasi Tuntas
          </div>
          <div className="text-3xl font-black text-indigo-800 font-mono mt-2">
            {progress.completedNumeracy.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Soal cerita pemecahan masalah</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Rekor Membaca Cepat
          </div>
          <div className="text-3xl font-black text-amber-700 font-mono mt-2">
            {progress.readingSpeedRecord ? `${progress.readingSpeedRecord.wpm} WPM` : 'Belum Tes'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Kata Per Menit pemahaman bacaan</p>
        </div>
      </div>

      {/* Badges Collection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Koleksi Lencana Penghargaan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Dapatkan lencana prestasi dengan menyelesaikan bacaan, memecahkan soal numerasi, simulasi AKM, dan streak belajar harian.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES_DATA.map((badge) => {
            const isEarned = progress.earnedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  isEarned
                    ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isEarned ? 'bg-amber-100 border border-amber-300' : 'bg-slate-200 grayscale'
                  }`}
                >
                  {badge.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900">{badge.name}</h4>
                    {isEarned && (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                        Raih
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Data Option */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            soundFx.playClick();
            setIsConfirmResetOpen(true);
          }}
          className="text-xs text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer"
        >
          Reset Riwayat Belajar Saya
        </button>
      </div>

      {/* Confirmation Modal for Resetting Student Progress */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reset Riwayat Belajar</h3>
                <p className="text-xs text-slate-500">Konfirmasi Pengaturan Ulang</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              Apakah kamu yakin ingin mengatur ulang data perkembangan dan riwayat belajar? Semua daftar modul yang telah selesai dan poin kuis akan dikembalikan ke awal.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsConfirmResetOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsConfirmResetOpen(false);
                  onResetProgress();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

