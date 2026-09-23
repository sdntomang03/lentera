import React from 'react';
import { formatSecondsToMinutes } from '../../utils/dailyChallenge';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityType: 'literasi' | 'numerasi';
  elapsedSeconds: number;
  bonusPoints: number;
  isAllCompletedNow: boolean;
  unlockedBadge: boolean;
  message: string;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  activityType,
  elapsedSeconds,
  bonusPoints,
  isAllCompletedNow,
  unlockedBadge,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-amber-400/30 via-yellow-400/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Speed Flash Icon */}
        <div className="relative z-10 mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-orange-500 text-slate-950 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 animate-bounce">
          ⚡
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-1">
          <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 tracking-wider">
            Tantangan Kilat &lt; 5 Menit
          </span>
          <h3 className="text-2xl font-black text-slate-900">
            {isAllCompletedNow ? 'Combo Harian Tuntas!' : 'Hebat, Waktu Terpenuhi!'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Time Result Pill */}
        <div className="relative z-10 flex items-center justify-center gap-3 py-2 px-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="text-left">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">
              Aktivitas: {activityType === 'literasi' ? 'Literasi Membaca' : 'Numerasi Soal'}
            </div>
            <div className="font-mono font-bold text-slate-900 text-sm">
              ⏱️ Waktu: {formatSecondsToMinutes(elapsedSeconds)} / 05:00
            </div>
          </div>
          <span className="text-emerald-700 font-extrabold text-xs bg-emerald-100 px-2 py-1 rounded-lg">
            Selesai Cepat ⚡
          </span>
        </div>

        {/* Badge Unlock Announcement */}
        {unlockedBadge && (
          <div className="relative z-10 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 space-y-1">
            <div className="text-2xl animate-pulse">⚡</div>
            <div className="text-xs font-black text-amber-950 uppercase tracking-wide">
              Lencana Baru: "Kilat Cerdas"
            </div>
            <p className="text-[11px] text-amber-800">
              Kamu berhasil menyelesaikan tantangan akurasi dalam waktu kurang dari 5 menit!
            </p>
          </div>
        )}

        {/* Bonus Points */}
        {bonusPoints > 0 && (
          <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black font-mono text-sm shadow-xs">
            <span>⭐</span>
            <span>+{bonusPoints} Poin Ekstra Harian!</span>
          </div>
        )}

        {/* Action Button */}
        <div className="relative z-10 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            Luar Biasa, Lanjutkan! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
