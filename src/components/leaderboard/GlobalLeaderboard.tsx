import React, { useState, useEffect, useTransition } from 'react';
import confetti from 'canvas-confetti';
import { EducationLevel, LeaderboardEntry, UserProgress } from '../../types';
import { fetchGlobalLeaderboard, LeaderboardFilter, LeaderboardResponse } from '../../services/leaderboardService';
import { soundFx } from '../../utils/audio';

interface GlobalLeaderboardProps {
  currentUser: UserProgress;
  onNavigateToActivity?: (activity: 'literasi' | 'numerasi' | 'akm') => void;
  onBack?: () => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  currentUser,
  onNavigateToActivity,
  onBack,
}) => {
  const [filterLevel, setFilterLevel] = useState<EducationLevel | 'all'>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<'all-time' | 'month' | 'week'>('all-time');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [cheerCount, setCheerCount] = useState<number>(42);
  const [hasCheered, setHasCheered] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const loadLeaderboard = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      soundFx.playClick();
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const filters: LeaderboardFilter = {
        level: filterLevel,
        timeframe: filterTimeframe,
        searchQuery: searchQuery.trim(),
      };

      const result = await fetchGlobalLeaderboard(currentUser, filters);
      startTransition(() => {
        setLeaderboardData(result);
      });
    } catch (error) {
      console.error('Failed to load global leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [filterLevel, filterTimeframe, searchQuery, currentUser.totalPoints, currentUser.studentName]);

  const handleCheer = () => {
    soundFx.playCorrect();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    setCheerCount((prev) => prev + 1);
    setHasCheered(true);
  };

  const topTen = leaderboardData?.topTen || [];
  const topThree = topTen.slice(0, 3);
  const restOfTopTen = topTen.slice(3, 10);
  const userRank = leaderboardData?.currentUserRank;
  const isUserInTopTen = userRank !== null && userRank !== undefined && userRank <= 10;
  const cutoffScore = leaderboardData?.cutoffScoreForTopTen || 0;
  const pointsToTopTen = Math.max(0, cutoffScore - currentUser.totalPoints + 1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        {onBack && (
          <div className="relative z-10 mb-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onBack();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer border border-white/20 shadow-2xs backdrop-blur-xs group"
              title="Kembali"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Kembali</span>
            </button>
          </div>
        )}

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-teal-200 border border-white/15">
            <span>🏆</span> Peringkat Nasional Terpadu
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Papan Peringkat Global Siswa
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed max-w-2xl">
            Rayakan prestasi 10 siswa dengan bintang & poin tertinggi di seluruh nusantara.
            Tumbuhkan semangat sportivitas dan belajar mandiri lewat literasi membaca dan penalaran numerasi!
          </p>
        </div>

        {/* Decorative Badge Background */}
        <div className="absolute -right-6 -bottom-8 text-8xl opacity-10 select-none pointer-events-none">
          🌟
        </div>
      </div>

      {/* Current Student Position Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center text-2xl font-black shrink-0">
            {isUserInTopTen ? (
              userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : `#${userRank}`
            ) : (
              `#${userRank || '-'}`
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Posisi Belajar Kamu</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {currentUser.studentName}
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {isUserInTopTen ? (
                <span className="text-emerald-700">
                  Luar biasa! Kamu berada di peringkat #{userRank} dari 10 besar nasional! 🎉
                </span>
              ) : (
                <span>
                  Peringkat #{userRank || '15+'}. Butuh <strong className="text-teal-800 font-mono">+{pointsToTopTen} poin</strong> untuk menembus Top 10!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Total Poinmu saat ini: <strong className="font-mono text-slate-800 font-bold">{currentUser.totalPoints} ⭐</strong> · {currentUser.earnedBadges.length} Lencana · {currentUser.completedPassages.length + currentUser.completedNumeracy.length} Modul Tuntas
            </p>
          </div>
        </div>

        {/* Action Shortcuts to earn points */}
        {onNavigateToActivity && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateToActivity('literasi')}
              className="px-3.5 py-2 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>📖</span> Baca Teks (+15)
            </button>
            <button
              onClick={() => onNavigateToActivity('numerasi')}
              className="px-3.5 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>🧮</span> Soal Numerasi (+25)
            </button>
            <button
              onClick={() => onNavigateToActivity('akm')}
              className="px-3.5 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>🏆</span> Simulasi ANBK (+100)
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterLevel === 'all'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Jenjang
            </button>
            <button
              onClick={() => setFilterLevel('fase-a')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterLevel === 'fase-a'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase A (Kls 1-2)
            </button>
            <button
              onClick={() => setFilterLevel('fase-b')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterLevel === 'fase-b'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase B (Kls 3-4)
            </button>
            <button
              onClick={() => setFilterLevel('fase-c')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterLevel === 'fase-c'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase C (Kls 5-6)
            </button>
          </div>

          {/* Timeframe & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterTimeframe('all-time')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterTimeframe === 'all-time'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Waktu
              </button>
              <button
                onClick={() => setFilterTimeframe('month')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterTimeframe === 'month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setFilterTimeframe('week')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterTimeframe === 'week'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Minggu Ini
              </button>
            </div>

            <button
              onClick={() => loadLeaderboard(true)}
              disabled={isRefreshing}
              title="Perbarui Data Peringkat"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
              <span className="hidden sm:inline">Perbarui</span>
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <span className="text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa, asal sekolah, atau kota..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="flex justify-center items-center py-12 gap-3 text-slate-500">
            <span className="animate-spin text-2xl">⏳</span>
            <span className="text-sm font-semibold">Mengambil data 10 peringkat teratas...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (Visual Showcase) */}
          {topThree.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place (Silver) */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col items-center text-center relative shadow-xs hover:border-slate-300 transition-all">
                <div className="absolute top-4 left-4 text-xs font-black px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                  🥈 #2
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-300 text-3xl flex items-center justify-center mb-3 mt-2 shadow-inner">
                  {topThree[1].avatar}
                </div>
                <h4 className="font-bold text-slate-900 text-base line-clamp-1">{topThree[1].name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{topThree[1].school}</p>
                <span className="text-[11px] text-slate-400">{topThree[1].city}</span>

                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TOTAL POIN</span>
                    <span className="font-black font-mono text-base text-slate-800">
                      ⭐ {topThree[1].points}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">LENCANA</span>
                    <span className="font-bold text-slate-700">🏅 {topThree[1].badgesCount}</span>
                  </div>
                </div>
              </div>

              {/* 1st Place (Gold Champion) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 rounded-2xl border-2 border-amber-400 p-6 flex flex-col items-center text-center relative shadow-md scale-102 hover:border-amber-500 transition-all">
                <div className="absolute -top-3.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full text-xs font-black shadow-xs flex items-center gap-1">
                  <span>👑</span> JUARA 1 NASIONAL
                </div>
                <div className="w-20 h-20 rounded-2xl bg-amber-100 border-3 border-amber-400 text-4xl flex items-center justify-center mb-3 mt-2 shadow-inner">
                  {topThree[0].avatar}
                </div>
                <h4 className="font-black text-slate-900 text-lg line-clamp-1">{topThree[0].name}</h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{topThree[0].school}</p>
                <span className="text-[11px] text-slate-500 font-semibold">{topThree[0].city}</span>

                <div className="mt-4 pt-4 border-t border-amber-200/60 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="text-amber-800 font-bold text-[10px] block">TOTAL POIN</span>
                    <span className="font-black font-mono text-xl text-amber-900">
                      ⭐ {topThree[0].points}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-bold text-[10px] block">LENCANA</span>
                    <span className="font-black text-amber-950">🏅 {topThree[0].badgesCount}</span>
                  </div>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="order-3 bg-gradient-to-b from-amber-50/30 to-white rounded-2xl border-2 border-amber-200 p-6 flex flex-col items-center text-center relative shadow-xs hover:border-amber-300 transition-all">
                <div className="absolute top-4 left-4 text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  🥉 #3
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-300 text-3xl flex items-center justify-center mb-3 mt-2 shadow-inner">
                  {topThree[2].avatar}
                </div>
                <h4 className="font-bold text-slate-900 text-base line-clamp-1">{topThree[2].name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{topThree[2].school}</p>
                <span className="text-[11px] text-slate-400">{topThree[2].city}</span>

                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TOTAL POIN</span>
                    <span className="font-black font-mono text-base text-amber-800">
                      ⭐ {topThree[2].points}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">LENCANA</span>
                    <span className="font-bold text-slate-700">🏅 {topThree[2].badgesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Top 10 Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Tabel 10 Besar Peserta Didik Berprestasi
                </h3>
                <p className="text-xs text-slate-500">
                  Total partisipan aktif: {leaderboardData?.totalParticipants || 150} siswa se-Indonesia
                </p>
              </div>

              <div className="text-xs text-slate-400 hidden sm:block">
                Diperbarui: {leaderboardData?.lastUpdated}
              </div>
            </div>

            {topTen.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Tidak ada data siswa yang cocok dengan filter atau kata kunci pencarian.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5 pl-5 w-16">Peringkat</th>
                      <th className="p-3.5">Nama Siswa & Satuan Pendidikan</th>
                      <th className="p-3.5 hidden sm:table-cell">Jenjang Fase</th>
                      <th className="p-3.5 hidden md:table-cell text-center">Aktivitas Selesai</th>
                      <th className="p-3.5 hidden sm:table-cell text-center">Lencana</th>
                      <th className="p-3.5 pr-5 text-right">Total Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topTen.map((student, idx) => {
                      const isCurrentUser = student.isCurrentUser;
                      const rank = student.rank || idx + 1;

                      let medalBadge = <span className="font-mono font-bold text-slate-600">#{rank}</span>;
                      if (rank === 1) medalBadge = <span className="text-base" title="Juara 1">🥇</span>;
                      else if (rank === 2) medalBadge = <span className="text-base" title="Juara 2">🥈</span>;
                      else if (rank === 3) medalBadge = <span className="text-base" title="Juara 3">🥉</span>;

                      return (
                        <tr
                          key={student.id}
                          className={`transition-colors ${
                            isCurrentUser
                              ? 'bg-teal-50/80 font-semibold ring-1 ring-inset ring-teal-300'
                              : idx % 2 === 0
                              ? 'bg-white hover:bg-slate-50/80'
                              : 'bg-slate-50/40 hover:bg-slate-50'
                          }`}
                        >
                          {/* Rank */}
                          <td className="p-3.5 pl-5">
                            <div className="flex items-center gap-1.5">
                              {medalBadge}
                              {student.trend === 'up' && (
                                <span className="text-[10px] text-emerald-600 font-bold" title="Peringkat Naik">
                                  ▲
                                </span>
                              )}
                              {student.trend === 'new' && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded font-bold">
                                  BARU
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Student Details */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xl shrink-0 p-1.5 rounded-lg bg-slate-100">
                                {student.avatar}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-700 text-white font-bold">
                                      Kamu
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {student.school} · <span className="text-slate-400">{student.city}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Level */}
                          <td className="p-3.5 hidden sm:table-cell text-slate-600">
                            <span className="px-2 py-1 rounded-md bg-slate-100 text-[11px] font-medium">
                              {student.levelLabel}
                            </span>
                          </td>

                          {/* Activities Completed */}
                          <td className="p-3.5 hidden md:table-cell text-center font-mono text-slate-700">
                            {student.activitiesCompleted} modul
                          </td>

                          {/* Badges */}
                          <td className="p-3.5 hidden sm:table-cell text-center font-medium text-slate-700">
                            🏅 {student.badgesCount}
                          </td>

                          {/* Total Points */}
                          <td className="p-3.5 pr-5 text-right">
                            <span className="font-mono font-black text-sm text-teal-800 bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-200">
                              ⭐ {student.points}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Friendly Competition Banner & Community Encouragement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>🤝</span> Semangat Sportivitas & Belajar Bersama
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Peringkat ini dirancang untuk memotivasi latihan berkala. Setiap siswa memiliki kecepatan
              belajar unik, dan setiap bacaan atau tantangan yang kamu selesaikan adalah kemenangan belajar sejati!
            </p>
          </div>

          <button
            onClick={handleCheer}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>👏</span>
            <span>{hasCheered ? 'Semangat Terkirim!' : 'Kirim Tepuk Tangan Teman'}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-mono">
              {cheerCount}
            </span>
          </button>
        </div>

        {/* Tips to climb leaderboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800 mb-0.5">📖 Selesaikan Bacaan</div>
            <div className="text-slate-500 leading-snug">
              Jawab pertanyaan pemahaman teks literasi dan kuis retensi kata sukar (+15 poin).
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800 mb-0.5">🧮 Pecahkan Soal Numerasi</div>
            <div className="text-slate-500 leading-snug">
              Analisis stimulus grafik dan hitung pemecahan masalah kontekstual (+25 poin).
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800 mb-0.5">🏆 Ikuti Ujian Simulasi</div>
            <div className="text-slate-500 leading-snug">
              Selesaikan paket ANBK 6 butir terpadu dengan kategori capaian Pusmendik (+100 poin).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
