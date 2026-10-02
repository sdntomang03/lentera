import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LiteracyView } from './components/literacy/LiteracyView';
import { NumeracyView } from './components/numeracy/NumeracyView';
import { ManipulativesHub } from './components/manipulatives/ManipulativesHub';
import { AkmSimulator } from './components/akm/AkmSimulator';
import { PrintableWorksheet } from './components/worksheet/PrintableWorksheet';
import { StudentProgress } from './components/profile/StudentProgress';
import { GlobalLeaderboard } from './components/leaderboard/GlobalLeaderboard';
import { Navbar } from './components/layout/Navbar';
import { DailyTipsView } from './components/tips/DailyTipsView';
import { StreakCelebrationModal } from './components/common/StreakCelebrationModal';
import { DailyChallengeModal } from './components/common/DailyChallengeModal';
import { DailyChallengeCard } from './components/common/DailyChallengeCard';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoginView } from './components/auth/LoginView';
import { EndziChatBot } from './components/chat/EndziChatBot';
import { LITERACY_PASSAGES } from './data/literacyData';
import { NUMERACY_QUESTIONS } from './data/numeracyData';
import { UserProgress, LiteracyPassage, NumeracyQuestion, AuthSession } from './types';
import { soundFx } from './utils/audio';
import { recordActivityStreak, getTodayDateString } from './utils/streak';
import {
  recordDailyChallengeCompletion,
  getCurrentDailyChallenge,
} from './utils/dailyChallenge';
import { logout as logoutFromApi } from './services/authService';
import { apiRequest, ApiError } from './services/apiClient';
import {
  fetchPassagesFromApi,
  fetchNumeracyFromApi,
  saveUserToApi,
} from './services/contentService';

type ActiveNav =
  | 'literasi'
  | 'numerasi'
  | 'tips'
  | 'manipulatif'
  | 'akm'
  | 'lkpd'
  | 'prestasi'
  | 'leaderboard';

const NAV_LABELS: Record<ActiveNav, string> = {
  literasi: 'Literasi Membaca',
  numerasi: 'Numerasi AKM',
  tips: 'Tips Harian Belajar',
  manipulatif: 'Lab Manipulatif',
  akm: 'Simulasi TKA',
  leaderboard: 'Papan Peringkat Global',
  lkpd: 'LKPD Cetak & Asesmen',
  prestasi: 'Profil & Prestasi',
};

const STORAGE_KEY = 'lentera_literasi_numerasi_v1';
const AUTH_SESSION_KEY = 'lentera_auth_session_v1';

const defaultProgress: UserProgress = {
  studentName: 'Budi Pratama',
  completedPassages: [],
  completedNumeracy: [],
  quizScores: {},
  earnedBadges: ['badge-first-read'],
  totalPoints: 120,
  streakCount: 1,
  longestStreak: 1,
  streakBonusPointsEarned: 20,
  activityHistoryDates: [getTodayDateString()],
  lastActiveDate: getTodayDateString(),
  dailyChallenge: {
    date: getTodayDateString(),
    literacyCompleted: false,
    numeracyCompleted: false,
    bonusPointsEarned: 0,
    allCompleted: false,
  },
};

