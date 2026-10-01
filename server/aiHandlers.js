// Shared AI/API handlers used by BOTH the Vite dev server middleware
// (vite.config.ts, for `npm run dev`) and the standalone production server
// (server.js, for `npm start` on Node.js hosting such as Hostinger).
//
// Keeping this logic in one place avoids the dev and production servers
// silently drifting apart (which is what previously caused "Tanya Endzi"
// to work locally but not once deployed as a static-only build).

/**
 * Generate a daily study tip with DeepSeek. Falls back to a static tip and
 * reports a configuration error when the provider is unavailable.
 */
export async function generateDailyTip(category = 'all', topic = '', count = 1) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const requestedTopic = typeof topic === 'string' ? topic.trim().slice(0, 200) : '';
  const requestedCount = Math.max(1, Math.min(3, Number.isInteger(count) ? count : 1));
  const tipApproaches = [
    'beri satu langkah praktis yang langsung bisa dicoba',
    'beri trik mengingat atau memahami materi',
    'beri tantangan mini berbentuk permainan',
    'beri contoh penerapan dalam kegiatan sehari-hari',
    'beri cara sederhana mengatasi kesalahan yang sering terjadi',
    'beri pertanyaan pemantik yang membuat siswa berpikir',
  ];
  const everydayContexts = [
    'kegiatan di kelas',
    'membaca buku cerita',
    'bermain bersama teman',
    'membantu orang tua di rumah',
    'berbelanja di pasar',
    'olahraga atau permainan',
    'memasak atau menyiapkan makanan',
    'mengamati lingkungan sekitar',
  ];
  const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
  const approach = pickRandom(tipApproaches);
  const everydayContext = pickRandom(everydayContexts);
  const fallback = {
    quote:
      'Membaca adalah petualangan pikiran, dan berhitung adalah seni memahami dunia di sekitar kita.',
    author: 'Ki Hajar Dewantara',
    category: category === 'all' ? 'motivasi' : category,
    actionTip:
      'Tantangan hari ini: Luangkan waktu 10 menit untuk membaca teks pilihanmu atau hitung belanjaan jajanan!',
    icon: '🌟',
    isAiGenerated: false,
  };

  if (!apiKey) {
    const fallbackResult = {
      ...fallback,
      generationError: 'DEEPSEEK_API_KEY belum diatur. Tambahkan API key aktif ke .env lalu jalankan ulang server.',
    };
    return requestedCount === 1
      ? fallbackResult
      : { tips: Array.from({ length: requestedCount }, () => fallbackResult), isAiGenerated: false, generationError: fallbackResult.generationError };
  }

  try {
    const prompt = `Buat ${requestedCount} tips belajar berbeda untuk siswa sekolah dasar Indonesia pada Kurikulum Merdeka.
${requestedTopic
    ? `Buat tips yang spesifik dan praktis tentang: "${requestedTopic}".`
    : `Pilih kategori ${category} dan buat tips yang sesuai.`}
Untuk setiap tips buat isi, pendekatan, dan tantangan yang berbeda. Gunakan pendekatan seperti ${approach} dan konteks sehari-hari seperti ${everydayContext}, tetapi pilih variasi berbeda untuk tiap tips.
Jangan memakai perumpamaan atau pola kalimat klise yang sama terus-menerus. Hindari perumpamaan "belajar seperti menanam pohon"; gunakan bahasa langsung kecuali perumpamaan memang paling membantu.
Balas sebagai JSON valid saja. ${requestedCount === 1
    ? 'Struktur: {"quote":"teks tips singkat","author":"Guru Lentera AI","category":"literasi|numerasi|motivasi","actionTip":"tantangan kecil yang bisa langsung dicoba","icon":"emoji"}'
    : `Struktur: {"tips":[${Array.from({ length: requestedCount }, () => '{"quote":"teks tips singkat","author":"Guru Lentera AI","category":"literasi|numerasi|motivasi","actionTip":"tantangan kecil yang bisa langsung dicoba","icon":"emoji"}').join(',')}]}. Pastikan semua kategori berbeda, satu literasi, satu numerasi, dan satu motivasi.`}
Gunakan bahasa Indonesia yang ramah, hangat, dan mudah dipahami. Quote maksimal dua kalimat.`;
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Kamu adalah guru pendamping belajar siswa SD di Indonesia.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 1,
      }),
    });

    if (!response.ok) {
      const error = new Error(`DeepSeek tips API returned HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(text || '{}');
    const generatedTips = requestedCount === 1 ? [parsed] : parsed.tips;
    if (!Array.isArray(generatedTips) || generatedTips.length !== requestedCount) {
      throw new Error('DeepSeek returned an incomplete study tip collection.');
    }
    if (generatedTips.some((tip) => (
      typeof tip.quote !== 'string'
      || typeof tip.author !== 'string'
      || typeof tip.actionTip !== 'string'
      || typeof tip.icon !== 'string'
    ))) {
      throw new Error('DeepSeek returned an incomplete study tip.');
    }
    const tips = generatedTips.map((tip) => ({
      ...tip,
      category: ['literasi', 'numerasi', 'motivasi'].includes(tip.category)
        ? tip.category
        : category === 'literasi' || category === 'numerasi' || category === 'motivasi'
          ? category
          : 'motivasi',
      isAiGenerated: true,
    }));
    return requestedCount === 1 ? tips[0] : { tips, isAiGenerated: true };
  } catch (error) {
    console.error('DeepSeek tips generation error:', error);
    const status = error && typeof error === 'object' && 'status' in error
      ? error.status
      : undefined;
    const generationError = status === 400 || status === 403
      ? 'Kunci DEEPSEEK_API_KEY ditolak DeepSeek. Periksa API key pada file .env, lalu jalankan ulang server.'
      : status === 402 || status === 429
        ? 'Saldo atau kuota DeepSeek tidak mencukupi. Periksa akun dan batas penggunaan API.'
        : 'DeepSeek tidak dapat membuat tips saat ini. Periksa koneksi server dan konfigurasi DEEPSEEK_API_KEY.';
    const fallbackResult = {
      ...fallback,
      generationError,
    };
    return requestedCount === 1
      ? fallbackResult
      : { tips: Array.from({ length: requestedCount }, () => fallbackResult), isAiGenerated: false, generationError };
  }
}

export async function generateLearningContent({ type, level, title, genre, domain, context }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY belum diatur. Tambahkan API key aktif ke .env lalu jalankan ulang server.');
  }

  const levelLabels = {
    'fase-a': 'Fase A (Kelas 1-2 SD)',
    'fase-b': 'Fase B (Kelas 3-4 SD)',
    'fase-c': 'Fase C (Kelas 5-6 SD)',
  };
  if (!['literacy', 'numeracy'].includes(type) || !levelLabels[level]) {
    throw new Error('Jenis konten atau fase pembelajaran tidak valid.');
  }

  const isLiteracy = type === 'literacy';
  const genreLabels = {
    fabel: 'Fabel & Cerita Hewan',
    informasi: 'Teks Informasi & Sains',
    budaya: 'Cerita Rakyat & Budaya',
    sains: 'Sains & Lingkungan',
    puisi: 'Puisi & Sastra Anak',
  };
  const domainLabels = {
    bilangan: 'Bilangan & Operasi Hitung',
    geometri: 'Geometri & Pengukuran',
    data: 'Data & Ketidakpastian',
    aljabar: 'Aljabar & Pola',
  };
  const contextLabels = {
    personal: 'Personal & Keseharian',
    'sosial-budaya': 'Sosial & Budaya',
    saintifik: 'Saintifik & Lingkungan',
  };
  const prompt = isLiteracy
    ? `Buat satu materi bacaan literasi berbahasa Indonesia untuk ${levelLabels[level]}.
Judul/topik: ${title || 'pilih topik menarik dan sesuai usia'}.
Genre: ${genre || 'informasi'}.
Buat bacaan orisinal 3-5 paragraf, ringkasan, 3-5 kosakata penting, dan tepat 4 soal pemahaman pilihan ganda.
Setiap soal wajib punya 4 opsi berbeda, satu correctAnswers yang sama persis dengan salah satu opsi, explanation yang menjelaskan alasan jawaban benar berdasarkan isi bacaan, dan cognitiveLevel yang salah satu dari: Menemukan Informasi (L1), Memahami & Interpretasi (L2), Mengevaluasi & Merefleksi (L3).
Keluaran JSON harus berbentuk:
{"title":"...","summary":"...","paragraphs":["..."],"vocabulary":[{"word":"...","meaning":"...","example":"..."}],"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswers":"...","explanation":"...","cognitiveLevel":"Menemukan Informasi (L1)"}],"moralOrTakeaway":"...","estimatedReadTimeMinutes":3,"authorOrSource":"Guru Lentera AI"}
Pastikan isi soal, kunci, dan pembahasan benar serta sesuai bacaan. Jangan menambahkan markdown.`
    : `Buat satu soal numerasi kontekstual berbahasa Indonesia untuk ${levelLabels[level]}.
