import { UserProgress } from '../types';

export interface StreakResult {
  updatedProgress: UserProgress;
  streakIncremented: boolean;
  bonusPoints: number;
  unlockedLoyalBadge: boolean;
  message: string;
}

export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateToYMD(new Date());
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToYMD(d);
}

/**
 * Updates streak when an activity is completed.
 * Rule:
 * - If lastActiveDate === today: user continues active day, no double streak increment, but registers progress.
 * - If lastActiveDate === yesterday: streak extends by +1!
 * - If lastActiveDate < yesterday or empty: streak resets to 1.
 * - If streak >= 3 and does not have 'badge-loyal-streak', awards badge + celebration!
 */
export function recordActivityStreak(prev: UserProgress): StreakResult {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const history = prev.activityHistoryDates || [];
  const hasCompletedToday = history.includes(today) || prev.lastActiveDate === today;

  let newStreak = prev.streakCount || 0;
  let streakIncremented = false;
  let bonusPoints = 0;
  let unlockedLoyalBadge = false;
  let message = '';

  if (hasCompletedToday) {
    // Already counted streak for today
    return {
      updatedProgress: {
        ...prev,
        lastActiveDate: today,
        activityHistoryDates: history.includes(today) ? history : [...history, today],
      },
      streakIncremented: false,
      bonusPoints: 0,
      unlockedLoyalBadge: false,
      message: `Hebat! Kamu sudah menyelesaikan aktivitas hari ini (Streak aktif: ${newStreak} hari).`,
    };
  }

  // Not completed yet today:
  if (prev.lastActiveDate === yesterday) {
    newStreak = (prev.streakCount || 0) + 1;
    streakIncremented = true;
    bonusPoints = 25 + newStreak * 10; // e.g. Day 2: 45 pts, Day 3: 55 pts
    message = `🔥 Luar biasa! Streak bertambah menjadi ${newStreak} hari berturut-turut! (+${bonusPoints} bonus poin)`;
  } else {
    // First time or missed day(s)
    newStreak = 1;
    streakIncremented = true;
    bonusPoints = 20;
    message = `🔥 Hari ke-1 dimulai! Pertahankan besok untuk bonus berlipat! (+${bonusPoints} poin)`;
  }

  const newLongest = Math.max(newStreak, prev.longestStreak || 1);
  const newHistory = history.includes(today) ? history : [...history, today];
  const newBadges = [...(prev.earnedBadges || [])];

  // Check for 'badge-loyal-streak' ('Pengguna Setia') at 3+ days streak
  if (newStreak >= 3 && !newBadges.includes('badge-loyal-streak')) {
    newBadges.push('badge-loyal-streak');
    unlockedLoyalBadge = true;
    bonusPoints += 50; // extra reward for loyal badge!
    message = `🏆 SELAMAT! Kamu meraih lencana istimewa 'Pengguna Setia' & bonus +${bonusPoints} poin atas ketekunanmu!`;
  }

  const updatedProgress: UserProgress = {
    ...prev,
    streakCount: newStreak,
    lastActiveDate: today,
    longestStreak: newLongest,
    earnedBadges: newBadges,
    totalPoints: prev.totalPoints + bonusPoints,
    streakBonusPointsEarned: (prev.streakBonusPointsEarned || 0) + bonusPoints,
    activityHistoryDates: newHistory,
  };

  return {
    updatedProgress,
    streakIncremented,
    bonusPoints,
    unlockedLoyalBadge,
    message,
  };
}

export interface WeekDayStatus {
  dayName: string;
  dayNumber: number;
  dateString: string;
  isToday: boolean;
  isCompleted: boolean;
  isPast: boolean;
}

/**
 * Generates Monday-Sunday status for current week to show in streak calendar widget.
 */
export function getCurrentWeekStatus(historyDates: string[] = []): WeekDayStatus[] {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ...
  // Adjust to Monday as index 0:
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const weekStatus: WeekDayStatus[] = [];
  const todayStr = getTodayDateString();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateToYMD(d);

    const isToday = dateStr === todayStr;
    const isCompleted = historyDates.includes(dateStr);
    const isPast = d < now && !isToday;

    weekStatus.push({
      dayName: dayNames[i],
      dayNumber: d.getDate(),
      dateString: dateStr,
      isToday,
      isCompleted,
      isPast,
    });
  }

  return weekStatus;
}
