import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

export default defineConfig(({ mode }) => {
  // Vite's native config loader no longer auto-injects .env values into
  // process.env, so load them explicitly for use inside the dev-server API
  // middleware below (e.g. GEMINI_API_KEY, DEEPSEEK_API_KEY).
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-plugin',
        configureServer(server) {
          // Leaderboard mock/sync endpoint
          server.middlewares.use('/api/leaderboard', (req, res, next) => {
            if (req.method === 'GET' || req.method === 'POST') {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'success',
                  message: 'Leaderboard API alive',
                  timestamp: new Date().toISOString(),
                })
              );
              return;
            }
            next();
          });

          // Gemini AI Daily Study Tips endpoint
          server.middlewares.use('/api/gemini/tips', async (req, res, next) => {
            if (req.method === 'POST' || req.method === 'GET') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  let category = 'all';
                  if (body) {
                    try {
                      const parsed = JSON.parse(body);
                      if (parsed.category) category = parsed.category;
                    } catch {
                      // ignore parse error
                    }
                  }

                  const apiKey = process.env.GEMINI_API_KEY;
                  if (!apiKey) {
                    // Fallback response if API key is not yet set
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        quote:
                          'Membaca adalah petualangan pikiran, dan berhitung adalah seni memahami dunia di sekitar kita.',
                        author: 'Ki Hajar Dewantara',
                        category: category === 'all' ? 'motivasi' : category,
                        actionTip:
                          'Tantangan hari ini: Luangkan waktu 10 menit untuk membaca teks pilihanmu atau hitung belanjaan jajanan!',
                        icon: '🌟',
                      })
                    );
                    return;
                  }

                  const ai = new GoogleGenAI({
                    apiKey: apiKey,
                    httpOptions: {
                      headers: {
                        'User-Agent': 'aistudio-build',
                      },
                    },
                  });

                  const prompt = `Kamu adalah guru pendamping belajar anak sekolah (SD & SMP) di Indonesia pada kurikulum Merdeka.
Buatlah 1 kutipan motivasi belajar singkat ATAU 1 tips cepat belajar (kategori: ${category}).
Syarat:
- Bahasa Indonesia yang ramah, hangat, edukatif, dan mudah dipahami siswa.
- Kutipan/tips maksimal 2 kalimat padat dan menginspirasi.
- Cantumkan nama tokoh inspiratif (atau 'Guru Lentera AI').
- Berikan 1 'actionTip' yaitu tantangan mini konkret yang bisa dicoba langsung oleh siswa hari ini.
- Berikan 1 emoji ikon yang cocok.`;

                  const response = await ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                          quote: {
                            type: Type.STRING,
                            description: 'Kutipan motivasi atau tips belajar ringkas',
                          },
                          author: {
                            type: Type.STRING,
                            description: 'Nama tokoh atau Guru Lentera AI',
                          },
                          category: {
                            type: Type.STRING,
                            description: 'Kategori: literasi, numerasi, atau motivasi',
                          },
                          actionTip: {
                            type: Type.STRING,
                            description: 'Tantangan kecil praktis untuk siswa hari ini',
                          },
                          icon: {
                            type: Type.STRING,
                            description: 'Emoji yang mewakili tips',
                          },
                        },
                        required: ['quote', 'author', 'category', 'actionTip', 'icon'],
                      },
                    },
                  });

                  const text = response.text || '{}';
                  res.setHeader('Content-Type', 'application/json');
                  res.end(text);
                } catch (error) {
                  console.error('Gemini tips generation error:', error);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      quote:
                        'Jangan takut salah saat mencoba! Setiap kesalahan adalah tangga menuju pemahaman yang lebih kuat.',
                      author: 'Guru Lentera AI',
                      category: 'motivasi',
                      actionTip:
                        'Tantangan hari ini: Kerjakan 1 soal yang kamu anggap menantang dengan teliti!',
                      icon: '💡',
                    })
                  );
                }
              });
              return;
            }
            next();
          });

          // DeepSeek AI Chatbot with Endzi the Hornbill Mascot
          server.middlewares.use('/api/gemini/chat', async (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                let parsed: any = {};
                try {
                  parsed = JSON.parse(body);
                } catch {
                  parsed = {};
                }

                const studentName = parsed.studentName || 'Siswa Lentera';
                const currentNav = parsed.currentNav || 'umum';
                const rawHistory = Array.isArray(parsed.history) ? parsed.history : [];
                const message = (parsed.message || '').trim();

                // Smart comprehensive fallback handler for high reliability
                const generateSmartFallback = (query: string, name: string) => {
                  const qLower = query.toLowerCase();

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
                };

                try {

                  const apiKey = process.env.DEEPSEEK_API_KEY;
                  if (!apiKey) {
                    const fallbackReply = generateSmartFallback(message, studentName);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ reply: fallbackReply }));
                    return;
                  }

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
   - Selalu bersikap suportif, hangat, dan menghargai rasa ingin tahu siswa (${studentName}).`;

                  // Build OpenAI-compatible message list (DeepSeek uses the same chat/completions schema)
                  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
                    { role: 'system', content: systemInstruction },
                  ];

                  // Sanitize history so roles strictly alternate and never end with a user turn
                  let lastRole: 'user' | 'assistant' | null = null;
                  for (const h of rawHistory.slice(-8)) {
                    const role: 'user' | 'assistant' = h.sender === 'user' ? 'user' : 'assistant';
                    const text = (h.text || '').trim();
                    if (!text) continue;

                    // If same role repeats, append to previous turn
                    if (role === lastRole && messages.length > 1) {
                      messages[messages.length - 1].content += `\n${text}`;
                    } else {
                      messages.push({ role, content: text });
                      lastRole = role;
                    }
                  }

                  // If the last history turn was already 'user', remove it to replace with fresh user message
                  if (messages.length > 1 && messages[messages.length - 1].role === 'user') {
                    messages.pop();
                  }

                  // Add current user message
                  messages.push({
                    role: 'user',
                    content: message || 'Halo Endzi, ceritakan hal menarik yang kamu ketahui hari ini!',
                  });

                  // Resilient candidate models fallback (e.g. if the primary model is temporarily unavailable)
                  const candidateModels = ['deepseek-chat', 'deepseek-reasoner'];
                  let replyText = '';
                  let lastErr: any = null;

                  for (const modelName of candidateModels) {
                    try {
                      const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                          model: modelName,
                          messages: messages,
                          temperature: 0.7,
                        }),
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
                    } catch (err: any) {
                      lastErr = err;
                      console.warn(`Model ${modelName} encountered issue, trying fallback model...`, err?.message || err);
                    }
                  }

                  if (!replyText) {
                    throw lastErr || new Error('All DeepSeek candidate models returned empty');
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ reply: replyText }));
                } catch (error: any) {
                  console.error('DeepSeek Endzi Chat error, falling back to smart engine:', error);
                  const fallback = generateSmartFallback(message || '', studentName || 'Siswa Lentera');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ reply: fallback }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
