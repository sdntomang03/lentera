import React from 'react';
import { UserProgress } from '../../types';
import { DailyChallengeCard } from '../common/DailyChallengeCard';

interface StudentDashboardProps {
  progress: UserProgress;
  passageCount: number;
  numeracyCount: number;
  onNavigate: (nav: 'literasi' | 'numerasi' | 'akm' | 'prestasi') => void;
  onStartChallenge: (type: 'literasi' | 'numerasi') => void;
}

const formatDate = () =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

const parseIndonesianDate = (date: string) => {
  const [day, month, year] = date.split('/').map(Number);
  return day && month && year ? new Date(year, month - 1, day).getTime() : 0;
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  progress,
  passageCount,
  numeracyCount,
  onNavigate,
  onStartChallenge,
}) => {
  const literacyCompleted = progress.completedPassages.length;
  const numeracyCompleted = progress.completedNumeracy.length;
  const activityCount = literacyCompleted + numeracyCompleted;
  const totalActivities = passageCount + numeracyCount;
  const completionPercent = totalActivities
    ? Math.min(100, Math.round((activityCount / totalActivities) * 100))
    : 0;
  const recentScores = Object.values(progress.quizScores)
    .sort((a, b) => parseIndonesianDate(b.date) - parseIndonesianDate(a.date))
    .slice(0, 3);
  const firstName = progress.studentName.trim().split(/\s+/)[0] || 'Siswa';

  const stats = [
    { label: 'Aktivitas selesai', value: activityCount, icon: '✓', color: 'teal' },
    { label: 'Total poin', value: progress.totalPoints.toLocaleString('id-ID'), icon: '★', color: 'amber' },
    { label: 'Hari beruntun', value: progress.streakCount || 0, icon: '↗', color: 'indigo' },
    { label: 'Lencana diraih', value: progress.earnedBadges.length, icon: '◆', color: 'sky' },
  ];

  const statColors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Dashboard Belajar</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Selamat datang, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Pantau perkembanganmu dan lanjutkan langkah kecil menuju prestasi belajar yang lebih baik.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-200">Hari ini</div>
            <div className="mt-1 font-semibold">{formatDate()}</div>
            {(progress.school || progress.gradeLevel) && (
              <div className="mt-1 text-xs text-slate-400">
                {[progress.gradeLevel, progress.school].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Ringkasan belajar" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ring-1 ${statColors[stat.color]}`}>
                {stat.icon}
              </span>
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Perkembangan Belajar</h2>
              <p className="mt-1 text-xs text-slate-500">Ringkasan aktivitas literasi dan numerasi yang telah diselesaikan.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('prestasi')}
              className="shrink-0 text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              Lihat rapor →
            </button>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Progres keseluruhan</span>
              <span className="font-bold text-teal-800">{completionPercent}%</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Progres aktivitas belajar"
              aria-valuenow={completionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigate('literasi')}
              className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50/70 p-4 text-left transition-colors hover:bg-teal-50"
            >
              <span>
                <span className="block text-xs font-bold text-teal-900">Literasi membaca</span>
                <span className="mt-1 block text-xs text-slate-600">{literacyCompleted} dari {passageCount} bacaan selesai</span>
              </span>
              <span className="text-lg text-teal-700" aria-hidden="true">📖</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('numerasi')}
              className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-left transition-colors hover:bg-indigo-50"
            >
              <span>
                <span className="block text-xs font-bold text-indigo-900">Numerasi AKM</span>
                <span className="mt-1 block text-xs text-slate-600">{numeracyCompleted} dari {numeracyCount} soal selesai</span>
              </span>
              <span className="text-lg text-indigo-700" aria-hidden="true">🧮</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="text-base font-bold text-slate-900">Mulai Belajar</h2>
          <p className="mt-1 text-xs text-slate-500">Pilih aktivitas yang ingin kamu lanjutkan.</p>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Latihan Literasi', detail: 'Baca dan pahami teks', nav: 'literasi' as const, icon: '📚' },
              { label: 'Latihan Numerasi', detail: 'Asah logika dan hitungan', nav: 'numerasi' as const, icon: '🔢' },
              { label: 'Simulasi TKA', detail: 'Uji kesiapan belajarmu', nav: 'akm' as const, icon: '🎯' },
            ].map((item) => (
              <button
                key={item.nav}
                type="button"
                onClick={() => onNavigate(item.nav)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-colors hover:border-teal-200 hover:bg-teal-50/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{item.detail}</span>
                </span>
                <span className="text-sm text-slate-400" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <DailyChallengeCard progress={progress} onStartChallenge={onStartChallenge} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Aktivitas Terbaru</h2>
            <p className="mt-1 text-xs text-slate-500">Hasil latihan terakhir yang tercatat.</p>
          </div>
          <span className="text-xl" aria-hidden="true">🗂️</span>
        </div>
        {recentScores.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100">
            {recentScores.map((score, index) => (
              <div key={`${score.title}-${score.date}-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-800">{score.title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{score.category === 'literasi' ? 'Literasi' : score.category === 'numerasi' ? 'Numerasi' : 'Simulasi TKA'} · {score.date}</div>
                </div>
                <span className="shrink-0 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800">
                  {score.score}/{score.total} benar
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-xs font-semibold text-slate-700">Belum ada aktivitas tercatat</p>
            <p className="mt-1 text-xs text-slate-500">Mulai latihan untuk melihat ringkasan hasil belajarmu di sini.</p>
          </div>
        )}
      </section>
    </div>
  );
};