Judul/topik: ${title || 'pilih situasi keseharian yang menarik dan sesuai usia'}.
Domain: ${domain || 'bilangan'}. Konteks: ${context || 'personal'}.
Buat stimulus kontekstual yang cukup datanya, tepat satu soal pilihan ganda tunggal dengan 4 opsi berbeda, satu jawaban numerik singkat yang sama persis dengan salah satu opsi, hint, dan pembahasan bertahap yang perhitungannya benar. Soal hanya boleh menanyakan satu hasil, bukan dua nilai sekaligus. Hitung jawaban dari awal dan periksa kembali hasil operasi sebelum menentukan opsi benar.
Keluaran JSON harus berbentuk:
{"title":"...","domain":"bilangan|geometri|data|aljabar","domainLabel":"...","context":"personal|sosial-budaya|saintifik","contextLabel":"...","stimulus":{"text":"..."},"question":"...","options":["...","...","...","..."],"correctAnswer":"...","hint":"...","stepByStepSolution":["Langkah 1: ...","Langkah 2: ..."],"cognitiveLevel":"Pemahaman (Knowing)|Penerapan (Applying)|Penalaran (Reasoning)"}
Pastikan semua informasi cukup, pilihan jawaban tidak ambigu, kunci benar, dan setiap langkah pembahasan menunjukkan proses hingga jawaban. Jangan menambahkan markdown.`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Kamu adalah ahli pengembangan materi ajar SD Indonesia dan penulis soal yang teliti.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek gagal membuat materi (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const generated = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
  if (isLiteracy) {
    if (
      typeof generated.title !== 'string'
      || typeof generated.summary !== 'string'
      || !Array.isArray(generated.paragraphs)
      || generated.paragraphs.length < 1
      || !generated.paragraphs.every((paragraph) => typeof paragraph === 'string')
      || !Array.isArray(generated.vocabulary)
      || generated.vocabulary.some((item) => (
        typeof item.word !== 'string'
        || typeof item.meaning !== 'string'
        || typeof item.example !== 'string'
      ))
      || !Array.isArray(generated.questions)
      || generated.questions.length !== 4
      || generated.questions.some((question) => (
        typeof question.question !== 'string'
        || !Array.isArray(question.options)
        || question.options.length !== 4
        || !question.options.every((option) => typeof option === 'string' && option.trim().length > 0)
        || new Set(question.options).size !== 4
        || typeof question.correctAnswers !== 'string'
        || !question.options.includes(question.correctAnswers)
        || typeof question.explanation !== 'string'
        || !['Menemukan Informasi (L1)', 'Memahami & Interpretasi (L2)', 'Mengevaluasi & Merefleksi (L3)'].includes(question.cognitiveLevel)
      ))
    ) {
      throw new Error('Hasil AI bacaan tidak lengkap atau kunci/pilihan jawabannya tidak valid. Silakan coba lagi.');
    }

    return {
      ...generated,
      id: `lit-ai-${Date.now()}`,
      level,
      levelLabel: levelLabels[level],
      genre,
      genreLabel: genreLabels[genre] || 'Teks Informasi & Sains',
      estimatedReadTimeMinutes: Number(generated.estimatedReadTimeMinutes) || 3,
      wordCount: generated.paragraphs.join(' ').trim().split(/\s/).filter(Boolean).length,
      authorOrSource: typeof generated.authorOrSource === 'string' ? generated.authorOrSource : 'Guru Lentera AI',
      questions: generated.questions.map((question, index) => ({
        ...question,
        id: `q-lit-ai-${Date.now()}-${index + 1}`,
        type: 'single-choice',
      })),
    };
  }

  if (
    typeof generated.title !== 'string'
    || !generated.stimulus
    || typeof generated.stimulus.text !== 'string'
    || typeof generated.question !== 'string'
    || !Array.isArray(generated.options)
    || generated.options.length !== 4
    || !generated.options.every((option) => typeof option === 'string' && option.trim().length > 0)
    || new Set(generated.options).size !== 4
    || typeof generated.correctAnswer !== 'string'
    || !generated.options.includes(generated.correctAnswer)
    || typeof generated.hint !== 'string'
    || !Array.isArray(generated.stepByStepSolution)
    || generated.stepByStepSolution.length < 1
    || !generated.stepByStepSolution.every((step) => typeof step === 'string' && step.trim().length > 0)
    || !['bilangan', 'geometri', 'data', 'aljabar'].includes(generated.domain)
    || !['personal', 'sosial-budaya', 'saintifik'].includes(generated.context)
  ) {
    throw new Error('Hasil AI numerasi tidak lengkap atau kunci/pilihan jawabannya tidak valid. Silakan coba lagi.');
  }

  const reviewResponse = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah pemeriksa soal matematika. Selesaikan soal secara mandiri dari stimulus, lalu periksa setiap operasi dan pembahasan. Jawab hanya JSON valid.',
        },
        {
          role: 'user',
          content: `Periksa soal numerasi berikut dengan menghitung ulang dari awal. Jangan percaya kunci atau pembahasan sebelum diverifikasi. Jika soal menanyakan satu nilai, jawaban harus satu nilai, bukan gabungan beberapa nilai. Apakah correctAnswer dan seluruh langkah penyelesaian benar secara matematis? Jawab {"isCorrect":true} atau {"isCorrect":false,"reason":"alasan singkat"}.\n${JSON.stringify({
            stimulus: generated.stimulus.text,
            question: generated.question,
            options: generated.options,
            correctAnswer: generated.correctAnswer,
            stepByStepSolution: generated.stepByStepSolution,
          })}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  });
  if (!reviewResponse.ok) {
    throw new Error(`DeepSeek tidak dapat memeriksa pembahasan numerasi (HTTP ${reviewResponse.status}). Silakan coba lagi.`);
  }
  const reviewData = await reviewResponse.json();
  const review = JSON.parse(reviewData?.choices?.[0]?.message?.content || '{}');
  if (review.isCorrect !== true) {
    throw new Error(`DeepSeek menemukan kunci atau pembahasan yang belum benar${review.reason ? `: ${review.reason}` : '.'} Silakan buat ulang soal.`);
  }

  return {
    ...generated,
    id: `num-ai-${Date.now()}`,
    level,
    levelLabel: levelLabels[level],
    domain: generated.domain,
    domainLabel: domainLabels[generated.domain] || domainLabels[domain] || 'Bilangan & Operasi Hitung',
    context: generated.context,
    contextLabel: contextLabels[generated.context] || contextLabels[context] || 'Personal & Keseharian',
    type: 'single-choice',
    cognitiveLevel: ['Pemahaman (Knowing)', 'Penerapan (Applying)', 'Penalaran (Reasoning)'].includes(generated.cognitiveLevel)
      ? generated.cognitiveLevel
      : 'Penerapan (Applying)',
  };
}

