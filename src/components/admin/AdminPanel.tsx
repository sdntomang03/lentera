import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  LiteracyPassage,
  NumeracyQuestion,
  EducationLevel,
  LiteracyGenre,
  NumeracyDomain,
  NumeracyContext,
  UserProgress,
} from '../../types';
import { BADGES_DATA } from '../../data/badgesData';
import {
  fetchPassagesFromFirestore,
  savePassageToFirestore,
  deletePassageFromFirestore,
  fetchNumeracyFromFirestore,
  saveNumeracyToFirestore,
  deleteNumeracyFromFirestore,
  seedDefaultPassages,
  seedDefaultNumeracy,
  seedFaseCContentToFirestore,
  fetchAdminPortalConfig,
  saveAdminPortalConfig,
  AdminPortalConfig,
  fetchAllUsersFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  seedDemoStudentsToFirestore,
} from '../../services/contentService';
import { soundFx } from '../../utils/audio';

export interface TrashItem {
  id: string;
  type: 'literasi' | 'numerasi' | 'user';
  title: string;
  levelLabel?: string;
  deletedAt: string;
  data: any;
}

interface AdminPanelProps {
  onContentUpdated: () => void;
  onClose: () => void;
  currentStudentName?: string;
  onSelectStudentProfile?: (student: UserProgress) => void;
}

