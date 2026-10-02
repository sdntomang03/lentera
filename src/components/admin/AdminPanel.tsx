import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  LiteracyPassage,
  LiteracyQuestion,
  NumeracyQuestion,
  EducationLevel,
  LiteracyGenre,
  NumeracyDomain,
  NumeracyContext,
  ReadingPracticeItem,
  UserProgress,
  SUPPORTED_GRADE_LEVEL_OPTIONS,
} from '../../types';
import { BADGES_DATA } from '../../data/badgesData';
import {
  fetchPassagesFromApi,
  savePassageToApi,
  deletePassageFromApi,
  fetchNumeracyFromApi,
  saveNumeracyToApi,
  deleteNumeracyFromApi,
  fetchReadingPracticeFromApi,
  saveReadingPracticeToApi,
  deleteReadingPracticeFromApi,
  seedDefaultPassages,
  seedDefaultNumeracy,
  seedFaseCContentToApi,
  fetchAdminPortalConfig,
  saveAdminPortalConfig,
  AdminPortalConfig,
  fetchAllUsersFromApi,
  saveUserToApi,
  createStudentFromAdmin,
  deleteUserFromApi,
} from '../../services/contentService';
import { soundFx } from '../../utils/audio';
import { generateLiteracyPassage, generateNumeracyQuestion } from '../../services/aiContentService';
import { createSchoolTeacher, fetchSchoolTeachers, SchoolTeacherAccount } from '../../services/authService';
import { ApiError } from '../../services/apiClient';

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
  isTeacher: boolean;
  teacherWorkspace?: boolean;
  currentStudentName?: string;
  onSelectStudentProfile?: (student: UserProgress) => void;
}

const AVATAR_OPTIONS = ['👦', '👧', '🧑', '🎒', '🦉', '🦊', '🚀', '⭐', '📚', '🎨', '🌟', '🦁'];

interface ReadingPracticeDraft {
  id: string;
  kind: ReadingPracticeItem['kind'];
  word: string;
  syllablesText: string;
  image: string;
  options: string[];
  sentence: string;
}

