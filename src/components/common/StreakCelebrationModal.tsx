import React from 'react';

interface StreakCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  bonusPoints: number;
  unlockedLoyalBadge: boolean;
  message: string;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  isOpen,
  onClose,
  streakCount,
  bonusPoints,
  unlockedLoyalBadge,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Background ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-amber-400/30 to-orange-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Flame Icon */}
        <div className="relative z-10 mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white flex items-center justify-center text-4xl shadow-lg shadow-orange-500/30 animate-bounce">
          🔥
        </div>

        {/* Title & Streak Count */}
        <div className="relative z-10 space-y-1">
          <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 tracking-wider">
            Streak Harian Aktif
          </span>
          <h3 className="text-2xl font-black text-slate-900">
            {streakCount} Hari Berturut-turut!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Special 'Pengguna Setia' Badge Unlock announcement if achieved */}
        {unlockedLoyalBadge && (
          <div className="relative z-10 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 space-y-1">
            <div className="text-2xl animate-pulse">🏅</div>
            <div className="text-xs font-black text-amber-950 uppercase tracking-wide">
              Lencana Baru Terbuka: "Pengguna Setia"
            </div>
            <p className="text-[11px] text-amber-800">
              Kamu telah membuktikan konsistensi belajar selama beberapa hari tanpa putus!
            </p>
          </div>
        )}

        {/* Bonus Points Chip */}
        {bonusPoints > 0 && (
          <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black font-mono text-sm shadow-xs">
            <span>⭐</span>
            <span>+{bonusPoints} Poin Bonus Streak!</span>
          </div>
        )}

        {/* Close Button */}
        <div className="relative z-10 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            Lanjutkan Belajar 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