// Smart comprehensive fallback handler for high reliability, used when
// DEEPSEEK_API_KEY is missing or the DeepSeek API call fails.
function generateSmartFallback(query, name) {
  const qLower = (query || '').toLowerCase();

  if (qLower.includes('burung enggang') || qLower.includes('enggang') || qLower.includes('bulu') || qLower.includes('paruh')) {
    return `Halo ${name}! Tentu, aku senang sekali menceritakan tentang burung Enggang (Rangkong) khas Indonesia!

1. **Simbol Keindahan & Kesetiaan Budaya Indonesia**
Burung Enggang, khususnya Enggang Cula atau Rhinoceros Hornbill, adalah burung endemik kebanggaan Indonesia, terutama di hutan Kalimantan dan Sumatra. Bagi masyarakat adat Dayak, burung Enggang adalah lambang kesucian, keberanian, dan kesetiaan karena burung ini terkenal setia pada satu pasangan seumur hidupnya.

2. **Ciri Khas Paruh Mahkota & Bulu Megah**
Ciri paling mencolok adalah paruh besar dengan tonjolan menyerupai mahkota tanduk (casque) berwarna gradasi emas, oranye, dan merah cerah. Mahkota ini terbuat dari zat keratin (seperti kuku manusia) yang kuat namun ringan. Bulu tubuhnya berwarna hitam pekat berpadu dengan sayap dan ekor putih bersih yang sangat kontras dan anggun saat terbang melintasi kanopi hutan rimba.

3. **Peran Vital sebagai 'Petani Hutan'**
Burung Enggang dijuluki petani hutan karena gemar memakan buah beringin liar dan menyebarkan biji-bijian pohon besar ke seluruh penjuru hutan melalui kotorannya. Berkat burung Enggang, hutan hujan tropis Indonesia tetap lestari dan hijau lebat.

Di aplikasi Lentera, Endzi hadir sebagai maskot untuk mengajak teman-teman semua terbang tinggi meraih ilmu literasi dan numerasi dengan penuh semangat! Ada hal lain yang ingin kamu ketahui?`;
  }

  if (qLower.includes('ide pokok') || qLower.includes('literasi') || qLower.includes('membaca')) {
    return `Halo ${name}! Untuk menemukan ide pokok dalam sebuah paragraf bacaan, ada 3 langkah praktis yang bisa kamu ikuti:

1. **Baca kalimat pertama dan kalimat terakhir:** Sebagian besar paragraf dalam Bahasa Indonesia menaruh gagasan utama di awal (paragraf deduktif) atau di akhir (paragraf induktif).
2. **Cari kata yang sering diulang:** Kata kunci yang sering muncul biasanya menunjukkan topik utama yang sedang dibahas.
3. **Tanyakan pada dirimu:** "Paragraf ini secara keseluruhan menceritakan tentang apa?" Jawaban dari pertanyaan itulah ide pokoknya.

Kamu bisa langsung mencobanya di modul Literasi Membaca Lentera sekarang!`;
  }

  if (qLower.includes('pecahan') || qLower.includes('numerasi') || qLower.includes('hitung') || qLower.includes('matematika')) {
    return `Halo ${name}! Dalam matematika dan numerasi, memahami konsep dasar adalah kuncinya:

- **Pecahan Senilai:** Bayangkan kamu punya 1 loyang pizza dipotong 2 (kamu makan 1/2). Jika pizza dipotong 4 bagian dan kamu makan 2 potong (2/4), jumlah yang kamu makan tetap sama besar!
- **Soal Cerita:** Baca soal secara perlahan, tuliskan apa yang diketahui, apa yang ditanyakan, lalu tentukan rumus atau operasi hitungnya (tambah, kurang, kali, atau bagi).

Ada soal berhitung tertentu yang sedang ingin kamu diskusikan langkah penyelesaiannya? Tuliskan saja soalnya di sini ya!`;
  }

  if (qLower.includes('teka-teki') || qLower.includes('logika')) {
    return `Halo ${name}! Ini dia teka-teki logika seru untuk melatih ketelitianmu:

*"Aku punya leher tapi tidak punya kepala, aku punya dua tangan tapi tidak punya jari. Apakah aku?"*

Coba tebak jawabannya apa! Tuliskan tebakanmu di sini ya!`;
  }

  if (qLower.includes('tips') || qLower.includes('motivasi')) {
    return `Halo ${name}! Tips belajar efektif hari ini:
- Gunakan teknik belajar 20 menit fokus membaca atau mengerjakan soal, lalu istirahat 3-5 menit untuk meregangkan mata dan tubuh.
- Jangan takut jika jawabanmu belum tepat saat latihan, karena setiap kesalahan adalah petunjuk berharga untuk memperbaiki pemahaman kita.

Semangat terus belajarnya ya ${name}! Kamu pasti bisa!`;
  }

  return `Halo ${name}! Pertanyaanmu yang sangat menarik tentang: "${query}".

Sebagai Sahabat Belajar cerdas, aku senang sekali mengeksplorasi topik ini bersamamu!
- **Konsep Inti:** Setiap hal menarik selalu bermula dari rasa ingin tahu yang besar. Kita dapat membedahnya mulai dari fakta dasarnya, alasan terjadinya, hingga penerapannya dalam kehidupan nyata.
- **Langkah Diskusi:** Coba ceritakan sedikit lagi bagian mana yang paling membuatmu penasaran, atau tanyakan contoh konkretnya.

Aku siap membahas topik ini lebih dalam bersamamu! Apa hal pertama yang ada di pikiranmu saat memikirkan hal ini?`;
}

