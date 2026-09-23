import { UserProgress, DailyChallengeState } from '../types';
import { getTodayDateString } from './streak';

export const CHALLENGE_TIME_LIMIT_SECONDS = 300; // 5 minutes (300 seconds)
export const SINGLE_CHALLENGE_BONUS = 40; // points for doing literacy OR numeracy < 5 mins
export const COMBO_CHALLENGE_BONUS = 60; // extra points for completing BOTH in under 5 mins

export function formatSecondsToMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function getInitialDailyChallenge(): DailyChallengeState {
  return {
    date: getTodayDateString(),
    literacyCompleted: false,
    numeracyCompleted: false,
    bonusPointsEarned: 0,
    allCompleted: false,
  };
}

export function getCurrentDailyChallenge(progress: UserProgress): DailyChallengeState {
  const today = getTodayDateString();
  if (!progress.dailyChallenge || progress.dailyChallenge.date !== today) {
    return getInitialDailyChallenge();
  }
  return progress.dailyChallenge;
}

export interface ChallengeResult {
  updatedProgress: UserProgress;
  isSpeedSuccess: boolean;
  isAllCompletedNow: boolean;
  bonusPoints: number;
  unlockedBadge: boolean;
  elapsedSeconds: number;
  message: string;
}

/**
 * Evaluates completion of literacy or numeracy within the 5-minute limit.
 */
export function recordDailyChallengeCompletion(
  progress: UserProgress,
  activityType: 'literasi' | 'numerasi',
  elapsedSeconds: number
): ChallengeResult {
  const today = getTodayDateString();
  const currentChallenge = getCurrentDailyChallenge(progress);

  const isSpeedSuccess = elapsedSeconds <= CHALLENGE_TIME_LIMIT_SECONDS;
  let bonusPoints = 0;
  let unlockedBadge = false;
  let isAllCompletedNow = false;
  let message = '';

  const timeFormatted = formatSecondsToMinutes(elapsedSeconds);

  const updatedChallenge: DailyChallengeState = {
    ...currentChallenge,
    date: today,
  };

  const newBadges = [...(progress.earnedBadges || [])];

  if (activityType === 'literasi') {
    const wasAlreadyDone = updatedChallenge.literacyCompleted;
    if (isSpeedSuccess && !wasAlreadyDone) {
      updatedChallenge.literacyCompleted = true;
      updatedChallenge.literacyTimeSeconds = elapsedSeconds;
      bonusPoints += SINGLE_CHALLENGE_BONUS;
      message = `⚡ Misi Literasi Kilat Sukses! Diselesaikan dalam ${timeFormatted} (Target: < 5:00). Bonus +${SINGLE_CHALLENGE_BONUS} poin!`;
    }
  } else if (activityType === 'numerasi') {
    const wasAlreadyDone = updatedChallenge.numeracyCompleted;
    if (isSpeedSuccess && !wasAlreadyDone) {
      updatedChallenge.numeracyCompleted = true;
      updatedChallenge.numeracyTimeSeconds = elapsedSeconds;
      bonusPoints += SINGLE_CHALLENGE_BONUS;
      message = `⚡ Misi Numerasi Kilat Sukses! Diselesaikan dalam ${timeFormatted} (Target: < 5:00). Bonus +${SINGLE_CHALLENGE_BONUS} poin!`;
    }
  }

  // Check if both are now completed
  if (
    updatedChallenge.literacyCompleted &&
    updatedChallenge.numeracyCompleted &&
    !updatedChallenge.allCompleted
  ) {
    updatedChallenge.allCompleted = true;
    bonusPoints += COMBO_CHALLENGE_BONUS;
    isAllCompletedNow = true;
    message = `🏆 COMBO TUNTAS! Kamu menyelesaikan tantangan Literasi & Numerasi kilat hari ini di bawah 5 menit! Bonus ekstra +${COMBO_CHALLENGE_BONUS} poin!`;
  }

  // Check badge unlock
  if (isSpeedSuccess && !newBadges.includes('badge-speed-challenger')) {
    newBadges.push('badge-speed-challenger');
    unlockedBadge = true;
  }

  updatedChallenge.bonusPointsEarned = (updatedChallenge.bonusPointsEarned || 0) + bonusPoints;

  const updatedProgress: UserProgress = {
    ...progress,
    totalPoints: progress.totalPoints + bonusPoints,
    earnedBadges: newBadges,
    dailyChallenge: updatedChallenge,
  };

  return {
    updatedProgress,
    isSpeedSuccess,
    isAllCompletedNow,
    bonusPoints,
    unlockedBadge,
    elapsedSeconds,
    message,
  };
}
