import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  isSupportedEducationLevel,
  isSupportedGradeLevel,
  LiteracyPassage,
  NumeracyQuestion,
  UserProgress,
} from '../types';
import { LITERACY_PASSAGES } from '../data/literacyData';
import { NUMERACY_QUESTIONS } from '../data/numeracyData';

export interface AdminPortalConfig {
  adminPin: string;
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
  adminPin: '123456',
  schoolName: 'SD Negeri Nusantara',
  teacherName: 'Guru Penggerak',
};

/**
 * Fetch literacy passages from Firebase Firestore.
 * Automatically seeds default curriculum passages if the database collection is empty.
 */
export async function fetchPassagesFromFirestore(): Promise<LiteracyPassage[]> {
  try {
    const colRef = collection(db, 'passages');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      // Seed default passages into Firebase
      await seedDefaultPassages();
      return LITERACY_PASSAGES;
    }

    const items: LiteracyPassage[] = [];
    snapshot.forEach((docSnap: any) => {
      items.push({ ...(docSnap.data() as LiteracyPassage), id: docSnap.id });
    });

    return items.filter((item) => isSupportedEducationLevel(item.level));
  } catch (error) {
    console.warn('Firestore fetchPassages error, fallback to local data:', error);
    return LITERACY_PASSAGES;
  }
}

/**
 * Save or update a literacy passage in Firestore.
 */
export async function savePassageToFirestore(passage: LiteracyPassage): Promise<void> {
  const docRef = doc(db, 'passages', passage.id);
  await setDoc(docRef, passage, { merge: true });
}

/**
 * Delete a literacy passage from Firestore.
 */
export async function deletePassageFromFirestore(passageId: string): Promise<void> {
  const docRef = doc(db, 'passages', passageId);
  await deleteDoc(docRef);
}

/**
 * Fetch numeracy questions from Firebase Firestore.
 * Automatically seeds default numeracy questions if collection is empty.
 */
export async function fetchNumeracyFromFirestore(): Promise<NumeracyQuestion[]> {
  try {
    const colRef = collection(db, 'questions');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      // Seed default numeracy into Firebase
      await seedDefaultNumeracy();
      return NUMERACY_QUESTIONS;
    }

    const items: NumeracyQuestion[] = [];
    snapshot.forEach((docSnap: any) => {
      items.push({ ...(docSnap.data() as NumeracyQuestion), id: docSnap.id });
    });

    return items.filter((item) => isSupportedEducationLevel(item.level));
  } catch (error) {
    console.warn('Firestore fetchNumeracy error, fallback to local data:', error);
    return NUMERACY_QUESTIONS;
  }
}

/**
 * Save or update a numeracy question in Firestore.
 */
export async function saveNumeracyToFirestore(question: NumeracyQuestion): Promise<void> {
  const docRef = doc(db, 'questions', question.id);
  await setDoc(docRef, question, { merge: true });
}

/**
 * Delete a numeracy question from Firestore.
 */
export async function deleteNumeracyFromFirestore(questionId: string): Promise<void> {
  const docRef = doc(db, 'questions', questionId);
  await deleteDoc(docRef);
}

/**
 * Seed all default literacy passages to Firestore.
 */
export async function seedDefaultPassages(): Promise<void> {
  try {
    const batch = writeBatch(db);
    LITERACY_PASSAGES.forEach((item) => {
      const docRef = doc(db, 'passages', item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to seed default passages:', err);
  }
}

/**
 * Seed all default numeracy questions to Firestore.
 */
export async function seedDefaultNumeracy(): Promise<void> {
  try {
    const batch = writeBatch(db);
    NUMERACY_QUESTIONS.forEach((item) => {
      const docRef = doc(db, 'questions', item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to seed default numeracy:', err);
  }
}

/**
 * Seed specifically Fase C (Kelas 5 - 6 SD) passages and numeracy questions to Firestore.
 */
export async function seedFaseCContentToFirestore(): Promise<{ passagesCount: number; numeracyCount: number }> {
  try {
    const batch = writeBatch(db);
    const faseCPassages = LITERACY_PASSAGES.filter((p) => p.level === 'fase-c');
    const faseCNumeracy = NUMERACY_QUESTIONS.filter((q) => q.level === 'fase-c');

    faseCPassages.forEach((item) => {
      const docRef = doc(db, 'passages', item.id);
      batch.set(docRef, item, { merge: true });
    });

    faseCNumeracy.forEach((item) => {
      const docRef = doc(db, 'questions', item.id);
      batch.set(docRef, item, { merge: true });
    });

    await batch.commit();
    return { passagesCount: faseCPassages.length, numeracyCount: faseCNumeracy.length };
  } catch (err) {
    console.warn('Failed to seed Fase C content to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch admin credentials and portal settings.
 */
export async function fetchAdminPortalConfig(): Promise<AdminPortalConfig> {
  try {
    const docRef = doc(db, 'admin_settings', 'config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_ADMIN_CONFIG, ...snap.data() } as AdminPortalConfig;
    }
    // Set initial config
    await setDoc(docRef, DEFAULT_ADMIN_CONFIG);
    return DEFAULT_ADMIN_CONFIG;
  } catch (error) {
    console.warn('Failed to fetch admin portal config, using default:', error);
    return DEFAULT_ADMIN_CONFIG;
  }
}

/**
 * Save admin credentials and portal settings.
 */
export async function saveAdminPortalConfig(config: AdminPortalConfig): Promise<void> {
  const docRef = doc(db, 'admin_settings', 'config');
  await setDoc(docRef, config, { merge: true });
}

/**
 * Fetch all student user profiles from Firestore.
 * Automatically seeds demo students if collection is empty.
 */
export async function fetchAllUsersFromFirestore(): Promise<UserProgress[]> {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      await seedDemoStudentsToFirestore();
      return INITIAL_DEMO_STUDENTS;
    }

    const items: UserProgress[] = [];
    snapshot.forEach((docSnap: any) => {
      items.push({ ...(docSnap.data() as UserProgress), id: docSnap.id });
    });

    return items.filter((item) => isSupportedGradeLevel(item.gradeLevel));
  } catch (error) {
    console.warn('Firestore fetchAllUsers error, fallback to demo data:', error);
    return INITIAL_DEMO_STUDENTS;
  }
}

/**
 * Save or update student profile in Firestore.
 */
export async function saveUserToFirestore(user: UserProgress): Promise<string> {
  const userId =
    user.id ||
    `student-${user.studentName.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
  const docRef = doc(db, 'users', userId);
  const dataToSave = {
    ...user,
    id: userId,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, dataToSave, { merge: true });
  return userId;
}

/**
 * Delete a student profile from Firestore.
 */
export async function deleteUserFromFirestore(userId: string, studentName?: string): Promise<void> {
  try {
    if (userId) {
      const docRef = doc(db, 'users', userId);
      await deleteDoc(docRef);
    }
    if (studentName) {
      const slug = `student-${studentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      if (slug !== userId) {
        try {
          await deleteDoc(doc(db, 'users', slug));
        } catch {
          // Ignore if slug doc does not exist
        }
      }
    }
  } catch (error) {
    console.warn('Error deleting user from Firestore:', error);
    throw error;
  }
}

/**
 * Seed initial demo classroom students to Firestore.
 */
export async function seedDemoStudentsToFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    INITIAL_DEMO_STUDENTS.forEach((student) => {
      const docRef = doc(db, 'users', student.id!);
      batch.set(docRef, student, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to seed demo students to Firestore:', err);
  }
}
