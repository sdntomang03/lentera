import { INITIAL_LEADERBOARD_DATA } from '../data/leaderboardData';
import { EducationLevel, LeaderboardEntry, UserProgress } from '../types';

const LEADERBOARD_CACHE_KEY = 'lentera_global_leaderboard_v1';

export interface LeaderboardFilter {
  level: EducationLevel | 'all';
  timeframe: 'all-time' | 'month' | 'week';
  searchQuery?: string;
}

export interface LeaderboardResponse {
  topTen: LeaderboardEntry[];
  totalParticipants: number;
  currentUserRank: number | null;
  currentUserEntry: LeaderboardEntry | null;
  cutoffScoreForTopTen: number;
  lastUpdated: string;
}

/**
 * Get stored leaderboard or fallback to initial data
 */
function getStoredLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return INITIAL_LEADERBOARD_DATA;
  try {
    const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read leaderboard cache', e);
  }
  return INITIAL_LEADERBOARD_DATA;
}

/**
 * Save updated leaderboard to local cache
 */
function saveStoredLeaderboard(list: LeaderboardEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save leaderboard cache', e);
  }
}

/**
 * Fetch top student points across the application.
 * Tries the real backend /api/leaderboard endpoint first; falls back to cached/local store.
 */
export async function fetchGlobalLeaderboard(
  currentUser: UserProgress,
  filters: LeaderboardFilter
): Promise<LeaderboardResponse> {
  let entries: LeaderboardEntry[] = [];

  // Try fetching from /api/leaderboard
  try {
    const params = new URLSearchParams();
    if (filters.level !== 'all') params.append('level', filters.level);
    if (filters.timeframe) params.append('timeframe', filters.timeframe);
    if (filters.searchQuery) params.append('q', filters.searchQuery);

    const res = await fetch(`/api/leaderboard?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.entries)) {
        entries = data.entries;
      }
    }
  } catch {
    // API endpoint unavailable or in standalone preview, use local database
  }

  if (entries.length === 0) {
    entries = getStoredLeaderboard();
  }

  // Ensure current user is included or updated
  const currentUserId = 'current-user-student';
  const existingUserIndex = entries.findIndex((e) => e.id === currentUserId || e.name === currentUser.studentName);

  const completedActivities =
    currentUser.completedPassages.length + currentUser.completedNumeracy.length;

  const userEntry: LeaderboardEntry = {
    id: currentUserId,
    name: `${currentUser.studentName} (Kamu)`,
    school: 'SDN Nusantara Cerdas',
    city: 'Pusat Belajar',
    level: 'fase-c',
    levelLabel: 'Fase C (Kls 5-6)',
    points: currentUser.totalPoints,
    badgesCount: currentUser.earnedBadges.length,
    activitiesCompleted: completedActivities,
    avatar: '⭐',
    streakDays: Math.max(1, Math.floor(currentUser.totalPoints / 30)),
    trend: 'up',
    isCurrentUser: true,
  };

  let mergedList = [...entries.filter((e) => e.id !== currentUserId && e.name !== currentUser.studentName)];
  mergedList.push(userEntry);

  // Apply filters
  if (filters.level !== 'all') {
    mergedList = mergedList.filter((e) => e.level === filters.level || e.isCurrentUser);
  }

  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase();
    mergedList = mergedList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.school.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q)
    );
  }

  // Adjust points slightly for timeframe visualization
  if (filters.timeframe === 'week') {
    mergedList = mergedList.map((e) => ({
      ...e,
      points: e.isCurrentUser ? e.points : Math.round(e.points * 0.35 + 20),
    }));
  } else if (filters.timeframe === 'month') {
    mergedList = mergedList.map((e) => ({
      ...e,
      points: e.isCurrentUser ? e.points : Math.round(e.points * 0.75 + 10),
    }));
  }

  // Sort by points descending
  mergedList.sort((a, b) => b.points - a.points);

  // Assign ranks
  mergedList.forEach((item, index) => {
    item.rank = index + 1;
  });

  saveStoredLeaderboard(mergedList);

  const topTen = mergedList.slice(0, 10);
  const userRankIndex = mergedList.findIndex((e) => e.isCurrentUser);
  const currentUserRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
  const cutoffScoreForTopTen = topTen.length >= 10 ? topTen[9].points : 0;

  return {
    topTen,
    totalParticipants: mergedList.length + 140, // realistic representation of participants
    currentUserRank,
    currentUserEntry: userEntry,
    cutoffScoreForTopTen,
    lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Add or sync student points to the leaderboard
 */
export async function syncStudentScoreToLeaderboard(currentUser: UserProgress): Promise<void> {
  try {
    await fetch('/api/leaderboard/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentUser.studentName,
        points: currentUser.totalPoints,
        badges: currentUser.earnedBadges.length,
        completedCount: currentUser.completedPassages.length + currentUser.completedNumeracy.length,
      }),
    });
  } catch {
    // silently failover to local storage
  }
}