const AVATAR_OPTIONS = ['👦', '👧', '🧑', '🎒', '🦉', '🦊', '🚀', '⭐', '📚', '🎨', '🌟', '🦁'];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onContentUpdated,
  onClose,
  currentStudentName,
  onSelectStudentProfile,
}) => {
  // Authentication PIN state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [adminConfig, setAdminConfig] = useState<AdminPortalConfig>({
    adminPin: '123456',
    schoolName: 'SD Negeri Nusantara',
    teacherName: 'Guru Penggerak',
  });

  // Admin tabs: 'literasi' | 'numerasi' | 'users' | 'trash' | 'settings'
  const [activeTab, setActiveTab] = useState<'literasi' | 'numerasi' | 'users' | 'trash' | 'settings'>('literasi');

  // Fase Filter for SD (fase-a, fase-b, fase-c)
  const [selectedFaseFilter, setSelectedFaseFilter] = useState<'all' | EducationLevel>('all');

  // Content state
  const [passages, setPassages] = useState<LiteracyPassage[]>([]);
  const [numeracyList, setNumeracyList] = useState<NumeracyQuestion[]>([]);
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Trash & Recovery state
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lentera_admin_trash_v2');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Undo Notification state
  const [undoToast, setUndoToast] = useState<{
    item: TrashItem;
    message: string;
  } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Passage Editor Modal
  const [isPassageEditorOpen, setIsPassageEditorOpen] = useState<boolean>(false);
  const [editingPassage, setEditingPassage] = useState<Partial<LiteracyPassage> | null>(null);

  // Numeracy Editor Modal
  const [isNumeracyEditorOpen, setIsNumeracyEditorOpen] = useState<boolean>(false);
  const [editingNumeracy, setEditingNumeracy] = useState<Partial<NumeracyQuestion> | null>(null);

  // User Editor Modal
  const [isUserEditorOpen, setIsUserEditorOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProgress> | null>(null);

  // New Student Quick Modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [newStudentForm, setNewStudentForm] = useState<{
    studentName: string;
    school: string;
    gradeLevel: string;
    avatar: string;
    initialPoints: number;
  }>({
    studentName: '',
    school: '',
    gradeLevel: 'Kelas 4 (Fase B)',
    avatar: '👦',
    initialPoints: 120,
  });

  // Settings form state
  const [newPin, setNewPin] = useState<string>('');
  const [newSchoolName, setNewSchoolName] = useState<string>('');
  const [newTeacherName, setNewTeacherName] = useState<string>('');

  // Custom In-App Confirmation Dialog with explicit Ya / Tidak
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    itemTitle?: string;
    itemTypeLabel?: string;
    itemLevelLabel?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    loadAdminConfig();
  }, []);

  const loadAdminConfig = async () => {
    const cfg = await fetchAdminPortalConfig();
    setAdminConfig(cfg);
    setNewSchoolName(cfg.schoolName);
    setNewTeacherName(cfg.teacherName);
    setNewStudentForm((prev) => ({ ...prev, school: cfg.schoolName }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === adminConfig.adminPin.trim()) {
      soundFx.playCorrect();
      setIsAuthenticated(true);
      setPinError('');
      loadData();
    } else {
      soundFx.playWrong();
      setPinError('PIN salah! Silakan coba lagi (Default PIN: 123456).');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, nData, uData] = await Promise.all([
        fetchPassagesFromFirestore(),
        fetchNumeracyFromFirestore(),
        fetchAllUsersFromFirestore(),
      ]);
      setPassages(pData);
      setNumeracyList(nData);
      setUsers(uData);
    } catch (err) {
      console.error('Failed to load content from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const showError = (msg: string) => {
    soundFx.playWrong();
    setActionError(msg);
    setTimeout(() => setActionError(''), 4500);
  };

  // --- PASSAGE HANDLERS ---
  const handleOpenNewPassage = () => {
    soundFx.playClick();
    const newId = `lit-custom-${Date.now()}`;
    setEditingPassage({
      id: newId,
      title: '',
      level: 'fase-b',
      levelLabel: 'Fase B (Kelas 3-4 SD)',
      genre: 'informasi',
      genreLabel: 'Teks Informasi & Pengetahuan',
      estimatedReadTimeMinutes: 3,
      wordCount: 150,
      summary: '',
      paragraphs: ['Tuliskan paragraf pertama di sini...', 'Tuliskan paragraf kedua di sini...'],
      vocabulary: [
        {
          word: 'Eksplorasi',
          meaning: 'Kegiatan penjelajahan atau penyelidikan untuk menemukan hal baru.',
          example: 'Siswa melakukan eksplorasi di taman sains.',
        },
      ],
      questions: [
        {
          id: `q-${Date.now()}-1`,
          type: 'single-choice',
          question: 'Apa ide pokok dari bacaan tersebut?',
          options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          correctAnswers: 'Pilihan A',
          explanation: 'Pembahasan jawaban berdasarkan paragraf pertama.',
          cognitiveLevel: 'Menemukan Informasi (L1)',
        },
      ],
      authorOrSource: adminConfig.teacherName || 'Guru SD',
    });
    setIsPassageEditorOpen(true);
  };

  const handleOpenNewFaseCPassage = () => {
    soundFx.playClick();
    const newId = `lit-fase-c-${Date.now()}`;
    setEditingPassage({
      id: newId,
      title: 'Keajaiban Hutan Mangrove: Penjaga Pesisir Indonesia',
      level: 'fase-c',
      levelLabel: 'Fase C (Kelas 5-6 SD)',
      genre: 'sains',
      genreLabel: 'Literasi Lingkungan & Sains Terapan',
      estimatedReadTimeMinutes: 4,
      wordCount: 320,
      summary: 'Mempelajari peran ekosistem hutan mangrove sebagai penyerap emisi karbon dan pelindung abrasi di pesisir kepulauan Indonesia.',
      paragraphs: [
        'Indonesia memiliki lebih dari 20% total luas hutan bakau (mangrove) di seluruh dunia. Hutan unik ini tumbuh subur di wilayah pesisir berlumpur tempat bertemunya air laut dan air tawar.',
        'Akar tunjang mangrove yang kuat bekerja bagaikan jaringan benteng alami. Benteng ini sanggup memecah hempasan ombak badai serta mencegah abrasi atau pengikisan pantai.',
        'Secara ilmiah, hutan mangrove mampu menyerap gas karbon dioksida (blue carbon) hingga 4 hingga 5 kali lebih tinggi dibandingkan hutan daratan biasa, menjadikannya pilar penyelamat iklim bumi.',
      ],
      vocabulary: [
        {
          word: 'Blue Carbon',
          meaning: 'Karbon yang diserap dan disimpan oleh ekosistem laut dan pesisir seperti hutan mangrove dan padang lamun.',
          example: 'Hutan mangrove menyerap blue carbon untuk menahan laju pemanasan global.',
        },
        {
          word: 'Akar Tunjang',
          meaning: 'Akar yang tumbuh dari bagian bawah batang ke segala arah dan menancap ke tanah lumpur.',
          example: 'Pohon bakau kokoh berdiri berkat akar tunjang yang saling berkait.',
        },
      ],
      questions: [
        {
          id: `q-c-${Date.now()}-1`,
          type: 'single-choice',
          question: 'Berapa persen perkiraan luas hutan mangrove Indonesia dibanding total luas mangrove dunia?',
          options: ['Sekitar 5%', 'Sekitar 10%', 'Lebih dari 20%', 'Hanya 1%'],
          correctAnswers: 'Lebih dari 20%',
          explanation: 'Paragraf pertama menjelaskan Indonesia memiliki lebih dari 20% total luas mangrove dunia.',
          cognitiveLevel: 'Menemukan Informasi (L1)',
        },
        {
          id: `q-c-${Date.now()}-2`,
          type: 'multiple-choice',
          question: 'Manakah DUA manfaat utama hutan mangrove menurut bacaan? (Pilih dua)',
          options: [
            'Mencegah abrasi dan hempasan gelombang badai di pesisir',
            'Menyerap gas karbon dioksida (blue carbon) 4-5 kali lebih tinggi',
            'Mengeringkan seluruh air laut di pesisir pantai',
            'Membuat air laut menjadi tawar dalam sekejap',
          ],
          correctAnswers: [
            'Mencegah abrasi dan hempasan gelombang badai di pesisir',
            'Menyerap gas karbon dioksida (blue carbon) 4-5 kali lebih tinggi',
          ],
          explanation: 'Paragraf ke-2 dan ke-3 merinci peran peredam abrasi pantai dan penyerap emisi karbon tinggi.',
          cognitiveLevel: 'Memahami & Interpretasi (L2)',
        },
      ],
      authorOrSource: adminConfig.teacherName || 'Guru Fase C SD',
    });
    setIsPassageEditorOpen(true);
  };

  const handleEditPassage = (p: LiteracyPassage) => {
    soundFx.playClick();
    setEditingPassage(JSON.parse(JSON.stringify(p)));
    setIsPassageEditorOpen(true);
  };

  const handleDeletePassage = (passage: LiteracyPassage) => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Hapus Bacaan Literasi',
      itemTitle: passage.title,
      itemTypeLabel: 'Bacaan Literasi',
      itemLevelLabel: passage.levelLabel,
      message: `Apakah Anda benar-benar yakin ingin menghapus bacaan "${passage.title}"?`,
      confirmLabel: '✓ Ya, Hapus Sekarang',
      cancelLabel: '✕ Tidak, Batalkan',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deletePassageFromFirestore(passage.id);
        } catch (err) {
          console.warn('Gagal menghapus dari Firebase Firestore, memperbarui state lokal:', err);
        }
        setPassages((prev) => prev.filter((item) => item.id !== passage.id));

        const newTrashItem: TrashItem = {
          id: passage.id,
          type: 'literasi',
          title: passage.title,
          levelLabel: passage.levelLabel,
          deletedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          data: passage,
        };
        const updatedTrash = [newTrashItem, ...trashItems.filter((t) => t.id !== passage.id)].slice(0, 50);
        setTrashItems(updatedTrash);
        try {
          localStorage.setItem('lentera_admin_trash_v2', JSON.stringify(updatedTrash));
        } catch {}

        setUndoToast({
          item: newTrashItem,
          message: `Bacaan "${passage.title}" telah dihapus.`,
        });

        showNotification(`Bacaan "${passage.title}" dipindahkan ke Kotak Sampah.`);
        onContentUpdated();
      },
    });
  };

  const handleSavePassage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPassage || !editingPassage.title || !editingPassage.id) {
      showError('Mohon lengkapi judul bacaan.');
      return;
    }

    try {
      const fullPassage = editingPassage as LiteracyPassage;
      await savePassageToFirestore(fullPassage);
      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`Bacaan "${fullPassage.title}" berhasil disimpan di Firebase Firestore!`);
      setIsPassageEditorOpen(false);
      setEditingPassage(null);
      await loadData();
      onContentUpdated();
    } catch (err) {
      showError('Gagal menyimpan ke database Firebase. Pastikan koneksi internet stabil.');
    }
  };

  // --- NUMERACY HANDLERS ---
  const handleOpenNewNumeracy = () => {
    soundFx.playClick();
    const newId = `num-custom-${Date.now()}`;
    setEditingNumeracy({
      id: newId,
      title: '',
      level: 'fase-b',
      levelLabel: 'Fase B (Kelas 3-4 SD)',
      domain: 'bilangan',
      domainLabel: 'Bilangan & Operasi Hitung',
      context: 'personal',
      contextLabel: 'Personal & Keseharian',
      stimulus: {
        text: 'Tuliskan teks stimulus atau narasi situasi kontekstual di sini...',
        chartType: 'table',
        chartData: {
          headers: ['Barang', 'Jumlah', 'Harga'],
          rows: [
            ['Buku Tulis', '5', 'Rp 15.000'],
            ['Pensil 2B', '3', 'Rp 6.000'],
          ],
        },
      },
      type: 'single-choice',
      question: 'Berapakah total biaya yang harus dibayar?',
      options: ['Rp 21.000', 'Rp 20.000', 'Rp 25.000', 'Rp 18.000'],
      correctAnswer: 'Rp 21.000',
      hint: 'Jumlahkan harga buku tulis dan pensil.',
      stepByStepSolution: [
        'Hitung harga buku: Rp 15.000',
        'Hitung harga pensil: Rp 6.000',
        'Total: 15.000 + 6.000 = Rp 21.000',
      ],
      cognitiveLevel: 'Penerapan (Applying)',
    });
    setIsNumeracyEditorOpen(true);
  };

  const handleOpenNewFaseCNumeracy = () => {
    soundFx.playClick();
    const newId = `num-fase-c-${Date.now()}`;
    setEditingNumeracy({
      id: newId,
      title: 'Perancangan Skala & Luas Kebun Sayur Hidroponik Sekolah',
      level: 'fase-c',
      levelLabel: 'Fase C (Kelas 5-6 SD)',
      domain: 'geometri',
      domainLabel: 'Pengukuran, Skala & Geometri Ruang',
      context: 'saintifik',
      contextLabel: 'Konteks Saintifik & Ketahanan Pangan',
      stimulus: {
        text: 'Siswa kelas 5 dan 6 merancang kebun hidroponik berbentuk persegi panjang dengan ukuran panjang sebenarnya 8 meter dan lebar 6 meter. Pada denah buku tugas, mereka menggambar dengan skala 1 : 100.',
        chartType: 'table',
        chartData: {
          headers: ['Bagian Kebun', 'Ukuran Sebenarnya', 'Ukuran pada Denah (Skala 1:100)'],
          rows: [
            ['Panjang Kebun', '8 meter (800 cm)', '8 cm'],
            ['Lebar Kebun', '6 meter (600 cm)', '6 cm'],
            ['Luas Sebenarnya', '8 m x 6 m = 48 m²', '48 cm² (pada kertas)'],
          ],
        },
      },
      type: 'single-choice',
      question: 'Berapakah luas sebenarnya dari kebun sayur hidroponik sekolah tersebut?',
      options: ['28 m²', '36 m²', '48 m²', '56 m²'],
      correctAnswer: '48 m²',
      hint: 'Rumus luas persegi panjang: Luas = Panjang x Lebar.',
      stepByStepSolution: [
        'Langkah 1: Identifikasi panjang sebenarnya = 8 meter.',
        'Langkah 2: Identifikasi lebar sebenarnya = 6 meter.',
        'Langkah 3: Luas = 8 m x 6 m = 48 meter persegi (m²).',
      ],
      cognitiveLevel: 'Penerapan (Applying)',
    });
    setIsNumeracyEditorOpen(true);
  };

  const handleEditNumeracy = (q: NumeracyQuestion) => {
    soundFx.playClick();
    setEditingNumeracy(JSON.parse(JSON.stringify(q)));
    setIsNumeracyEditorOpen(true);
  };

  const handleDeleteNumeracy = (q: NumeracyQuestion) => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Hapus Soal Numerasi',
      itemTitle: q.title,
      itemTypeLabel: 'Soal Numerasi',
      itemLevelLabel: q.levelLabel,
      message: `Apakah Anda benar-benar yakin ingin menghapus soal numerasi "${q.title}"?`,
      confirmLabel: '✓ Ya, Hapus Sekarang',
      cancelLabel: '✕ Tidak, Batalkan',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteNumeracyFromFirestore(q.id);
        } catch (err) {
          console.warn('Gagal menghapus soal dari Firestore, memperbarui state lokal:', err);
        }
        setNumeracyList((prev) => prev.filter((item) => item.id !== q.id));

        const newTrashItem: TrashItem = {
          id: q.id,
          type: 'numerasi',
          title: q.title,
          levelLabel: q.levelLabel,
          deletedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          data: q,
        };
        const updatedTrash = [newTrashItem, ...trashItems.filter((t) => t.id !== q.id)].slice(0, 50);
        setTrashItems(updatedTrash);
        try {
          localStorage.setItem('lentera_admin_trash_v2', JSON.stringify(updatedTrash));
        } catch {}

        setUndoToast({
          item: newTrashItem,
          message: `Soal numerasi "${q.title}" telah dihapus.`,
        });

        showNotification(`Soal "${q.title}" dipindahkan ke Kotak Sampah.`);
        onContentUpdated();
      },
    });
  };

  // --- TRASH & RESTORATION HANDLERS ---
  const handleRestoreTrashItem = async (item: TrashItem) => {
    soundFx.playClick();
    setIsLoading(true);
    try {
      if (item.type === 'literasi') {
        await savePassageToFirestore(item.data);
        setPassages((prev) => [item.data, ...prev.filter((p) => p.id !== item.id)]);
      } else if (item.type === 'numerasi') {
        await saveNumeracyToFirestore(item.data);
        setNumeracyList((prev) => [item.data, ...prev.filter((q) => q.id !== item.id)]);
      } else if (item.type === 'user') {
        await saveUserToFirestore(item.data);
        setUsers((prev) => [item.data, ...prev.filter((u) => (u.id || u.studentName) !== item.id)]);
      }

      const remainingTrash = trashItems.filter((t) => t.id !== item.id);
      setTrashItems(remainingTrash);
      try {
        localStorage.setItem('lentera_admin_trash_v2', JSON.stringify(remainingTrash));
      } catch {}

      if (undoToast?.item.id === item.id) {
        setUndoToast(null);
      }

      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`✓ Berhasil memulihkan data "${item.title}" kembali ke sistem!`);
      onContentUpdated();
    } catch (err) {
      showError('Gagal memulihkan data. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentDeleteTrashItem = (id: string, title: string) => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Permanen dari Kotak Sampah',
      itemTitle: title,
      itemTypeLabel: 'Arsip Kotak Sampah',
      message: `Hapus permanen "${title}"? Data ini tidak akan bisa dipulihkan lagi setelahnya.`,
      confirmLabel: '✓ Ya, Hapus Permanen',
      cancelLabel: '✕ Tidak, Batal',
      isDestructive: true,
      onConfirm: () => {
        const remaining = trashItems.filter((t) => t.id !== id);
        setTrashItems(remaining);
        try {
          localStorage.setItem('lentera_admin_trash_v2', JSON.stringify(remaining));
        } catch {}
        if (undoToast?.item.id === id) {
          setUndoToast(null);
        }
        showNotification(`Data "${title}" dihapus permanen dari Kotak Sampah.`);
      },
    });
  };

  const handleRestoreAllTrash = async () => {
    soundFx.playClick();
    if (trashItems.length === 0) return;
    setIsLoading(true);
    try {
      for (const item of trashItems) {
        if (item.type === 'literasi') {
          await savePassageToFirestore(item.data);
        } else if (item.type === 'numerasi') {
          await saveNumeracyToFirestore(item.data);
        } else if (item.type === 'user') {
          await saveUserToFirestore(item.data);
        }
      }
      setTrashItems([]);
      try {
        localStorage.removeItem('lentera_admin_trash_v2');
      } catch {}
      setUndoToast(null);
      await loadData();
      soundFx.playCorrect();
      confetti({ particleCount: 70, spread: 80 });
      showNotification('Semua data di kotak sampah berhasil dipulihkan!');
      onContentUpdated();
    } catch (err) {
      showError('Gagal memulihkan sebagian data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllTrash = () => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Kotak Sampah',
      itemTitle: `${trashItems.length} item arsip`,
      itemTypeLabel: 'Kotak Sampah',
      message: 'Apakah Anda benar-benar yakin ingin mengosongkan seluruh isi kotak sampah?',
      confirmLabel: '✓ Ya, Kosongkan Semua',
      cancelLabel: '✕ Tidak, Batalkan',
      isDestructive: true,
      onConfirm: () => {
        setTrashItems([]);
        try {
          localStorage.removeItem('lentera_admin_trash_v2');
        } catch {}
        setUndoToast(null);
        showNotification('Kotak sampah telah dibersihkan.');
      },
    });
  };

  // 1-Click Fase C content loader
  const handleSeedFaseCContent = async () => {
    soundFx.playClick();
    setIsLoading(true);
    try {
      const res = await seedFaseCContentToFirestore();
      soundFx.playCorrect();
      confetti({ particleCount: 60, spread: 70 });
      showNotification(`Berhasil menyinkronkan konten resmi Fase C (Kelas 5-6 SD): ${res.passagesCount} bacaan & ${res.numeracyCount} soal ke database!`);
      await loadData();
      onContentUpdated();
    } catch (err) {
      showError('Gagal memuat konten Fase C. Periksa koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNumeracy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNumeracy || !editingNumeracy.title || !editingNumeracy.id) {
      showError('Mohon lengkapi judul soal numerasi.');
      return;
    }

    try {
      const fullNumeracy = editingNumeracy as NumeracyQuestion;
      await saveNumeracyToFirestore(fullNumeracy);
      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`Soal "${fullNumeracy.title}" berhasil disimpan di Firebase Firestore!`);
      setIsNumeracyEditorOpen(false);
      setEditingNumeracy(null);
      await loadData();
      onContentUpdated();
    } catch (err) {
      showError('Gagal menyimpan ke database Firebase. Pastikan koneksi internet stabil.');
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenRegisterStudent = () => {
    soundFx.playClick();
    setNewStudentForm({
      studentName: '',
      school: adminConfig.schoolName || 'SD Negeri Nusantara',
      gradeLevel: 'Kelas 4 (Fase B)',
      avatar: '👦',
      initialPoints: 120,
    });
    setIsNewUserModalOpen(true);
  };

  const handleSaveNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.studentName.trim()) {
      showError('Nama siswa wajib diisi.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newStudent: UserProgress = {
      id: `student-${Date.now()}`,
      studentName: newStudentForm.studentName.trim(),
      school: newStudentForm.school.trim() || adminConfig.schoolName,
      gradeLevel: newStudentForm.gradeLevel,
      avatar: newStudentForm.avatar || '👦',
      completedPassages: [],
      completedNumeracy: [],
      quizScores: {},
      earnedBadges: ['badge-first-read'],
      totalPoints: newStudentForm.initialPoints || 100,
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
    };

    try {
      await saveUserToFirestore(newStudent);
      soundFx.playCorrect();
      confetti({ particleCount: 60, spread: 70 });
      showNotification(`Siswa "${newStudent.studentName}" berhasil didaftarkan di Firebase!`);
      setIsNewUserModalOpen(false);
      await loadData();
    } catch (err) {
      showError('Gagal mendaftarkan siswa ke Firebase.');
    }
  };

  const handleEditUser = (user: UserProgress) => {
    soundFx.playClick();
    setEditingUser(JSON.parse(JSON.stringify(user)));
    setIsUserEditorOpen(true);
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.studentName) {
      showError('Nama siswa tidak boleh kosong.');
      return;
    }

    try {
      const fullUser = editingUser as UserProgress;
      await saveUserToFirestore(fullUser);
      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`Data siswa "${fullUser.studentName}" berhasil diperbarui di Firestore!`);
      setIsUserEditorOpen(false);
      setEditingUser(null);
      await loadData();
      if (currentStudentName === fullUser.studentName && onSelectStudentProfile) {
        onSelectStudentProfile(fullUser);
      }
    } catch (err) {
      showError('Gagal memperbarui data siswa di Firestore.');
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    soundFx.playClick();
    const targetUser = users.find((u) => (u.id || u.studentName) === userId || u.studentName === name);
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Hapus Akun Siswa',
      itemTitle: name,
      itemTypeLabel: 'Akun Siswa SD',
      itemLevelLabel: targetUser?.gradeLevel || 'Siswa SD',
      message: `Apakah Anda benar-benar yakin ingin menghapus data akun siswa "${name}"?`,
      confirmLabel: '✓ Ya, Hapus Sekarang',
      cancelLabel: '✕ Tidak, Batalkan',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteUserFromFirestore(userId, name);
        } catch (err) {
          console.warn('Gagal menghapus akun siswa dari Firestore, memperbarui state lokal:', err);
        }
        setUsers((prev) =>
          prev.filter((u) => (u.id || u.studentName) !== userId && u.studentName !== name)
        );

        if (targetUser) {
          const newTrashItem: TrashItem = {
            id: userId,
            type: 'user',
            title: name,
            levelLabel: targetUser.gradeLevel,
            deletedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            data: targetUser,
          };
          const updatedTrash = [newTrashItem, ...trashItems.filter((t) => t.id !== userId)].slice(0, 50);
          setTrashItems(updatedTrash);
          try {
            localStorage.setItem('lentera_admin_trash_v2', JSON.stringify(updatedTrash));
          } catch {}

          setUndoToast({
            item: newTrashItem,
            message: `Akun siswa "${name}" telah dihapus.`,
          });
        }

        showNotification(`Data siswa "${name}" dipindahkan ke Kotak Sampah.`);
      },
    });
  };

  const handleResetStudentProgress = (user: UserProgress) => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Progres Siswa',
      message: `Reset seluruh progres belajar (modul selesai & nilai kuis) untuk "${user.studentName}"? Nama akun & poin dasar akan dipertahankan.`,
      confirmLabel: 'Ya, Reset Progres',
      isDestructive: false,
      onConfirm: async () => {
        const resetUser: UserProgress = {
          ...user,
          completedPassages: [],
          completedNumeracy: [],
          quizScores: {},
          totalPoints: Math.max(50, Math.round(user.totalPoints * 0.3)), // bonus baseline
          streakCount: 1,
        };
        try {
          await saveUserToFirestore(resetUser);
        } catch (err) {
          console.warn('Gagal mereset siswa di Firestore:', err);
        }
        setUsers((prev) =>
          prev.map((u) =>
            (u.id && u.id === user.id) || u.studentName === user.studentName ? resetUser : u
          )
        );
        soundFx.playCorrect();
        showNotification(`Progres belajar "${user.studentName}" berhasil direset.`);
        if (currentStudentName === user.studentName && onSelectStudentProfile) {
          onSelectStudentProfile(resetUser);
        }
      },
    });
  };

  const handleSelectStudentAsActive = (user: UserProgress) => {
    soundFx.playClick();
    if (onSelectStudentProfile) {
      onSelectStudentProfile(user);
      showNotification(`Profil aktif dialihkan ke siswa: ${user.studentName}`);
    }
  };

  const handleSeedDemoStudents = () => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Muat Siswa Contoh',
      message: 'Muat data daftar siswa percontohan Kurikulum Merdeka ke Firebase?',
      confirmLabel: 'Ya, Muat Data',
      isDestructive: false,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await seedDemoStudentsToFirestore();
          await loadData();
          soundFx.playFanfare();
          showNotification('Daftar siswa contoh berhasil dimuat ke database Firebase!');
        } catch (err) {
          showNotification('Gagal memuat siswa contoh ke database.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // --- SEED DEFAULT RESTORE ---
  const handleResetDefaults = () => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Sinkronisasi Materi Standar',
      message: 'Sinkronisasi ulang semua materi standar Kurikulum Merdeka ke database Firebase Anda?',
      confirmLabel: 'Ya, Sinkronkan',
      isDestructive: false,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await Promise.all([seedDefaultPassages(), seedDefaultNumeracy()]);
          await loadData();
          soundFx.playFanfare();
          showNotification('Materi standar Kurikulum Merdeka berhasil disinkronkan ke Firebase!');
          onContentUpdated();
        } catch (err) {
          showNotification('Gagal menyinkronkan materi ke Firebase.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // --- SETTINGS SAVE ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminPortalConfig = {
      adminPin: newPin.trim() ? newPin.trim() : adminConfig.adminPin,
      schoolName: newSchoolName.trim() || 'SD Negeri Nusantara',
      teacherName: newTeacherName.trim() || 'Guru Penggerak',
    };
    try {
      await saveAdminPortalConfig(updated);
      setAdminConfig(updated);
      soundFx.playCorrect();
      showNotification('Pengaturan portal guru berhasil diperbarui!');
      setNewPin('');
    } catch (err) {
      showError('Gagal menyimpan pengaturan ke Firebase.');
    }
  };

  // Filtered lists
  const filteredPassages = passages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genreLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.levelLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFase = selectedFaseFilter === 'all' || p.level === selectedFaseFilter;
    return matchesSearch && matchesFase;
  });

  const filteredNumeracy = numeracyList.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.domainLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.levelLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFase = selectedFaseFilter === 'all' || q.level === selectedFaseFilter;
    return matchesSearch && matchesFase;
  });

  const filteredTrash = trashItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.levelLabel && item.levelLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(
    (u) =>
      u.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.school && u.school.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.gradeLevel && u.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl text-lg cursor-pointer"
            title="Tutup"
          >
            ✕
          </button>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-3xl mx-auto shadow-md shadow-teal-900/20">
              🔐
            </div>
            <h2 className="text-2xl font-black text-slate-900">Portal Guru & Admin</h2>
            <p className="text-xs text-slate-500">
              Kelola materi pembelajaran dan <strong className="text-teal-800">data akun pengguna / siswa</strong> yang tersimpan di{' '}
              <strong className="text-teal-800">Firebase Firestore</strong>.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Masukkan PIN Guru:
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN 6 digit (Default: 123456)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-600 font-medium mt-1.5">{pinError}</p>}
            </div>

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-[11px] text-teal-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>💡</span> Informasi Akses Guru:
              </div>
              <p>
                PIN bawaan sistem adalah <strong className="font-mono bg-teal-100 px-1 py-0.5 rounded">123456</strong>. Anda dapat mengubah PIN ini kapan saja di menu Pengaturan.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Masuk Portal ➔
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN INTERFACE ---
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center text-xl shadow-xs">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">Panel Kelola Konten & Pengguna</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Connected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {adminConfig.schoolName} · Pengampu: {adminConfig.teacherName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Muat Ulang Data dari Firebase"
          >
            <span>🔄</span> Segarkan
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Tutup Panel ✕
          </button>
        </div>
      </header>

      {/* Floating Action Banner */}
      {actionNotice && (
        <div className="bg-emerald-700 text-white text-xs font-bold py-2 px-4 text-center animate-in slide-in-from-top duration-200">
          ✅ {actionNotice}
        </div>
      )}
      {actionError && (
        <div className="bg-rose-700 text-white text-xs font-bold py-2 px-4 text-center animate-in slide-in-from-top duration-200">
          ⚠️ {actionError}
        </div>
      )}

      {/* Navigation Sub-Tabs & Actions Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('literasi');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'literasi'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📖 Literasi SD ({passages.length})
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('numerasi');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'numerasi'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧮 Numerasi SD ({numeracyList.length})
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('users');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👥 Siswa ({users.length})
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('trash');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'trash'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🗑️ Kotak Sampah & Pemulihan</span>
            {trashItems.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">
                {trashItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('settings');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔒 Pengaturan PIN
          </button>
        </div>

        {/* Action Button: Add new content / student */}
        {activeTab === 'literasi' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cari judul bacaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 w-36 sm:w-52"
            />
            <button
              onClick={handleOpenNewFaseCPassage}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Buat materi bacaan baru khusus jenjang Fase C (Kelas 5-6 SD)"
            >
              <span>⭐</span> + Bacaan Fase C (Kls 5-6)
            </button>
            <button
              onClick={handleOpenNewPassage}
              className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>➕</span> Tambah Bacaan
            </button>
            <button
              onClick={handleSeedFaseCContent}
              className="hidden lg:flex px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold items-center gap-1 cursor-pointer shadow-2xs"
              title="Muat konten kurikulum resmi Fase C ke Firebase"
            >
              <span>📥</span> Sinkron Fase C
            </button>
          </div>
        )}

        {activeTab === 'numerasi' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cari judul soal numerasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-700 w-36 sm:w-52"
            />
            <button
              onClick={handleOpenNewFaseCNumeracy}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Buat soal matematika aplikatif baru khusus jenjang Fase C (Kelas 5-6 SD)"
            >
              <span>⭐</span> + Soal Fase C (Kls 5-6)
            </button>
            <button
              onClick={handleOpenNewNumeracy}
              className="px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>➕</span> Tambah Soal
            </button>
            <button
              onClick={handleSeedFaseCContent}
              className="hidden lg:flex px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold items-center gap-1 cursor-pointer shadow-2xs"
              title="Muat soal kurikulum resmi Fase C ke Firebase"
            >
              <span>📥</span> Sinkron Fase C
            </button>
          </div>
        )}

        {activeTab === 'trash' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cari data terhapus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-700 w-36 sm:w-52"
            />
            {trashItems.length > 0 && (
              <>
                <button
                  onClick={handleRestoreAllTrash}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Kembalikan semua data yang ada di kotak sampah"
                >
                  <span>🔄</span> Pulihkan Semua ({trashItems.length})
                </button>
                <button
                  onClick={handleClearAllTrash}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>🗑️</span> Kosongkan Sampah
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama siswa atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 w-48 sm:w-60"
            />
            <button
              onClick={handleOpenRegisterStudent}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>➕</span> Daftarkan Siswa Baru
            </button>
            <button
              onClick={handleSeedDemoStudents}
              className="hidden lg:flex px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold items-center gap-1 cursor-pointer"
              title="Muat data daftar siswa kelas contoh"
            >
              <span>📥</span> Contoh Kelas
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Muat ulang konten standar Kurikulum Merdeka ke Firebase"
          >
            <span>📥</span> Pulihkan Materi Standar AKM
          </button>
        )}
      </div>

      {/* Fase SD Filter Chips Row (Only for Literasi and Numerasi tabs) */}
      {(activeTab === 'literasi' || activeTab === 'numerasi') && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-2 shrink-0 flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Filter Jenjang SD:</span>
          {(['all', 'fase-a', 'fase-b', 'fase-c'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedFaseFilter(lvl)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFaseFilter === lvl
                  ? lvl === 'fase-c'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lvl === 'all'
                ? 'Semua SD'
                : lvl === 'fase-a'
                ? 'Fase A (Kls 1-2)'
                : lvl === 'fase-b'
                ? 'Fase B (Kls 3-4)'
                : '⭐ Fase C (Kls 5-6)'}
            </button>
          ))}
          {selectedFaseFilter === 'fase-c' && (
            <span className="text-[11px] text-teal-800 bg-teal-100 font-bold px-2 py-0.5 rounded-md ml-auto">
              ✓ Menampilkan materi khusus SD Fase C (Kelas 5 & 6)
            </span>
          )}
        </div>
      )}

      {/* Main Body List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-36 sm:pb-44 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Menghubungkan ke database Firebase Firestore...</p>
          </div>
        ) : (
          <>
            {/* LITERASI TAB */}
            {activeTab === 'literasi' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Menampilkan <strong>{filteredPassages.length}</strong> bacaan tersimpan di Firestore
                  </span>
                  <span>Database: Cloud Firestore Collection <code>passages</code></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPassages.map((passage) => (
                    <div
                      key={passage.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                            {passage.levelLabel}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {passage.genreLabel}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                          {passage.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {passage.summary || passage.paragraphs?.[0]}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>⏱️ {passage.estimatedReadTimeMinutes} mnt</span>
                          <span>📝 {passage.paragraphs?.length || 0} paragraf</span>
                          <span>❓ {passage.questions?.length || 0} kuis</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditPassage(passage)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeletePassage(passage)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPassages.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-500 space-y-3 border border-slate-200">
                    <p className="text-sm">Tidak ada bacaan yang cocok dengan pencarian.</p>
                    <button
                      onClick={handleOpenNewPassage}
                      className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Buat Bacaan Baru Sekarang
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* NUMERASI TAB */}
            {activeTab === 'numerasi' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Menampilkan <strong>{filteredNumeracy.length}</strong> butir soal tersimpan di Firestore
                  </span>
                  <span>Database: Cloud Firestore Collection <code>questions</code></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNumeracy.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {q.levelLabel}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {q.domainLabel}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                          {q.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {q.stimulus?.text}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>🌐 {q.contextLabel}</span>
                          <span>🎯 {q.type}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditNumeracy(q)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNumeracy(q)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredNumeracy.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-500 space-y-3 border border-slate-200">
                    <p className="text-sm">Tidak ada soal numerasi yang cocok dengan pencarian.</p>
                    <button
                      onClick={handleOpenNewNumeracy}
                      className="px-4 py-2 bg-indigo-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Buat Soal Numerasi Baru
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* USERS / SISWA MANAGEMENT TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-4">
                    <span>
                      Total Siswa Terdata: <strong className="text-slate-900 font-bold">{users.length}</strong>
                    </span>
                    <span>
                      Koleksi Firestore: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">users</code>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Profil aktif saat ini: <strong className="text-teal-900">{currentStudentName || 'Budi Pratama'}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => {
                    const isCurrent = currentStudentName === user.studentName;
                    const quizCount = Object.keys(user.quizScores || {}).length;

                    return (
                      <div
                        key={user.id || user.studentName}
                        className={`bg-white rounded-2xl border p-5 space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all ${
                          isCurrent ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Student Card Top */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                                {user.avatar || '👦'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-black text-slate-900 text-base leading-snug">
                                    {user.studentName}
                                  </h3>
                                  {isCurrent && (
                                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                                      Aktif
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                                  {user.school || adminConfig.schoolName} · {user.gradeLevel || 'Kelas 4'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Poin</div>
                              <div className="text-xs font-black text-amber-600 font-mono">⭐ {user.totalPoints}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Streak</div>
                              <div className="text-xs font-black text-orange-600 font-mono">🔥 {user.streakCount || 0}h</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Literasi</div>
                              <div className="text-xs font-bold text-teal-800 font-mono">📖 {user.completedPassages?.length || 0}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Numerasi</div>
                              <div className="text-xs font-bold text-indigo-800 font-mono">🧮 {user.completedNumeracy?.length || 0}</div>
                            </div>
                          </div>

                          {/* Badges preview */}
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                              <span>Lencana ({user.earnedBadges?.length || 0}):</span>
                              <span className="text-[10px] text-slate-400">Riwayat Kuis: {quizCount}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(user.earnedBadges || []).slice(0, 5).map((bId) => {
                                const b = BADGES_DATA.find((item) => item.id === bId);
                                return (
                                  <span
                                    key={bId}
                                    title={b ? `${b.name}: ${b.description}` : bId}
                                    className="text-xs bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md"
                                  >
                                    {b ? b.icon : '🏅'} {b ? b.name : bId}
                                  </span>
                                );
                              })}
                              {(user.earnedBadges || []).length > 5 && (
                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 font-bold">
                                  +{(user.earnedBadges || []).length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          {!isCurrent && onSelectStudentProfile ? (
                            <button
                              onClick={() => handleSelectStudentAsActive(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors cursor-pointer"
                              title="Pilih akun siswa ini sebagai pengguna aktif di aplikasi"
                            >
                              🎒 Jadikan Aktif
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              ✓ Akun Terpilih
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                              title="Edit Profil & Poin Bintang"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleResetStudentProgress(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
                              title="Reset nilai & modul selesai (untuk remedial)"
                            >
                              🔄 Reset
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id || user.studentName, user.studentName)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Hapus akun siswa dari Firebase"
                              aria-label={`Hapus akun siswa ${user.studentName}`}
                            >
                              <span>🗑️</span>
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-500 space-y-3 border border-slate-200">
                    <p className="text-sm">Tidak ada siswa yang cocok dengan pencarian.</p>
                    <button
                      onClick={handleOpenRegisterStudent}
                      className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Daftarkan Siswa Baru Sekarang
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* KOTAK SAMPAH & PEMULIHAN TAB */}
            {activeTab === 'trash' && (
              <div className="space-y-4">
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0">
                      🗑️
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Arsip Data Terhapus & Fitur Pemulihan
                      </h3>
                      <p className="text-xs text-slate-600">
                        Jika Anda tidak sengaja menghapus bacaan, soal numerasi, atau akun siswa, klik <strong>"Pulihkan Data"</strong> untuk mengembalikannya ke sistem secara utuh.
                      </p>
                    </div>
                  </div>
                  {trashItems.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleRestoreAllTrash}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <span>🔄</span> Pulihkan Semua ({trashItems.length})
                      </button>
                      <button
                        onClick={handleClearAllTrash}
                        className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Menampilkan <strong>{filteredTrash.length}</strong> data terarsip di Kotak Sampah
                  </span>
                  <span>Disimpan di memori pengaman & pemulihan cepat</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTrash.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md ${
                              item.type === 'literasi'
                                ? 'bg-teal-50 text-teal-800'
                                : item.type === 'numerasi'
                                ? 'bg-indigo-50 text-indigo-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {item.type === 'literasi'
                              ? '📖 Bacaan Literasi'
                              : item.type === 'numerasi'
                              ? '🧮 Soal Numerasi'
                              : '👤 Akun Siswa'}
                          </span>
                          <span className="text-slate-400 font-medium">
                            Dihapus pk {item.deletedAt}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                          {item.title}
                        </h3>

                        {item.levelLabel && (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">Jenjang:</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                              {item.levelLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestoreTrashItem(item)}
                          className="flex-1 px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          title="Kembalikan data ini ke aplikasi"
                        >
                          <span>🔄</span> Pulihkan Data
                        </button>
                        <button
                          onClick={() => handlePermanentDeleteTrashItem(item.id, item.title)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                          title="Hapus permanen tanpa bisa dikembalikan lagi"
                        >
                          🗑️ Permanen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTrash.length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-500 space-y-3 border border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                      ✓
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Kotak Sampah Kosong</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Belum ada materi atau akun yang dihapus. Bila Anda kelak menghapus sesuatu, data akan tersimpan di sini dan siap dipulihkan kapan saja.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Pengaturan Identitas & PIN Guru</h2>
                  <p className="text-xs text-slate-500">
                    Atur PIN keamanan agar siswa tidak dapat sembarangan mengubah atau menghapus materi dan data kelas.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Sekolah / Madrasah:
                    </label>
                    <input
                      type="text"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Guru Pengampu / Admin:
                    </label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ubah PIN Admin (Kosongkan jika tidak ingin ganti):
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      placeholder="PIN baru (contoh: 654321)"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      PIN saat ini: <strong className="font-mono text-slate-700">{adminConfig.adminPin}</strong>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Simpan Pengaturan Portal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: PASSAGE EDITOR */}
      {isPassageEditorOpen && editingPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📖</span> Editor Teks Bacaan Literasi (Firebase)
              </h2>
              <button
                onClick={() => setIsPassageEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePassage} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Cerita / Bacaan:</label>
                  <input
                    type="text"
                    required
                    value={editingPassage.title || ''}
                    onChange={(e) => setEditingPassage({ ...editingPassage, title: e.target.value })}
                    placeholder="Contoh: Petualangan Kancil yang Bijak"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang / Fase (SD):</label>
                  <select
                    value={editingPassage.level}
                    onChange={(e) => {
                      const lvl = e.target.value as EducationLevel;
                      const labels: Record<EducationLevel, string> = {
                        'fase-a': 'Fase A (Kelas 1-2 SD)',
                        'fase-b': 'Fase B (Kelas 3-4 SD)',
                        'fase-c': 'Fase C (Kelas 5-6 SD)',
                      };
                      setEditingPassage({
                        ...editingPassage,
                        level: lvl,
                        levelLabel: labels[lvl],
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="fase-a">Fase A (Kelas 1-2 SD)</option>
                    <option value="fase-b">Fase B (Kelas 3-4 SD)</option>
                    <option value="fase-c">Fase C (Kelas 5-6 SD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Genre Teks:</label>
                  <select
                    value={editingPassage.genre}
                    onChange={(e) => {
                      const g = e.target.value as LiteracyGenre;
                      const labels: Record<LiteracyGenre, string> = {
                        fabel: 'Fabel & Cerita Hewan',
                        informasi: 'Teks Informasi & Sains',
                        budaya: 'Cerita Rakyat & Budaya',
                        sains: 'Sains & Lingkungan',
                        puisi: 'Puisi & Sastra Anak',
                      };
                      setEditingPassage({
                        ...editingPassage,
                        genre: g,
                        genreLabel: labels[g],
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="fabel">Fabel & Cerita Hewan</option>
                    <option value="informasi">Teks Informasi & Sains</option>
                    <option value="budaya">Cerita Rakyat & Budaya</option>
                    <option value="sains">Sains & Lingkungan</option>
                    <option value="puisi">Puisi & Sastra Anak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Baca (Menit):</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editingPassage.estimatedReadTimeMinutes || 3}
                    onChange={(e) =>
                      setEditingPassage({
                        ...editingPassage,
                        estimatedReadTimeMinutes: parseInt(e.target.value) || 3,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penulis / Sumber:</label>
                  <input
                    type="text"
                    value={editingPassage.authorOrSource || ''}
                    onChange={(e) =>
                      setEditingPassage({ ...editingPassage, authorOrSource: e.target.value })
                    }
                    placeholder="Contoh: Guru Kelas 4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan / Sinopsis:</label>
                <input
                  type="text"
                  value={editingPassage.summary || ''}
                  onChange={(e) => setEditingPassage({ ...editingPassage, summary: e.target.value })}
                  placeholder="Ringkasan singkat cerita dalam 1-2 kalimat..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Paragraf Bacaan (Pisahkan tiap paragraf dengan baris kosong):
                </label>
                <textarea
                  rows={6}
                  required
                  value={(editingPassage.paragraphs || []).join('\n\n')}
                  onChange={(e) => {
                    const paras = e.target.value
                      .split('\n\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const words = e.target.value.trim().split(/\s+/).length;
                    setEditingPassage({
                      ...editingPassage,
                      paragraphs: paras,
                      wordCount: words,
                    });
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  placeholder="Tuliskan isi cerita paragraf 1 di sini...&#10;&#10;Tuliskan paragraf 2 di sini..."
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Jumlah kata terdeteksi: {editingPassage.wordCount || 0} kata
                </p>
              </div>

              {/* Vocabulary / Glosarium Editor */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950">Glosarium Kosakata Sulit:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const vocabs = editingPassage.vocabulary || [];
                      setEditingPassage({
                        ...editingPassage,
                        vocabulary: [
                          ...vocabs,
                          { word: '', meaning: '', example: '' },
                        ],
                      });
                    }}
                    className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                  >
                    + Tambah Kata
                  </button>
                </div>

                {(editingPassage.vocabulary || []).map((v, vIdx) => (
                  <div key={vIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-teal-100">
                    <input
                      type="text"
                      placeholder="Kata (contoh: Konservasi)"
                      value={v.word}
                      onChange={(e) => {
                        const next = [...(editingPassage.vocabulary || [])];
                        next[vIdx].word = e.target.value;
                        setEditingPassage({ ...editingPassage, vocabulary: next });
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Arti kata"
                      value={v.meaning}
                      onChange={(e) => {
                        const next = [...(editingPassage.vocabulary || [])];
                        next[vIdx].meaning = e.target.value;
                        setEditingPassage({ ...editingPassage, vocabulary: next });
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Contoh kalimat"
                        value={v.example}
                        onChange={(e) => {
                          const next = [...(editingPassage.vocabulary || [])];
                          next[vIdx].example = e.target.value;
                          setEditingPassage({ ...editingPassage, vocabulary: next });
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (editingPassage.vocabulary || []).filter((_, i) => i !== vIdx);
                          setEditingPassage({ ...editingPassage, vocabulary: next });
                        }}
                        className="text-red-500 hover:text-red-700 px-2 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Questions Editor */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Butir Soal Asesmen AKM ({editingPassage.questions?.length || 0}):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const qs = editingPassage.questions || [];
                      const newQ = {
                        id: `q-${Date.now()}-${qs.length + 1}`,
                        type: 'single-choice' as const,
                        question: '',
                        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                        correctAnswers: 'Pilihan A',
                        explanation: '',
                        cognitiveLevel: 'Menemukan Informasi (L1)' as const,
                      };
                      setEditingPassage({ ...editingPassage, questions: [...qs, newQ] });
                    }}
                    className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                  >
                    + Tambah Soal
                  </button>
                </div>

                {(editingPassage.questions || []).map((q, qIdx) => (
                  <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Soal #{qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = (editingPassage.questions || []).filter((_, i) => i !== qIdx);
                          setEditingPassage({ ...editingPassage, questions: next });
                        }}
                        className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Hapus Soal ✕
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Tuliskan pertanyaan pemahaman AKM..."
                      value={q.question}
                      onChange={(e) => {
                        const next = [...(editingPassage.questions || [])];
                        next[qIdx].question = e.target.value;
                        setEditingPassage({ ...editingPassage, questions: next });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold">Level Kognitif AKM:</label>
                        <select
                          value={q.cognitiveLevel}
                          onChange={(e) => {
                            const next = [...(editingPassage.questions || [])];
                            next[qIdx].cognitiveLevel = e.target.value as any;
                            setEditingPassage({ ...editingPassage, questions: next });
                          }}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Menemukan Informasi (L1)">Menemukan Informasi (L1)</option>
                          <option value="Memahami & Interpretasi (L2)">Memahami & Interpretasi (L2)</option>
                          <option value="Mengevaluasi & Merefleksi (L3)">Mengevaluasi & Merefleksi (L3)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-bold">Kunci Jawaban Benar:</label>
                        <input
                          type="text"
                          placeholder="Harus sama persis dengan salah satu opsi"
                          value={q.correctAnswers as string}
                          onChange={(e) => {
                            const next = [...(editingPassage.questions || [])];
                            next[qIdx].correctAnswers = e.target.value;
                            setEditingPassage({ ...editingPassage, questions: next });
                          }}
                          className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">Opsi Pilihan (Pisahkan dengan tanda koma):</label>
                      <input
                        type="text"
                        placeholder="Opsi A, Opsi B, Opsi C, Opsi D"
                        value={(q.options || []).join(', ')}
                        onChange={(e) => {
                          const next = [...(editingPassage.questions || [])];
                          next[qIdx].options = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          setEditingPassage({ ...editingPassage, questions: next });
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Pembahasan ringkas jawaban..."
                      value={q.explanation || ''}
                      onChange={(e) => {
                        const next = [...(editingPassage.questions || [])];
                        next[qIdx].explanation = e.target.value;
                        setEditingPassage({ ...editingPassage, questions: next });
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>

              {/* Save / Cancel Bar */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPassageEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Bacaan ke Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUMERACY EDITOR */}
      {isNumeracyEditorOpen && editingNumeracy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🧮</span> Editor Soal Numerasi Kontekstual (Firebase)
              </h2>
              <button
                onClick={() => setIsNumeracyEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNumeracy} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Soal Asesmen:</label>
                  <input
                    type="text"
                    required
                    value={editingNumeracy.title || ''}
                    onChange={(e) => setEditingNumeracy({ ...editingNumeracy, title: e.target.value })}
                    placeholder="Contoh: Menghitung Biaya Belanja Pasar Tradisional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang / Fase (SD):</label>
                  <select
                    value={editingNumeracy.level}
                    onChange={(e) => {
                      const lvl = e.target.value as EducationLevel;
                      const labels: Record<EducationLevel, string> = {
                        'fase-a': 'Fase A (Kelas 1-2 SD)',
                        'fase-b': 'Fase B (Kelas 3-4 SD)',
                        'fase-c': 'Fase C (Kelas 5-6 SD)',
                      };
                      setEditingNumeracy({
                        ...editingNumeracy,
                        level: lvl,
                        levelLabel: labels[lvl],
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  >
                    <option value="fase-a">Fase A (Kelas 1-2 SD)</option>
                    <option value="fase-b">Fase B (Kelas 3-4 SD)</option>
                    <option value="fase-c">Fase C (Kelas 5-6 SD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Domain AKM:</label>
                  <select
                    value={editingNumeracy.domain}
                    onChange={(e) => {
                      const dom = e.target.value as NumeracyDomain;
                      const labels: Record<NumeracyDomain, string> = {
                        bilangan: 'Bilangan & Operasi',
                        geometri: 'Geometri & Pengukuran',
                        aljabar: 'Aljabar & Pola',
                        data: 'Data & Ketidakpastian',
                      };
                      setEditingNumeracy({
                        ...editingNumeracy,
                        domain: dom,
                        domainLabel: labels[dom],
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  >
                    <option value="bilangan">Bilangan & Operasi</option>
                    <option value="geometri">Geometri & Pengukuran</option>
                    <option value="aljabar">Aljabar & Pola</option>
                    <option value="data">Data & Ketidakpastian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Konteks AKM:</label>
                  <select
                    value={editingNumeracy.context}
                    onChange={(e) => {
                      const ctx = e.target.value as NumeracyContext;
                      const labels: Record<NumeracyContext, string> = {
                        personal: 'Personal & Keseharian',
                        'sosial-budaya': 'Sosial & Budaya',
                        saintifik: 'Saintifik & Lingkungan',
                      };
                      setEditingNumeracy({
                        ...editingNumeracy,
                        context: ctx,
                        contextLabel: labels[ctx],
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  >
                    <option value="personal">Personal & Keseharian</option>
                    <option value="sosial-budaya">Sosial & Budaya</option>
                    <option value="saintifik">Saintifik & Lingkungan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Soal:</label>
                  <select
                    value={editingNumeracy.type}
                    onChange={(e) => {
                      setEditingNumeracy({
                        ...editingNumeracy,
                        type: e.target.value as any,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  >
                    <option value="single-choice">Pilihan Ganda Tunggal</option>
                    <option value="numeric">Isian Angka (Numeric)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Narasi Stimulus Kontekstual:</label>
                <textarea
                  rows={4}
                  required
                  value={editingNumeracy.stimulus?.text || ''}
                  onChange={(e) =>
                    setEditingNumeracy({
                      ...editingNumeracy,
                      stimulus: {
                        ...(editingNumeracy.stimulus || { chartType: 'table' }),
                        text: e.target.value,
                      },
                    })
                  }
                  placeholder="Ceritakan latar situasi nyata (misal harga belanja di pasar, jadwal kereta, resep kue, dll)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan Soal:</label>
                <input
                  type="text"
                  required
                  value={editingNumeracy.question || ''}
                  onChange={(e) => setEditingNumeracy({ ...editingNumeracy, question: e.target.value })}
                  placeholder="Berapakah selisih biaya antara paket A dan paket B?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                />
              </div>

              {editingNumeracy.type === 'single-choice' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Opsi Pilihan Ganda (Pisahkan dengan koma):
                  </label>
                  <input
                    type="text"
                    value={(editingNumeracy.options || []).join(', ')}
                    onChange={(e) =>
                      setEditingNumeracy({
                        ...editingNumeracy,
                        options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Contoh: 15.000, 20.000, 25.000, 30.000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban Benar:</label>
                  <input
                    type="text"
                    required
                    value={String(editingNumeracy.correctAnswer ?? '')}
                    onChange={(e) => {
                      const val = editingNumeracy.type === 'numeric'
                        ? parseFloat(e.target.value) || e.target.value
                        : e.target.value;
                      setEditingNumeracy({ ...editingNumeracy, correctAnswer: val });
                    }}
                    placeholder="Kunci jawaban tepat"
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Petunjuk Belajar (Hint):</label>
                  <input
                    type="text"
                    value={editingNumeracy.hint || ''}
                    onChange={(e) => setEditingNumeracy({ ...editingNumeracy, hint: e.target.value })}
                    placeholder="Petunjuk rumus atau strategi cepat..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Langkah Penyelesaian (Tiap baris satu langkah):
                </label>
                <textarea
                  rows={3}
                  value={(editingNumeracy.stepByStepSolution || []).join('\n')}
                  onChange={(e) =>
                    setEditingNumeracy({
                      ...editingNumeracy,
                      stepByStepSolution: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  placeholder="Langkah 1: Identifikasi data belanja...&#10;Langkah 2: Kalikan harga dengan jumlah..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-700"
                />
              </div>

              {/* Save / Cancel Bar */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNumeracyEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Soal ke Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW STUDENT */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🎒</span> Daftarkan Akun Siswa Baru
              </h2>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.studentName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, studentName: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sekolah / Madrasah:</label>
                  <input
                    type="text"
                    value={newStudentForm.school}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, school: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang / Kelas (SD):</label>
                  <select
                    value={newStudentForm.gradeLevel}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, gradeLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Kelas 1-2 (Fase A)">Kelas 1-2 (Fase A)</option>
                    <option value="Kelas 3-4 (Fase B)">Kelas 3-4 (Fase B)</option>
                    <option value="Kelas 5-6 (Fase C)">Kelas 5-6 (Fase C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Avatar Siswa:</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewStudentForm({ ...newStudentForm, avatar: av })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                        newStudentForm.avatar === av
                          ? 'bg-emerald-100 border-2 border-emerald-600 scale-105'
                          : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skor Bintang Awal:</label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={newStudentForm.initialPoints}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, initialPoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Daftarkan Siswa ke Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT PROFILE & POINTS */}
      {isUserEditorOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>✏️</span> Edit Profil, Poin, & Lencana Siswa
              </h2>
              <button
                onClick={() => setIsUserEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Siswa:</label>
                <input
                  type="text"
                  required
                  value={editingUser.studentName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, studentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sekolah / Madrasah:</label>
                  <input
                    type="text"
                    value={editingUser.school || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, school: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Fase:</label>
                  <input
                    type="text"
                    value={editingUser.gradeLevel || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, gradeLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Avatar:</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, avatar: av })}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                        editingUser.avatar === av
                          ? 'bg-emerald-100 border-2 border-emerald-600 scale-105'
                          : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Total Poin Bintang (⭐):</label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={editingUser.totalPoints ?? 0}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, totalPoints: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Streak Hari Belajar (🔥):</label>
                  <input
                    type="number"
                    min={0}
                    value={editingUser.streakCount ?? 0}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, streakCount: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950"
                  />
                </div>
              </div>

              {/* Badges manager */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Lencana Penghargaan Siswa:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {BADGES_DATA.map((badge) => {
                    const hasBadge = (editingUser.earnedBadges || []).includes(badge.id);
                    return (
                      <label
                        key={badge.id}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                          hasBadge ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={hasBadge}
                          onChange={(e) => {
                            const cur = editingUser.earnedBadges || [];
                            const next = e.target.checked
                              ? [...cur, badge.id]
                              : cur.filter((id) => id !== badge.id);
                            setEditingUser({ ...editingUser, earnedBadges: next });
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{badge.icon}</span>
                        <span className="truncate">{badge.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUserEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Perubahan ke Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Undo Notification Toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base">🗑️</span>
            <span className="font-semibold">{undoToast.message}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRestoreTrashItem(undoToast.item)}
              className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <span>↶</span> Kembalikan (Undo)
            </button>
            <button
              onClick={() => setUndoToast(null)}
              className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
              title="Tutup pemberitahuan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Custom In-App Confirmation Modal with explicit Ya & Tidak (Iframe & Sandbox Safe) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {confirmDialog.isDestructive ? '🗑️' : '⚠️'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Konfirmasi Tindakan</p>
              </div>
            </div>

            {/* Target Item Details Box */}
            {confirmDialog.itemTitle && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">{confirmDialog.itemTypeLabel || 'Data'}</span>
                  {confirmDialog.itemLevelLabel && (
                    <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-bold">
                      {confirmDialog.itemLevelLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 line-clamp-2">
                  "{confirmDialog.itemTitle}"
                </p>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>

            {confirmDialog.isDestructive && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                <span>💡</span>
                <span>
                  Tenang, data akan disimpan di <strong>Kotak Sampah & Pemulihan</strong> dan dapat dikembalikan kapan saja.
                </span>
              </div>
            )}

            {/* Dua Pilihan Jelas: TIDAK vs YA */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              {/* Pilihan TIDAK */}
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={() => {
                  soundFx.playClick();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {confirmDialog.cancelLabel || '✕ Tidak, Batalkan'}
              </button>

              {/* Pilihan YA */}
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={async () => {
                  setIsConfirmLoading(true);
                  soundFx.playClick();
                  try {
                    await confirmDialog.onConfirm();
                  } finally {
                    setIsConfirmLoading(false);
                    setConfirmDialog(null);
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-teal-800 hover:bg-teal-900'
                }`}
              >
                {isConfirmLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{confirmDialog.confirmLabel || '✓ Ya, Lanjutkan'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
