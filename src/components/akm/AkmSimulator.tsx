import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LITERACY_PASSAGES } from '../../data/literacyData';
import { NUMERACY_QUESTIONS } from '../../data/numeracyData';
import { soundFx } from '../../utils/audio';

interface AkmSimulatorProps {
  onAkmCompleted: (score: number, total: number) => void;
  onBack?: () => void;
}

interface AkmItem {
  id: string;
  type: 'literasi' | 'numerasi';
  title: string;
  stimulus: string;
  question: string;
  options?: string[];
  correctAnswer: any;
  explanation: string;
}

export const AkmSimulator: React.FC<AkmSimulatorProps> = ({ onAkmCompleted, onBack }) => {
  // Assemble a mixed AKM exam package (3 Literacy questions + 3 Numeracy questions)
  const examItems: AkmItem[] = [
    {
      id: 'akm-1',
      type: 'literasi',
      title: 'Literasi - Hutan Bakau Pesisir',
      stimulus: 'Indonesia memiliki garis pantai terpanjang kedua di dunia. Akar tunjang pohon bakau berfungsi seperti jaring raksasa yang memecah energi ombak badai dan melindungi daratan dari ancaman abrasi pantai.',
      question: 'Berdasarkan kutipan teks di atas, apakah manfaat utama akar tunjang pohon bakau bagi pesisir?',
      options: [
        'Menyerap seluruh air asin agar menjadi air tawar',
        'Memecah energi gelombang ombak dan mencegah abrasi',
        'Membantu mempercepat laju perahu nelayan',
        'Menghasilkan buah kelapa yang manis'
      ],
      correctAnswer: 'Memecah energi gelombang ombak dan mencegah abrasi',
      explanation: 'Sesuai stimulus, akar tunjang memecah energi gelombang ombak sehingga daratan terhindar dari abrasi pantai.'
    },
    {
      id: 'akm-2',
      type: 'numerasi',
      title: 'Numerasi - Kue Lapis Legit',
      stimulus: 'Ibu memotong satu loyang kue lapis legit berbentuk persegi panjang menjadi 8 bagian yang sama besar. Adik memakan 2 potong, dan Kakak memakan 3 potong.',
      question: 'Berapakah sisa kue lapis legit yang masih ada di atas piring?',
      options: [
        '1/8 bagian',
        '3/8 bagian',
        '5/8 bagian',
        '2/8 bagian'
      ],
      correctAnswer: '3/8 bagian',
      explanation: 'Total kue utuh = 8/8 bagian. Yang dimakan Adik dan Kakak = 2 + 3 = 5 potong. Sisa kue = 8 - 5 = 3 potong (3/8 bagian).'
    },
    {
      id: 'akm-3',
      type: 'literasi',
      title: 'Literasi - Kain Songket Palembang',
      stimulus: 'Secara etimologi, kata songket berasal dari bahasa Melayu "sungkit" yang berarti mencungkil atau mengaitkan benang emas. Penenun harus menghitung helai demi helai benang dengan rumus pola simetris geometri.',
      question: 'Apa akibat jika seorang penenun keliru menghitung helai benang pada baris awal pengerjaan?',
      options: [
        'Kain akan langsung robek terbakar',
        'Seluruh motif di baris berikutnya akan miring atau bergeser tidak beraturan',
        'Harga kain emas akan naik dua kali lipat',
        'Benang emas akan berubah menjadi perak'
      ],
      correctAnswer: 'Seluruh motif di baris berikutnya akan miring atau bergeser tidak beraturan',
      explanation: 'Kesalahan perhitungan helai di awal menyebabkan runtutan pola simetris bergeser tidak beraturan.'
    },
    {
      id: 'akm-4',
      type: 'numerasi',
      title: 'Numerasi - Taman Persegi Panjang',
      stimulus: 'Taman bunga sekolah berukuran panjang 12 meter dan lebar 8 meter. Di sekeliling taman tersebut akan dipasangi pagar kawat pelindung.',
      question: 'Berapa meter total panjang pagar kawat yang dibutuhkan untuk mengelilingi seluruh taman tersebut?',
      options: [
        '20 meter',
        '40 meter',
        '96 meter',
        '48 meter'
      ],
      correctAnswer: '40 meter',
      explanation: 'Keliling persegi panjang = 2 x (panjang + lebar) = 2 x (12 + 8) = 2 x 20 = 40 meter.'
    },
    {
      id: 'akm-5',
      type: 'literasi',
      title: 'Literasi - PLTS Terapung Cirata',
      stimulus: 'Panel fotovoltaik yang dipasang mengapung di atas air Waduk Cirata memperoleh efek pendinginan alami (cooling effect), sehingga efisiensi energi listriknya meningkat hingga 10% dibanding panel di darat.',
      question: 'Mengapa panel surya terapung lebih efisien dibanding di daratan?',
      options: [
        'Karena mendapat pendinginan alami dari air di bawahnya yang mencegah overheating',
        'Karena disinari dua matahari sekaligus',
        'Karena panel surya bisa berenang mengikuti arus',
        'Karena air waduk menarik energi magnet bumi'
      ],
      correctAnswer: 'Karena mendapat pendinginan alami dari air di bawahnya yang mencegah overheating',
      explanation: 'Air di bawah panel memberikan efek pendinginan yang menjaga suhu operasional panel tetap optimal.'
    },
    {
      id: 'akm-6',
      type: 'numerasi',
      title: 'Numerasi - Pola Manik Nusantara',
      stimulus: 'Pola gelang manik tersusun berulang: 2 Kuning, 3 Merah, 1 Hitam (Total satu siklus = 6 manik).',
      question: 'Apakah warna butir manik ke-38 pada rangkaian gelang tersebut?',
      options: [
        'Kuning',
        'Merah',
        'Hitam',
        'Hijau'
      ],
      correctAnswer: 'Kuning',
      explanation: '38 dibagi 6 siklus = 6 sisa 2. Urutan ke-2 dalam siklus adalah butir manik Kuning.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [flagged, setFlagged] = useState<{ [qId: string]: boolean }>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 minutes
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [scoreReport, setScoreReport] = useState<{
    score: number;
    total: number;
    percent: number;
    level: string;
    description: string;
  } | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  const currentItem = examItems[currentIndex];

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectAnswer = (opt: string) => {
    soundFx.playClick();
    setAnswers({ ...answers, [currentItem.id]: opt });
  };

  const toggleFlag = () => {
    soundFx.playClick();
    setFlagged({ ...flagged, [currentItem.id]: !flagged[currentItem.id] });
  };

  const handleSubmitExam = () => {
    let correct = 0;
    examItems.forEach((item) => {
      if (answers[item.id] === item.correctAnswer) {
        correct++;
      }
    });

    const percent = Math.round((correct / examItems.length) * 100);
    let level = 'Perlu Intervensi Khusus';
    let description = 'Perlu pendampingan intensif dalam memahami informasi teks dan operasi hitung dasar.';

    if (percent >= 85) {
      level = 'Mahir';
      description = 'Mampu bernalar kritis, mengevaluasi teks multimodal, dan menyelesaikan masalah numerasi kompleks.';
    } else if (percent >= 70) {
      level = 'Cakap';
      description = 'Mampu membuat interpretasi dari informasi tersirat dan menyelesaikan permasalahan matematis standar.';
    } else if (percent >= 50) {
      level = 'Dasar';
      description = 'Memiliki keterampilan literasi dasar dan mampu menyelesaikan permasalahan matematika langsung.';
    }

    setScoreReport({
      score: correct,
      total: examItems.length,
      percent,
      level,
      description
    });
    setIsSubmitted(true);

    if (percent >= 70) {
      soundFx.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } else {
      soundFx.playCorrect();
    }

    onAkmCompleted(correct, examItems.length);
  };

  return (
    <div className="space-y-6">
      {!isSubmitted ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Header Bar: ANBK Simulation Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-lg">
                AKM
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Simulasi ANBK / Asesmen Nasional</h3>
                <span className="text-xs text-slate-400">Paket Terpadu: Literasi Membaca & Numerasi Terapan</span>
              </div>
            </div>

            {/* Timer & Actions Display */}
            <div className="flex flex-wrap items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    if (Object.keys(answers).length > 0) {
                      if (window.confirm('Apakah kamu yakin ingin kembali? Lembar jawaban simulasi yang sedang berjalan akan diatur ulang.')) {
                        onBack();
                      }
                    } else {
                      onBack();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Kembali"
                >
                  <span>←</span>
                  <span>Kembali ke Menu</span>
                </button>
              )}

              <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
                <span className="text-slate-400 text-xs">Sisa Waktu:</span>
                <span className={`font-mono font-bold text-sm ${secondsRemaining < 180 ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`}>
                  ⏱️ {formatTimer(secondsRemaining)}
                </span>
              </div>

              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Selesaikan Ujian
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Main Stimulus & Question Content */}
            <div className="lg:col-span-8 p-6 md:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  Soal No. {currentIndex + 1} dari {examItems.length}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${currentItem.type === 'literasi' ? 'text-teal-700' : 'text-indigo-700'}`}>
                  {currentItem.type === 'literasi' ? '📖 Literasi Membaca' : '🧮 Numerasi'}
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-900">{currentItem.title}</h4>

              {/* Stimulus Box */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm leading-relaxed text-slate-800">
                <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wide">
                  Stimulus Bacaan / Konteks:
                </span>
                {currentItem.stimulus}
              </div>

              {/* Question Statement */}
              <div className="space-y-4">
                <p className="text-base font-semibold text-slate-900">
                  {currentItem.question}
                </p>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {currentItem.options?.map((opt, oIdx) => {
                    const isChosen = answers[currentItem.id] === opt;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(opt)}
                        className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-start gap-3 ${
                          isChosen
                            ? 'bg-teal-50 text-teal-900 border-teal-600 font-semibold shadow-xs ring-1 ring-teal-500'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isChosen
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="mt-0.5">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav: Ragu-ragu & Next/Prev */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={toggleFlag}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    flagged[currentItem.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>🚩</span> {flagged[currentItem.id] ? 'Tanda Ragu-Ragu Aktif' : 'Ragu-Ragu'}
                </button>

                <div className="flex gap-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentIndex(currentIndex - 1);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={currentIndex === examItems.length - 1}
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentIndex(currentIndex + 1);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-xl"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Palette Navigation */}
            <div className="lg:col-span-4 p-6 bg-slate-50/70 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Nomor Butir Soal (Palet)
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {examItems.map((it, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = answers[it.id] !== undefined;
                    const isFlag = flagged[it.id];

                    return (
                      <button
                        key={it.id}
                        onClick={() => {
                          soundFx.playClick();
                          setCurrentIndex(idx);
                        }}
                        className={`p-3 rounded-xl text-xs font-bold border flex flex-col items-center justify-center relative transition-all ${
                          isCurrent
                            ? 'ring-2 ring-teal-600 bg-white border-teal-500 shadow-sm'
                            : isAnswered
                            ? 'bg-teal-700 text-white border-teal-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-mono text-sm">{idx + 1}</span>
                        <span className="text-[9px] uppercase tracking-tighter">
                          {it.type === 'literasi' ? 'Lit' : 'Num'}
                        </span>
                        {isFlag && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Legend */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">Keterangan Warna:</span>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-3.5 h-3.5 rounded-sm bg-teal-700" />
                  <span>Sudah dijawab</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-3.5 h-3.5 rounded-sm bg-white border border-slate-300" />
                  <span>Belum dijawab</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-3.5 h-3.5 rounded-sm bg-amber-400" />
                  <span>Ragu-ragu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Report Card View */
        scoreReport && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <span className="text-4xl">🎓</span>
              <h2 className="text-2xl font-black text-slate-900">
                Laporan Hasil Simulasi AKM Nasional
              </h2>
              <p className="text-sm text-slate-500">
                Evaluasi kompetensi literasi dan numerasi sesuai kategori Pusmendik Kemendikbudristek.
              </p>
            </div>

            {/* Score Metric Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 text-center">
                <div className="text-xs font-semibold text-teal-700">Skor Benar</div>
                <div className="text-4xl font-black text-teal-900 font-mono mt-1">
                  {scoreReport.score} / {scoreReport.total}
                </div>
                <div className="text-xs text-teal-600 mt-1 font-medium">{scoreReport.percent}% Ketuntasan</div>
              </div>

              <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                <div className="text-xs font-semibold text-indigo-700">Kategori Capaian AKM</div>
                <div className="text-2xl font-black text-indigo-950 mt-1">{scoreReport.level}</div>
                <div className="text-xs text-indigo-600 mt-1">Standar Kemendikbud</div>
              </div>

              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                <div className="text-xs font-semibold text-amber-700">Waktu Pengerjaan</div>
                <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                  {formatTimer(900 - secondsRemaining)}
                </div>
                <div className="text-xs text-amber-600 mt-1">Dari Alokasi 15:00</div>
              </div>
            </div>

            {/* Teacher Feedback & Recommendation */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>📋</span> Deskripsi Kompetensi & Rekomendasi Guru:
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{scoreReport.description}</p>
            </div>

            {/* Step by step answer key */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-base">Kunci Jawaban & Pembahasan Lengkap:</h4>
              <div className="space-y-3">
                {examItems.map((item, idx) => {
                  const userAns = answers[item.id];
                  const isCorrect = userAns === item.correctAnswer;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border text-xs leading-relaxed ${
                        isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">
                          No. {idx + 1} - {item.title}
                        </span>
                        <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isCorrect ? '✓ Jawaban Benar' : '✗ Belum Tepat'}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        <strong>Jawabanmu:</strong> {userAns || '(Tidak dijawab)'}
                      </div>
                      <div className="text-slate-800 font-semibold mt-0.5">
                        <strong>Kunci:</strong> {item.correctAnswer}
                      </div>
                      <div className="text-slate-600 mt-1 italic">
                        <strong>Pembahasan:</strong> {item.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onBack();
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs"
                >
                  ← Kembali
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsSubmitted(false);
                  setAnswers({});
                  setFlagged({});
                  setSecondsRemaining(900);
                  setCurrentIndex(0);
                  setScoreReport(null);
                }}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Ulangi Ujian Simulasi
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