/**
 * Generate Endzi's chat reply. Uses DeepSeek (chat/completions, OpenAI-
 * compatible schema) when DEEPSEEK_API_KEY is configured, otherwise (or on
 * failure) uses the smart local fallback engine above.
 */
export async function generateEndziReply({ message, studentName, currentNav, history }) {
  const name = studentName || 'Siswa Lentera';
  const rawHistory = Array.isArray(history) ? history : [];
  const trimmedMessage = (message || '').trim();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return generateSmartFallback(trimmedMessage, name);
  }

  try {
    const systemInstruction = `Kamu adalah Endzi, maskot Burung Enggang khas Indonesia dan Sahabat Belajar cerdas yang serba tahu, ramah, bijaksana, dan berwawasan luas.

KEMAMPUAN UTAMA & KECERDASAN (PENTING):
1. KAMU MAMPU MERESPON & MENJAWAB SEGALA HAL APAPUN YANG DITANYAKAN, baik materi pelajaran sekolah, literasi, numerasi, maupun TOPIK APAPUN DI LUAR LENTERA!
   - Jangan pernah menolak pertanyaan atau berkata "itu di luar pembahasan Lentera". Jawablah dengan cerdas, lengkap, dan antusias apapun yang ditanyakan oleh pengguna!
   - Topik Sains & Alam: Fisika, kimia, biologi, tata surya, astronomi, cuaca, alam semesta, flora & fauna.
   - Matematika & Logika: Pecahan, aljabar, geometri, statistika, teka-teki logika, trik berhitung cepat, pembuktian rumus.
   - Literasi, Bahasa & Seni: Kosakata, tata bahasa, cara menulis cerita, puisi, analisis teks bacaan, bahasa asing, seni budaya.
   - Sejarah & Geografi: Tokoh pahlawan, sejarah dunia, sejarah Indonesia, peta dunia, ibukota, keajaiban dunia.
   - Teknologi & Komputer: Pemrograman, internet, AI, robotika, gadget, cara kerja teknologi modern.
   - Pengetahuan Umum & Kehidupan: Hobi, olahraga, kesehatan, musik, film, motivasi belajar, tips produktivitas, fakta unik burung Enggang di Indonesia, dan pertanyaan sehari-hari lainnya.
2. PEDOMAN GAYA BAHASA & KOMUNIKASI:
   - Gunakan bahasa Indonesia yang normal, wajar, bersahabat, sopan, dan mengalir seperti seorang tutor cerdas atau sahabat setia yang menyenangkan.
   - DILARANG KERAS menirukan suara burung, bunyi kepakan sayap, atau onomatope seperti "Krr-krr", "Kwoo-kwoo", "Flap flap", "Kawk", "Cuit cuit", atau sejenisnya. Bicaralah secara normal tanpa efek suara hewan.
   - Jawaban harus cerdas, jelas, mendalam, dan terstruktur rapi (gunakan cetak tebal dan poin-poin bila membantu pemahaman).
   - Selalu bersikap suportif, hangat, dan menghargai rasa ingin tahu siswa (${name}).`;

    // Build OpenAI-compatible message list (DeepSeek uses the same chat/completions schema)
    const messages = [{ role: 'system', content: systemInstruction }];

    // Sanitize history so roles strictly alternate and never end with a user turn
    let lastRole = null;
    for (const h of rawHistory.slice(-8)) {
      const role = h.sender === 'user' ? 'user' : 'assistant';
      const text = (h.text || '').trim();
      if (!text) continue;

      if (role === lastRole && messages.length > 1) {
        messages[messages.length - 1].content += `\n${text}`;
      } else {
        messages.push({ role, content: text });
        lastRole = role;
      }
    }

    if (messages.length > 1 && messages[messages.length - 1].role === 'user') {
      messages.pop();
    }

    messages.push({
      role: 'user',
      content: trimmedMessage || 'Halo Endzi, ceritakan hal menarik yang kamu ketahui hari ini!',
    });

    // Resilient candidate models fallback (e.g. if the primary model is temporarily unavailable)
    const candidateModels = ['deepseek-chat', 'deepseek-reasoner'];
    let replyText = '';
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: modelName, messages, temperature: 0.7 }),
        });

        if (!dsResponse.ok) {
          throw new Error(`DeepSeek HTTP ${dsResponse.status}`);
        }

        const dsData = await dsResponse.json();
        const text = dsData?.choices?.[0]?.message?.content?.trim();
        if (text) {
          replyText = text;
          break;
        }
      } catch (err) {
        lastErr = err;
        console.warn(`Model ${modelName} encountered issue, trying fallback model...`, err?.message || err);
      }
    }

    if (!replyText) {
      throw lastErr || new Error('All DeepSeek candidate models returned empty');
    }

    return replyText;
  } catch (error) {
    console.error('DeepSeek Endzi Chat error, falling back to smart engine:', error);
    return generateSmartFallback(trimmedMessage, name);
  }
}
