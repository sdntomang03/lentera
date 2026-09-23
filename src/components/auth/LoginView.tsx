import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProgress, AuthSession, SUPPORTED_GRADE_LEVEL_OPTIONS } from '../../types';
import {
  fetchAllUsersFromFirestore,
  saveUserToFirestore,
  fetchAdminPortalConfig,
  AdminPortalConfig,
  seedDemoStudentsToFirestore,
} from '../../services/contentService';
import { soundFx } from '../../utils/audio';
import { getTodayDateString } from '../../utils/streak';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession, progressData?: UserProgress) => void;
  onOpenAdminDirect?: () => void;
}

const AVATAR_LIST = ['👦', '👧', '🧑', '🎒', '🦉', '🦊', '🚀', '⭐', '📚', '🎨', '🌟', '🦁'];

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenAdminDirect,
}) => {
  const [roleTab, setRoleTab] = useState<'student' | 'teacher'>('student');
  const [studentMode, setStudentMode] = useState<'select' | 'register'>('select');

  // Firestore students data
  const [students, setStudents] = useState<UserProgress[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  // Admin / Teacher config & login
  const [adminConfig, setAdminConfig] = useState<AdminPortalConfig>({
    adminPin: '123456',
    schoolName: 'SD Negeri Nusantara',
    teacherName: 'Guru Penggerak',
  });
  const [teacherPinInput, setTeacherPinInput] = useState<string>('');
  const [teacherNameInput, setTeacherNameInput] = useState<string>('');
  const [teacherPinError, setTeacherPinError] = useState<string>('');

  // New student registration form
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newSchool, setNewSchool] = useState<string>('');
  const [newGradeLevel, setNewGradeLevel] = useState<string>('Fase B (Kelas 3-4 SD)');
  const [newAvatar, setNewAvatar] = useState<string>('👦');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');

  // Load students and admin config on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingStudents(true);
    try {
      const [uData, cfg] = await Promise.all([
        fetchAllUsersFromFirestore(),
        fetchAdminPortalConfig(),
      ]);
      setStudents(uData || []);
      setAdminConfig(cfg);
      setNewSchool(cfg.schoolName || 'SD Negeri Nusantara');
      setTeacherNameInput(cfg.teacherName || 'Bapak/Ibu Guru');
    } catch (err) {
      console.warn('Failed to load login initial data from Firestore:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // --- STUDENT: SELECT EXISTING ACCOUNT ---
  const handleSelectStudent = (student: UserProgress) => {
    soundFx.playCorrect();
    confetti({ particleCount: 40, spread: 60 });

    const session: AuthSession = {
      role: 'student',
      studentName: student.studentName,
      school: student.school || adminConfig.schoolName,
      gradeLevel: student.gradeLevel || 'Fase B (Kelas 3-4 SD)',
      avatar: student.avatar || '👦',
      id: student.id,
      loginTime: new Date().toISOString(),
    };

    onLoginSuccess(session, student);
  };

  // --- STUDENT: REGISTER NEW ACCOUNT ---
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      setRegisterError('Silakan masukkan nama lengkap siswa.');
      soundFx.playWrong();
      return;
    }

    setRegisterError('');
    setIsRegistering(true);
    soundFx.playClick();

    const todayStr = getTodayDateString();
    const newId = `student-${Date.now()}`;

    const newStudent: UserProgress = {
      id: newId,
      studentName: newStudentName.trim(),
      school: newSchool.trim() || adminConfig.schoolName,
      gradeLevel: newGradeLevel,
      avatar: newAvatar,
      completedPassages: [],
      completedNumeracy: [],
      quizScores: {},
      earnedBadges: ['badge-first-read'],
      totalPoints: 120,
      streakCount: 1,
      longestStreak: 1,
      streakBonusPointsEarned: 20,
      activityHistoryDates: [todayStr],
      lastActiveDate: todayStr,
      dailyChallenge: {
        date: todayStr,
        literacyCompleted: false,
        numeracyCompleted: false,
        bonusPointsEarned: 0,
        allCompleted: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserToFirestore(newStudent);
      soundFx.playFanfare();
      confetti({ particleCount: 80, spread: 80 });

      const session: AuthSession = {
        role: 'student',
        studentName: newStudent.studentName,
        school: newStudent.school || adminConfig.schoolName,
        gradeLevel: newStudent.gradeLevel,
        avatar: newStudent.avatar || '👦',
        id: newStudent.id,
        loginTime: new Date().toISOString(),
      };

      onLoginSuccess(session, newStudent);
    } catch (err) {
      console.error('Failed to register student to Firestore:', err);
      setRegisterError('Terjadi kendala saat menyimpan akun ke database.');
    } finally {
      setIsRegistering(false);
    }
  };

  // --- TEACHER: LOGIN VIA PIN ---
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherPinInput.trim() === adminConfig.adminPin.trim()) {
      soundFx.playFanfare();
      confetti({ particleCount: 60, spread: 70 });

      const session: AuthSession = {
        role: 'teacher',
        studentName: teacherNameInput.trim() || adminConfig.teacherName,
        school: adminConfig.schoolName,
        gradeLevel: 'Pengampu / Guru',
        avatar: '👨‍🏫',
        loginTime: new Date().toISOString(),
      };

      onLoginSuccess(session);
    } else {
      soundFx.playWrong();
      setTeacherPinError('PIN salah! Silakan coba lagi (Default PIN: 123456).');
    }
  };

  // Seed sample demo students if list is empty
  const handleLoadSampleStudents = async () => {
    setIsLoadingStudents(true);
    soundFx.playClick();
    try {
      await seedDemoStudentsToFirestore();
      const uData = await fetchAllUsersFromFirestore();
      setStudents(uData);
      soundFx.playCorrect();
    } catch (err) {
      console.warn('Could not seed sample students:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      (s.school && s.school.toLowerCase().includes(searchStudentQuery.toLowerCase())) ||
      (s.gradeLevel && s.gradeLevel.toLowerCase().includes(searchStudentQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col justify-between text-slate-100 relative overflow-x-hidden selection:bg-teal-500 selection:text-white">
      {/* Decorative Background Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full border-b border-white/10 px-4 sm:px-8 py-4 backdrop-blur-md bg-slate-900/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-xl shadow-lg shadow-teal-900/40">
            🏮
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Lentera
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-200 border border-teal-700/50">
                AKM & Kurikulum Merdeka
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Media Pembelajaran Literasi & Numerasi Terpadu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Firebase Firestore Aktif</span>
          <span className="sm:hidden">Online</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Card Hero Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-bold">
                <span>✨</span> Selamat Datang di Portal Pembelajaran
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Silakan Masuk Terlebih Dahulu
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/90 max-w-lg leading-relaxed">
                Pilih akun Anda untuk melanjutkan petualangan membaca teks inspiratif, menyelesaikan tantangan numerasi, dan mengumpulkan bintang prestasi!
              </p>
            </div>

            {/* Floating Background Icons */}
            <div className="absolute right-4 -bottom-4 text-7xl opacity-15 pointer-events-none select-none">
              📚🧮
            </div>
          </div>

          {/* Role Navigation Switcher (Siswa vs Guru) */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setRoleTab('student');
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === 'student'
                  ? 'bg-white text-teal-950 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">🎒</span>
              <span>Masuk Siswa (Murid)</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setRoleTab('teacher');
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === 'teacher'
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">👨‍🏫</span>
              <span>Masuk Guru / Admin</span>
            </button>
          </div>

          {/* BODY: STUDENT TAB */}
          {roleTab === 'student' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Student Sub-modes: Select existing vs Register new */}
              <div className="flex items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-md mx-auto">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setStudentMode('select');
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    studentMode === 'select'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔍 Pilih Akun Terdaftar
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setStudentMode('register');
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    studentMode === 'register'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ➕ Daftar Siswa Baru
                </button>
              </div>

              {/* MODE 1: SELECT EXISTING STUDENT */}
              {studentMode === 'select' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Cari nama Anda atau kelas..."
                        value={searchStudentQuery}
                        onChange={(e) => setSearchStudentQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                      <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
                    </div>

                    <div className="text-xs text-slate-500 shrink-0 text-right">
                      {filteredStudents.length} siswa ditemukan
                    </div>
                  </div>

                  {isLoadingStudents ? (
                    <div className="py-16 text-center text-slate-400 space-y-3">
                      <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs">Memuat daftar siswa dari Firebase...</p>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id || student.studentName}
                          onClick={() => handleSelectStudent(student)}
                          className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 bg-white text-left flex items-center justify-between gap-3 transition-all hover:shadow-md cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                              {student.avatar || '👦'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-teal-900 truncate">
                                {student.studentName}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {student.gradeLevel || 'Fase B'} · {student.school || adminConfig.schoolName}
                              </p>
                              <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                                <span className="text-amber-600 font-bold">⭐ {student.totalPoints}</span>
                                <span className="text-orange-600 font-bold">🔥 {student.streakCount || 1}h</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-slate-300 group-hover:text-teal-600 text-lg font-bold shrink-0">
                            ➔
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                      <p className="text-xs text-slate-600">
                        {searchStudentQuery
                          ? 'Tidak ada siswa yang cocok dengan kata kunci pencarian.'
                          : 'Belum ada daftar siswa di database.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => setStudentMode('register')}
                          className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          + Daftar Sebagai Siswa Baru
                        </button>
                        {students.length === 0 && (
                          <button
                            onClick={handleLoadSampleStudents}
                            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            📥 Muat Siswa Contoh Kelas
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200/60 text-[11px] text-teal-950 flex items-start gap-2.5">
                    <span className="text-base shrink-0">💡</span>
                    <p className="leading-relaxed">
                      Klik pada kartu nama Anda untuk masuk. Seluruh nilai kuis, poin bintang, dan rekor streak Anda tersimpan aman di cloud database Firebase!
                    </p>
                  </div>
                </div>
              )}

              {/* MODE 2: REGISTER NEW STUDENT */}
              {studentMode === 'register' && (
                <form onSubmit={handleRegisterStudent} className="space-y-4">
                  {registerError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                      ⚠️ {registerError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Siswa: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Muhammad Farhan Pratama"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Jenjang / Fase:
                      </label>
                      <select
                        value={newGradeLevel}
                        onChange={(e) => setNewGradeLevel(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                      >
                        {SUPPORTED_GRADE_LEVEL_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Asal Sekolah / Madrasah:
                      </label>
                      <input
                        type="text"
                        value={newSchool}
                        onChange={(e) => setNewSchool(e.target.value)}
                        placeholder="Nama sekolah"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Pilih Karakter Avatar Anda:
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {AVATAR_LIST.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setNewAvatar(av);
                          }}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                            newAvatar === av
                              ? 'bg-teal-800 text-white scale-110 shadow-md ring-2 ring-teal-600'
                              : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-3.5 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm transition-all shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isRegistering ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mendaftarkan ke Firebase...</span>
                        </>
                      ) : (
                        <>
                          <span>Mulai Belajar & Kumpulkan Bintang ➔</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* BODY: TEACHER TAB */}
          {roleTab === 'teacher' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                  👨‍🏫
                </div>
                <h3 className="text-lg font-black text-slate-900">Portal Akses Guru & Pengampu</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Masuk sebagai guru untuk mengelola bacaan literasi, soal numerasi, melihat statistik seluruh siswa, dan mengekspor rekap nilai.
                </p>
              </div>

              <form onSubmit={handleTeacherLogin} className="space-y-4 max-w-md mx-auto">
                {teacherPinError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    ⚠️ {teacherPinError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Guru Pengampu:
                  </label>
                  <input
                    type="text"
                    value={teacherNameInput}
                    onChange={(e) => setTeacherNameInput(e.target.value)}
                    placeholder="Nama Bapak/Ibu Guru"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Masukkan PIN Guru:
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={teacherPinInput}
                    onChange={(e) => setTeacherPinInput(e.target.value)}
                    placeholder="PIN 6 digit (Default: 123456)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    autoFocus
                  />
                </div>

                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/70 text-[11px] text-indigo-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🔐</span> Informasi Keamanan:
                  </div>
                  <p>
                    PIN bawaan sistem adalah <strong className="font-mono bg-indigo-100 px-1 py-0.5 rounded">123456</strong>. Anda dapat mengubah PIN di menu Pengaturan setelah masuk.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm transition-all shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Masuk Sebagai Guru ➔</span>
                </button>

                {onOpenAdminDirect && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        onOpenAdminDirect();
                      }}
                      className="text-xs text-indigo-700 hover:underline font-bold cursor-pointer"
                    >
                      Buka Panel Admin Pengelolaan Konten Langsung ⚙️
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Card Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>© Lentera Indonesia · Literasi & Numerasi Berkelanjutan</span>
            <span className="font-semibold text-slate-600">Standar Asesmen Nasional (ANBK)</span>
          </div>
        </div>
      </main>

      {/* Page Bottom Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-white/5 z-10">
        <p>Aplikasi Media Pembelajaran Interaktif Lentera · Didukung oleh Firebase Firestore</p>
      </footer>
    </div>
  );
};
