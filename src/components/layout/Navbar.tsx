import React, { useState } from 'react';
import { UserProgress, AuthSession } from '../../types';
import { soundFx } from '../../utils/audio';
import { ENDZI_MASCOT_IMAGE } from '../../assets/mascot';

export type NavItemKey =
  | 'literasi'
  | 'numerasi'
  | 'tips'
  | 'manipulatif'
  | 'akm'
  | 'leaderboard'
  | 'lkpd'
  | 'prestasi';

interface NavbarProps {
  activeNav: NavItemKey;
  onSelectNav: (nav: NavItemKey) => void;
  progress: UserProgress;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  session?: AuthSession | null;
  onToggleChat?: () => void;
}

interface NavItemConfig {
  key: NavItemKey;
  label: string;
  shortLabel: string;
  icon: string;
  tag?: string;
  colorClass: {
    active: string;
    text: string;
    hover: string;
  };
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    key: 'literasi',
    label: 'Literasi Membaca',
    shortLabel: 'Literasi',
    icon: '📖',
    colorClass: {
      active: 'bg-teal-600 text-white shadow-xs',
      text: 'text-teal-700',
      hover: 'hover:bg-teal-50 hover:text-teal-800',
    },
  },
  {
    key: 'numerasi',
    label: 'Numerasi AKM',
    shortLabel: 'Numerasi',
    icon: '🧮',
    colorClass: {
      active: 'bg-indigo-600 text-white shadow-xs',
      text: 'text-indigo-700',
      hover: 'hover:bg-indigo-50 hover:text-indigo-800',
    },
  },
  {
    key: 'tips',
    label: 'Tips Harian',
    shortLabel: 'Tips AI',
    icon: '💡',
    tag: 'AI ✨',
    colorClass: {
      active: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs',
      text: 'text-teal-700',
      hover: 'hover:bg-teal-50 hover:text-teal-800',
    },
  },
  {
    key: 'manipulatif',
    label: 'Lab Manipulatif',
    shortLabel: 'Lab Visual',
    icon: '🧩',
    colorClass: {
      active: 'bg-emerald-600 text-white shadow-xs',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-50 hover:text-emerald-800',
    },
  },
  {
    key: 'akm',
    label: 'Simulasi ANBK',
    shortLabel: 'ANBK',
    icon: '🏆',
    tag: 'Ujian',
    colorClass: {
      active: 'bg-amber-600 text-white shadow-xs',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-50 hover:text-amber-800',
    },
  },
  {
    key: 'leaderboard',
    label: 'Papan Peringkat',
    shortLabel: 'Top 10',
    icon: '🌟',
    colorClass: {
      active: 'bg-amber-500 text-slate-950 font-extrabold shadow-xs',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-50 hover:text-amber-800',
    },
  },
  {
    key: 'lkpd',
    label: 'Cetak LKPD',
    shortLabel: 'LKPD',
    icon: '🖨️',
    colorClass: {
      active: 'bg-sky-700 text-white shadow-xs',
      text: 'text-sky-700',
      hover: 'hover:bg-sky-50 hover:text-sky-800',
    },
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeNav,
  onSelectNav,
  progress,
  onOpenAdmin,
  onLogout,
  session,
  onToggleChat,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  const handleNavClick = (key: NavItemKey) => {
    soundFx.playClick();
    onSelectNav(key);
    setMobileMenuOpen(false);
  };

  const totalActivities =
    progress.completedPassages.length + progress.completedNumeracy.length;

  return (
    <header className="no-print sticky top-0 z-50 w-full max-w-full overflow-x-hidden transition-all duration-200 backdrop-blur-md bg-white/95 border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
      {/* Top micro-gradient indicator bar */}
      <div className="h-0.75 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-600" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo & Brand Identity */}
          <button
            onClick={() => handleNavClick('literasi')}
            className="flex items-center gap-1.5 sm:gap-2.5 text-left group cursor-pointer focus:outline-hidden shrink-0 min-w-0"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform duration-200">
                💡
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-brand text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  Lentera
                </span>
                <span className="hidden sm:inline text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 tracking-wider">
                  Merdeka
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Portal Literasi & Numerasi Terpadu
              </p>
            </div>
          </button>

          {/* Desktop Navigation (Single, Clean Menu for xl & desktop screens) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`relative px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none ${
                    isActive
                      ? item.colorClass.active
                      : `text-slate-600 ${item.colorClass.hover}`
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.shortLabel}</span>
                  {item.tag && (
                    <span
                      className={`text-[9px] font-black uppercase px-1 rounded ${
                        isActive ? 'bg-black/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mid-screen compact horizontal pills (for tablets / medium desktops) */}
          <nav className="hidden md:flex xl:hidden items-center gap-1 overflow-x-auto min-w-0 flex-1 justify-center py-1 no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? item.colorClass.active
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Student Profile Capsule & Mobile Hamburger Toggle */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Student Profile Capsule Button */}
            <button
              onClick={() => handleNavClick('prestasi')}
              className={`group flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 pr-1.5 sm:pr-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                activeNav === 'prestasi'
                  ? 'bg-teal-900 text-white border-teal-950 shadow-sm ring-2 ring-teal-500/30'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
              }`}
              title="Lihat Rapor & Prestasi Belajar"
            >
              {/* Streak Flame Pill */}
              <div
                className="flex items-center gap-0.5 px-1.5 sm:px-2 py-0.75 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black font-mono text-xs shadow-xs"
                title={`Streak Belajar: ${progress.streakCount || 0} hari berturut-turut`}
              >
                <span className="text-[11px]">🔥</span>
                <span>{progress.streakCount || 0}</span>
              </div>

              {/* Daily Speed Challenge Pill */}
              {progress.dailyChallenge && (
                <div
                  className={`hidden md:flex items-center gap-0.5 px-2 py-0.75 rounded-xl text-xs font-black font-mono shadow-xs ${
                    progress.dailyChallenge.allCompleted
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                  }`}
                  title={
                    progress.dailyChallenge.allCompleted
                      ? 'Tantangan Kilat Hari Ini: Selesai Penuh (2/2)'
                      : `Tantangan Kilat: ${(progress.dailyChallenge.literacyCompleted ? 1 : 0) + (progress.dailyChallenge.numeracyCompleted ? 1 : 0)}/2 Misi`
                  }
                >
                  <span className="text-[11px]">⚡</span>
                  <span>
                    {(progress.dailyChallenge.literacyCompleted ? 1 : 0) +
                      (progress.dailyChallenge.numeracyCompleted ? 1 : 0)}
                    /2
                  </span>
                </div>
              )}

              {/* Star Score Chip */}
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.75 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black font-mono text-xs shadow-xs">
                <span>⭐</span>
                <span>{progress.totalPoints}</span>
              </div>

              {/* Student Name and Meta (Hidden on tiny mobile) */}
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-bold leading-tight group-hover:text-teal-600 transition-colors max-w-[100px] truncate">
                    {progress.studentName}
                  </div>
                  {session?.role === 'teacher' && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Guru
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {totalActivities} Modul · 🏅 {progress.earnedBadges.length}
                </div>
              </div>

              <div className="hidden sm:flex w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center text-xs">
                🎒
              </div>
            </button>

            {/* Endzi Mascot Chat Button */}
            {onToggleChat && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onToggleChat();
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-amber-300/80 active:scale-95 shrink-0"
                title="Tanya Endzi si Burung Enggang (Maskot AI)"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white shrink-0 bg-teal-900 shadow-2xs">
                  <img src={ENDZI_MASCOT_IMAGE} alt="Endzi" className="w-full h-full object-cover" />
                </div>
                <span className="hidden sm:inline">Tanya Endzi</span>
                <span className="hidden sm:inline text-[10px] bg-amber-800/60 px-1 py-0.2 rounded font-black">🪶 AI</span>
              </button>
            )}

            {/* Admin Guru / Teacher Portal Button (moved to mobile menu below md to avoid crowding) */}
            {onOpenAdmin && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenAdmin();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Buka Panel Admin Guru (Kelola Konten Firebase)"
              >
                <span>⚙️</span>
                <span className="hidden lg:inline">Kelola Konten</span>
              </button>
            )}

            {/* Logout / Switch Account Button (moved to mobile menu below md to avoid crowding) */}
            {onLogout && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsLogoutConfirmOpen(true);
                }}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Keluar / Beralih Akun Pengguna"
              >
                <span>🚪</span>
                <span className="hidden xl:inline">Keluar</span>
              </button>
            )}

            {/* Mobile Hamburger Button (Only on mobile < md) */}
            <button
              onClick={() => {
                soundFx.playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clean Mobile Dropdown Menu (Opened only when Hamburger is tapped, NO duplicate bottom bar!) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md p-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
            Menu Pembelajaran Lentera
          </div>

          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`p-3 rounded-2xl text-left border flex flex-col justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{item.icon}</span>
                    {item.tag && (
                      <span className="text-[9px] font-black uppercase px-1 rounded bg-amber-100 text-amber-900">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => handleNavClick('prestasi')}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>🎒</span> Rapor & Lencana ({progress.studentName})
              </span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-orange-400 font-bold">🔥 {progress.streakCount || 0}</span>
                <span className="text-amber-300">⭐ {progress.totalPoints}</span>
              </div>
            </button>

            {onToggleChat && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMobileMenuOpen(false);
                  onToggleChat();
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white shrink-0 bg-teal-900">
                  <img src={ENDZI_MASCOT_IMAGE} alt="Endzi" className="w-full h-full object-cover" />
                </div>
                <span>Tanya Endzi (Maskot Burung Enggang AI) 🪶</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full p-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <span>⚙️</span>
                <span>Panel Kelola Konten Guru (Firebase)</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMobileMenuOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>🚪</span>
                <span>Keluar / Ganti Akun Pengguna</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* In-app Logout Confirmation Dialog */}
      {isLogoutConfirmOpen && onLogout && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0">
                🚪
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Keluar Akun</h3>
                <p className="text-xs text-slate-500">Konfirmasi Keluar / Beralih</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              Yakin ingin keluar atau beralih ke akun siswa lain? Data progres yang tersimpan di Firebase tetap aman.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsLogoutConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsLogoutConfirmOpen(false);
                  onLogout();
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
