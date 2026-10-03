import React, { useEffect, useState } from 'react';
import { BellRing, ChevronLeft, ChevronRight, Copy, RefreshCw, Smartphone } from 'lucide-react';
import {
  createPlatformSchool,
  fetchPlatformFcmDevices,
  fetchPlatformSchools,
  PlatformFcmDevice,
  PlatformSchool,
  updatePlatformSchool,
} from '../../services/authService';
import { soundFx } from '../../utils/audio';

interface PlatformAdminPanelProps {
  onLogout: () => void;
}

export const PlatformAdminPanel: React.FC<PlatformAdminPanelProps> = ({ onLogout }) => {
  const [schools, setSchools] = useState<PlatformSchool[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [createdSchool, setCreatedSchool] = useState<PlatformSchool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [fcmDevices, setFcmDevices] = useState<PlatformFcmDevice[]>([]);
  const [fcmPage, setFcmPage] = useState(1);
  const [fcmLastPage, setFcmLastPage] = useState(1);
  const [fcmTotal, setFcmTotal] = useState(0);
  const [isFcmLoading, setIsFcmLoading] = useState(true);
  const [fcmError, setFcmError] = useState('');
  const [copiedDeviceId, setCopiedDeviceId] = useState<number | null>(null);

  const loadSchools = async () => {
    setIsLoading(true);
    try {
      setSchools(await fetchPlatformSchools());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat daftar sekolah.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSchools();
  }, []);

  const loadFcmDevices = async (page = fcmPage) => {
    setIsFcmLoading(true);
    try {
      const result = await fetchPlatformFcmDevices(page);
      setFcmDevices(result.data);
      setFcmPage(result.current_page);
      setFcmLastPage(result.last_page);
      setFcmTotal(result.total);
      setFcmError('');
    } catch (loadError) {
      setFcmError(loadError instanceof Error ? loadError.message : 'Gagal memuat daftar perangkat FCM.');
    } finally {
      setIsFcmLoading(false);
    }
  };

  useEffect(() => {
    void loadFcmDevices(1);
  }, []);

  const handleCopyToken = async (device: PlatformFcmDevice) => {
    try {
      await navigator.clipboard.writeText(device.token);
      setCopiedDeviceId(device.id);
      window.setTimeout(() => setCopiedDeviceId((current) => current === device.id ? null : current), 2000);
    } catch {
      setFcmError('Token tidak dapat disalin. Periksa izin clipboard browser.');
    }
  };

  const handleCreateSchool = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const result = await createPlatformSchool({
        name: schoolName.trim(),
        teacherName: teacherName.trim(),
        username: username.trim().toLowerCase(),
        password,
      });
      setCreatedSchool(result.school);
      setSchoolName('');
      setTeacherName('');
      setUsername('');
      setPassword('');
      await loadSchools();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal membuat sekolah dan akun guru.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSchool = async (school: PlatformSchool) => {
    try {
      const updated = await updatePlatformSchool(school.id, { is_active: !school.is_active });
      setSchools((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Gagal mengubah status sekolah.');
    }
  };

  const handleLogout = () => {
    soundFx.playClick();
    onLogout();
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Lentera · Admin Platform</p>
            <h1 className="mt-1 text-xl font-black text-slate-900">Manajemen Sekolah</h1>
            <p className="mt-1 text-xs text-slate-500">Daftarkan sekolah beserta akun guru pertamanya.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="text-base font-bold text-slate-900">Tambah Sekolah</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Setiap sekolah mendapat kode unik. Berikan kode kepada siswa agar mereka dapat bergabung.
          </p>
          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
              {error}
            </div>
          )}
          {createdSchool && (
            <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-900">Sekolah berhasil dibuat</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{createdSchool.name}</p>
              <p className="mt-2 text-[11px] text-slate-600">Kode pendaftaran siswa:</p>
              <p className="mt-1 select-all font-mono text-xl font-black tracking-[0.2em] text-emerald-900">{createdSchool.code}</p>
              <p className="mt-2 text-[11px] text-slate-600">Akun guru pertama dapat langsung digunakan untuk login.</p>
            </div>
          )}
          <form onSubmit={handleCreateSchool} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Nama sekolah
              <input
                required
                maxLength={160}
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Nama guru pertama
              <input
                required
                maxLength={120}
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Username guru
              <input
                required
                minLength={3}
                maxLength={40}
                pattern="[A-Za-z0-9_-]{3,40}"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Kata sandi awal
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-violet-800 px-4 py-3 text-xs font-bold text-white hover:bg-violet-900 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? 'Membuat sekolah...' : 'Buat Sekolah & Akun Guru'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sekolah Terdaftar</h2>
              <p className="mt-1 text-xs text-slate-500">Data dan akun antar sekolah terisolasi.</p>
            </div>
            <button type="button" onClick={() => void loadSchools()} className="rounded-lg px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-50">
              Segarkan
            </button>
          </div>
          {isLoading ? (
            <p className="py-10 text-center text-xs text-slate-500">Memuat daftar sekolah...</p>
          ) : schools.length ? (
            <div className="mt-4 space-y-3">
              {schools.map((school) => (
                <article key={school.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900">{school.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Kode <span className="font-mono font-bold tracking-wider text-slate-700">{school.code}</span>
                      {' · '}{school.teacher_count || 0} guru · {school.student_count || 0} siswa
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggleSchool(school)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      school.is_active
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {school.is_active ? 'Aktif · Nonaktifkan' : 'Nonaktif · Aktifkan'}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500">
              Belum ada sekolah. Buat sekolah pertama menggunakan formulir.
            </p>
          )}
        </section>
      </div>

      <section className="mx-auto mb-8 max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                <BellRing size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Perangkat Notifikasi FCM</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {fcmTotal} perangkat terdaftar · token ditampilkan hanya untuk admin platform.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadFcmDevices(fcmPage)}
              disabled={isFcmLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={14} className={isFcmLoading ? 'animate-spin' : ''} aria-hidden="true" />
              Segarkan
            </button>
          </div>

          {fcmError && (
            <div role="alert" className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 sm:mx-6">
              {fcmError}
            </div>
          )}

          {isFcmLoading ? (
            <p className="py-12 text-center text-xs text-slate-500">Memuat daftar perangkat...</p>
          ) : fcmDevices.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Pengguna / Perangkat</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Token FCM</th>
                      <th className="px-6 py-3">Terakhir diperbarui</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fcmDevices.map((device) => (
                      <tr key={device.id} className="align-top">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{device.username || 'Username belum tersedia'}</p>
                          <p className="mt-1 max-w-56 truncate font-mono text-[10px] text-slate-400" title={device.deviceId}>
                            {device.deviceId}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600">
                            <Smartphone size={12} aria-hidden="true" />
                            {device.platform}
                          </span>
                        </td>
                        <td className="max-w-xl px-4 py-4">
                          <div className="flex items-start gap-2">
                            <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-600">
                              {device.token}
                            </code>
                            <button
                              type="button"
                              onClick={() => void handleCopyToken(device)}
                              aria-label={`Salin token FCM ${device.username || device.deviceId}`}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <Copy size={12} aria-hidden="true" />
                              {copiedDeviceId === device.id ? 'Tersalin' : 'Salin'}
                            </button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                          {new Date(device.updatedAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6">
                <p className="text-[11px] text-slate-500">Halaman {fcmPage} dari {fcmLastPage}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void loadFcmDevices(fcmPage - 1)}
                    disabled={fcmPage <= 1 || isFcmLoading}
                    aria-label="Halaman sebelumnya"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadFcmDevices(fcmPage + 1)}
                    disabled={fcmPage >= fcmLastPage || isFcmLoading}
                    aria-label="Halaman berikutnya"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="px-5 py-12 text-center text-xs text-slate-500 sm:px-6">
              Belum ada perangkat yang mendaftarkan notifikasi FCM.
            </p>
          )}
          <p className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-[10px] leading-relaxed text-amber-900 sm:px-6">
            Token FCM bersifat sensitif. Gunakan hanya untuk pengiriman notifikasi resmi dan jangan membagikannya di luar admin tepercaya.
          </p>
        </div>
      </section>
    </main>
  );
};
