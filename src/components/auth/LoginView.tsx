import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserProgress, AuthSession, SUPPORTED_GRADE_LEVEL_OPTIONS } from '../../types';
import { login, registerStudent, lookupSchool } from '../../services/authService';
import { soundFx } from '../../utils/audio';
import { getTodayDateString } from '../../utils/streak';
import { ENDZI_MASCOT_IMAGE } from '../../assets/mascot';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession, progressData?: UserProgress) => void;
}

const AVATAR_LIST = ['👦', '👧', '🧑', '🎒', '🦉', '🦊', '🚀', '⭐', '📚', '🎨', '🌟', '🦁'];

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
}) => {
  const [roleTab, setRoleTab] = useState<'student' | 'teacher' | 'platform-admin'>('student');
  const [studentMode, setStudentMode] = useState<'select' | 'register'>('select');

  const [studentUsername, setStudentUsername] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');
  const [studentLoginError, setStudentLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [teacherPinInput, setTeacherPinInput] = useState<string>('');
  const [teacherUsername, setTeacherUsername] = useState<string>('');
  const [teacherPinError, setTeacherPinError] = useState<string>('');
  const [isTeacherLoggingIn, setIsTeacherLoggingIn] = useState<boolean>(false);

  // New student registration form
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentUsername, setNewStudentUsername] = useState<string>('');
  const [newTeacherUsername, setNewTeacherUsername] = useState<string>('');
  const [newSchoolCode, setNewSchoolCode] = useState<string>('');
  const [newGradeLevel, setNewGradeLevel] = useState<string>('Fase B (Kelas 3-4 SD)');
  const [newAvatar, setNewAvatar] = useState<string>('👦');
  const [newStudentPassword, setNewStudentPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setStudentLoginError('');
    try {
      const result = await login(studentUsername.trim(), studentPassword, 'student');
      if (result.session.role !== 'student' || !result.progress) {
        throw new Error('Akun ini bukan akun siswa.');
      }
      setStudentLoginError('');
      soundFx.playCorrect();
      confetti({ particleCount: 40, spread: 60 });
      onLoginSuccess(result.session, result.progress);
    } catch (error) {
      setStudentLoginError(error instanceof Error ? error.message : 'Gagal masuk ke API.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- STUDENT: REGISTER NEW ACCOUNT ---
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      setRegisterError('Silakan masukkan nama lengkap siswa.');
      soundFx.playWrong();
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,40}$/.test(newStudentUsername.trim())) {
      setRegisterError('Username harus 3–40 karakter dan hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung.');
      soundFx.playWrong();
      return;
    }
    if (newStudentPassword.length < 8) {
      setRegisterError('Kata sandi harus terdiri dari minimal 8 karakter.');
      soundFx.playWrong();
      return;
    }

    setRegisterError('');
    setIsRegistering(true);
    soundFx.playClick();

    const todayStr = getTodayDateString();
    const newStudent: UserProgress = {
      studentName: newStudentName.trim(),
      username: newStudentUsername.trim().toLowerCase(),
      school: '',
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
      const school = await lookupSchool(newSchoolCode);
      const result = await registerStudent({
        studentName: newStudent.studentName,
        username: newStudent.username || '',
        teacherUsername: newTeacherUsername.trim().toLowerCase(),
        schoolCode: school.code,
        gradeLevel: newStudent.gradeLevel || newGradeLevel,
        avatar: newStudent.avatar || newAvatar,
        password: newStudentPassword,
        progress: { ...newStudent, school: school.name },
      });
      if (result.session.role !== 'student' || !result.progress) {
        throw new Error('API tidak mengembalikan akun siswa yang valid.');
      }
      soundFx.playFanfare();
      confetti({ particleCount: 80, spread: 80 });
      onLoginSuccess(result.session, result.progress);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Pendaftaran melalui API gagal.');
    } finally {
      setIsRegistering(false);
    }
  };

  // --- TEACHER: LOGIN VIA API ---
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTeacherLoggingIn(true);
    setTeacherPinError('');
    try {
      const requestedRole = roleTab === 'platform-admin' ? 'platform_admin' : 'teacher';
      const result = await login(teacherUsername.trim(), teacherPinInput, requestedRole);
      if (result.session.role !== requestedRole) {
        throw new Error('Jenis akun tidak sesuai dengan pilihan masuk.');
      }
      soundFx.playFanfare();
      confetti({ particleCount: 60, spread: 70 });
      onLoginSuccess(result.session);
    } catch (error) {
      soundFx.playWrong();
      setTeacherPinError(error instanceof Error ? error.message : 'Gagal masuk ke API.');
    } finally {
      setIsTeacherLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col justify-between text-slate-100 relative overflow-x-hidden selection:bg-teal-500 selection:text-white">
      {/* Decorative Background Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full border-b border-white/10 px-4 sm:px-8 py-4 backdrop-blur-md bg-slate-900/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800 text-2xl text-white shadow-lg shadow-teal-900/40">
            🏮
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Lentera
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-200 border border-teal-700/50">
                Literasi & Numerasi
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Media Pembelajaran Literasi & Numerasi Terpadu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Database Aktif</span>
          <span className="sm:hidden">Online</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Card Hero Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-2">
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
              <img
                src={ENDZI_MASCOT_IMAGE}
                alt="Endzi, burung enggang sahabat belajar"
                className="hidden h-28 w-28 shrink-0 rounded-2xl border border-white/20 object-cover shadow-lg sm:block"
              />
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
              className={`flex-1 py-3 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
              className={`flex-1 py-3 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === 'teacher'
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">👨‍🏫</span>
              <span>Guru</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setRoleTab('platform-admin');
              }}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === 'platform-admin'
                  ? 'bg-white text-violet-950 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🛡️</span>
              <span>Admin Platform</span>
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
                  🔍 Masuk Akun Terdaftar
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
                  <form onSubmit={handleStudentLogin} className="max-w-md mx-auto space-y-3">
                    {studentLoginError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                        ⚠️ {studentLoginError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Username terdaftar
                      </label>
                      <input
                        type="text"
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="Masukkan username"
                        autoComplete="username"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Masukkan password"
                        autoComplete="current-password"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
            
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3.5 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 disabled:opacity-70 disabled:cursor-wait text-white font-bold text-sm transition-all shadow-md shadow-teal-900/20 cursor-pointer"
                    >
                      {isLoggingIn ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Memeriksa akun...
                        </span>
                      ) : 'Masuk dan Mulai Belajar ➔'}
                    </button>
                  </form>

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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Username untuk masuk: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudentUsername}
                      onChange={(e) => setNewStudentUsername(e.target.value)}
                      placeholder="Contoh: farhan_2026"
                      autoComplete="username"
                      minLength={3}
                      maxLength={40}
                      pattern="[A-Za-z0-9_-]{3,40}"
                      title="3–40 karakter: huruf, angka, garis bawah, atau tanda hubung."
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Username harus unik dan digunakan untuk login.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Username Guru: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTeacherUsername}
                      onChange={(e) => setNewTeacherUsername(e.target.value)}
                      placeholder="Username guru kelas"
                      autoComplete="off"
                      minLength={3}
                      maxLength={40}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Minta username guru Anda agar akun masuk ke daftar siswanya.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kata sandi (minimal 8 karakter)
                    </label>
                    <input
                      type="password"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="Buat kata sandi"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
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
                        Kode Sekolah:
                      </label>
                      <input
                        type="text"
                        value={newSchoolCode}
                        onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: A1B2C3D4"
                        maxLength={8}
                        minLength={8}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">Minta kode ini kepada guru di sekolahmu.</p>
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
                          <span>Mendaftarkan akun...</span>
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

          {/* BODY: STAFF ACCESS */}
          {roleTab !== 'student' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1.5">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl mx-auto shadow-2xs ${
                  roleTab === 'teacher'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    : 'bg-violet-50 border-violet-200 text-violet-900'
                }`}>
                  {roleTab === 'teacher' ? '👨‍🏫' : '🛡️'}
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {roleTab === 'teacher' ? 'Portal Akses Guru' : 'Portal Admin Platform'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {roleTab === 'teacher'
                    ? 'Masuk untuk mengelola materi dan siswa di sekolah Anda.'
                    : 'Masuk untuk mendaftarkan sekolah dan akun guru pertama.'}
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
                    Username:
                  </label>
                  <input
                    type="text"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    placeholder="Masukkan username guru"
                    autoComplete="username"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password:
                  </label>
                  <input
                    type="password"
                    value={teacherPinInput}
                    onChange={(e) => setTeacherPinInput(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    autoFocus
                  />
                </div>

                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/70 text-[11px] text-indigo-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🔐</span> Informasi Keamanan:
                  </div>
                  <p>
                    {roleTab === 'teacher'
                      ? 'Gunakan username dan kata sandi akun guru yang disiapkan sekolah.'
                      : 'Gunakan kredensial admin platform yang dikonfigurasi pada server.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isTeacherLoggingIn}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-800 hover:bg-indigo-900 disabled:opacity-70 disabled:cursor-wait text-white font-bold text-sm transition-all shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isTeacherLoggingIn ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memeriksa akun...</span>
                    </>
                  ) : <span>Masuk {roleTab === 'teacher' ? 'Sebagai Guru' : 'Sebagai Admin Platform'} ➔</span>}
                </button>

              </form>
            </div>
          )}

          {/* Card Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>© Lentera  · Literasi & Numerasi Berkelanjutan</span>
            
          </div>
        </div>
      </main>

      {/* Page Bottom Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-white/5 z-10">
        <p>Aplikasi Media Pembelajaran Interaktif Lentera · Didukung oleh Aplikasi Karya Anak Bangsa</p>
      </footer>
    </div>
  );
};
