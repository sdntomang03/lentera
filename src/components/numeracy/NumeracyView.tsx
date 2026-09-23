import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { NUMERACY_QUESTIONS } from '../../data/numeracyData';
import { NumeracyQuestion, EducationLevel, NumeracyDomain } from '../../types';
import { soundFx } from '../../utils/audio';
import { formatSecondsToMinutes } from '../../utils/dailyChallenge';

interface NumeracyViewProps {
  onQuestionCompleted: (questionId: string, isCorrect: boolean, elapsedSeconds?: number) => void;
  completedIds: string[];
  autoOpenQuestionId?: string | null;
  onClearAutoOpen?: () => void;
  onActiveItemChange?: (hasActiveItem: boolean) => void;
  questions?: NumeracyQuestion[];
}

export const NumeracyView: React.FC<NumeracyViewProps> = ({
  onQuestionCompleted,
  completedIds,
  autoOpenQuestionId,
  onClearAutoOpen,
  onActiveItemChange,
  questions,
}) => {
  const activeQuestions = questions && questions.length > 0 ? questions : NUMERACY_QUESTIONS;
  const [selectedQuestion, setSelectedQuestion] = useState<NumeracyQuestion | null>(null);
  const [filterLevel, setFilterLevel] = useState<EducationLevel | 'all'>('all');
  const [filterDomain, setFilterDomain] = useState<NumeracyDomain | 'all'>('all');

  // Answer state
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [numericInput, setNumericInput] = useState<string>('');
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Daily Challenge timer state
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0);

  // Scratchpad toggle
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');

  // Notify parent of active math exercise
  useEffect(() => {
    onActiveItemChange?.(!!selectedQuestion);
  }, [selectedQuestion, onActiveItemChange]);

  // Handle direct launch from Daily Challenge
  useEffect(() => {
    if (autoOpenQuestionId) {
      const target =
        activeQuestions.find((q) => q.id === autoOpenQuestionId) ||
        activeQuestions.find((q) => !completedIds.includes(q.id)) ||
        activeQuestions[0];
      if (target) {
        handleSelectQuestion(target);
      }
      onClearAutoOpen?.();
    }
  }, [autoOpenQuestionId, completedIds, onClearAutoOpen, activeQuestions]);

  // Timer ticker for Daily Challenge (< 5 mins)
  useEffect(() => {
    if (!selectedQuestion || isChecked || !questionStartTime) return;
    const interval = setInterval(() => {
      setLiveElapsedSeconds(Math.round((Date.now() - questionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedQuestion, isChecked, questionStartTime]);

  const handleSelectQuestion = (q: NumeracyQuestion) => {
    soundFx.playClick();
    setSelectedQuestion(q);
    setUserAnswer(q.type === 'multiple-choice' ? [] : null);
    setNumericInput('');
    setIsChecked(false);
    setIsCorrect(null);
    setShowHint(false);
    setShowSolution(false);
    setShowScratchpad(false);
    setQuestionStartTime(Date.now());
    setLiveElapsedSeconds(0);
  };

  const handleMultipleSelect = (option: string) => {
    soundFx.playClick();
    const current = (userAnswer as string[]) || [];
    if (current.includes(option)) {
      setUserAnswer(current.filter((o) => o !== option));
    } else {
      setUserAnswer([...current, option]);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedQuestion) return;

    let correct = false;

    if (selectedQuestion.type === 'single-choice') {
      correct = userAnswer === selectedQuestion.correctAnswer;
    } else if (selectedQuestion.type === 'multiple-choice') {
      const expected = selectedQuestion.correctAnswer as string[];
      const actual = (userAnswer as string[]) || [];
      correct =
        expected.length === actual.length &&
        expected.every((item) => actual.includes(item));
    } else if (selectedQuestion.type === 'numeric') {
      const numVal = parseFloat(numericInput.replace(',', '.').trim());
      correct = Math.abs(numVal - selectedQuestion.correctAnswer) < 0.01;
    }

    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      soundFx.playCorrect();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      soundFx.playWrong();
    }

    const totalElapsed = questionStartTime
      ? Math.round((Date.now() - questionStartTime) / 1000)
      : 0;

    onQuestionCompleted(selectedQuestion.id, correct, totalElapsed);
  };

  const filteredQuestions = activeQuestions.filter((q) => {
    if (filterLevel !== 'all' && q.level !== filterLevel) return false;
    if (filterDomain !== 'all' && q.domain !== filterDomain) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {!selectedQuestion ? (
        <div className="space-y-6">
          {/* Header and Filter */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Numerasi & Asesmen Kontekstual</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Soal AKM numerasi berbasis stimulus nyata: diagram batang, denah geometri, rasio keuangan, dan pola Nusantara.
                </p>
              </div>

              {/* Segmented Domain Filters */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setFilterDomain('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterDomain === 'all' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Domain
                </button>
                <button
                  onClick={() => setFilterDomain('bilangan')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterDomain === 'bilangan' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bilangan
                </button>
                <button
                  onClick={() => setFilterDomain('geometri')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterDomain === 'geometri' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Geometri
                </button>
                <button
                  onClick={() => setFilterDomain('data')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterDomain === 'data' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Data & Peluang
                </button>
                <button
                  onClick={() => setFilterDomain('aljabar')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterDomain === 'aljabar' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aljabar & Pola
                </button>
              </div>
            </div>

            {/* Sub-level Filter Row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 whitespace-nowrap">Tingkat Fase SD:</span>
              {(['all', 'fase-a', 'fase-b', 'fase-c'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                    filterLevel === lvl ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {lvl === 'all'
                    ? 'Semua SD'
                    : lvl === 'fase-a'
                    ? 'Fase A (Kls 1-2)'
                    : lvl === 'fase-b'
                    ? 'Fase B (Kls 3-4)'
                    : 'Fase C (Kls 5-6)'}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuestions.map((q) => {
              const isCompleted = completedIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-indigo-700">{q.levelLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.domainLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.contextLabel}</span>
                      {isCompleted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 font-bold">✓ Terselesaikan</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {q.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {q.stimulus.text}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                        Level: {q.cognitiveLevel}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium capitalize">
                        Bentuk: {q.type.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Standar Asesmen Nasional</span>
                    <button
                      onClick={() => handleSelectQuestion(q)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      Buka Soal Cerita <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Question Working Area */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedQuestion(null);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <span>←</span> Kembali ke Daftar Soal Numerasi
            </button>

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

              <button
                onClick={() => setShowScratchpad(!showScratchpad)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  showScratchpad
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>✏️</span> Coretan Hitung Siswa
              </button>
            </div>
          </div>

          {/* Optional Scratchpad Canvas/Textarea */}
          {showScratchpad && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                <span>Papan Coretan & Catatan Perhitungan Siswa:</span>
                <button
                  onClick={() => setScratchpadText('')}
                  className="text-[11px] text-amber-700 hover:underline font-normal"
                >
                  Hapus Coretan
                </button>
              </div>
              <textarea
                rows={3}
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Tuliskan operasi perkalian, penjumlahan, atau coretan rumusanmu di sini..."
                className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stimulus & Chart Area */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-indigo-700">{selectedQuestion.levelLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedQuestion.domainLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedQuestion.contextLabel}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {selectedQuestion.title}
                </h1>
              </div>

              {/* Stimulus Narrative */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 text-slate-800 leading-relaxed text-sm md:text-base">
                {selectedQuestion.stimulus.text}
              </div>

              {/* Interactive Visuals / Charts */}
              {selectedQuestion.stimulus.chartType === 'bar' && selectedQuestion.stimulus.chartData && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4 text-center">
                    Diagram Batang Pengunjung Harian
                  </h4>
                  <div className="h-48 flex items-end justify-around gap-2 pt-6 px-4 border-b border-l border-slate-300">
                    {selectedQuestion.stimulus.chartData.categories.map((cat: string, idx: number) => {
                      const val = selectedQuestion.stimulus.chartData.values[idx];
                      const heightPercent = (val / 70) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-xs font-mono font-bold text-indigo-700">
                            {val}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[42px] bg-indigo-600 rounded-t-md group-hover:bg-indigo-700 transition-all"
                          />
                          <span className="text-xs font-medium text-slate-600 mt-1">
                            {cat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedQuestion.stimulus.chartType === 'grid' && selectedQuestion.stimulus.chartData && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
                  <div className="text-xs font-bold text-slate-700 mb-3">
                    Denah Taman Persegi Panjang
                  </div>
                  <div className="relative w-64 h-44 bg-emerald-50 border-4 border-emerald-700 rounded-xl flex items-center justify-center shadow-inner">
                    <span className="text-xs font-bold text-emerald-900">
                      Rumput Hias (Luas = p × l)
                    </span>
                    {/* Top dimension */}
                    <div className="absolute -top-7 left-0 right-0 text-center text-xs font-mono font-bold text-slate-800">
                      Panjang (p) = 12 m
                    </div>
                    {/* Left dimension */}
                    <div className="absolute top-0 bottom-0 -left-10 flex items-center text-xs font-mono font-bold text-slate-800 -rotate-90">
                      Lebar = 8 m
                    </div>
                  </div>
                </div>
              )}

              {selectedQuestion.stimulus.chartType === 'table' && selectedQuestion.stimulus.chartData?.comparison && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
                      <tr>
                        <th className="p-3">Jenis Lampu</th>
                        <th className="p-3">Jumlah</th>
                        <th className="p-3">Daya Tiap Lampu</th>
                        <th className="p-3">Total Daya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedQuestion.stimulus.chartData.comparison.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{item.type}</td>
                          <td className="p-3">{item.qty} unit</td>
                          <td className="p-3">{item.watt} Watt</td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{item.totalWatt} Watt</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Hint Accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs font-bold text-amber-800 flex items-center gap-1.5 hover:underline"
                >
                  <span>💡</span> {showHint ? 'Tutup Petunjuk' : 'Butuh Petunjuk Pengerjaan?'}
                </button>
                {showHint && (
                  <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed">
                    <strong>Petunjuk Guru:</strong> {selectedQuestion.hint}
                  </div>
                )}
              </div>
            </div>

            {/* Answer & Interaction Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div>
                  <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
                    Pertanyaan Asesmen
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedQuestion.question}
                  </h3>
                </div>

                {/* Option / Input Interface */}
                {selectedQuestion.type === 'single-choice' && selectedQuestion.options && (
                  <div className="space-y-2 pt-2">
                    {selectedQuestion.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        disabled={isChecked}
                        onClick={() => {
                          soundFx.playClick();
                          setUserAnswer(opt);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-colors ${
                          userAnswer === opt
                            ? 'bg-indigo-700 text-white border-indigo-800 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {selectedQuestion.type === 'multiple-choice' && selectedQuestion.options && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] text-slate-500 italic block">
                      * Pilih dua atau lebih opsi yang paling sesuai
                    </span>
                    {selectedQuestion.options.map((opt, optIdx) => {
                      const checked = ((userAnswer as string[]) || []).includes(opt);
                      return (
                        <button
                          key={optIdx}
                          disabled={isChecked}
                          onClick={() => handleMultipleSelect(opt)}
                          className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-colors flex items-start gap-2.5 ${
                            checked
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-500 font-semibold'
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

                {selectedQuestion.type === 'numeric' && (
                  <div className="pt-2 space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tuliskan angka hasil perhitunganmu:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        disabled={isChecked}
                        value={numericInput}
                        onChange={(e) => setNumericInput(e.target.value)}
                        placeholder="Contoh: 40"
                        className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      {selectedQuestion.unit && (
                        <span className="text-sm font-semibold text-slate-600">
                          {selectedQuestion.unit}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit / Check Answer Button */}
                {!isChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={
                      (selectedQuestion.type === 'numeric' && !numericInput.trim()) ||
                      (selectedQuestion.type === 'single-choice' && !userAnswer) ||
                      (selectedQuestion.type === 'multiple-choice' && (!userAnswer || userAnswer.length === 0))
                    }
                    className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-xs"
                  >
                    Periksa Jawaban
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    {/* Result Banner */}
                    <div
                      className={`p-4 rounded-xl border flex items-center gap-3 ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="text-2xl">{isCorrect ? '🎉' : '🤔'}</span>
                      <div>
                        <div className="font-bold text-sm">
                          {isCorrect ? 'Hebat! Jawabanmu Benar!' : 'Belum Tepat, Jangan Putus Asa!'}
                        </div>
                        <div className="text-xs mt-0.5">
                          {isCorrect
                            ? 'Kamu memahami konsep stimulus dengan sangat baik.'
                            : 'Pelajari langkah penyelesaian di bawah ini untuk memahami rumusnya.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSolution(!showSolution)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                      >
                        {showSolution ? 'Tutup Pembahasan' : '📖 Buka Pembahasan Bertahap'}
                      </button>
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedQuestion(null);
                        }}
                        className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Lanjut ke Soal Lain
                      </button>
                    </div>

                    {showSolution && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <span className="font-bold text-slate-900 block mb-1">
                          Langkah Penyelesaian (Kurikulum Merdeka):
                        </span>
                        {selectedQuestion.stepByStepSolution.map((step, idx) => (
                          <div key={idx} className="text-slate-700 leading-relaxed font-sans">
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
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
