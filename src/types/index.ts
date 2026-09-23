export type EducationLevel = 'fase-a' | 'fase-b' | 'fase-c';

export const SUPPORTED_GRADE_LEVEL_OPTIONS = [
  'Fase A (Kelas 1-2 SD)',
  'Fase B (Kelas 3-4 SD)',
  'Fase C (Kelas 5-6 SD)',
] as const;

export const isSupportedEducationLevel = (level: unknown): level is EducationLevel =>
  level === 'fase-a' || level === 'fase-b' || level === 'fase-c';

export const isSupportedGradeLevel = (gradeLevel: string | undefined): boolean => {
  if (!gradeLevel) return true;

  const normalized = gradeLevel.toLowerCase();
  return (
    normalized.includes('fase a') ||
    normalized.includes('fase b') ||
    normalized.includes('fase c') ||
    /kelas\s*[1-6]\b/.test(normalized)
  );
};

export type LiteracyGenre = 'fabel' | 'informasi' | 'budaya' | 'sains' | 'puisi';

export interface VocabItem {
  word: string;
  meaning: string;
  example: string;
}

export interface LiteracyQuestion {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false' | 'sequencing' | 'short-answer';
  question: string;
  options?: string[]; // for single and multiple choice
  correctAnswers: string | string[] | boolean | number[]; // handles single, multiple choice or index order
  explanation: string;
  cognitiveLevel: 'Menemukan Informasi (L1)' | 'Memahami & Interpretasi (L2)' | 'Mengevaluasi & Merefleksi (L3)';
  sequenceItems?: string[]; // for sequencing questions
}

export interface LiteracyPassage {
  id: string;
  title: string;
  level: EducationLevel;
  levelLabel: string;
  genre: LiteracyGenre;
  genreLabel: string;
  estimatedReadTimeMinutes: number;
  wordCount: number;
  summary: string;
  paragraphs: string[];
  vocabulary: VocabItem[];
  questions: LiteracyQuestion[];
  moralOrTakeaway?: string;
  authorOrSource: string;
}

export type NumeracyDomain = 'bilangan' | 'geometri' | 'data' | 'aljabar';
export type NumeracyContext = 'personal' | 'sosial-budaya' | 'saintifik';

export interface NumeracyQuestion {
  id: string;
  title: string;
  level: EducationLevel;
  levelLabel: string;
  domain: NumeracyDomain;
  domainLabel: string;
  context: NumeracyContext;
  contextLabel: string;
  stimulus: {
    text: string;
    chartType?: 'bar' | 'pie' | 'grid' | 'table' | 'number-line';
    chartData?: any;
    imageDescription?: string;
  };
  type: 'single-choice' | 'multiple-choice' | 'matching' | 'numeric' | 'true-false';
  question: string;
  options?: string[];
  matchingPairs?: { left: string; right: string }[];
  correctAnswer: any; // string, string[], number, or boolean
  unit?: string;
  hint: string;
  stepByStepSolution: string[];
  cognitiveLevel: 'Pemahaman (Knowing)' | 'Penerapan (Applying)' | 'Penalaran (Reasoning)';
}

export interface UserProgress {
  id?: string; // Firestore document ID
  studentName: string;
  school?: string;
  gradeLevel?: string;
  avatar?: string;
  completedPassages: string[];
  completedNumeracy: string[];
  quizScores: {
    [key: string]: {
      score: number;
      total: number;
      date: string;
      title: string;
      category: 'literasi' | 'numerasi' | 'akm';
    };
  };
  earnedBadges: string[];
  totalPoints: number;
  readingSpeedRecord?: {
    wpm: number;
    comprehensionPercent: number;
    date: string;
  };
  // Daily Streak Tracking
  streakCount: number;
  lastActiveDate?: string; // YYYY-MM-DD
  longestStreak: number;
  streakBonusPointsEarned?: number;
  activityHistoryDates?: string[]; // list of active dates YYYY-MM-DD
  // Daily Speed Challenge (< 5 mins)
  dailyChallenge?: DailyChallengeState;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  literacyCompleted: boolean;
  literacyTimeSeconds?: number;
  numeracyCompleted: boolean;
  numeracyTimeSeconds?: number;
  bonusPointsEarned: number;
  allCompleted: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'literasi' | 'numerasi' | 'spesial';
}

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  name: string;
  school: string;
  city: string;
  level: EducationLevel;
  levelLabel: string;
  points: number;
  badgesCount: number;
  activitiesCompleted: number;
  avatar: string;
  streakDays: number;
  trend: 'up' | 'down' | 'same' | 'new';
  isCurrentUser?: boolean;
}

export type UserRole = 'student' | 'teacher';

export interface AuthSession {
  role: UserRole;
  studentName: string;
  school: string;
  gradeLevel?: string;
  avatar: string;
  id?: string;
  loginTime: string;
}
