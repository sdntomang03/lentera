import { LiteracyPassage, NumeracyQuestion, UserProgress } from '../types';
import { LITERACY_PASSAGES } from '../data/literacyData';
import { NUMERACY_QUESTIONS } from '../data/numeracyData';
import { apiRequest, ApiError } from './apiClient';

export interface AdminPortalConfig {
  schoolName: string;
  teacherName: string;
}

export const INITIAL_DEMO_STUDENTS: UserProgress[] = [
  {
    id: 'user-budi-pratama',
    studentName: 'Budi Pratama',
    school: 'SD Negeri Nusantara 01',
    gradeLevel: 'Kelas 4 (Fase B)',
    avatar: '👦',
    completedPassages: ['lit-001', 'lit-002'],
    completedNumeracy: ['num-001', 'num-002', 'num-004'],
    quizScores: {
      'lit-001': { score: 3, total: 3, date: '2026-09-21', title: 'Kancil dan Buaya', category: 'literasi' },
      'num-001': { score: 1, total: 1, date: '2026-09-22', title: 'Pasar Tradisional', category: 'numerasi' },
    },
    earnedBadges: ['badge-first-read', 'badge-math-starter', 'badge-streak-master'],
    totalPoints: 240,
    streakCount: 3,
    longestStreak: 5,
    streakBonusPointsEarned: 40,
    activityHistoryDates: ['2026-09-20', '2026-09-21', '2026-09-22'],
    lastActiveDate: '2026-09-22',
  },
  {
    id: 'user-siti-rahmawati',
    studentName: 'Siti Rahmawati',
    school: 'SD Negeri Nusantara 01',
    gradeLevel: 'Kelas 5 (Fase C)',
    avatar: '👧',
    completedPassages: ['lit-001', 'lit-002', 'lit-003'],
    completedNumeracy: ['num-001', 'num-003'],
    quizScores: {
      'lit-003': { score: 4, total: 4, date: '2026-09-22', title: 'Ekosistem Terumbu Karang', category: 'literasi' },
    },
    earnedBadges: ['badge-first-read', 'badge-vocab-guru'],
    totalPoints: 310,
    streakCount: 5,
    longestStreak: 7,
    streakBonusPointsEarned: 60,
    activityHistoryDates: ['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'],
    lastActiveDate: '2026-09-22',
  },
  {
    id: 'user-kevin-wijaya',
    studentName: 'Kevin Wijaya',
    school: 'SD Harapan Bangsa',
    gradeLevel: 'Kelas 4 (Fase B)',
    avatar: '🧑',
    completedPassages: ['lit-001'],
    completedNumeracy: ['num-001', 'num-002', 'num-003', 'num-004', 'num-005'],
    quizScores: {
      'num-002': { score: 1, total: 1, date: '2026-09-22', title: 'Luas Kebun Sayur', category: 'numerasi' },
    },
    earnedBadges: ['badge-math-starter', 'badge-speed-demon'],
    totalPoints: 290,
    streakCount: 2,
    longestStreak: 4,
    streakBonusPointsEarned: 20,
    activityHistoryDates: ['2026-09-21', '2026-09-22'],
    lastActiveDate: '2026-09-22',
  },
];

const DEFAULT_ADMIN_CONFIG: AdminPortalConfig = {
  schoolName: 'SD Negeri Nusantara',
  teacherName: 'Guru Penggerak',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLiteracyPassage(value: unknown): value is LiteracyPassage {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.title === 'string'
    && ['fase-a', 'fase-b', 'fase-c'].includes(String(value.level))
    && typeof value.levelLabel === 'string'
    && typeof value.genre === 'string'
    && typeof value.genreLabel === 'string'
    && typeof value.summary === 'string'
    && typeof value.estimatedReadTimeMinutes === 'number'
    && typeof value.wordCount === 'number'
    && typeof value.authorOrSource === 'string'
    && Array.isArray(value.paragraphs)
    && value.paragraphs.every((paragraph) => typeof paragraph === 'string')
    && Array.isArray(value.vocabulary)
    && value.vocabulary.every((item) => isRecord(item) && typeof item.word === 'string')
    && Array.isArray(value.questions)
    && value.questions.every((question) => {
      if (!isRecord(question)
        || typeof question.id !== 'string'
        || typeof question.question !== 'string'
        || typeof question.type !== 'string'
        || typeof question.explanation !== 'string'
        || typeof question.cognitiveLevel !== 'string'
        || !['single-choice', 'multiple-choice', 'true-false', 'sequencing', 'short-answer'].includes(question.type)
        || !(
          typeof question.correctAnswers === 'string'
          || typeof question.correctAnswers === 'number'
          || typeof question.correctAnswers === 'boolean'
          || Array.isArray(question.correctAnswers)
        )) return false;
      if (
        (question.type === 'single-choice' || question.type === 'multiple-choice')
        && (!Array.isArray(question.options)
          || !question.options.every((option) => typeof option === 'string'))
      ) return false;
      if (question.type === 'sequencing' && !Array.isArray(question.sequenceItems)) return false;
      return true;
    })
  );
}

