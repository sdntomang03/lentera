export interface DailyTip {
  id: string;
  quote: string;
  author: string;
  category: 'literasi' | 'numerasi' | 'motivasi';
  actionTip: string;
  icon: string;
  isAiGenerated?: boolean;
}

export const FALLBACK_TIPS: DailyTip[] = [
  {
    id: 'tip-1',
    quote: 'Membaca adalah jendela dunia. Setiap kata yang kamu baca hari ini adalah kunci rahasia masa depanmu.',
    author: 'Ki Hajar Dewantara (Pahlawan Pendidikan)',
    category: 'literasi',
    actionTip: 'Tantangan: Temukan 1 kata baru yang belum pernah kamu dengar hari ini, lalu cari artinya di kamus!',
    icon: '📚',
  },
  {
    id: 'tip-2',
    quote: 'Trik Perkalian 9: Jumlahkan digit hasil kali 9, hasilnya selalu 9! Contoh: 9 x 4 = 36 (3 + 6 = 9). Ajaib bukan?',
    author: 'Guru Lentera AI',
    category: 'numerasi',
    actionTip: 'Tantangan: Coba buktikan untuk 9 x 7 dan 9 x 8 di selembar kertas sekarang!',
    icon: '🧮',
  },
  {
    id: 'tip-3',
    quote: 'Bukan karena kamu tidak bisa, tetapi kamu sedang dalam proses belajar. Kesalahan adalah bukti bahwa kamu sedang mencoba!',
    author: 'B.J. Habibie',
    category: 'motivasi',
    actionTip: 'Tantangan: Beri tepuk tangan untuk dirimu sendiri saat berhasil menyelesaikan 1 soal yang awalnya terasa sulit.',
    icon: '🚀',
  },
  {
    id: 'tip-4',
    quote: 'Sebelum membaca teks cerita yang panjang, baca judul dan lihat gambarnya dulu untuk menebak apa isi ceritanya.',
    author: 'Pakar Literasi Pusmendik',
    category: 'literasi',
    actionTip: 'Tantangan: Coba teknik memprediksi ini saat memilih bacaan di tab Literasi hari ini!',
    icon: '🔍',
  },
  {
    id: 'tip-5',
    quote: 'Matematika bukan tentang menghafal rumus rumit, melainkan tentang melihat pola indah di alam semesta.',
    author: 'Maryam Mirzakhani',
    category: 'numerasi',
    actionTip: 'Tantangan: Cari pola bilangan di sekitarmu, misalnya nomor rumah atau jumlah ubin di kamarmu.',
    icon: '✨',
  },
];
