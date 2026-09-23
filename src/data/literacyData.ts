import { LiteracyPassage } from '../types';

export const LITERACY_PASSAGES: LiteracyPassage[] = [
  {
    id: 'lit-1',
    title: 'Kancil dan Jembatan Kejujuran',
    level: 'fase-a',
    levelLabel: 'Fase A (Kelas 1 - 2)',
    genre: 'fabel',
    genreLabel: 'Cerita Fabel',
    estimatedReadTimeMinutes: 2,
    wordCount: 165,
    summary: 'Kancil yang cerdik belajar bahwa kejujuran jauh lebih berharga daripada mengambil jalan pintas saat menyeberangi sungai.',
    paragraphs: [
      'Pagi itu, Kancil ingin menyeberangi Sungai Musi yang arusnya tenang. Di seberang sungai, pohon rambutan berbuah sangat lebat dan manis.',
      'Di tepi sungai, Pak Buaya sedang berjemur bersama anak-anaknya. Kancil biasanya suka memperdaya Pak Buaya dengan menghitung punggung buaya.',
      'Namun kali ini, Kancil memilih untuk menyapa dengan sopan. "Selamat pagi, Pak Buaya. Bolehkan saya minta izin menyeberang jembatan batang kayu milikmu?"',
      'Pak Buaya tersenyum ramah karena Kancil meminta izin dengan jujur dan santun. "Tentu saja, Kancil yang baik. Hati-hati ya saat melangkah!"',
      'Kancil pun menyeberang dengan aman dan membagikan rambutan manis kepada keluarga Pak Buaya. Mereka pun menjadi sahabat baik di hutan.'
    ],
    vocabulary: [
      {
        word: 'Arus',
        meaning: 'Gerakan air yang mengalir ke satu arah.',
        example: 'Arus sungai pagi ini sangat tenang.'
      },
      {
        word: 'Memperdaya',
        meaning: 'Mengakali atau menipu orang lain untuk keuntungan sendiri.',
        example: 'Kancil berjanji tidak akan memperdaya temannya lagi.'
      },
      {
        word: 'Santun',
        meaning: 'Halus dan baik budi bahasanya serta tingkah lakunya.',
        example: 'Kancil menyapa Pak Buaya dengan tutur kata yang santun.'
      }
    ],
    moralOrTakeaway: 'Kejujuran dan sikap sopan santun membuka jalan kebaikan dan persahabatan sejati.',
    authorOrSource: 'Cerita Rakyat Adaptasi Kurikulum Merdeka',
    questions: [
      {
        id: 'q1-1',
        type: 'single-choice',
        question: 'Mengapa Kancil ingin menyeberangi Sungai Musi?',
        options: [
          'Ingin berenang bersama anak-anak buaya',
          'Ingin memetik buah rambutan yang lebat di seberang sungai',
          'Sedang dikejar oleh pemburu di tengah hutan',
          'Ingin berjemur di tepi sungai'
        ],
        correctAnswers: ['Ingin memetik buah rambutan yang lebat di seberang sungai'],
        explanation: 'Pada paragraf pertama dijelaskan bahwa di seberang sungai terdapat pohon rambutan yang berbuah sangat lebat dan manis yang ingin dicapai Kancil.',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      },
      {
        id: 'q1-2',
        type: 'true-false',
        question: 'Tentukan apakah pernyataan berikut Benar atau Salah: Kancil menipu Pak Buaya dengan pura-pura menghitung punggungnya kali ini.',
        correctAnswers: false,
        explanation: 'Salah. Kali ini Kancil memilih meminta izin secara jujur dan sopan kepada Pak Buaya, bukan menipunya.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'q1-3',
        type: 'sequencing',
        question: 'Urutkan peristiwa berikut sesuai dengan alur cerita yang benar!',
        sequenceItems: [
          'Kancil melihat pohon rambutan di seberang sungai',
          'Kancil menyapa dan meminta izin dengan sopan kepada Pak Buaya',
          'Pak Buaya mengizinkan Kancil menyeberangi jembatan kayu',
          'Kancil berbagi buah rambutan manis bersama keluarga Pak Buaya'
        ],
        correctAnswers: [0, 1, 2, 3],
        explanation: 'Alur cerita dimulai dari keinginan Kancil, meminta izin dengan santun, diizinkan menyeberang, hingga berbagi buah rambutan.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      }
    ]
  },
  {
    id: 'lit-2',
    title: 'Hutan Bakau Penjaga Pesisir Pantai Kita',
    level: 'fase-b',
    levelLabel: 'Fase B (Kelas 3 - 4)',
    genre: 'informasi',
    genreLabel: 'Teks Informasi & Sains',
    estimatedReadTimeMinutes: 3,
    wordCount: 280,
    summary: 'Mengenal keajaiban pohon bakau (mangrove) sebagai benteng alami pencegah abrasi dan rumah bagi ribuan biota laut Indonesia.',
    paragraphs: [
      'Indonesia memiliki garis pantai terpanjang kedua di dunia. Di sepanjang pesisir kita, terbentang pepohonan unik dengan akar-akar yang mencuat ke atas permukaan lumpur. Pohon ini dikenal sebagai pohon bakau atau mangrove.',
      'Akar tunjang pohon bakau berfungsi seperti jaring raksasa. Ketika ombak pasang dan badai laut menerjang pantai, akar-akar ini memecah energi gelombang sehingga daratan terhindar dari abrasi (pengikisan pantai oleh air laut).',
      'Selain sebagai pemecah ombak alami, hutan bakau adalah tempat penitipan anak-anak ikan, kepiting bakau, dan udang. Mereka berlindung di sela-sela akar dari mangsa hewan besar sebelum berenang bebas ke laut lepas.',
      'Daun-daun bakau yang gugur akan membusuk dan berubah menjadi humus makanan bagi plankton. Tanpa hutan bakau, hasil tangkapan nelayan kita akan berkurang drastis karena rantai makanan laut terputus.',
      'Oleh karena itu, aksi menanam bibit bakau yang sering dilakukan para siswa dan komunitas peduli lingkungan merupakan langkah nyata menjaga masa depan bumi kita.'
    ],
    vocabulary: [
      {
        word: 'Abrasi',
        meaning: 'Proses pengikisan pantai oleh tenaga gelombang laut dan arus laut yang bersifat merusak.',
        example: 'Pesisir pantai itu terancam abrasi karena hutannya ditebang.'
      },
      {
        word: 'Akar Tunjang',
        meaning: 'Akar yang tumbuh dari bagian bawah batang ke segala arah dan seolah-olah menunjang batang agar tidak rebah.',
        example: 'Akar tunjang bakau menembus lumpur pantai yang dalam.'
      },
      {
        word: 'Biota Laut',
        meaning: 'Seluruh makhluk hidup (hewan dan tumbuhan) yang ada di perairan laut.',
        example: 'Kepiting dan ikan kecil adalah bagian dari biota laut pesisir.'
      },
      {
        word: 'Plankton',
        meaning: 'Organisme renik (mikroskopis) yang melayang-layang di dalam air laut.',
        example: 'Plankton menjadi makanan utama bagi ikan-ikan kecil.'
      }
    ],
    moralOrTakeaway: 'Melestarikan alam seperti hutan bakau sama dengan menjaga kelangsungan hidup manusia dan seluruh makhluk di laut.',
    authorOrSource: 'Badan Restorasi Gambut dan Mangrove & Pusmendik',
    questions: [
      {
        id: 'q2-1',
        type: 'multiple-choice',
        question: 'Pilihlah DUA fungsi utama akar tunjang pohon bakau yang disebutkan dalam bacaan!',
        options: [
          'Memecah energi gelombang laut untuk mencegah abrasi pantai',
          'Menghasilkan garam laut alami bagi nelayan sekitar',
          'Menjadi tempat berlindung bagi anak-anak ikan, kepiting, dan udang',
          'Menarik perhatian kapal pesiar wisatawan asing'
        ],
        correctAnswers: [
          'Memecah energi gelombang laut untuk mencegah abrasi pantai',
          'Menjadi tempat berlindung bagi anak-anak ikan, kepiting, dan udang'
        ],
        explanation: 'Dua fungsi yang ditegaskan dalam teks adalah memecah energi ombak (paragraf 2) dan tempat perlindungan biota laut kecil (paragraf 3).',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      },
      {
        id: 'q2-2',
        type: 'single-choice',
        question: 'Apa dampak yang paling mungkin terjadi bagi nelayan jika hutan bakau di suatu daerah rusak seluruhnya?',
        options: [
          'Jumlah garam di laut akan bertambah manis',
          'Hasil tangkapan ikan menurun drastis karena rantai makanan dan tempat pemijahan anak ikan hilang',
          'Air laut akan menjadi tawar dan lebih dingin',
          'Kapal nelayan dapat berlayar lebih cepat tanpa halangan akar'
        ],
        correctAnswers: ['Hasil tangkapan ikan menurun drastis karena rantai makanan dan tempat pemijahan anak ikan hilang'],
        explanation: 'Paragraf 4 menjelaskan tanpa bakau rantai makanan laut terputus karena anak ikan tidak memiliki tempat berkembang biak dan makanan plankton.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'q2-3',
        type: 'short-answer',
        question: 'Berdasarkan teks, apa yang menjadi makanan utama bagi plankton di hutan mangrove?',
        options: [
          'Daun-daun bakau yang gugur dan membusuk menjadi humus',
          'Lumpur berpasir dari ombak pantai',
          'Sisa makanan dari kapal nelayan',
          'Garam laut yang mengendap di akar'
        ],
        correctAnswers: ['Daun-daun bakau yang gugur dan membusuk menjadi humus'],
        explanation: 'Paragraf 4 menuliskan bahwa daun-daun bakau yang gugur akan membusuk dan berubah menjadi humus makanan bagi plankton.',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      }
    ]
  },
  {
    id: 'lit-3',
    title: 'Tenunan Songket Palembang: Kilau Benang Emas Warisan Sriwijaya',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    genre: 'budaya',
    genreLabel: 'Literasi Sosial Budaya',
    estimatedReadTimeMinutes: 4,
    wordCount: 360,
    summary: 'Mempelajari nilai filosofis, kesabaran matematika para penenun, dan sejarah kain songket Palembang yang diakui sebagai warisan budaya takbenda dunia.',
    paragraphs: [
      'Kain Songket Palembang sering dijuluki sebagai "Ratu Segala Kain". Julukan ini bukan tanpa alasan. Kilauan helai benang emas dan perak yang berpadu dengan benang sutra berwarna merah tua atau hijau zamrud memancarkan keanggunan masa kejayaan Kerajaan Sriwijaya pada abad ke-7 hingga ke-13.',
      'Secara etimologi, kata "songket" berasal dari bahasa Melayu "sungkit", yang berarti mencungkil atau mengaitkan benang emas pada kain dasar. Proses menenun songket membutuhkan ketelitian perhitungan matematika yang sangat tinggi. Penenun tradisional harus menghitung helai demi helai benang lungsi dan benang pakan dengan rumus pola simetris.',
      'Satu lembar kain songket berukuran 2 meter memerlukan waktu pembuatan antara 1 hingga 3 bulan penuh. Apabila penenun salah menghitung satu helai saja di baris awal, maka seluruh motif di baris berikutnya akan miring atau bergeser tidak beraturan.',
      'Setiap motif songket mengandung filosofi mendalam. Motif "Bunga Bintang" melambangkan ketakwaan kepada Tuhan Yang Maha Esa. Motif "Nago Besaung" (Naga Bertarung) melambangkan kekuatan dan perlindungan. Sedangkan motif "Titian Tarung" melambangkan kewaspadaan dan kehati-hatian dalam mengambil keputusan hidup.',
      'Kini, kain songket tidak hanya dipakai pada upacara pernikahan adat Palembang, tetapi juga telah diakui oleh UNESCO dan dipakai oleh para desainer dunia. Menenun songket bukan sekadar keterampilan tangan, melainkan wujud kesabaran, kecerdasan geometri, dan rasa cinta pada identitas bangsa.'
    ],
    vocabulary: [
      {
        word: 'Etimologi',
        meaning: 'Cabang ilmu linguistik yang menyelidiki asal-usul suatu kata beserta perubahan maknanya.',
        example: 'Secara etimologi, kata songket berasal dari kata sungkit.'
      },
      {
        word: 'Benang Lungsi',
        meaning: 'Benang tenun yang dipasang membujur (vertikal) sejajar pada alat tenun.',
        example: 'Penenun mengatur kerapatan benang lungsi sebelum memasukkan benang pakan.'
      },
      {
        word: 'Benang Pakan',
        meaning: 'Benang yang disisipkan melintang (horizontal) pada benang lungsi saat menenun.',
        example: 'Benang emas disisipkan sebagai benang pakan untuk membentuk motif.'
      },
      {
        word: 'Simetris',
        meaning: 'Sama kedua belah bagiannya; seimbang antara sisi kiri dan kanan.',
        example: 'Motif songket memiliki pola geometri yang simetris dan rapi.'
      }
    ],
    moralOrTakeaway: 'Kesabaran, ketelitian, dan rasa bangga terhadap warisan leluhur menghasilkan karya seni yang tak lekang oleh waktu.',
    authorOrSource: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi RI',
    questions: [
      {
        id: 'q3-1',
        type: 'single-choice',
        question: 'Keterampilan matematika apa yang sangat dibutuhkan oleh penenun songket menurut bacaan di atas?',
        options: [
          'Menghitung suku bunga bank dan diskon penjualan',
          'Menghitung helai benang dengan rumus pola simetris dan kecerdasan geometri',
          'Mengukur kecepatan angin di ruang penenunan',
          'Menghitung perbandingan berat timbangan benang'
        ],
        correctAnswers: ['Menghitung helai benang dengan rumus pola simetris dan kecerdasan geometri'],
        explanation: 'Paragraf 2 dan 5 menegaskan penenun harus teliti menghitung helai benang dengan pola simetris geometri agar motif tidak miring.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'q3-2',
        type: 'multiple-choice',
        question: 'Manakah DUA pernyataan berikut yang SESUAI dengan makna motif songket Palembang?',
        options: [
          'Motif Bunga Bintang melambangkan ketakwaan kepada Tuhan Yang Maha Esa',
          'Motif Titian Tarung melambangkan keinginan untuk berperang dengan kerajaan tetangga',
          'Motif Titian Tarung melambangkan kewaspadaan dan kehati-hatian dalam mengambil keputusan hidup',
          'Motif Nago Besaung melambangkan kekayaan uang koin emas'
        ],
        correctAnswers: [
          'Motif Bunga Bintang melambangkan ketakwaan kepada Tuhan Yang Maha Esa',
          'Motif Titian Tarung melambangkan kewaspadaan dan kehati-hatian dalam mengambil keputusan hidup'
        ],
        explanation: 'Sesuai dengan paragraf 4 yang merinci filosofi motif Bunga Bintang dan Titian Tarung.',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      },
      {
        id: 'q3-3',
        type: 'single-choice',
        question: 'Mengapa penulis menyebut kain songket sebagai "wujud kesabaran"?',
        options: [
          'Karena bahannya harus dibeli dari luar negeri dengan menunggu lama',
          'Karena proses menenunnya membutuhkan waktu hingga 3 bulan dengan ketelitian helai demi helai tanpa boleh keliru',
          'Karena kain ini hanya boleh dicuci setahun sekali',
          'Karena harganya tidak boleh ditawar sama sekali'
        ],
        correctAnswers: ['Karena proses menenunnya membutuhkan waktu hingga 3 bulan dengan ketelitian helai demi helai tanpa boleh keliru'],
        explanation: 'Paragraf 3 menjelaskan pembuatan satu lembar membutuhkan 1 hingga 3 bulan dan kesalahan satu helai di awal merusak seluruh motif.',
        cognitiveLevel: 'Mengevaluasi & Merefleksi (L3)'
      }
    ]
  },
  {
    id: 'lit-c-ekosistem',
    title: 'Pesona Terumbu Karang Raja Ampat: Benteng Kehidupan Bawah Laut',
    level: 'fase-c',
    levelLabel: 'Fase C (Kelas 5 - 6)',
    genre: 'sains',
    genreLabel: 'Literasi Lingkungan & Sains Terapan',
    estimatedReadTimeMinutes: 4,
    wordCount: 380,
    summary: 'Mengenal keanekaragaman hayati terumbu karang di Papua Barat, peran simbiosis karang dengan alga zooxanthellae, serta aksi konservasi menjaga laut Nusantara.',
    paragraphs: [
      'Kepulauan Raja Ampat di Papua Barat dikenal dunia sebagai jantung segitiga terumbu karang bumi. Lautan ini menjadi rumah bagi lebih dari 550 spesies karang keras dan 1.400 jenis ikan laut yang hidup harmonis.',
      'Secara sains, karang bukanlah tumbuhan atau batuan mati, melainkan koloni hewan-hewan kecil yang disebut polip karang. Polip ini bersimbiosis mutualisme dengan mikroalga fotosintetik bernama zooxanthellae yang tinggal di dalam jaringannya.',
      'Alga tersebut menyuplai hingga 90% kebutuhan energi makanan bagi karang melalui fotosintesis dengan bantuan sinar matahari, sekaligus memancarkan pendar warna-warni yang indah di bawah laut.',
      'Selain bernilai estetika, terumbu karang berfungsi sebagai pemecah gelombang alami yang melindungi garis pantai pulau dari bencana abrasi dan badai besar. Karang juga menjadi tempat pembibitan (nursery ground) bagi jutaan biota laut.',
      'Menjaga kelestarian terumbu karang berarti menjaga kedaulatan laut dan masa depan pangan generasi penerus Indonesia dari ancaman krisis iklim global.'
    ],
    vocabulary: [
      {
        word: 'Simbiosis Mutualisme',
        meaning: 'Hubungan timbal balik antara dua makhluk hidup berbeda jenis yang saling menguntungkan.',
        example: 'Polip karang dan zooxanthellae hidup berdampingan secara simbiosis mutualisme.'
      },
      {
        word: 'Polip',
        meaning: 'Bentuk hidup hewan karang berukuran mikro menyerupai kantung dengan tentakel di sekitar mulutnya.',
        example: 'Jutaan polip membentuk koloni struktur kapur karang yang kokoh.'
      },
      {
        word: 'Abrasi',
        meaning: 'Proses pengikisan daerah pesisir pantai oleh tenaga gelombang dan arus laut.',
        example: 'Terumbu karang mencegah terjadinya abrasi pantai di pulau-pulau kecil Nusantara.'
      },
      {
        word: 'Konservasi',
        meaning: 'Upaya pemeliharaan dan perlindungan sumber daya alam secara terencana dan berkelanjutan.',
        example: 'Masyarakat adat Papua menerapkan tradisi sasi sebagai bentuk kearifan lokal konservasi laut.'
      }
    ],
    moralOrTakeaway: 'Keseimbangan alam laut Nusantara bergantung pada harmoni antara makhluk mikroskopis terkecil hingga kepedulian manusia.',
    authorOrSource: 'Badan Riset dan Inovasi Nasional (BRIN) & Kemendikbudristek',
    questions: [
      {
        id: 'lit-c-q1',
        type: 'single-choice',
        question: 'Apakah sumber makanan utama bagi polip karang untuk tumbuh menurut bacaan?',
        options: [
          'Hasil fotosintesis mikroalga zooxanthellae yang bersimbiosis dengannya',
          'Limbah organik yang hanyut terbawa perahu nelayan',
          'Mineral garam dari bebatuan laut dalam',
          'Pengikisan pasir pantai oleh ombak pasang'
        ],
        correctAnswers: 'Hasil fotosintesis mikroalga zooxanthellae yang bersimbiosis dengannya',
        explanation: 'Paragraf ke-2 dan ke-3 menjelaskan mikroalga zooxanthellae menghasilkan hingga 90% energi makanan bagi polip karang melalui proses fotosintesis.',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      },
      {
        id: 'lit-c-q2',
        type: 'multiple-choice',
        question: 'Manakah DUA fungsi ekologis terpenting dari terumbu karang bagi garis pantai dan perikanan? (Pilih dua)',
        options: [
          'Sebagai benteng pemecah gelombang alami pencegah abrasi pantai',
          'Sebagai tempat pembibitan dan perlindungan jutaan biota laut',
          'Mengubah air asin menjadi air tawar murni secara otomatis',
          'Menghilangkan angin topan sebelum mencapai daratan'
        ],
        correctAnswers: [
          'Sebagai benteng pemecah gelombang alami pencegah abrasi pantai',
          'Sebagai tempat pembibitan dan perlindungan jutaan biota laut'
        ],
        explanation: 'Paragraf 4 menegaskan terumbu karang berfungsi meredam gelombang abrasi pantai dan tempat pembibitan (nursery ground) biota laut.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'lit-c-q3',
        type: 'true-false',
        question: 'Tentukan Benar atau Salah: Secara sains, karang adalah sejenis tumbuhan laut berakar yang berfotosintesis sendiri tanpa bantuan hewan lain.',
        correctAnswers: false,
        explanation: 'Salah. Paragraf ke-2 menjelaskan karang sebenarnya adalah koloni hewan kecil bernama polip, bukan tumbuhan atau batuan mati.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'lit-c-q4',
        type: 'short-answer',
        question: 'Apa istilah ilmiah untuk proses pengikisan daerah pesisir pantai oleh tenaga ombak yang dapat dicegah oleh terumbu karang?',
        correctAnswers: 'abrasi',
        explanation: 'Abrasi adalah pengikisan daerah pantai oleh tenaga ombak dan arus laut yang dapat diredam secara alami oleh terumbu karang.',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      },
      {
        id: 'lit-c-q5',
        type: 'single-choice',
        question: 'Di wilayah perairan kepulauan manakah lokasi jantung segitiga terumbu karang bumi yang dijelaskan dalam teks?',
        options: [
          'Kepulauan Raja Ampat di Papua Barat',
          'Kepulauan Seribu di Teluk Jakarta',
          'Kepulauan Karimunjawa di Jawa Tengah',
          'Kepulauan Mentawai di Sumatra Barat'
        ],
        correctAnswers: 'Kepulauan Raja Ampat di Papua Barat',
        explanation: 'Paragraf ke-1 secara spesifik menyebutkan Kepulauan Raja Ampat di Papua Barat sebagai jantung segitiga terumbu karang dunia.',
        cognitiveLevel: 'Menemukan Informasi (L1)'
      },
      {
        id: 'lit-c-q6',
        type: 'multiple-choice',
        question: 'Berdasarkan teks, keuntungan apa yang diberikan mikroalga zooxanthellae kepada polip karang? (Pilih dua)',
        options: [
          'Menyuplai hingga 90% kebutuhan energi makanan melalui fotosintesis',
          'Memancarkan warna-warni yang indah di bawah laut',
          'Menggali pasir di dasar laut agar karang bisa berpindah tempat',
          'Membuat air laut di sekitar karang membeku saat malam hari'
        ],
        correctAnswers: [
          'Menyuplai hingga 90% kebutuhan energi makanan melalui fotosintesis',
          'Memancarkan warna-warni yang indah di bawah laut'
        ],
        explanation: 'Paragraf ke-3 menyebutkan alga zooxanthellae menyuplai 90% energi dan memancarkan pendar warna-warni indah pada karang.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'lit-c-q7',
        type: 'true-false',
        question: 'Tentukan Benar atau Salah: Hubungan kerja sama antara polip karang dan mikroalga zooxanthellae merupakan contoh simbiosis mutualisme yang saling menguntungkan.',
        correctAnswers: true,
        explanation: 'Benar. Polip menyediakan tempat tinggal dan perlindungan bagi alga, sedangkan alga menyuplai makanan melalui fotosintesis.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'lit-c-q8',
        type: 'single-choice',
        question: 'Bentuk kearifan lokal apa dari masyarakat adat Papua yang disebutkan dalam teks sebagai aksi pelestarian dan konservasi laut?',
        options: [
          'Tradisi sasi (larangan memanen sumber daya laut tertentu selama periode waktu tertentu)',
          'Tradisi berlayar menggunakan kapal bermesin diesel besar',
          'Tradisi menangkap ikan menggunakan jaring pukat harimau',
          'Tradisi memecah batuan karang untuk dijadikan hiasan rumah'
        ],
        correctAnswers: 'Tradisi sasi (larangan memanen sumber daya laut tertentu selama periode waktu tertentu)',
        explanation: 'Kosakata pada teks mencatat masyarakat adat Papua mempraktikkan tradisi sasi sebagai kearifan lokal konservasi laut.',
        cognitiveLevel: 'Mengevaluasi & Merefleksi (L3)'
      },
      {
        id: 'lit-c-q9',
        type: 'sequencing',
        question: 'Urutkan tahapan keterkaitan biologis dari fotosintesis alga hingga terwujudnya benteng pelindung pantai:',
        sequenceItems: [
          'Sinar matahari menembus perairan laut jernih dan diserap mikroalga zooxanthellae',
          'Alga melakukan fotosintesis dan menyuplai 90% energi bagi polip karang',
          'Polip karang tumbuh bersama jutaan koloninya membentuk struktur kapur yang kokoh',
          'Struktur terumbu karang memecah energi gelombang besar laut dan melindungi garis pantai'
        ],
        correctAnswers: [0, 1, 2, 3],
        explanation: 'Dimulai dari radiasi matahari untuk fotosintesis alga, pasokan energi ke polip, pembentukan struktur kapur karang, hingga menjadi peredam gelombang pantai.',
        cognitiveLevel: 'Memahami & Interpretasi (L2)'
      },
      {
        id: 'lit-c-q10',
        type: 'short-answer',
        question: 'Mengapa menjaga kelestarian ekosistem terumbu karang sangat penting bagi kedaulatan laut dan masa depan bangsa Indonesia?',
        correctAnswers: 'mencegah abrasi dan menjaga lumbung pangan laut',
        explanation: 'Terumbu karang melindungi pulau-pulau kita dari ancaman abrasi gelombang serta menjadi lumbung bibit pangan bagi perikanan Nusantara.',
        cognitiveLevel: 'Mengevaluasi & Merefleksi (L3)'
      }
    ]
  }
];
