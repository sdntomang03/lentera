import { AuthSession, UserProgress } from '../types';
import { apiRequest } from './apiClient';

interface ApiUser {
  id: string;
  username: string;
  role: AuthSession['role'];
  studentName: string;
  school: string | null;
  gradeLevel: string | null;
  avatar: string | null;
  progress: Partial<UserProgress>;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

function toAuthResult(response: AuthResponse): {
  session: AuthSession;
  progress?: UserProgress;
} {
  const { user } = response;
  const session: AuthSession = {
    role: user.role,
    studentName: user.studentName,
    username: user.username,
    school: user.school || '',
    gradeLevel: user.gradeLevel || undefined,
    avatar: user.avatar || (user.role === 'teacher' ? '👨‍🏫' : '👦'),
    id: user.id,
    token: response.token,
    loginTime: new Date().toISOString(),
  };

  if (user.role !== 'student') return { session };

  return {
    session,
    progress: {
      ...user.progress,
      id: user.id,
      studentName: user.studentName,
      username: user.username,
      school: user.school || undefined,
      gradeLevel: user.gradeLevel || undefined,
      avatar: user.avatar || undefined,
      completedPassages: user.progress.completedPassages || [],
      completedNumeracy: user.progress.completedNumeracy || [],
      quizScores: user.progress.quizScores || {},
      earnedBadges: user.progress.earnedBadges || [],
      totalPoints: user.progress.totalPoints || 0,
      streakCount: user.progress.streakCount || 0,
      longestStreak: user.progress.longestStreak || 0,
    },
  };
}

export async function login(username: string, password: string, role: AuthSession['role']) {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
  return toAuthResult(response);
}

export async function registerStudent(data: {
  studentName: string;
  username: string;
  school: string;
  gradeLevel: string;
  avatar: string;
  password: string;
  progress: UserProgress;
}) {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return toAuthResult(response);
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST' });
}
