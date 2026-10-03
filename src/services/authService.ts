import { AuthSession, UserProgress } from '../types';
import { apiRequest } from './apiClient';

interface ApiUser {
  id: string;
  username: string;
  role: AuthSession['role'];
  studentName: string;
  school: string | null;
  schoolId: number | null;
  schoolCode: string | null;
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
    schoolId: user.schoolId || undefined,
    schoolCode: user.schoolCode || undefined,
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

export async function updateTeacherName(name: string): Promise<string> {
  const response = await apiRequest<{ data: { name: string } }>('/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
  return response.data.name;
}

export async function registerStudent(data: {
  studentName: string;
  username: string;
  teacherUsername: string;
  schoolCode: string;
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

export async function lookupSchool(code: string): Promise<{ id: number; name: string; code: string }> {
  const response = await apiRequest<{ data: { id: number; name: string; code: string } }>(
    `/schools/lookup/${encodeURIComponent(code.trim().toUpperCase())}`,
  );
  return response.data;
}

export interface PlatformSchool {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  users_count?: number;
  student_count?: number;
  teacher_count?: number;
}

export interface PlatformFcmDevice {
  id: number;
  deviceId: string;
  username: string | null;
  token: string;
  platform: 'android' | 'ios';
  updatedAt: string;
}

export interface PlatformFcmDevicePage {
  data: PlatformFcmDevice[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface SchoolTeacherAccount {
  id: string;
  teacherName: string;
  username: string;
  school: string;
}

export async function fetchSchoolTeachers(): Promise<SchoolTeacherAccount[]> {
  const response = await apiRequest<{ data: SchoolTeacherAccount[] }>('/admin/teachers');
  return response.data;
}

export async function createSchoolTeacher(data: {
  teacherName: string;
  username: string;
  password: string;
}): Promise<SchoolTeacherAccount> {
  const response = await apiRequest<{ data: SchoolTeacherAccount }>('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function fetchPlatformSchools(): Promise<PlatformSchool[]> {
  const response = await apiRequest<{ data: PlatformSchool[] }>('/platform/schools');
  return response.data;
}

export async function fetchPlatformFcmDevices(page = 1): Promise<PlatformFcmDevicePage> {
  return apiRequest<PlatformFcmDevicePage>(`/platform/fcm-devices?page=${page}`);
}

export async function createPlatformSchool(data: {
  name: string;
  teacherName: string;
  username: string;
  password: string;
}): Promise<{ school: PlatformSchool; teacher: { id: number; name: string; username: string } }> {
  const response = await apiRequest<{ data: { school: PlatformSchool; teacher: { id: number; name: string; username: string } } }>('/platform/schools', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updatePlatformSchool(schoolId: number, data: { is_active: boolean }): Promise<PlatformSchool> {
  const response = await apiRequest<{ data: PlatformSchool }>(`/platform/schools/${schoolId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST' });
}
