import { NumeracyQuestion } from '../types';

export const NUMERACY_QUESTIONS: NumeracyQuestion[] = [
  {
    id: 'num-1',
    title: 'Pembagian Kue Tradisional Lapis Legit',
    level: 'fase-a',
    levelLabel: 'Fase A (Kelas 1 - 2)',
    domain: 'bilangan',
    domainLabel: 'Bilangan & Pecahan',
    context: 'personal',
    contextLabel: 'Konteks Personal',
    stimulus: {
      text: 'Ibu memotong satu loyang kue lapis legit yang berbentuk persegi panjang menjadi 8 bagian yang sama besar untuk dibagikan saat acara keluarga. Adik memakan 2 potong kue, dan Kakak memakan 3 potong kue.',
      chartType: 'pie',
      chartData: {
        total: 8,
        slices: [
          { label: 'Dimakan Adik (2)', value: 2, color: '#f59e0b' },
          { label: 'Dimakan Kakak (3)', value: 3, color: '#3b82f6' },
          { label: 'Sisa Kue (3)', value: 3, color: '#10b981' }
        ]
      }
    },
    type: 'single-choice',
    question: 'Berapa bagian kue lapis legit yang masih tersisa di piring?',
    options: [
      '2/8 bagian (atau 1/4 bagian)',
      '3/8 bagian',
      '5/8 bagian',
      '1/8 bagian'
    ],
    correctAnswer: '3/8 bagian',
    hint: 'Hitung total potongan yang sudah dimakan oleh Adik dan Kakak terlebih dahulu, lalu kurangkan dari total 8 potongan.',
    stepByStepSolution: [
      'Langkah 1: Total kue utuh = 8/8 bagian (8 potong).',
      'Langkah 2: Kue yang dimakan Adik = 2 potong; dimakan Kakak = 3 potong.',
      'Langkah 3: Jumlah kue yang sudah dimakan = 2 + 3 = 5 potong (5/8 bagian).',
      'Langkah 4: Sisa kue di piring = 8 - 5 = 3 potong, atau 3/8 bagian.'
    ],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-2',
    title: 'Statistik Pengunjung Perpustakaan "Jendela Dunia"',
    level: 'fase-b',
    levelLabel: 'Fase B (Kelas 3 - 4)',
    domain: 'data',
    domainLabel: 'Data & Peluang',
    context: 'sosial-budaya',
    contextLabel: 'Konteks Sosial Budaya',
    stimulus: {
      text: 'Pak Guru Budi mencatat jumlah siswa yang berkunjung ke Perpustakaan SD Sukamaju dari hari Senin sampai Jumat pada pekan pertama bulan ini. Berikut diagram batang pencatatan kunjungan harian:',
      chartType: 'bar',
      chartData: {
        categories: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        values: [45, 30, 60, 50, 25],
        yAxisLabel: 'Jumlah Siswa'
      }
    },
    type: 'multiple-choice',
    question: 'Berdasarkan diagram batang di atas, pilihlah DUA pernyataan yang PALING TEPAT!',
    options: [
      'Hari Rabu adalah hari dengan jumlah pengunjung terbanyak (60 siswa)',
      'Selisih pengunjung antara hari Senin dan Selasa adalah 25 siswa',
      'Jumlah total pengunjung pada hari Kamis dan Jumat adalah 75 siswa',
      'Hari Selasa memiliki pengunjung lebih banyak daripada hari Kamis'
    ],
    correctAnswer: [
      'Hari Rabu adalah hari dengan jumlah pengunjung terbanyak (60 siswa)',
      'Jumlah total pengunjung pada hari Kamis dan Jumat adalah 75 siswa'
    ],
    hint: 'Perhatikan tinggi batang pada hari Rabu, Kamis (50), dan Jumat (25). Hitung penjumlahan Kamis + Jumat.',
    stepByStepSolution: [
      'Periksa Opsi 1: Hari Rabu batangnya mencapai angka 60 (paling tinggi dari semua hari). -> BENAR.',
      'Periksa Opsi 2: Selisih Senin (45) dan Selasa (30) adalah 45 - 30 = 15 siswa (bukan 25). -> SALAH.',
      'Periksa Opsi 3: Total Kamis (50) + Jumat (25) = 75 siswa. -> BENAR.',
      'Periksa Opsi 4: Selasa (30) lebih sedikit dari Kamis (50). -> SALAH.'
    ],
    cognitiveLevel: 'Penalaran (Reasoning)'
  },
  {
    id: 'num-3',
    title: 'Merancang Taman Bunga Geometri Sekolah',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    domain: 'geometri',
    domainLabel: 'Geometri & Pengukuran',
    context: 'personal',
    contextLabel: 'Konteks Lingkungan Sekolah',
    stimulus: {
      text: 'Siswa kelas 5 akan menanami rumput hias pada sebidang tanah berbentuk persegi panjang di halaman sekolah. Ukuran panjang taman adalah 12 meter dan lebarnya 8 meter. Di sekeliling taman tersebut akan dipasang pagar kayu pembatas, dan setiap 1 meter pagar memerlukan biaya Rp 25.000.',
      chartType: 'grid',
      chartData: {
        shape: 'rectangle',
        length: 12,
        width: 8,
        unit: 'meter'
      }
    },
    type: 'numeric',
    question: 'Berapakah keliling taman yang akan dipasangi pagar (dalam meter)?',
    correctAnswer: 40,
    unit: 'meter',
    hint: 'Gunakan rumus keliling persegi panjang: Keliling = 2 x (Panjang + Lebar).',
    stepByStepSolution: [
      'Langkah 1: Identifikasi panjang (p = 12 m) dan lebar (l = 8 m).',
      'Langkah 2: Rumus keliling persegi panjang: K = 2 x (p + l)',
      'Langkah 3: Hitung dalam kurung: 12 + 8 = 20 meter.',
      'Langkah 4: Kalikan dengan 2: 2 x 20 = 40 meter keliling pagar taman.'
    ],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-4',
    title: 'Pola Manik-Manik Gelang Anyaman Suku Dayak',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    domain: 'aljabar',
    domainLabel: 'Aljabar & Pola Bilangan',
    context: 'sosial-budaya',
    contextLabel: 'Kearifan Lokal Nusantara',
    stimulus: {
      text: 'Pengrajin cilik membuat gelang manik-manik tradisional dengan pola warna yang berulang secara teratur: 2 manik Kuning (K), diikuti 3 manik Merah (M), lalu 1 manik Hitam (H). Setelah itu, pola berulang kembali dari awal: K, K, M, M, M, H, K, K, M, M, M, H...',
      chartType: 'table',
      chartData: {
        sequence: ['K', 'K', 'M', 'M', 'M', 'H'],
        patternLength: 6
      }
    },
    type: 'single-choice',
    question: 'Jika gelang tersebut dirangkai hingga memiliki 38 butir manik-manik, apakah warna manik-manik ke-38?',
    options: [
      'Kuning',
      'Merah',
      'Hitam',
      'Putih'
    ],
    correctAnswer: 'Kuning',
    hint: 'Hitung panjang satu siklus pola (2 + 3 + 1 = 6 manik). Lalu bagi nomor urut 38 dengan panjang siklus 6 untuk mencari sisanya.',
    stepByStepSolution: [
      'Langkah 1: Tentukan panjang 1 siklus pola: 2 Kuning + 3 Merah + 1 Hitam = 6 butir manik.',
      'Langkah 2: Pola per siklus: Ke-1 & 2 = Kuning, Ke-3, 4, 5 = Merah, Ke-6 = Hitam.',
      'Langkah 3: Bagi 38 dengan 6: 38 ÷ 6 = 6 siklus penuh dengan sisa 2 manik (karena 6 x 6 = 36, lalu 38 - 36 = 2).',
      'Langkah 4: Sisa 2 menunjukkan manik ke-2 dalam urutan siklus baru, yaitu warna KUNING.'
    ],
    cognitiveLevel: 'Penalaran (Reasoning)'
  }
];