const emptyReadingPracticeDraft = (): ReadingPracticeDraft => ({
  id: `reading-a-${Date.now()}`,
  kind: 'syllable',
  word: '',
  syllablesText: '',
  image: '',
  options: ['', '', '', ''],
  sentence: '',
});

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onContentUpdated,
  onClose,
  isTeacher,
  teacherWorkspace = false,
  currentStudentName,
  onSelectStudentProfile,
}) => {
  const [adminConfig, setAdminConfig] = useState<AdminPortalConfig>({
    schoolName: 'SD Negeri Nusantara',
    teacherName: 'Guru Penggerak',
  });

  // Admin tabs: 'dashboard' | 'literasi' | 'numerasi' | 'reading-practice' | 'users' | 'trash' | 'settings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'literasi' | 'numerasi' | 'reading-practice' | 'users' | 'trash' | 'settings'>(
    teacherWorkspace ? 'dashboard' : 'literasi',
  );

  // Fase Filter for SD (fase-a, fase-b, fase-c)
  const [selectedFaseFilter, setSelectedFaseFilter] = useState<'all' | EducationLevel>('all');

  // Content state
  const [passages, setPassages] = useState<LiteracyPassage[]>([]);
  const [numeracyList, setNumeracyList] = useState<NumeracyQuestion[]>([]);
  const [readingPracticeItems, setReadingPracticeItems] = useState<ReadingPracticeItem[]>([]);
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [teachers, setTeachers] = useState<SchoolTeacherAccount[]>([]);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherDraft, setTeacherDraft] = useState({ teacherName: '', username: '', password: '' });
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [readingPracticeDraft, setReadingPracticeDraft] = useState<ReadingPracticeDraft | null>(null);
  const [isSavingReadingPractice, setIsSavingReadingPractice] = useState(false);

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
  const [isGeneratingPassage, setIsGeneratingPassage] = useState<boolean>(false);

  // Numeracy Editor Modal
  const [isNumeracyEditorOpen, setIsNumeracyEditorOpen] = useState<boolean>(false);
  const [editingNumeracy, setEditingNumeracy] = useState<Partial<NumeracyQuestion> | null>(null);
  const [isGeneratingNumeracy, setIsGeneratingNumeracy] = useState<boolean>(false);

  // User Editor Modal
  const [isUserEditorOpen, setIsUserEditorOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProgress> | null>(null);

  // New Student Quick Modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [newStudentForm, setNewStudentForm] = useState<{
    studentName: string;
    username: string;
    password: string;
    school: string;
    gradeLevel: string;
    avatar: string;
    initialPoints: number;
  }>({
    studentName: '',
    username: '',
    password: '',
    school: '',
    gradeLevel: 'Kelas 4 (Fase B)',
    avatar: '👦',
    initialPoints: 120,
  });

  // Settings form state
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
    if (isTeacher) void loadData();
  }, [isTeacher]);

  const loadAdminConfig = async () => {
    try {
      const cfg = await fetchAdminPortalConfig();
      setAdminConfig(cfg);
      setNewSchoolName(cfg.schoolName);
      setNewTeacherName(cfg.teacherName);
      setNewStudentForm((prev) => ({ ...prev, school: cfg.schoolName }));
    } catch (error) {
      console.error('Failed to load portal settings from Database:', error);
      showError('Gagal memuat pengaturan portal dari Database.');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, nData, readingData, uData, teacherData] = await Promise.all([
        fetchPassagesFromApi(),
        fetchNumeracyFromApi(),
        fetchReadingPracticeFromApi(),
        fetchAllUsersFromApi(),
        fetchSchoolTeachers(),
      ]);
      setPassages(pData);
      setNumeracyList(nData);
      setReadingPracticeItems(readingData);
      setUsers(uData);
      setTeachers(teacherData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui.';
      console.error('Failed to load content from Database:', err);
      showError(`Gagal memuat konten dan data siswa dari Database: ${message}`);
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

  const handleCreateTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingTeacher(true);
    try {
      const teacher = await createSchoolTeacher({
        ...teacherDraft,
        teacherName: teacherDraft.teacherName.trim(),
        username: teacherDraft.username.trim().toLowerCase(),
      });
      setTeachers((current) => [...current, teacher].sort((a, b) => a.teacherName.localeCompare(b.teacherName)));
      setTeacherDraft({ teacherName: '', username: '', password: '' });
      setShowTeacherForm(false);
      showNotification('Akun guru berhasil ditambahkan ke sekolah ini.');
    } catch (error) {
      console.error('Failed to create school teacher:', error);
      showError(error instanceof Error ? `Gagal membuat akun guru: ${error.message}` : 'Gagal membuat akun guru.');
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const openReadingPracticeDraft = (item?: ReadingPracticeItem) => {
    if (!item) {
      setReadingPracticeDraft(emptyReadingPracticeDraft());
      return;
    }

    setReadingPracticeDraft({
      id: item.id,
      kind: item.kind,
      word: item.kind === 'sentence' ? '' : item.word,
      syllablesText: item.kind === 'syllable' ? item.syllables.join(' ') : '',
      image: item.kind === 'syllable' ? '' : item.image,
      options: item.kind === 'word-image' ? [...item.options] : ['', '', '', ''],
      sentence: item.kind === 'sentence' ? item.sentence : '',
    });
  };

  const handleSaveReadingPractice = async () => {
    if (!readingPracticeDraft || isSavingReadingPractice) return;
    const { id, kind } = readingPracticeDraft;
    let item: ReadingPracticeItem;

    if (kind === 'syllable') {
      const syllables = readingPracticeDraft.syllablesText.trim().split(/\s+/).filter(Boolean);
      if (!readingPracticeDraft.word.trim() || syllables.length < 2) {
        showError('Isi kata dan minimal dua suku kata yang dipisahkan spasi.');
        return;
      }
      item = { id, kind, word: readingPracticeDraft.word.trim(), syllables };
    } else if (kind === 'word-image') {
      const options = readingPracticeDraft.options.map((option) => option.trim());
      if (!readingPracticeDraft.word.trim() || !readingPracticeDraft.image.trim() || options.some((option) => !option)) {
        showError('Isi kata, gambar/emoji jawaban, dan keempat pilihan gambar.');
        return;
      }
      if (!options.includes(readingPracticeDraft.image.trim())) {
        showError('Gambar/emoji jawaban harus sama dengan salah satu pilihan.');
        return;
      }
      item = {
        id,
        kind,
        word: readingPracticeDraft.word.trim(),
        image: readingPracticeDraft.image.trim(),
        options,
      };
    } else {
      if (!readingPracticeDraft.sentence.trim() || !readingPracticeDraft.image.trim()) {
        showError('Isi kalimat pendek dan gambar/emoji yang sesuai.');
        return;
      }
      item = {
        id,
        kind,
        sentence: readingPracticeDraft.sentence.trim(),
        image: readingPracticeDraft.image.trim(),
      };
    }

    setIsSavingReadingPractice(true);
    try {
      await saveReadingPracticeToApi(item);
      setReadingPracticeItems((current) => [
        ...current.filter((entry) => entry.id !== item.id),
        item,
      ]);
      setReadingPracticeDraft(null);
      showNotification('Latihan Membaca Fase A berhasil disimpan ke database.');
      onContentUpdated();
    } catch (error) {
      console.error('Failed to save Fase A reading practice to Database:', error);
      showError(error instanceof Error ? `Gagal menyimpan latihan: ${error.message}` : 'Gagal menyimpan latihan membaca ke database.');
    } finally {
      setIsSavingReadingPractice(false);
    }
  };

  const handleDeleteReadingPractice = (item: ReadingPracticeItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Latihan Membaca Fase A',
      itemTitle: item.kind === 'sentence' ? item.sentence : item.word,
      itemTypeLabel: item.kind === 'syllable' ? 'Latihan Suku Kata' : item.kind === 'word-image' ? 'Latihan Kata & Gambar' : 'Kalimat Pendek',
      message: 'Materi ini akan dihapus dari database dan tidak lagi muncul di latihan siswa.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteReadingPracticeFromApi(item.id);
          setReadingPracticeItems((current) => current.filter((entry) => entry.id !== item.id));
          showNotification('Latihan membaca berhasil dihapus.');
          onContentUpdated();
        } catch (error) {
          console.error('Failed to delete Fase A reading practice from Database:', error);
          showError(error instanceof Error ? `Gagal menghapus latihan: ${error.message}` : 'Gagal menghapus latihan membaca dari database.');
        }
      },
    });
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
          await deletePassageFromApi(passage.id);
        } catch (err) {
          console.warn('Gagal menghapus dari Database, memperbarui state lokal:', err);
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
      await savePassageToApi(fullPassage);
      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`Bacaan "${fullPassage.title}" berhasil disimpan di Database!`);
      setIsPassageEditorOpen(false);
      setEditingPassage(null);
      await loadData();
      onContentUpdated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui.';
      showError(`Gagal menyimpan bacaan: ${message}`);
    }
  };

  const handleGeneratePassageWithAi = async () => {
    if (!editingPassage) return;
    soundFx.playClick();
    setIsGeneratingPassage(true);
    try {
      const generated = await generateLiteracyPassage({
        level: editingPassage.level || 'fase-b',
        title: editingPassage.title?.trim() || '',
        genre: editingPassage.genre || 'informasi',
      });
      setEditingPassage({
        ...generated,
        id: editingPassage.id || generated.id,
      });
      soundFx.playCorrect();
      showNotification('Bacaan, kosakata, kuis, kunci jawaban, dan pembahasan berhasil dibuat dengan DeepSeek AI. Periksa lalu simpan ke Database.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
      showError(`Gagal membuat bacaan dengan AI: ${message}`);
    } finally {
      setIsGeneratingPassage(false);
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
          await deleteNumeracyFromApi(q.id);
        } catch (err) {
          console.warn('Gagal menghapus soal dari Database, memperbarui state lokal:', err);
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
        await savePassageToApi(item.data);
        setPassages((prev) => [item.data, ...prev.filter((p) => p.id !== item.id)]);
      } else if (item.type === 'numerasi') {
        await saveNumeracyToApi(item.data);
        setNumeracyList((prev) => [item.data, ...prev.filter((q) => q.id !== item.id)]);
      } else if (item.type === 'user') {
        await saveUserToApi(item.data);
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
          await savePassageToApi(item.data);
        } else if (item.type === 'numerasi') {
          await saveNumeracyToApi(item.data);
        } else if (item.type === 'user') {
          await saveUserToApi(item.data);
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
      const res = await seedFaseCContentToApi();
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
      await saveNumeracyToApi(fullNumeracy);
      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`Soal "${fullNumeracy.title}" berhasil disimpan di Database!`);
      setIsNumeracyEditorOpen(false);
      setEditingNumeracy(null);
      await loadData();
      onContentUpdated();
    } catch (err) {
      showError('Gagal menyimpan ke database Database. Pastikan koneksi internet stabil.');
    }
  };

  const handleGenerateNumeracyWithAi = async () => {
    if (!editingNumeracy) return;
    soundFx.playClick();
    setIsGeneratingNumeracy(true);
    try {
      const generated = await generateNumeracyQuestion({
        level: editingNumeracy.level || 'fase-b',
        title: editingNumeracy.title?.trim() || '',
        domain: editingNumeracy.domain || 'bilangan',
        context: editingNumeracy.context || 'personal',
      });
      setEditingNumeracy({
        ...generated,
        id: editingNumeracy.id || generated.id,
      });
      soundFx.playCorrect();
      showNotification('Stimulus, soal, pilihan, kunci jawaban, petunjuk, dan pembahasan berhasil dibuat dengan DeepSeek AI. Periksa lalu simpan ke Database.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
      showError(`Gagal membuat soal numerasi dengan AI: ${message}`);
    } finally {
      setIsGeneratingNumeracy(false);
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenRegisterStudent = () => {
    soundFx.playClick();
    setNewStudentForm({
      studentName: '',
      username: '',
      password: '',
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
    if (!/^[a-zA-Z0-9_-]{3,40}$/.test(newStudentForm.username.trim())) {
      showError('Username harus 3–40 karakter dan hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung.');
      return;
    }
    if (newStudentForm.password.length < 8) {
      showError('Kata sandi siswa minimal 8 karakter.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newStudent: UserProgress = {
      studentName: newStudentForm.studentName.trim(),
      username: newStudentForm.username.trim().toLowerCase(),
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
      const studentId = await createStudentFromAdmin(newStudent, newStudentForm.password);
      soundFx.playCorrect();
      confetti({ particleCount: 60, spread: 70 });
      showNotification(`Siswa "${newStudent.studentName}" berhasil didaftarkan dengan username ${newStudent.username} (ID ${studentId}).`);
      setIsNewUserModalOpen(false);
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mendaftarkan siswa melalui API.');
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
      await saveUserToApi(fullUser);
      soundFx.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`Data siswa "${fullUser.studentName}" berhasil diperbarui di Database!`);
      setIsUserEditorOpen(false);
      setEditingUser(null);
      await loadData();
      if (currentStudentName === fullUser.studentName && onSelectStudentProfile) {
        onSelectStudentProfile(fullUser);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal memperbarui data siswa di Database.');
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
          await deleteUserFromApi(userId, name);
        } catch (err) {
          console.warn('Gagal menghapus akun siswa dari Database, memperbarui state lokal:', err);
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
          await saveUserToApi(resetUser);
        } catch (err) {
          console.warn('Gagal mereset siswa di Database:', err);
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

  // --- SEED DEFAULT RESTORE ---
  const handleResetDefaults = () => {
    soundFx.playClick();
    setConfirmDialog({
      isOpen: true,
      title: 'Sinkronisasi Materi Standar',
      message: 'Sinkronisasi ulang semua materi standar Kurikulum Merdeka ke database Database Anda?',
      confirmLabel: 'Ya, Sinkronkan',
      isDestructive: false,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await Promise.all([seedDefaultPassages(), seedDefaultNumeracy()]);
          await loadData();
          soundFx.playFanfare();
          showNotification('Materi standar Kurikulum Merdeka berhasil disinkronkan ke Database!');
          onContentUpdated();
        } catch (err) {
          showNotification('Gagal menyinkronkan materi ke Database.');
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
      schoolName: newSchoolName.trim() || 'SD Negeri Nusantara',
      teacherName: newTeacherName.trim() || 'Guru Penggerak',
    };
    try {
      await saveAdminPortalConfig(updated);
      setAdminConfig(updated);
      soundFx.playCorrect();
      showNotification('Pengaturan portal guru berhasil diperbarui!');
    } catch (err) {
      const message = err instanceof ApiError
        ? err.status === 401
          ? 'Sesi login telah berakhir. Silakan login kembali.'
          : err.message
        : err instanceof Error
          ? err.message
          : 'Terjadi kesalahan yang tidak diketahui.';
      showError(`Gagal menyimpan pengaturan: ${message}`);
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
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.school && u.school.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.gradeLevel && u.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- LOGIN SCREEN ---
  if (!isTeacher) {
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
              Panel ini hanya tersedia untuk akun guru yang telah masuk melalui Database.
            </p>
          </div>

          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-teal-800 text-white font-bold text-xs">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN INTERFACE ---
  return (
    <div className={teacherWorkspace
      ? 'min-h-screen w-full flex flex-col bg-slate-100'
      : 'fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-200'}>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center text-xl shadow-xs">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">
                {teacherWorkspace ? 'Ruang Kerja Guru' : 'Panel Kelola Konten & Pengguna'}
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Database Connected
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
            title="Muat Ulang Data dari Database"
          >
            <span>🔄</span> Segarkan
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {teacherWorkspace ? 'Keluar Akun' : 'Tutup Panel ✕'}
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
          {teacherWorkspace && (
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('dashboard');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏠 Dashboard
            </button>
          )}
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
              setActiveTab('reading-practice');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reading-practice'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔤 Latihan Membaca A ({readingPracticeItems.length})
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
          {!teacherWorkspace && <button
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
          </button>}
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
            🏫 Sekolah & Guru
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
              title="Muat konten kurikulum resmi Fase C ke Database"
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
              title="Muat soal kurikulum resmi Fase C ke Database"
            >
              <span>📥</span> Sinkron Fase C
            </button>
          </div>
        )}

        {activeTab === 'reading-practice' && (
          <button
            type="button"
            onClick={() => openReadingPracticeDraft()}
            className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>➕</span> Buat Latihan Fase A
          </button>
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
              placeholder="Cari nama, username, atau kelas..."
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
          </div>
        )}

        {activeTab === 'settings' && (
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Muat ulang konten standar Kurikulum Merdeka ke Database"
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
      <div className={teacherWorkspace
        ? 'flex-1 p-4 sm:p-8 pb-36 sm:pb-44 space-y-6'
        : 'flex-1 overflow-y-auto p-4 sm:p-8 pb-36 sm:pb-44 space-y-6'}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Menghubungkan ke database Database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
                  <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
                  <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Ringkasan Pengelolaan</p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                        Selamat datang, {adminConfig.teacherName}.
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                        Pantau materi, aktivitas, dan perkembangan siswa di {adminConfig.schoolName}.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-200">Pusat pembelajaran</div>
                      <div className="mt-1 font-semibold">Literasi · Numerasi · Prestasi Siswa</div>
                    </div>
                  </div>
                </section>

                <section aria-label="Ringkasan data pembelajaran" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: 'Siswa terdata', value: users.length, icon: '👥', color: 'text-emerald-700 bg-emerald-50' },
                    { label: 'Materi literasi', value: passages.length, icon: '📖', color: 'text-teal-700 bg-teal-50' },
                    { label: 'Soal numerasi', value: numeracyList.length, icon: '🧮', color: 'text-indigo-700 bg-indigo-50' },
                    {
                      label: 'Aktivitas selesai',
                      value: users.reduce(
                        (total, user) => total + (user.completedPassages?.length || 0) + (user.completedNumeracy?.length || 0),
                        0,
                      ),
                      icon: '✓',
                      color: 'text-amber-700 bg-amber-50',
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${stat.color}`}>{stat.icon}</span>
                      </div>
                      <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">{stat.value.toLocaleString('id-ID')}</div>
                    </div>
                  ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Siswa dengan Poin Tertinggi</h3>
                        <p className="mt-1 text-xs text-slate-500">Apresiasi untuk konsistensi dan partisipasi belajar.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900"
                      >
                        Kelola siswa →
                      </button>
                    </div>
                    {users.length > 0 ? (
                      <div className="mt-4 divide-y divide-slate-100">
                        {[...users]
                          .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                          .slice(0, 5)
                          .map((user, index) => (
                            <div key={user.id || user.studentName} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">{index + 1}</span>
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg">{user.avatar || '🎒'}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-bold text-slate-800">{user.studentName}</span>
                                <span className="mt-0.5 block text-[11px] text-slate-500">{user.gradeLevel || 'Jenjang belum diatur'}</span>
                              </span>
                              <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800">★ {(user.totalPoints || 0).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                        Data siswa belum tersedia. Siswa yang terdaftar akan muncul di sini.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <h3 className="text-base font-bold text-slate-900">Akses Cepat</h3>
                    <p className="mt-1 text-xs text-slate-500">Buka area pengelolaan yang dibutuhkan.</p>
                    <div className="mt-4 space-y-2">
                      {[
                        { tab: 'literasi' as const, icon: '📚', label: 'Kelola materi literasi', detail: `${passages.length} bacaan tersedia` },
                        { tab: 'numerasi' as const, icon: '🔢', label: 'Kelola soal numerasi', detail: `${numeracyList.length} soal tersedia` },
                        { tab: 'users' as const, icon: '👥', label: 'Pantau perkembangan siswa', detail: `${users.length} siswa terdata` },
                      ].map((item) => (
                        <button
                          key={item.tab}
                          type="button"
                          onClick={() => setActiveTab(item.tab)}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-colors hover:border-teal-200 hover:bg-teal-50/50"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">{item.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-slate-800">{item.label}</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">{item.detail}</span>
                          </span>
                          <span className="text-sm text-slate-400" aria-hidden="true">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'reading-practice' && (
              <div className="space-y-5">
                {readingPracticeDraft && (
                  <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {readingPracticeItems.some((item) => item.id === readingPracticeDraft.id)
                            ? 'Ubah Materi Latihan'
                            : 'Buat Materi Latihan Membaca'}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Materi disimpan ke database dan langsung tersedia pada Latihan Membaca Fase A siswa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReadingPracticeDraft(null)}
                        className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                      >
                        Batal
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-1 text-xs font-semibold text-slate-700">
                        Tahap latihan
                        <select
                          value={readingPracticeDraft.kind}
                          onChange={(event) => setReadingPracticeDraft((draft) => draft
                            ? { ...draft, kind: event.target.value as ReadingPracticeItem['kind'] }
                            : draft)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="syllable">Suku kata</option>
                          <option value="word-image">Kata & gambar</option>
                          <option value="sentence">Kalimat pendek</option>
                        </select>
                      </label>

                      {readingPracticeDraft.kind !== 'sentence' && (
                        <label className="space-y-1 text-xs font-semibold text-slate-700">
                          Kata
                          <input
                            value={readingPracticeDraft.word}
                            onChange={(event) => setReadingPracticeDraft((draft) => draft ? { ...draft, word: event.target.value } : draft)}
                            maxLength={80}
                            placeholder="Contoh: bola"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </label>
                      )}

                      {readingPracticeDraft.kind === 'syllable' && (
                        <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
                          Suku kata (pisahkan dengan spasi)
                          <input
                            value={readingPracticeDraft.syllablesText}
                            onChange={(event) => setReadingPracticeDraft((draft) => draft ? { ...draft, syllablesText: event.target.value } : draft)}
                            placeholder="Contoh: bo la"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </label>
                      )}

                      {readingPracticeDraft.kind === 'word-image' && (
                        <>
                          <label className="space-y-1 text-xs font-semibold text-slate-700">
                            Gambar jawaban (emoji)
                            <input
                              value={readingPracticeDraft.image}
                              onChange={(event) => setReadingPracticeDraft((draft) => draft ? { ...draft, image: event.target.value } : draft)}
                              maxLength={32}
                              placeholder="Contoh: ⚽"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </label>
                          <fieldset className="space-y-2 sm:col-span-2">
                            <legend className="text-xs font-semibold text-slate-700">Empat pilihan gambar (emoji)</legend>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {readingPracticeDraft.options.map((option, index) => (
                                <input
                                  key={index}
                                  value={option}
                                  onChange={(event) => setReadingPracticeDraft((draft) => {
                                    if (!draft) return draft;
                                    const options = [...draft.options];
                                    options[index] = event.target.value;
                                    return { ...draft, options };
                                  })}
                                  maxLength={32}
                                  aria-label={`Pilihan gambar ${index + 1}`}
                                  placeholder={`Pilihan ${index + 1}`}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500">Pastikan gambar jawaban juga ada di salah satu pilihan.</p>
                          </fieldset>
                        </>
                      )}

                      {readingPracticeDraft.kind === 'sentence' && (
                        <>
                          <label className="space-y-1 text-xs font-semibold text-slate-700">
                            Gambar pendamping (emoji)
                            <input
                              value={readingPracticeDraft.image}
                              onChange={(event) => setReadingPracticeDraft((draft) => draft ? { ...draft, image: event.target.value } : draft)}
                              maxLength={32}
                              placeholder="Contoh: 🐈"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </label>
                          <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
                            Kalimat pendek
                            <textarea
                              value={readingPracticeDraft.sentence}
                              onChange={(event) => setReadingPracticeDraft((draft) => draft ? { ...draft, sentence: event.target.value } : draft)}
                              maxLength={180}
                              rows={2}
                              placeholder="Contoh: Ini bola saya."
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </label>
                        </>
                      )}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleSaveReadingPractice()}
                        disabled={isSavingReadingPractice}
                        className="rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSavingReadingPractice ? 'Menyimpan...' : 'Simpan ke Database'}
                      </button>
                    </div>
                  </section>
                )}

                <section className="space-y-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Materi Latihan Fase A</h2>
                    <p className="mt-1 text-xs text-slate-500">Konten tersimpan: {readingPracticeItems.length} item.</p>
                  </div>
                  {readingPracticeItems.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {readingPracticeItems.map((item) => {
                        const title = item.kind === 'sentence' ? item.sentence : item.word;
                        const detail = item.kind === 'syllable'
                          ? `Suku kata: ${item.syllables.join(' · ')}`
                          : item.kind === 'word-image'
                            ? `Gambar jawaban: ${item.image}`
                            : `Gambar: ${item.image}`;
                        const label = item.kind === 'syllable' ? 'Suku kata' : item.kind === 'word-image' ? 'Kata & gambar' : 'Kalimat pendek';
                        return (
                          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="inline-flex rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-800">{label}</span>
                                <h3 className="mt-2 break-words text-sm font-bold text-slate-900">{title}</h3>
                                <p className="mt-1 text-xs text-slate-500">{detail}</p>
                              </div>
                              <span className="text-2xl" aria-hidden="true">{item.kind === 'sentence' || item.kind === 'word-image' ? item.image : '🔤'}</span>
                            </div>
                            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                              <button
                                type="button"
                                onClick={() => openReadingPracticeDraft(item)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              >
                                Ubah
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReadingPractice(item)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                              >
                                Hapus
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                      <div className="text-3xl">🔤</div>
                      <p className="mt-2 text-sm font-bold text-slate-800">Belum ada materi tambahan</p>
                      <p className="mt-1 text-xs text-slate-500">Buat latihan suku kata, pasangan kata dan gambar, atau kalimat pendek.</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* LITERASI TAB */}
            {activeTab === 'literasi' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Menampilkan <strong>{filteredPassages.length}</strong> bacaan tersimpan di Database
                  </span>
                  <span>Database: Cloud Database Collection <code>passages</code></span>
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
                    Menampilkan <strong>{filteredNumeracy.length}</strong> butir soal tersimpan di Database
                  </span>
                  <span>Database: Cloud Database Collection <code>questions</code></span>
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
                <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-2xs sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Guru di Sekolah Ini ({teachers.length})</h2>
                      <p className="mt-1 text-xs text-slate-500">Setiap guru hanya dapat mengakses data sekolah ini.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTeacherForm((visible) => !visible)}
                      className="rounded-xl bg-indigo-700 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-800"
                    >
                      {showTeacherForm ? 'Tutup Form' : '+ Tambah Guru'}
                    </button>
                  </div>
                  {showTeacherForm && (
                    <form onSubmit={handleCreateTeacher} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Nama guru
                        <input
                          required
                          maxLength={120}
                          value={teacherDraft.teacherName}
                          onChange={(event) => setTeacherDraft((draft) => ({ ...draft, teacherName: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">
                        Username
                        <input
                          required
                          minLength={3}
                          maxLength={40}
                          pattern="[A-Za-z0-9_-]{3,40}"
                          value={teacherDraft.username}
                          onChange={(event) => setTeacherDraft((draft) => ({ ...draft, username: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">
                        Kata sandi awal
                        <input
                          required
                          type="password"
                          minLength={8}
                          maxLength={72}
                          value={teacherDraft.password}
                          onChange={(event) => setTeacherDraft((draft) => ({ ...draft, password: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={isSavingTeacher}
                        className="self-end rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60"
                      >
                        {isSavingTeacher ? 'Membuat akun...' : 'Buat Akun Guru'}
                      </button>
                    </form>
                  )}
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center gap-3 rounded-xl bg-indigo-50/60 p-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">👨‍🏫</span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-800">{teacher.teacherName}</span>
                          <span className="block truncate text-[11px] text-slate-500">@{teacher.username}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-4">
                    <span>
                      Total Siswa Terdata: <strong className="text-slate-900 font-bold">{users.length}</strong>
                    </span>
                    <span>
                      Koleksi Database: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">users</code>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{teacherWorkspace ? `Daftar hanya menampilkan siswa dari ${adminConfig.schoolName}.` : <>Profil aktif saat ini: <strong className="text-teal-900">{currentStudentName || 'Belum dipilih'}</strong></>}</span>
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
                                <p className="text-[11px] text-slate-500">
                                  Username: <span className="font-semibold text-slate-700">{user.username || 'Belum tersedia'}</span>
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
                          {onSelectStudentProfile && !isCurrent ? (
                            <button
                              onClick={() => handleSelectStudentAsActive(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors cursor-pointer"
                              title="Pilih akun siswa ini sebagai pengguna aktif di aplikasi"
                            >
                              🎒 Jadikan Aktif
                            </button>
                          ) : onSelectStudentProfile ? (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              ✓ Akun Terpilih
                            </span>
                          ) : null}

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
                              title="Hapus akun siswa dari Database"
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
                  <h2 className="text-xl font-bold text-slate-900">Pengaturan Identitas Sekolah & Guru</h2>
                  <p className="text-xs text-slate-500">
                    Atur identitas sekolah dan guru yang ditampilkan pada portal pembelajaran.
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
                <span>📖</span> Editor Teks Bacaan Literasi (Database)
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
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                <div>
                  <p className="text-sm font-bold text-teal-950">Buat bacaan dan kuis otomatis</p>
                  <p className="mt-1 text-xs text-teal-800">AI menyiapkan teks, kosakata, 4 soal pilihan ganda, kunci, dan pembahasan.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePassageWithAi}
                  disabled={isGeneratingPassage}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-900 disabled:cursor-wait disabled:opacity-60"
                >
                  <span className={isGeneratingPassage ? 'animate-spin' : ''}>{isGeneratingPassage ? '⏳' : '✨'}</span>
                  {isGeneratingPassage ? 'AI sedang menulis...' : 'Buat dengan DeepSeek AI'}
                </button>
              </div>
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
                    Kuis Pemahaman Teks ({editingPassage.questions?.length || 0}):
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

                      {q.options?.length ? (
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Pilih Kunci Jawaban:</label>
                          <select
                            value={typeof q.correctAnswers === 'string' ? q.correctAnswers : ''}
                            onChange={(e) => {
                              const next = [...(editingPassage.questions || [])];
                              next[qIdx].correctAnswers = e.target.value;
                              setEditingPassage({ ...editingPassage, questions: next });
                            }}
                            className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950"
                          >
                            <option value="" disabled>Pilih jawaban benar</option>
                            {q.options.map((option, optionIdx) => (
                              <option key={`${q.id}-answer-${optionIdx}`} value={option}>
                                {String.fromCharCode(65 + optionIdx)}. {option || '(Opsi kosong)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Kunci Jawaban Benar:</label>
                          <input
                            type="text"
                            value={String(q.correctAnswers)}
                            onChange={(e) => {
                              const next = [...(editingPassage.questions || [])];
                              next[qIdx].correctAnswers = e.target.value;
                              setEditingPassage({ ...editingPassage, questions: next });
                            }}
                            className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">Opsi Pilihan (pilih radio untuk menetapkan kunci):</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {(q.options || []).map((option, optionIdx) => (
                          <div
                            key={`${q.id}-option-${optionIdx}`}
                            className={`flex items-center gap-2 rounded-xl border p-2 ${
                              q.correctAnswers === option
                                ? 'border-emerald-400 bg-emerald-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`literacy-answer-${q.id}`}
                              checked={q.correctAnswers === option}
                              aria-label={`Jadikan opsi ${String.fromCharCode(65 + optionIdx)} sebagai jawaban benar`}
                              onChange={() => {
                                const next = [...(editingPassage.questions || [])];
                                next[qIdx].correctAnswers = option;
                                setEditingPassage({ ...editingPassage, questions: next });
                              }}
                              className="h-4 w-4 accent-emerald-700"
                            />
                            <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + optionIdx)}.</span>
                            <input
                              type="text"
                              value={option}
                              aria-label={`Teks opsi ${String.fromCharCode(65 + optionIdx)}`}
                              onChange={(e) => {
                                const next = [...(editingPassage.questions || [])];
                                const previousOption = next[qIdx].options?.[optionIdx];
                                if (!next[qIdx].options) next[qIdx].options = [];
                                next[qIdx].options![optionIdx] = e.target.value;
                                if (next[qIdx].correctAnswers === previousOption) {
                                  next[qIdx].correctAnswers = e.target.value;
                                }
                                setEditingPassage({ ...editingPassage, questions: next });
                              }}
                              className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none"
                            />
                            {(q.options || []).length > 2 && (
                              <button
                                type="button"
                                aria-label={`Hapus opsi ${String.fromCharCode(65 + optionIdx)}`}
                                onClick={() => {
                                  const next = [...(editingPassage.questions || [])];
                                  const nextOptions = (next[qIdx].options || []).filter((_, idx) => idx !== optionIdx);
                                  next[qIdx].options = nextOptions;
                                  if (!nextOptions.includes(String(next[qIdx].correctAnswers))) {
                                    next[qIdx].correctAnswers = nextOptions[0] || '';
                                  }
                                  setEditingPassage({ ...editingPassage, questions: next });
                                }}
                                className="text-slate-400 hover:text-red-600"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={(q.options || []).length >= 6}
                        onClick={() => {
                          const next = [...(editingPassage.questions || [])];
                          const nextOptions = [...(next[qIdx].options || []), `Opsi ${(next[qIdx].options || []).length + 1}`];
                          next[qIdx].options = nextOptions;
                          setEditingPassage({ ...editingPassage, questions: next });
                        }}
                        className="mt-2 text-[11px] font-bold text-teal-800 hover:underline disabled:opacity-50"
                      >
                        + Tambah Opsi
                      </button>
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
                  Simpan Bacaan ke Database
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
                <span>🧮</span> Editor Soal Numerasi Kontekstual (Database)
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
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div>
                  <p className="text-sm font-bold text-indigo-950">Buat soal numerasi otomatis</p>
                  <p className="mt-1 text-xs text-indigo-800">AI menyiapkan stimulus, soal, empat opsi, kunci, petunjuk, dan pembahasan bertahap.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateNumeracyWithAi}
                  disabled={isGeneratingNumeracy}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-900 disabled:cursor-wait disabled:opacity-60"
                >
                  <span className={isGeneratingNumeracy ? 'animate-spin' : ''}>{isGeneratingNumeracy ? '⏳' : '✨'}</span>
                  {isGeneratingNumeracy ? 'AI sedang menyusun...' : 'Buat dengan DeepSeek AI'}
                </button>
              </div>
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
                    Opsi Pilihan Ganda (pilih radio untuk menetapkan kunci):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(editingNumeracy.options || []).map((option, optionIdx) => (
                      <div
                        key={`numeracy-option-${optionIdx}`}
                        className={`flex items-center gap-2 rounded-xl border p-3 ${
                          editingNumeracy.correctAnswer === option
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="numeracy-correct-answer"
                          checked={editingNumeracy.correctAnswer === option}
                          aria-label={`Jadikan opsi ${String.fromCharCode(65 + optionIdx)} sebagai jawaban benar`}
                          onChange={() => setEditingNumeracy({ ...editingNumeracy, correctAnswer: option })}
                          className="h-4 w-4 accent-emerald-700"
                        />
                        <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + optionIdx)}.</span>
                        <input
                          type="text"
                          value={option}
                          aria-label={`Teks opsi ${String.fromCharCode(65 + optionIdx)}`}
                          onChange={(e) => {
                            const options = [...(editingNumeracy.options || [])];
                            const previousOption = options[optionIdx];
                            options[optionIdx] = e.target.value;
                            setEditingNumeracy({
                              ...editingNumeracy,
                              options,
                              correctAnswer: editingNumeracy.correctAnswer === previousOption
                                ? e.target.value
                                : editingNumeracy.correctAnswer,
                            });
                          }}
                          className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none"
                        />
                        {(editingNumeracy.options || []).length > 2 && (
                          <button
                            type="button"
                            aria-label={`Hapus opsi ${String.fromCharCode(65 + optionIdx)}`}
                            onClick={() => {
                              const options = (editingNumeracy.options || []).filter((_, idx) => idx !== optionIdx);
                              setEditingNumeracy({
                                ...editingNumeracy,
                                options,
                                correctAnswer: options.includes(String(editingNumeracy.correctAnswer))
                                  ? editingNumeracy.correctAnswer
                                  : options[0] || '',
                              });
                            }}
                            className="text-slate-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={(editingNumeracy.options || []).length >= 6}
                    onClick={() => setEditingNumeracy({
                      ...editingNumeracy,
                      options: [...(editingNumeracy.options || []), `Opsi ${(editingNumeracy.options || []).length + 1}`],
                    })}
                    className="mt-2 text-[11px] font-bold text-indigo-800 hover:underline disabled:opacity-50"
                  >
                    + Tambah Opsi
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {editingNumeracy.type === 'single-choice' && (editingNumeracy.options || []).length > 0 ? (
                    <>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban Benar:</label>
                      <select
                        required
                        value={String(editingNumeracy.correctAnswer ?? '')}
                        onChange={(e) => setEditingNumeracy({ ...editingNumeracy, correctAnswer: e.target.value })}
                        className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value="" disabled>Pilih jawaban benar</option>
                        {(editingNumeracy.options || []).map((option, index) => (
                          <option key={`answer-option-${index}`} value={option}>
                            {String.fromCharCode(65 + index)}. {option || '(Opsi kosong)'}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  Simpan Soal ke Database
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username untuk masuk:</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  pattern="[A-Za-z0-9_-]{3,40}"
                  value={newStudentForm.username}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, username: e.target.value })}
                  placeholder="Contoh: farhan_2026"
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <p className="mt-1 text-[11px] text-slate-500">3–40 karakter: huruf, angka, garis bawah, atau tanda hubung.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata sandi awal (minimal 8 karakter):</label>
                <input
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  value={newStudentForm.password}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                  Daftarkan Siswa ke Database
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username untuk masuk:</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  pattern="[A-Za-z0-9_-]{3,40}"
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <p className="mt-1 text-[11px] text-slate-500">Username unik, 3–40 karakter: huruf, angka, garis bawah, atau tanda hubung.</p>
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
                  <select
                    value={editingUser.gradeLevel || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, gradeLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {SUPPORTED_GRADE_LEVEL_OPTIONS.map((gradeLevel) => (
                      <option key={gradeLevel} value={gradeLevel}>
                        {gradeLevel}
                      </option>
                    ))}
                  </select>
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
                  Simpan Perubahan ke Database
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