export default function App() {
  const [activeNav, setActiveNav] = useState<ActiveNav>('literasi');
  const [navHistory, setNavHistory] = useState<ActiveNav[]>([]);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    if (!isAboutOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAboutOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAboutOpen]);

  // Authentication session state (Student or Teacher)
  const [session, setSession] = useState<AuthSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(AUTH_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as AuthSession;
          return parsed.token ? parsed : null;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [progress, setProgress] = useState<UserProgress>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const currentDaily = getCurrentDailyChallenge({
            ...defaultProgress,
            ...parsed,
          });
          return {
            ...defaultProgress,
            ...parsed,
            streakCount: parsed.streakCount || 1,
            longestStreak: parsed.longestStreak || 1,
            activityHistoryDates: parsed.activityHistoryDates || [getTodayDateString()],
            lastActiveDate: parsed.lastActiveDate || getTodayDateString(),
            dailyChallenge: currentDaily,
          };
        }
      } catch {
        // use default
      }
    }
    return defaultProgress;
  });
  const [isRestoringProgress, setIsRestoringProgress] = useState(
    () => session?.role === 'student' && Boolean(session.token),
  );
  const progressSyncQueue = useRef<Promise<void>>(Promise.resolve());

  // Streak celebration modal state
  const [streakModalData, setStreakModalData] = useState<{
    isOpen: boolean;
    streakCount: number;
    bonusPoints: number;
    unlockedLoyalBadge: boolean;
    message: string;
  }>({
    isOpen: false,
    streakCount: 1,
    bonusPoints: 0,
    unlockedLoyalBadge: false,
    message: '',
  });

  // Daily Challenge (< 5 mins) celebration modal state
  const [challengeModalData, setChallengeModalData] = useState<{
    isOpen: boolean;
    activityType: 'literasi' | 'numerasi';
    elapsedSeconds: number;
    bonusPoints: number;
    isAllCompletedNow: boolean;
    unlockedBadge: boolean;
    message: string;
  }>({
    isOpen: false,
    activityType: 'literasi',
    elapsedSeconds: 0,
    bonusPoints: 0,
    isAllCompletedNow: false,
    unlockedBadge: false,
    message: '',
  });

  // Auto open practice item for Daily Challenge direct start
  const [autoOpenPassageId, setAutoOpenPassageId] = useState<string | null>(null);
  const [autoOpenQuestionId, setAutoOpenQuestionId] = useState<string | null>(null);
  const [hasActiveExercise, setHasActiveExercise] = useState<boolean>(false);

  // Admin & Database Content state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [passages, setPassages] = useState<LiteracyPassage[]>(LITERACY_PASSAGES);
  const [numeracyQuestions, setNumeracyQuestions] = useState<NumeracyQuestion[]>(NUMERACY_QUESTIONS);

  // Fetch from Database on startup
  const loadApiContent = async () => {
    try {
      const [pData, nData] = await Promise.all([
        fetchPassagesFromApi(),
        fetchNumeracyFromApi(),
      ]);
      if (pData && pData.length > 0) setPassages(pData);
      if (nData && nData.length > 0) setNumeracyQuestions(nData);
    } catch (err) {
      console.warn('Could not load content from Database, using local fallback:', err);
    }
  };

  useEffect(() => {
    loadApiContent();
  }, []);

  useEffect(() => {
    if (session?.role !== 'student' || !session.token || !isRestoringProgress) return;
    let isActive = true;
    apiRequest<{ data: UserProgress }>('/me/progress')
      .then(({ data }) => {
        if (!isActive) return;
        const restored = { ...defaultProgress, ...data };
        setProgress({
          ...restored,
          dailyChallenge: getCurrentDailyChallenge(restored),
        });
        setIsRestoringProgress(false);
      })
      .catch((error) => {
        if (!isActive) return;
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(AUTH_SESSION_KEY);
          setSession(null);
          setIsRestoringProgress(false);
          return;
        }
        console.warn('Could not restore student progress from Database:', error);
      });
    return () => {
      isActive = false;
    };
  }, [session?.id, isRestoringProgress]);

  const handleLoginSuccess = (nextSession: AuthSession, progressData?: UserProgress) => {
    setIsRestoringProgress(false);
    setSession(nextSession);
    if (progressData) {
      setProgress({
        ...defaultProgress,
        ...progressData,
        dailyChallenge: getCurrentDailyChallenge({
          ...defaultProgress,
          ...progressData,
        }),
      });
    } else if (nextSession.role === 'teacher') {
      setProgress((prev) => ({
        ...prev,
        studentName: nextSession.studentName,
      }));
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
    }
  };

  const handleLogout = () => {
    void logoutFromApi().catch((error) => {
      console.warn('Could not revoke the Database session:', error);
    });
    setSession(null);
    setActiveNav('literasi');
    setNavHistory([]);
    setIsChatOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  };

  const handleStartDailyChallenge = (type: 'literasi' | 'numerasi') => {
    soundFx.playClick();
    if (type === 'literasi') {
      const activeList = passages.length > 0 ? passages : LITERACY_PASSAGES;
      const uncompleted = activeList.find(
        (p) => !progress.completedPassages.includes(p.id)
      );
      const targetId = uncompleted ? uncompleted.id : activeList[0].id;
      setAutoOpenPassageId(targetId);
      setHasActiveExercise(true);
      setActiveNav('literasi');
    } else {
      const activeList = numeracyQuestions.length > 0 ? numeracyQuestions : NUMERACY_QUESTIONS;
      const uncompleted = activeList.find(
        (q) => !progress.completedNumeracy.includes(q.id)
      );
      const targetId = uncompleted ? uncompleted.id : activeList[0].id;
      setAutoOpenQuestionId(targetId);
      setHasActiveExercise(true);
      setActiveNav('numerasi');
    }
  };

  const handleNavSelect = (nav: ActiveNav) => {
    if (nav !== activeNav) {
      setHasActiveExercise(false);
      setNavHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === activeNav) {
          return prev;
        }
        return [...prev, activeNav];
      });
    }
    setActiveNav(nav);
  };

  const handleGoBack = () => {
    soundFx.playClick();
    setHasActiveExercise(false);
    if (navHistory.length > 0) {
      const prevNav = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setActiveNav(prevNav);
    } else {
      setActiveNav('literasi');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      if (
        session?.role === 'student'
        && progress.id
        && !isRestoringProgress
      ) {
        const progressSnapshot = progress;
        progressSyncQueue.current = progressSyncQueue.current
          .catch(() => undefined)
          .then(async () => {
            await saveUserToApi(progressSnapshot);
          })
          .catch((err) => {
            console.warn('Could not sync student progress to Database:', err);
          });
      }
    } catch {
      // ignore
    }
  }, [progress, session?.id, session?.role, isRestoringProgress]);

  const processStreakOnActivity = (baseProgress: UserProgress): UserProgress => {
    const streakRes = recordActivityStreak(baseProgress);
    if (streakRes.streakIncremented) {
      setStreakModalData({
        isOpen: true,
        streakCount: streakRes.updatedProgress.streakCount,
        bonusPoints: streakRes.bonusPoints,
        unlockedLoyalBadge: streakRes.unlockedLoyalBadge,
        message: streakRes.message,
      });

      if (streakRes.unlockedLoyalBadge) {
        soundFx.playFanfare();
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
      } else {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }
    }
    return streakRes.updatedProgress;
  };

  const handlePassageCompleted = (
    passageId: string,
    score: number,
    total: number,
    elapsedSeconds: number = 0
  ) => {
    setProgress((prev) => {
      const nextPassages = prev.completedPassages.includes(passageId)
        ? prev.completedPassages
        : [...prev.completedPassages, passageId];

      const newBadges = [...prev.earnedBadges];
      if (!newBadges.includes('badge-first-read')) {
        newBadges.push('badge-first-read');
      }
      if (nextPassages.length >= 3 && !newBadges.includes('badge-vocab-master')) {
        newBadges.push('badge-vocab-master');
      }

      const updatedBase: UserProgress = {
        ...prev,
        completedPassages: nextPassages,
        totalPoints: prev.totalPoints + score * 15,
        earnedBadges: newBadges,
        quizScores: {
          ...prev.quizScores,
          [passageId]: {
            score,
            total,
            date: new Date().toLocaleDateString('id-ID'),
            title: passageId,
            category: 'literasi',
          },
        },
      };

      // Process daily streak
      let finalProgress = processStreakOnActivity(updatedBase);

      // Process Daily Challenge speed tracking (< 5 mins) if passed score
      if (score > 0 && elapsedSeconds > 0) {
        const chalRes = recordDailyChallengeCompletion(
          finalProgress,
          'literasi',
          elapsedSeconds
        );
        if (chalRes.isSpeedSuccess && chalRes.bonusPoints > 0) {
          setChallengeModalData({
            isOpen: true,
            activityType: 'literasi',
            elapsedSeconds,
            bonusPoints: chalRes.bonusPoints,
            isAllCompletedNow: chalRes.isAllCompletedNow,
            unlockedBadge: chalRes.unlockedBadge,
            message: chalRes.message,
          });
          soundFx.playFanfare();
          confetti({ particleCount: 95, spread: 75, origin: { y: 0.55 } });
        }
        finalProgress = chalRes.updatedProgress;
      }

      return finalProgress;
    });
  };

  const handleQuestionCompleted = (
    questionId: string,
    isCorrect: boolean,
    elapsedSeconds: number = 0
  ) => {
    setProgress((prev) => {
      const nextNumeracy = prev.completedNumeracy.includes(questionId)
        ? prev.completedNumeracy
        : [...prev.completedNumeracy, questionId];

      const newBadges = [...prev.earnedBadges];
      if (isCorrect && !newBadges.includes('badge-first-math')) {
        newBadges.push('badge-first-math');
      }
      if (nextNumeracy.length >= 3 && !newBadges.includes('badge-fraction-wizard')) {
        newBadges.push('badge-fraction-wizard');
      }

      const updatedBase: UserProgress = {
        ...prev,
        completedNumeracy: nextNumeracy,
        totalPoints: prev.totalPoints + (isCorrect ? 25 : 5),
        earnedBadges: newBadges,
      };

      // Process daily streak
      let finalProgress = processStreakOnActivity(updatedBase);

      // Process Daily Challenge speed tracking (< 5 mins) if correct
      if (isCorrect && elapsedSeconds > 0) {
        const chalRes = recordDailyChallengeCompletion(
          finalProgress,
          'numerasi',
          elapsedSeconds
        );
        if (chalRes.isSpeedSuccess && chalRes.bonusPoints > 0) {
          setChallengeModalData({
            isOpen: true,
            activityType: 'numerasi',
            elapsedSeconds,
            bonusPoints: chalRes.bonusPoints,
            isAllCompletedNow: chalRes.isAllCompletedNow,
            unlockedBadge: chalRes.unlockedBadge,
            message: chalRes.message,
          });
          soundFx.playFanfare();
          confetti({ particleCount: 95, spread: 75, origin: { y: 0.55 } });
        }
        finalProgress = chalRes.updatedProgress;
      }

      return finalProgress;
    });
  };

  const handleAkmCompleted = (score: number, total: number) => {
    setProgress((prev) => {
      const newBadges = [...prev.earnedBadges];
      if (score / total >= 0.8 && !newBadges.includes('badge-akm-champion')) {
        newBadges.push('badge-akm-champion');
      }

      const updatedBase: UserProgress = {
        ...prev,
        totalPoints: prev.totalPoints + score * 20,
        earnedBadges: newBadges,
      };

      return processStreakOnActivity(updatedBase);
    });
  };

  const handleSimulateNextDay = () => {
    setProgress((prev) => {
      const currentStreak = prev.streakCount || 1;
      const nextStreak = currentStreak + 1;
      const bonus = 25 + nextStreak * 10;
      const newBadges = [...prev.earnedBadges];
      let unlockedLoyal = false;
      let extraBonus = 0;

      if (nextStreak >= 3 && !newBadges.includes('badge-loyal-streak')) {
        newBadges.push('badge-loyal-streak');
        unlockedLoyal = true;
        extraBonus = 50;
      }

      const totalBonus = bonus + extraBonus;

      setStreakModalData({
        isOpen: true,
        streakCount: nextStreak,
        bonusPoints: totalBonus,
        unlockedLoyalBadge: unlockedLoyal,
        message: unlockedLoyal
          ? "🏆 Luar biasa! Kamu belajar 3 hari berturut-turut dan meraih lencana istimewa 'Pengguna Setia'!"
          : `🔥 Streak belajarmu bertambah menjadi ${nextStreak} hari berturut-turut! Pertahankan konsistensimu!`,
      });

      if (unlockedLoyal) {
        soundFx.playFanfare();
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.5 } });
      } else {
        soundFx.playCorrect();
        confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
      }

      const todayStr = getTodayDateString();
      const currentDates = prev.activityHistoryDates || [];
      const updatedDates = currentDates.includes(todayStr) ? currentDates : [...currentDates, todayStr];

      return {
        ...prev,
        streakCount: nextStreak,
        longestStreak: Math.max(nextStreak, prev.longestStreak || 1),
        totalPoints: prev.totalPoints + totalBonus,
        streakBonusPointsEarned: (prev.streakBonusPointsEarned || 0) + totalBonus,
        earnedBadges: newBadges,
        lastActiveDate: todayStr,
        activityHistoryDates: updatedDates,
      };
    });
  };

  const handleUpdateStudentName = (newName: string) => {
    setProgress((prev) => ({
      ...prev,
      studentName: newName,
    }));
  };

  const handleResetProgress = () => {
    setProgress({
      studentName: 'Budi Pratama',
      completedPassages: [],
      completedNumeracy: [],
      quizScores: {},
      earnedBadges: [],
      totalPoints: 0,
      streakCount: 1,
      longestStreak: 1,
      streakBonusPointsEarned: 0,
      activityHistoryDates: [getTodayDateString()],
      lastActiveDate: getTodayDateString(),
      dailyChallenge: {
        date: getTodayDateString(),
        literacyCompleted: false,
        numeracyCompleted: false,
        bonusPointsEarned: 0,
        allCompleted: false,
      },
    });
  };

  if (!session) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (session.role === 'teacher') {
    return (
      <AdminPanel
        onContentUpdated={loadApiContent}
        onClose={handleLogout}
        isTeacher
        teacherWorkspace
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 flex flex-col">
      {/* Top Main Navigation (Hidden on Print) */}
      <Navbar
        activeNav={activeNav}
        onSelectNav={handleNavSelect}
        progress={progress}
        onLogout={handleLogout}
        session={session}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Back & Navigation Breadcrumb Bar (Hidden on Print & on default view if no history) */}
        {(activeNav !== 'literasi' || navHistory.length > 0) && (
          <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200 shadow-2xs group"
              title="Kembali"
            >
              <span className="text-teal-700 font-extrabold text-base group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Kembali</span>
              {navHistory.length > 0 && (
                <span className="hidden sm:inline text-slate-500 font-normal text-xs">
                  ({NAV_LABELS[navHistory[navHistory.length - 1]] || 'Menu Utama'})
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="hidden md:inline">Menu Aktif:</span>
              <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200/80">
                {NAV_LABELS[activeNav] || activeNav}
              </span>
            </div>
          </div>
        )}

        {/* Daily Challenge Banner on Learning Views (Hidden when actively working on an exercise to maximize focus) */}
        {(activeNav === 'literasi' || activeNav === 'numerasi') && !hasActiveExercise && (
          <div className="mb-6 animate-in fade-in duration-200">
            <DailyChallengeCard
              progress={progress}
              onNavigate={(tab) => {
                soundFx.playClick();
                handleNavSelect(tab);
              }}
              onStartChallenge={handleStartDailyChallenge}
            />
          </div>
        )}

        {activeNav === 'literasi' && (
          <LiteracyView
            onPassageCompleted={handlePassageCompleted}
            completedIds={progress.completedPassages}
            autoOpenPassageId={autoOpenPassageId}
            onClearAutoOpen={() => setAutoOpenPassageId(null)}
            onActiveItemChange={setHasActiveExercise}
            passages={passages}
          />
        )}

        {activeNav === 'numerasi' && (
          <NumeracyView
            onQuestionCompleted={handleQuestionCompleted}
            completedIds={progress.completedNumeracy}
            autoOpenQuestionId={autoOpenQuestionId}
            onClearAutoOpen={() => setAutoOpenQuestionId(null)}
            onActiveItemChange={setHasActiveExercise}
            questions={numeracyQuestions}
          />
        )}

        {activeNav === 'tips' && <DailyTipsView onBack={handleGoBack} />}

        {activeNav === 'manipulatif' && <ManipulativesHub onBack={handleGoBack} />}

        {activeNav === 'akm' && <AkmSimulator onAkmCompleted={handleAkmCompleted} onBack={handleGoBack} />}

        {activeNav === 'lkpd' && <PrintableWorksheet onBack={handleGoBack} />}

        {activeNav === 'leaderboard' && (
          <GlobalLeaderboard
            currentUser={progress}
            onBack={handleGoBack}
            onNavigateToActivity={(act) => {
              soundFx.playClick();
              handleNavSelect(act);
            }}
          />
        )}

        {activeNav === 'prestasi' && (
          <StudentProgress
            progress={progress}
            onBack={handleGoBack}
            onUpdateName={handleUpdateStudentName}
            onResetProgress={handleResetProgress}
            onViewLeaderboard={() => {
              soundFx.playClick();
              handleNavSelect('leaderboard');
            }}
            onSimulateNextDay={handleSimulateNextDay}
            onNavigateToLearning={(tab) => {
              soundFx.playClick();
              handleNavSelect(tab);
            }}
            onStartChallenge={handleStartDailyChallenge}
          />
        )}
      </main>

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        isOpen={streakModalData.isOpen}
        onClose={() => setStreakModalData((prev) => ({ ...prev, isOpen: false }))}
        streakCount={streakModalData.streakCount}
        bonusPoints={streakModalData.bonusPoints}
        unlockedLoyalBadge={streakModalData.unlockedLoyalBadge}
        message={streakModalData.message}
      />

      {/* Daily Challenge Speed Celebration Modal */}
      <DailyChallengeModal
        isOpen={challengeModalData.isOpen}
        onClose={() => setChallengeModalData((prev) => ({ ...prev, isOpen: false }))}
        activityType={challengeModalData.activityType}
        elapsedSeconds={challengeModalData.elapsedSeconds}
        bonusPoints={challengeModalData.bonusPoints}
        isAllCompletedNow={challengeModalData.isAllCompletedNow}
        unlockedBadge={challengeModalData.unlockedBadge}
        message={challengeModalData.message}
      />

      {/* Footer (Hidden on Print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Lentera · Media Pembelajaran Literasi & Numerasi Terpadu
          </p>
          <p>
            Sesuai Standar Asesmen Kompetensi Minimum (AKM) & Kurikulum Merdeka Kemendikbudristek RI
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-bold text-teal-800 transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">ℹ️</span>
            Tentang Lentera
          </button>
        </div>
      </footer>

      {isAboutOpen && (
        <div
          className="about-overlay no-print fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setIsAboutOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            className="about-card relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-600" />
            <button
              type="button"
              onClick={() => setIsAboutOpen(false)}
              aria-label="Tutup tentang Lentera"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
            >
              ✕
            </button>

            <div className="about-hero relative isolate overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-indigo-900 px-7 pb-8 pt-10 text-center text-white">
              <span aria-hidden="true" className="about-orb about-orb-one" />
              <span aria-hidden="true" className="about-orb about-orb-two" />
              <span aria-hidden="true" className="about-spark about-spark-one">✦</span>
              <span aria-hidden="true" className="about-spark about-spark-two">✧</span>
              <div className="about-lantern relative z-10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-4xl shadow-lg">
                <span className="about-lantern-glow" />
                <span className="relative">🏮</span>
              </div>
              <p className="about-copy about-copy-one relative z-10 mb-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">
                Tentang Aplikasi
              </p>
              <h2 id="about-title" className="about-copy about-copy-two relative z-10 text-3xl font-black tracking-tight">
                Lentera
              </h2>
              <p className="about-copy about-copy-three relative z-10 mt-2 text-sm leading-relaxed text-teal-100">
                Media Pembelajaran Literasi & Numerasi Terpadu
              </p>
            </div>

            <div className="about-details space-y-4 px-7 py-6 text-center">
              <p className="text-sm leading-relaxed text-slate-600">
                Ruang belajar interaktif untuk mendukung kegiatan literasi dan numerasi siswa.
              </p>
              <div className="about-author-card rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Dibuat oleh
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">Asnaeni</p>
                <p className="text-sm font-semibold text-slate-600">SD Negeri 007 Nunukan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAboutOpen(false)}
                className="w-full rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-teal-900 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Mulai Belajar
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Maskot AI Burung Enggang 'Endzi' Chatbot Widget */}
      <EndziChatBot
        userId={session.id}
        studentName={session.studentName || progress.studentName}
        currentNav={activeNav}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen((prev) => !prev)}
      />
    </div>
  );
}