function isNumeracyQuestion(value: unknown): value is NumeracyQuestion {
  if (!isRecord(value) || !isRecord(value.stimulus)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.title === 'string'
    && ['fase-a', 'fase-b', 'fase-c'].includes(String(value.level))
    && typeof value.domain === 'string'
    && typeof value.levelLabel === 'string'
    && typeof value.domainLabel === 'string'
    && typeof value.context === 'string'
    && typeof value.contextLabel === 'string'
    && typeof value.question === 'string'
    && ['single-choice', 'multiple-choice', 'matching', 'numeric', 'true-false'].includes(String(value.type))
    && Object.prototype.hasOwnProperty.call(value, 'correctAnswer')
    && typeof value.cognitiveLevel === 'string'
    && typeof value.hint === 'string'
    && typeof value.stimulus.text === 'string'
    && Array.isArray(value.stepByStepSolution)
  );
}

async function saveContent(
  type: 'passages' | 'questions',
  id: string,
  data: LiteracyPassage | NumeracyQuestion,
): Promise<void> {
  const path = `/content/${type}/${encodeURIComponent(id)}`;
  try {
    await apiRequest(path, { method: 'PUT', body: JSON.stringify({ data }) });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    await apiRequest(`/content/${type}`, { method: 'POST', body: JSON.stringify({ data }) });
  }
}

export async function fetchPassagesFromApi(): Promise<LiteracyPassage[]> {
  const response = await apiRequest<{ data: unknown }>('/content/passages');
  if (!Array.isArray(response.data)) throw new Error('Respons API bacaan tidak valid.');
  const passages = response.data.filter(isLiteracyPassage);
  if (passages.length !== response.data.length) {
    console.warn('Some malformed literacy content from the Database was ignored.');
  }
  return passages;
}

export async function savePassageToApi(passage: LiteracyPassage): Promise<void> {
  await saveContent('passages', passage.id, passage);
}

export async function deletePassageFromApi(passageId: string): Promise<void> {
  await apiRequest(`/content/passages/${encodeURIComponent(passageId)}`, { method: 'DELETE' });
}

export async function fetchNumeracyFromApi(): Promise<NumeracyQuestion[]> {
  const response = await apiRequest<{ data: unknown }>('/content/questions');
  if (!Array.isArray(response.data)) throw new Error('Respons API numerasi tidak valid.');
  const questions = response.data.filter(isNumeracyQuestion);
  if (questions.length !== response.data.length) {
    console.warn('Some malformed numeracy content from the Database was ignored.');
  }
  return questions;
}

export async function saveNumeracyToApi(question: NumeracyQuestion): Promise<void> {
  await saveContent('questions', question.id, question);
}

export async function deleteNumeracyFromApi(questionId: string): Promise<void> {
  await apiRequest(`/content/questions/${encodeURIComponent(questionId)}`, { method: 'DELETE' });
}

export async function seedDefaultPassages(): Promise<void> {
  await Promise.all(LITERACY_PASSAGES.map((item) => savePassageToApi(item)));
}

export async function seedDefaultNumeracy(): Promise<void> {
  await Promise.all(NUMERACY_QUESTIONS.map((item) => saveNumeracyToApi(item)));
}

export async function seedFaseCContentToApi(): Promise<{ passagesCount: number; numeracyCount: number }> {
  const passages = LITERACY_PASSAGES.filter((item) => item.level === 'fase-c');
  const questions = NUMERACY_QUESTIONS.filter((item) => item.level === 'fase-c');
  await Promise.all([
    ...passages.map((item) => savePassageToApi(item)),
    ...questions.map((item) => saveNumeracyToApi(item)),
  ]);
  return { passagesCount: passages.length, numeracyCount: questions.length };
}

export async function fetchAdminPortalConfig(): Promise<AdminPortalConfig> {
  const response = await apiRequest<{ data: AdminPortalConfig }>('/settings');
  return { ...DEFAULT_ADMIN_CONFIG, ...response.data };
}

export async function saveAdminPortalConfig(config: AdminPortalConfig): Promise<void> {
  await apiRequest('/settings', { method: 'PUT', body: JSON.stringify(config) });
}

export async function fetchAllUsersFromApi(): Promise<UserProgress[]> {
  const response = await apiRequest<{ data: unknown }>('/admin/students');
  if (!Array.isArray(response.data)) throw new Error('Respons API daftar siswa tidak valid.');
  return response.data;
}

export async function saveUserToApi(user: UserProgress): Promise<string> {
  const session = typeof window === 'undefined'
    ? null
    : JSON.parse(window.localStorage.getItem('lentera_auth_session_v1') || 'null') as
        { role?: string; id?: string } | null;
  if (session?.role === 'student' && user.id && user.id === session.id) {
    await apiRequest('/me/progress', { method: 'PUT', body: JSON.stringify({ progress: user }) });
    return user.id;
  }
  if (session?.role === 'teacher' && user.id) {
    await apiRequest(`/admin/students/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        studentName: user.studentName,
        username: user.username,
        school: user.school,
        gradeLevel: user.gradeLevel,
        avatar: user.avatar,
        progress: user,
      }),
    });
    return user.id;
  }
  throw new Error('Tidak memiliki sesi yang berhak menyimpan progres siswa ini.');
}

export async function createStudentFromAdmin(
  user: UserProgress,
  password: string,
): Promise<string> {
  if (!user.username) throw new Error('Username siswa wajib diisi.');
  const response = await apiRequest<{ data: { id: string } }>('/admin/students', {
    method: 'POST',
    body: JSON.stringify({
      studentName: user.studentName,
      username: user.username,
      school: user.school,
      gradeLevel: user.gradeLevel,
      avatar: user.avatar,
      password,
      progress: user,
    }),
  });
  return response.data.id;
}

export async function deleteUserFromApi(userId: string, _studentName?: string): Promise<void> {
  await apiRequest(`/admin/students/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}
