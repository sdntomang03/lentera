import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LITERACY_PASSAGES } from '../../data/literacyData';
import { LiteracyPassage, VocabItem, EducationLevel } from '../../types';
import { SpeechReader, soundFx } from '../../utils/audio';
import { formatSecondsToMinutes } from '../../utils/dailyChallenge';

interface LiteracyViewProps {
  onPassageCompleted: (
    passageId: string,
    score: number,
    total: number,
    elapsedSeconds?: number
  ) => void;
  completedIds: string[];
  autoOpenPassageId?: string | null;
  onClearAutoOpen?: () => void;
  onActiveItemChange?: (hasActiveItem: boolean) => void;
  passages?: LiteracyPassage[];
}

export const LiteracyView: React.FC<LiteracyViewProps> = ({
  onPassageCompleted,
  completedIds,
  autoOpenPassageId,
  onClearAutoOpen,
  onActiveItemChange,
  passages,
}) => {
  const activePassages = passages && passages.length > 0 ? passages : LITERACY_PASSAGES;
  const [selectedPassage, setSelectedPassage] = useState<LiteracyPassage | null>(null);
  const [filterLevel, setFilterLevel] = useState<EducationLevel | 'all'>('all');
  const [activeVocab, setActiveVocab] = useState<VocabItem | null>(null);

  // Audio Speech state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);

  // Reader Settings
  const [fontSize, setFontSize] = useState<'text-base' | 'text-lg' | 'text-xl'>('text-base');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: any }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  // Daily Challenge timer state
  const [activityStartTime, setActivityStartTime] = useState<number | null>(null);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0);

  // Speed Reading Test Mode
  const [isSpeedTestActive, setIsSpeedTestActive] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmResult, setWpmResult] = useState<number | null>(null);

  useEffect(() => {
    SpeechReader.initVoices();
    return () => {
      SpeechReader.stop();
    };
  }, []);

  // Notify parent of active reading exercise
  useEffect(() => {
    onActiveItemChange?.(!!selectedPassage);
  }, [selectedPassage, onActiveItemChange]);

  // Handle direct launch from Daily Challenge
  useEffect(() => {
    if (autoOpenPassageId) {
      const target =
        activePassages.find((p) => p.id === autoOpenPassageId) ||
        activePassages.find((p) => !completedIds.includes(p.id)) ||
        activePassages[0];
      if (target) {
        handleSelectPassage(target);
      }
      onClearAutoOpen?.();
    }
  }, [autoOpenPassageId, completedIds, onClearAutoOpen, activePassages]);

  // Timer ticker for Daily Challenge (< 5 mins)
  useEffect(() => {
    if (!selectedPassage || quizSubmitted || !activityStartTime) return;
    const interval = setInterval(() => {
      setLiveElapsedSeconds(Math.round((Date.now() - activityStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPassage, quizSubmitted, activityStartTime]);

  const handleSelectPassage = (passage: LiteracyPassage) => {
    soundFx.playClick();
    SpeechReader.stop();
    setIsPlayingAudio(false);
    setSelectedPassage(passage);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setActiveVocab(null);
    setIsSpeedTestActive(false);
    setStartTime(null);
    setWpmResult(null);
    setActivityStartTime(Date.now());
    setLiveElapsedSeconds(0);
  };

  const handleStartSpeedTest = () => {
    soundFx.playClick();
    setIsSpeedTestActive(true);
    setStartTime(Date.now());
    setWpmResult(null);
  };

  const handleFinishSpeedTest = () => {
    if (!startTime || !selectedPassage) return;
    const elapsedSeconds = Math.max(5, (Date.now() - startTime) / 1000);
    const minutes = elapsedSeconds / 60;
    const wpm = Math.round(selectedPassage.wordCount / minutes);
    setWpmResult(wpm);
    setIsSpeedTestActive(false);
    soundFx.playFanfare();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const toggleSpeech = () => {
    if (!selectedPassage) return;

    if (isPlayingAudio) {
      SpeechReader.stop();
      setIsPlayingAudio(false);
    } else {
      const fullText = `${selectedPassage.title}. ${selectedPassage.paragraphs.join(' ')}`;
      setIsPlayingAudio(true);
      SpeechReader.speak(fullText, {
        rate: speechRate,
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false)
      });
    }
  };

  const handleSingleAnswer = (qId: string, option: string) => {
    soundFx.playClick();
    setQuizAnswers({ ...quizAnswers, [qId]: option });
  };

  const handleMultipleAnswer = (qId: string, option: string) => {
    soundFx.playClick();
    const current = (quizAnswers[qId] as string[]) || [];
    if (current.includes(option)) {
      setQuizAnswers({ ...quizAnswers, [qId]: current.filter((o) => o !== option) });
    } else {
      setQuizAnswers({ ...quizAnswers, [qId]: [...current, option] });
    }
  };

  const handleTrueFalseAnswer = (qId: string, val: boolean) => {
    soundFx.playClick();
    setQuizAnswers({ ...quizAnswers, [qId]: val });
  };

  const handleSequencingAnswer = (qId: string, newOrder: number[]) => {
    soundFx.playClick();
    setQuizAnswers({ ...quizAnswers, [qId]: newOrder });
  };

  const handleQuizSubmit = () => {
    if (!selectedPassage) return;
    let correctCount = 0;

    selectedPassage.questions.forEach((q) => {
      const userAns = quizAnswers[q.id];

      if (q.type === 'single-choice' || q.type === 'short-answer') {
        const correctOpt = Array.isArray(q.correctAnswers) ? q.correctAnswers[0] : q.correctAnswers;
        if (userAns === correctOpt) correctCount++;
      } else if (q.type === 'true-false') {
        if (userAns === q.correctAnswers) correctCount++;
      } else if (q.type === 'multiple-choice') {
        const expected = q.correctAnswers as string[];
        const actual = (userAns as string[]) || [];
        const isMatch =
          expected.length === actual.length &&
          expected.every((item) => actual.includes(item));
        if (isMatch) correctCount++;
      } else if (q.type === 'sequencing') {
        const expectedOrder = q.correctAnswers as number[];
        const actualOrder = (userAns as number[]) || [];
        const isMatch =
          actualOrder.length === expectedOrder.length &&
          actualOrder.every((val, idx) => val === expectedOrder[idx]);
        if (isMatch) correctCount++;
      }
    });

    setQuizScore({ correct: correctCount, total: selectedPassage.questions.length });
    setQuizSubmitted(true);

    if (correctCount === selectedPassage.questions.length) {
      soundFx.playFanfare();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } else if (correctCount > 0) {
      soundFx.playCorrect();
    } else {
      soundFx.playWrong();
    }

    const totalElapsed = activityStartTime
      ? Math.round((Date.now() - activityStartTime) / 1000)
      : 0;

    onPassageCompleted(
      selectedPassage.id,
      correctCount,
      selectedPassage.questions.length,
      totalElapsed
    );
  };

  const filteredPassages = filterLevel === 'all'
    ? activePassages
    : activePassages.filter((p) => p.level === filterLevel);

  return (
    <div className="space-y-6">
      {/* Passage Selector Bar */}
      {!selectedPassage ? (
        <div className="space-y-6">
          {/* Header and Filter */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Ruang Baca & Literasi Kontekstual</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Koleksi bacaan bertingkat khusus SD (Fase A hingga Fase C) yang memuat cerita rakyat nusantara, sains, dan isu lingkungan dengan standar AKM.
                </p>
              </div>

              {/* Segmented Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setFilterLevel('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterLevel === 'all' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Fase
                </button>
                <button
                  onClick={() => setFilterLevel('fase-a')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterLevel === 'fase-a' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fase A (Kls 1-2)
                </button>
                <button
                  onClick={() => setFilterLevel('fase-b')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterLevel === 'fase-b' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fase B (Kls 3-4)
                </button>
                <button
                  onClick={() => setFilterLevel('fase-c')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterLevel === 'fase-c' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fase C (Kls 5-6)
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPassages.map((p) => {
              const isCompleted = completedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-teal-500 hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Unboxed clean metadata with typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-teal-700">{p.levelLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{p.genreLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>~{p.estimatedReadTimeMinutes} mnt ({p.wordCount} kata)</span>
                      {isCompleted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 font-bold">✓ Tuntas</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {p.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Kosakata Kunci:</span>
                      {p.vocabulary.map((v, i) => (
                        <span key={i} className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {v.word}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {p.questions.length} Soal Evaluasi AKM
                    </span>
                    <button
                      onClick={() => handleSelectPassage(p)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      Buka Bacaan <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Reading Passage & Comprehension Assessment View */
        <div className="space-y-6">
          {/* Top Bar with Return Button & Audio Narration */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => {
                soundFx.playClick();
                SpeechReader.stop();
                setSelectedPassage(null);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <span>←</span> Kembali ke Daftar Bacaan
            </button>

            {/* Narration & Reading Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Daily Challenge Speed Timer (< 5 mins) */}
              <div
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition-all shadow-xs ${
                  liveElapsedSeconds <= 300
                    ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title="Tantangan Kilat: Selesaikan dalam < 5 menit untuk bonus poin ekstra!"
              >
                <span>⚡</span>
                <span>{formatSecondsToMinutes(liveElapsedSeconds)} / 05:00</span>
                {liveElapsedSeconds <= 300 && (
                  <span className="hidden sm:inline text-[10px] text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded font-sans font-bold">
                    +40 Poin
                  </span>
                )}
              </div>

              {/* Text-to-Speech Control */}
              <button
                onClick={toggleSpeech}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isPlayingAudio
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                <span>{isPlayingAudio ? '⏹️ Hentikan Suara' : '🔊 Bacakan Teks (Audio)'}</span>
              </button>

              {/* Speed rate adjustment */}
              {isPlayingAudio && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Kecepatan:</span>
                  <button
                    onClick={() => {
                      setSpeechRate(0.8);
                      if (isPlayingAudio) toggleSpeech();
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${speechRate === 0.8 ? 'bg-teal-700 text-white' : 'bg-slate-100'}`}
                  >
                    0.8x
                  </button>
                  <button
                    onClick={() => {
                      setSpeechRate(1.0);
                      if (isPlayingAudio) toggleSpeech();
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${speechRate === 1.0 ? 'bg-teal-700 text-white' : 'bg-slate-100'}`}
                  >
                    1.0x
                  </button>
                </div>
              )}

              {/* Font Size Adjuster */}
              <div className="flex items-center gap-1 border-l pl-3 border-slate-200">
                <span className="text-xs text-slate-400 mr-1">Huruf:</span>
                <button
                  onClick={() => setFontSize('text-base')}
                  className={`px-2 py-0.5 rounded text-xs ${fontSize === 'text-base' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('text-lg')}
                  className={`px-2 py-0.5 rounded text-sm font-semibold ${fontSize === 'text-lg' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('text-xl')}
                  className={`px-2 py-0.5 rounded text-base font-bold ${fontSize === 'text-xl' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
                >
                  A++
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Reading Column */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
              {/* Header Info */}
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-teal-700">{selectedPassage.levelLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPassage.genreLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPassage.wordCount} kata</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-reading leading-tight">
                  {selectedPassage.title}
                </h1>
                <p className="text-xs text-slate-400 mt-1 italic">
                  Sumber: {selectedPassage.authorOrSource}
                </p>
              </div>

              {/* Speed Reading Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Uji Kecepatan Membaca (WPM)</span>
                  <p className="text-slate-500">Hitung kemampuan kata per menit dan ketuntasan bacaan.</p>
                </div>
                {!isSpeedTestActive && !wpmResult && (
                  <button
                    onClick={handleStartSpeedTest}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                  >
                    Mulai Timer Membaca
                  </button>
                )}
                {isSpeedTestActive && (
                  <button
                    onClick={handleFinishSpeedTest}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold animate-pulse"
                  >
                    Saya Selesai Membaca!
                  </button>
                )}
                {wpmResult && (
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-emerald-700">{wpmResult} WPM</span>
                    <span className="block text-[10px] text-slate-500">Kata Per Menit</span>
                  </div>
                )}
              </div>

              {/* Text Paragraphs */}
              <div className={`space-y-5 leading-relaxed text-slate-800 font-reading ${fontSize}`}>
                {selectedPassage.paragraphs.map((p, pIdx) => {
                  return (
                    <p key={pIdx} className="text-justify indent-6">
                      {p}
                    </p>
                  );
                })}
              </div>

              {/* Moral / Takeaway */}
              {selectedPassage.moralOrTakeaway && (
                <div className="p-4 bg-teal-50/70 border-l-4 border-teal-600 rounded-r-xl text-sm">
                  <span className="font-bold text-teal-900 block mb-1">Amanat & Nilai Karakter:</span>
                  <p className="text-teal-800 italic">{selectedPassage.moralOrTakeaway}</p>
                </div>
              )}

              {/* Interactive Vocabulary Glossary */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Glosarium Kosakata Sukar:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPassage.vocabulary.map((vocab, vIdx) => (
                    <button
                      key={vIdx}
                      onClick={() => {
                        soundFx.playClick();
                        setActiveVocab(vocab);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                    >
                      📖 {vocab.word}
                    </button>
                  ))}
                </div>

                {activeVocab && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-amber-900 text-sm">{activeVocab.word}</span>
                      <button
                        onClick={() => setActiveVocab(null)}
                        className="text-amber-700 hover:text-amber-900 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mt-1 text-slate-800 font-medium">Arti: {activeVocab.meaning}</p>
                    <p className="mt-1 text-slate-600 italic">Contoh Kalimat: &quot;{activeVocab.example}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comprehension Quiz Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Kuis Pemahaman Teks (AKM)</h3>
                    <p className="text-xs text-slate-500">Uji kemampuan menemukan info & evaluasi</p>
                  </div>
                  {quizScore && (
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-mono font-bold text-xs">
                      Skor: {quizScore.correct}/{quizScore.total}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedPassage.questions.map((q, qIndex) => {
                    const isAnswered = quizAnswers[q.id] !== undefined;

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-teal-700 font-mono">
                            No. {qIndex + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {q.cognitiveLevel}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-800">{q.question}</p>

                        {/* Question Types */}
                        {q.type === 'single-choice' && q.options && (
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                disabled={quizSubmitted}
                                onClick={() => handleSingleAnswer(q.id, opt)}
                                className={`w-full text-left p-2.5 rounded-lg text-xs font-medium border transition-colors ${
                                  quizAnswers[q.id] === opt
                                    ? 'bg-teal-700 text-white border-teal-800'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === 'multiple-choice' && q.options && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] text-slate-500 block italic">
                              * Centang opsi jawaban yang menurutmu benar
                            </span>
                            {q.options.map((opt, optIdx) => {
                              const checked = ((quizAnswers[q.id] as string[]) || []).includes(opt);
                              return (
                                <button
                                  key={optIdx}
                                  disabled={quizSubmitted}
                                  onClick={() => handleMultipleAnswer(q.id, opt)}
                                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium border transition-colors flex items-start gap-2 ${
                                    checked
                                      ? 'bg-teal-50 text-teal-900 border-teal-500 font-semibold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-4 h-4 mt-0.5 rounded border border-slate-400 flex items-center justify-center text-[10px] bg-white">
                                    {checked && '✓'}
                                  </span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'true-false' && (
                          <div className="flex gap-3 pt-2">
                            <button
                              disabled={quizSubmitted}
                              onClick={() => handleTrueFalseAnswer(q.id, true)}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                                quizAnswers[q.id] === true
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              BENAR
                            </button>
                            <button
                              disabled={quizSubmitted}
                              onClick={() => handleTrueFalseAnswer(q.id, false)}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                                quizAnswers[q.id] === false
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              SALAH
                            </button>
                          </div>
                        )}

                        {q.type === 'sequencing' && q.sequenceItems && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] text-slate-500 block">
                              Gunakan tombol panah untuk mengatur kronologi yang runtut:
                            </span>
                            {(() => {
                              const currentOrder: number[] =
                                (quizAnswers[q.id] as number[]) || q.sequenceItems.map((_, i) => i);

                              return currentOrder.map((itemIdx, pos) => (
                                <div
                                  key={pos}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                                >
                                  <span className="font-bold text-teal-700 mr-2">{pos + 1}.</span>
                                  <span className="flex-1 text-slate-700">
                                    {q.sequenceItems![itemIdx]}
                                  </span>
                                  {!quizSubmitted && (
                                    <div className="flex gap-1 ml-2">
                                      {pos > 0 && (
                                        <button
                                          onClick={() => {
                                            const next = [...currentOrder];
                                            [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
                                            handleSequencingAnswer(q.id, next);
                                          }}
                                          className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-[10px]"
                                        >
                                          ▲
                                        </button>
                                      )}
                                      {pos < currentOrder.length - 1 && (
                                        <button
                                          onClick={() => {
                                            const next = [...currentOrder];
                                            [next[pos + 1], next[pos]] = [next[pos], next[pos + 1]];
                                            handleSequencingAnswer(q.id, next);
                                          }}
                                          className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-[10px]"
                                        >
                                          ▼
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        )}

                        {/* Explanation on submit */}
                        {quizSubmitted && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs">
                            <span className="font-bold text-slate-800 block mb-1">
                              💡 Pembahasan:
                            </span>
                            <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    className="w-full mt-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-sm transition-colors shadow-xs"
                  >
                    Periksa Jawaban Saya
                  </button>
                ) : (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setQuizScore(null);
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                    >
                      Ulangi Kuis
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedPassage(null);
                      }}
                      className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold text-xs"
                    >
                      Selesai & Lanjut
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
