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
  },
  {
    id: 'num-5',
    title: 'Kelereng di Kotak Bermain',
    level: 'fase-a',
    levelLabel: 'Fase A (Kelas 1 - 2)',
    domain: 'bilangan',
    domainLabel: 'Bilangan & Operasi',
    context: 'personal',
    contextLabel: 'Konteks Personal',
    stimulus: {
      text: 'Raka memiliki 12 kelereng. Ia memberikan 4 kelereng kepada adiknya. Setelah itu, Raka mendapat 3 kelereng dari temannya.',
      chartType: 'table',
      chartData: { kegiatan: ['Awal', 'Diberikan', 'Diterima'], jumlah: [12, -4, 3] }
    },
    type: 'numeric',
    question: 'Berapa kelereng Raka sekarang?',
    correctAnswer: 11,
    unit: 'kelereng',
    hint: 'Kurangi kelereng yang diberikan, lalu tambahkan kelereng yang diterima.',
    stepByStepSolution: ['12 - 4 = 8 kelereng.', '8 + 3 = 11 kelereng.'],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-6',
    title: 'Buah untuk Bekal Sekolah',
    level: 'fase-a',
    levelLabel: 'Fase A (Kelas 1 - 2)',
    domain: 'bilangan',
    domainLabel: 'Bilangan & Operasi',
    context: 'personal',
    contextLabel: 'Konteks Personal',
    stimulus: {
      text: 'Ibu menyiapkan 3 piring. Setiap piring berisi 2 potong apel untuk bekal anak-anak.',
      chartType: 'table',
      chartData: { piring: 3, apelPerPiring: 2 }
    },
    type: 'single-choice',
    question: 'Berapa potong apel seluruhnya?',
    options: ['5 potong', '6 potong', '8 potong', '9 potong'],
    correctAnswer: '6 potong',
    hint: 'Tambahkan 2 apel sebanyak tiga kali.',
    stepByStepSolution: ['Piring pertama 2 apel.', 'Piring kedua 2 apel.', 'Piring ketiga 2 apel.', '2 + 2 + 2 = 6 apel.'],
    cognitiveLevel: 'Pemahaman (Knowing)'
  },
  {
    id: 'num-7',
    title: 'Pita Hias Kelas',
    level: 'fase-a',
    levelLabel: 'Fase A (Kelas 1 - 2)',
    domain: 'geometri',
    domainLabel: 'Geometri & Pengukuran',
    context: 'sosial-budaya',
    contextLabel: 'Konteks Sekolah',
    stimulus: {
      text: 'Untuk menghias kelas, Sari memiliki pita merah sepanjang 1 meter dan pita kuning sepanjang 2 meter. Ia menyambungkan kedua pita tersebut.',
      chartType: 'table',
      chartData: { pitaMerah: 1, pitaKuning: 2, unit: 'meter' }
    },
    type: 'numeric',
    question: 'Berapa meter panjang pita Sari setelah disambungkan?',
    correctAnswer: 3,
    unit: 'meter',
    hint: 'Jumlahkan panjang pita merah dan pita kuning.',
    stepByStepSolution: ['Pita merah = 1 meter.', 'Pita kuning = 2 meter.', '1 + 2 = 3 meter.'],
    cognitiveLevel: 'Pemahaman (Knowing)'
  },
  {
    id: 'num-8',
    title: 'Jadwal Menyiram Tanaman',
    level: 'fase-b',
    levelLabel: 'Fase B (Kelas 3 - 4)',
    domain: 'data',
    domainLabel: 'Data & Peluang',
    context: 'personal',
    contextLabel: 'Konteks Lingkungan',
    stimulus: {
      text: 'Kelompok kelas mencatat jumlah tanaman yang disiram selama empat hari. Senin 8 tanaman, Selasa 12 tanaman, Rabu 10 tanaman, dan Kamis 14 tanaman.',
      chartType: 'bar',
      chartData: { categories: ['Senin', 'Selasa', 'Rabu', 'Kamis'], values: [8, 12, 10, 14], yAxisLabel: 'Jumlah tanaman' }
    },
    type: 'numeric',
    question: 'Berapa jumlah seluruh tanaman yang disiram selama empat hari?',
    correctAnswer: 44,
    unit: 'tanaman',
    hint: 'Jumlahkan data dari Senin sampai Kamis.',
    stepByStepSolution: ['8 + 12 = 20.', '20 + 10 = 30.', '30 + 14 = 44 tanaman.'],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-9',
    title: 'Belanja di Pasar Desa',
    level: 'fase-b',
    levelLabel: 'Fase B (Kelas 3 - 4)',
    domain: 'bilangan',
    domainLabel: 'Bilangan & Operasi',
    context: 'sosial-budaya',
    contextLabel: 'Konteks Pasar',
    stimulus: {
      text: 'Ayah membeli 2 kg beras dengan harga Rp14.000 per kg dan 1 kg jeruk seharga Rp12.000. Ayah membayar dengan uang Rp50.000.',
      chartType: 'table',
      chartData: { beras: { jumlah: 2, harga: 14000 }, jeruk: { jumlah: 1, harga: 12000 } }
    },
    type: 'numeric',
    question: 'Berapa uang kembalian yang diterima Ayah?',
    correctAnswer: 10000,
    unit: 'rupiah',
    hint: 'Hitung total belanja, lalu kurangi dari Rp50.000.',
    stepByStepSolution: ['Harga beras = 2 x Rp14.000 = Rp28.000.', 'Total belanja = Rp28.000 + Rp12.000 = Rp40.000.', 'Kembalian = Rp50.000 - Rp40.000 = Rp10.000.'],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-10',
    title: 'Lantai Teras Berbentuk Persegi',
    level: 'fase-b',
    levelLabel: 'Fase B (Kelas 3 - 4)',
    domain: 'geometri',
    domainLabel: 'Geometri & Pengukuran',
    context: 'personal',
    contextLabel: 'Konteks Rumah',
    stimulus: {
      text: 'Teras rumah Nisa berbentuk persegi. Panjang setiap sisinya 5 meter. Ayah ingin memasang lampu di sepanjang tepi teras.',
      chartType: 'grid',
      chartData: { shape: 'square', side: 5, unit: 'meter' }
    },
    type: 'numeric',
    question: 'Berapa meter panjang tepi teras yang perlu dipasangi lampu?',
    correctAnswer: 20,
    unit: 'meter',
    hint: 'Keliling persegi adalah 4 kali panjang sisinya.',
    stepByStepSolution: ['Sisi persegi = 5 meter.', 'Keliling = 4 x 5 = 20 meter.'],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-11',
    title: 'Pola Kursi di Aula',
    level: 'fase-b',
    levelLabel: 'Fase B (Kelas 3 - 4)',
    domain: 'aljabar',
    domainLabel: 'Aljabar & Pola Bilangan',
    context: 'sosial-budaya',
    contextLabel: 'Konteks Kegiatan Sekolah',
    stimulus: {
      text: 'Kursi disusun membentuk pola. Baris pertama memiliki 4 kursi, baris kedua 7 kursi, dan baris ketiga 10 kursi. Setiap baris bertambah dengan jumlah yang sama.',
      chartType: 'table',
      chartData: { baris: [1, 2, 3], kursi: [4, 7, 10] }
    },
    type: 'single-choice',
    question: 'Berapa kursi pada baris keempat?',
    options: ['11 kursi', '12 kursi', '13 kursi', '14 kursi'],
    correctAnswer: '13 kursi',
    hint: 'Cari pertambahan kursi dari satu baris ke baris berikutnya.',
    stepByStepSolution: ['7 - 4 = 3 dan 10 - 7 = 3.', 'Pola bertambah 3 kursi.', 'Baris keempat = 10 + 3 = 13 kursi.'],
    cognitiveLevel: 'Penalaran (Reasoning)'
  },
  {
    id: 'num-12',
    title: 'Kebun Sayur Sekolah',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    domain: 'geometri',
    domainLabel: 'Geometri & Pengukuran',
    context: 'saintifik',
    contextLabel: 'Konteks Lingkungan Sekolah',
    stimulus: {
      text: 'Kebun sayur sekolah berbentuk persegi panjang dengan panjang 15 meter dan lebar 8 meter. Siswa akan menutup seluruh permukaannya dengan kompos.',
      chartType: 'grid',
      chartData: { shape: 'rectangle', length: 15, width: 8, unit: 'meter' }
    },
    type: 'numeric',
    question: 'Berapa luas kebun sayur tersebut?',
    correctAnswer: 120,
    unit: 'meter persegi',
    hint: 'Luas persegi panjang = panjang x lebar.',
    stepByStepSolution: ['Panjang = 15 meter dan lebar = 8 meter.', 'Luas = 15 x 8 = 120 meter persegi.'],
    cognitiveLevel: 'Penerapan (Applying)'
  },
  {
    id: 'num-13',
    title: 'Air Bersih untuk Warga',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    domain: 'bilangan',
    domainLabel: 'Bilangan & Pecahan',
    context: 'sosial-budaya',
    contextLabel: 'Konteks Kehidupan Warga',
    stimulus: {
      text: 'Sebuah tangki berisi 240 liter air. Sebanyak 3/8 bagian digunakan untuk memasak dan mencuci. Sisa air disimpan untuk keperluan berikutnya.',
      chartType: 'pie',
      chartData: { total: 240, usedFraction: '3/8' }
    },
    type: 'numeric',
    question: 'Berapa liter air yang masih tersisa?',
    correctAnswer: 150,
    unit: 'liter',
    hint: 'Hitung 3/8 dari 240 liter, lalu kurangi hasilnya dari 240.',
    stepByStepSolution: ['240 ÷ 8 = 30 liter.', '3/8 x 240 = 3 x 30 = 90 liter digunakan.', 'Sisa = 240 - 90 = 150 liter.'],
    cognitiveLevel: 'Penalaran (Reasoning)'
  },
  {
    id: 'num-14',
    title: 'Hasil Panen Cabai',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    domain: 'data',
    domainLabel: 'Data & Peluang',
    context: 'saintifik',
    contextLabel: 'Konteks Pertanian',
    stimulus: {
      text: 'Kebun belajar mencatat hasil panen cabai selama lima minggu: 6 kg, 8 kg, 7 kg, 9 kg, dan 10 kg. Data ini digunakan untuk mengetahui hasil panen rata-rata.',
      chartType: 'bar',
      chartData: { categories: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'], values: [6, 8, 7, 9, 10], yAxisLabel: 'Hasil (kg)' }
    },
    type: 'numeric',
    question: 'Berapa hasil panen cabai rata-rata setiap minggu?',
    correctAnswer: 8,
    unit: 'kg',
    hint: 'Jumlahkan semua hasil panen, lalu bagi dengan banyak minggu.',
    stepByStepSolution: ['Total panen = 6 + 8 + 7 + 9 + 10 = 40 kg.', 'Banyak data = 5 minggu.', 'Rata-rata = 40 ÷ 5 = 8 kg per minggu.'],
    cognitiveLevel: 'Penalaran (Reasoning)'
  }
];
