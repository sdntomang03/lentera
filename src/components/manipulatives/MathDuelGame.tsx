import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../../utils/audio';

/**
 * "Duel Berhitung Cepat" — a 2-player same-screen quick-math buzzer game.
 * Both players sit at the same device, each has their own set of answer
 * buttons on their half of the screen, and race to tap the correct answer
 * first. Designed with dramatic countdowns, reveals and a victory screen.
 */

type Phase = 'setup' | 'countdown' | 'question' | 'reveal' | 'finished';
type PlayerKey = 'p1' | 'p2';

interface Question {
  text: string;
  answer: number;
  choicesP1: number[];
  choicesP2: number[];
}

const ROUND_SECONDS = 8;

type Operation = '+' | '-' | '×' | '÷';

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: '+', label: 'Penjumlahan' },
  { value: '-', label: 'Pengurangan' },
  { value: '×', label: 'Perkalian' },
  { value: '÷', label: 'Pembagian' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genDistractors(answer: number, count: number): number[] {
  const nearbyAnswers = Array.from({ length: 20 }, (_, index) => {
    const distance = Math.floor(index / 2) + 1;
    return index % 2 === 0 ? answer + distance : answer - distance;
  }).filter((candidate) => candidate > 0 && candidate !== answer);
  const distractors = shuffle(nearbyAnswers).slice(0, count);
  return shuffle([answer, ...distractors]);
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genQuestion(operations: Operation[], firstDigitCount: number, secondDigitCount: number): Question {
  const op = operations[randomInteger(0, operations.length - 1)];
  const minFirstOperand = 10 ** (firstDigitCount - 1);
  const maxFirstOperand = 10 ** firstDigitCount - 1;
  const minSecondOperand = 10 ** (secondDigitCount - 1);
  const maxSecondOperand = 10 ** secondDigitCount - 1;
  let a: number;
  let b: number;
  let answer: number;

  if (op === '÷') {
    const maxValidDivisor = Math.min(maxSecondOperand, maxFirstOperand);
    b = randomInteger(minSecondOperand, maxValidDivisor);
    const minQuotient = Math.max(1, Math.ceil(minFirstOperand / b));
    const maxQuotient = Math.floor(maxFirstOperand / b);
    answer = randomInteger(minQuotient, maxQuotient);
    a = b * answer;
  } else if (op === '-') {
    a = randomInteger(Math.max(minFirstOperand, minSecondOperand + 1), maxFirstOperand);
    const maxValidSecond = Math.min(maxSecondOperand, a - 1);
    b = randomInteger(minSecondOperand, maxValidSecond);
    answer = a - b;
  } else {
    a = randomInteger(minFirstOperand, maxFirstOperand);
    b = randomInteger(minSecondOperand, maxSecondOperand);
    answer = op === '+' ? a + b : a * b;
  }

  const distractors = genDistractors(answer, 3);

  return {
    text: `${a} ${op} ${b}`,
    answer,
    choicesP1: shuffle(distractors),
    choicesP2: shuffle(distractors),
  };
}

export const MathDuelGame: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [names, setNames] = useState({ p1: 'Pemain 1', p2: 'Pemain 2' });
  const [selectedOperations, setSelectedOperations] = useState<Operation[]>(['+', '-']);
  const [firstDigitCount, setFirstDigitCount] = useState(2);
  const [secondDigitCount, setSecondDigitCount] = useState(2);
  const [questionCount, setQuestionCount] = useState(8);
  const [setupError, setSetupError] = useState('');
  const [fullscreenError, setFullscreenError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [question, setQuestion] = useState<Question | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [locked, setLocked] = useState<{ p1: boolean; p2: boolean }>({ p1: false, p2: false });
  const [roundWinner, setRoundWinner] = useState<PlayerKey | 'draw' | null>(null);
  const [flash, setFlash] = useState<{ side: PlayerKey; ok: boolean } | null>(null);

  const timers = useRef<number[]>([]);
  const roundActiveRef = useRef(false);
  // Authoritative round counter for game-loop control flow. Using this (instead
  // of the `round` state) avoids stale-closure bugs inside the chained
  // setTimeout sequence that drives countdown -> question -> reveal -> next round.
  const roundRef = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.forEach((id) => window.clearInterval(id));
    timers.current = [];
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === gameContainerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      clearTimers();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const startGame = () => {
    if (selectedOperations.length === 0) {
      setSetupError('Pilih minimal satu operasi hitung.');
      return;
    }
    if (selectedOperations.includes('-') && firstDigitCount < secondDigitCount) {
      setSetupError('Untuk pengurangan, banyak digit angka 1 harus sama atau lebih besar daripada angka 2.');
      return;
    }
    if (selectedOperations.includes('÷') && firstDigitCount < secondDigitCount) {
      setSetupError('Untuk pembagian, banyak digit angka 1 harus sama atau lebih besar daripada angka 2.');
      return;
    }
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50) {
      setSetupError('Jumlah soal harus antara 1 sampai 50.');
      return;
    }
    setSetupError('');
    setFullscreenError('');
    soundFx.playClick();
    if (gameContainerRef.current?.requestFullscreen) {
      void gameContainerRef.current.requestFullscreen().catch((error: unknown) => {
        console.warn('Could not enter fullscreen for math duel:', error);
        setFullscreenError('Mode layar penuh tidak tersedia. Permainan tetap dapat dilanjutkan.');
      });
    } else {
      setFullscreenError('Browser tidak mendukung mode layar penuh. Permainan tetap dapat dilanjutkan.');
    }
    setScores({ p1: 0, p2: 0 });
    startCountdown(1);
  };

  const startCountdown = (nextRound: number) => {
    clearTimers();
    roundRef.current = nextRound;
    setPhase('countdown');
    setRoundWinner(null);
    setFlash(null);
    setRound(nextRound);
    let c = 3;
    setCountdown(c);
    const tick = () => {
      c -= 1;
      if (c > 0) {
        setCountdown(c);
        timers.current.push(window.setTimeout(tick, 600));
      } else {
        setCountdown(0);
        timers.current.push(
          window.setTimeout(() => {
            beginQuestion(nextRound);
          }, 600)
        );
      }
    };
    timers.current.push(window.setTimeout(tick, 600));
  };

  const beginQuestion = (roundNum: number) => {
    clearTimers();
    setQuestion(genQuestion(selectedOperations, firstDigitCount, secondDigitCount));
    setLocked({ p1: false, p2: false });
    setTimeLeft(ROUND_SECONDS);
    setPhase('question');
    roundActiveRef.current = true;

    const interval = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(interval);
          if (roundActiveRef.current) {
            roundActiveRef.current = false;
            revealRound('draw');
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    timers.current.push(interval);
  };

  const revealRound = (winner: PlayerKey | 'draw') => {
    clearTimers();
    roundActiveRef.current = false;
    setPhase('reveal');
    setRoundWinner(winner);

    if (winner !== 'draw') {
      soundFx.playCorrect();
      setScores((s) => ({ ...s, [winner]: s[winner] + 1 }));
    } else {
      soundFx.playWrong();
    }

    const finishedRound = roundRef.current;
    timers.current.push(
      window.setTimeout(() => {
        if (finishedRound >= questionCount) {
          setPhase('finished');
          soundFx.playFanfare();
        } else {
          startCountdown(finishedRound + 1);
        }
      }, 1600)
    );
  };

  const handleAnswer = (side: PlayerKey, value: number) => {
    if (phase !== 'question' || !roundActiveRef.current || locked[side] || !question) return;
    soundFx.playClick();

    if (value === question.answer) {
      roundActiveRef.current = false;
      setFlash({ side, ok: true });
      revealRound(side);
    } else {
      setLocked((l) => ({ ...l, [side]: true }));
      setFlash({ side, ok: false });
      soundFx.playWrong();
      // If both players have now answered wrong, it's a draw round
      setTimeout(() => {
        setLocked((l) => {
          const otherKey = side === 'p1' ? 'p2' : 'p1';
          if (l[otherKey] && roundActiveRef.current) {
            roundActiveRef.current = false;
            revealRound('draw');
          }
          return l;
        });
      }, 50);
    }
  };

  const resetAll = () => {
    clearTimers();
    roundRef.current = 0;
    roundActiveRef.current = false;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch((error: unknown) => {
        console.warn('Could not exit fullscreen for math duel:', error);
      });
    }
    soundFx.playClick();
    setPhase('setup');
    setScores({ p1: 0, p2: 0 });
    setRound(0);
    setQuestion(null);
    setRoundWinner(null);
    setFlash(null);
  };

  const playerNames = {
    p1: names.p1.trim() || 'Pemain 1',
    p2: names.p2.trim() || 'Pemain 2',
  };
  const winnerName = scores.p1 === scores.p2 ? null : scores.p1 > scores.p2 ? playerNames.p1 : playerNames.p2;
  const timerPct = Math.max(0, (timeLeft / ROUND_SECONDS) * 100);
  const scorePercent = (side: PlayerKey) => Math.round((scores[side] / questionCount) * 100);


  const renderPanel = (side: PlayerKey) => {
    const name = playerNames[side];
    const choices = side === 'p1' ? question?.choicesP1 : question?.choicesP2;
    const isFlashOk = flash?.side === side && flash.ok;
    const isFlashBad = flash?.side === side && !flash.ok;
    const isRoundWinner = roundWinner === side;
    const palette = side === 'p1' ? 'from-teal-600 to-emerald-600' : 'from-indigo-600 to-violet-600';
    const isLeading = scores[side] > scores[side === 'p1' ? 'p2' : 'p1'];

    return (
      <div
        className={`flex min-h-0 flex-1 flex-col min-w-0 rounded-2xl border transition-all ${
          isFullscreen ? 'space-y-2 p-2 sm:space-y-3 sm:p-3' : 'space-y-3 p-4'
        } ${
          isFlashOk || isRoundWinner
            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400'
            : isFlashBad
            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-300'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-black text-sm truncate bg-gradient-to-r ${palette} bg-clip-text text-transparent`}>
            {name}
          </span>
          <span className={`font-black text-slate-800 font-mono ${isFullscreen ? 'text-xs sm:text-base' : 'text-sm'}`}>
            ⭐ {scores[side]} poin
          </span>
        </div>
        <div className={`grid min-h-0 flex-1 grid-cols-2 ${isFullscreen ? 'gap-2 sm:gap-3' : 'gap-2'}`}>
          {(choices ?? []).map((val, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(side, val)}
              disabled={phase !== 'question' || locked[side]}
              className={`${isFullscreen
                ? 'min-h-[clamp(2.75rem,9vh,5rem)] px-2 py-1 text-[clamp(1.25rem,4vh,2rem)] sm:min-h-[clamp(3rem,10vh,6rem)] sm:text-[clamp(1.5rem,5vh,2.75rem)]'
                : 'py-3 text-lg'
              } rounded-xl font-black border transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                locked[side]
                  ? 'bg-slate-100 border-slate-200 text-slate-300'
                  : `bg-white border-slate-300 text-slate-800 hover:bg-gradient-to-r hover:${palette} hover:text-white`
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={gameContainerRef}
      className={`bg-white shadow-xs ${
        isFullscreen
          ? 'fixed inset-0 z-[100] flex h-dvh w-screen flex-col gap-2 overflow-hidden rounded-none border-0 bg-slate-100 p-2 sm:gap-3 sm:p-4'
          : 'space-y-5 rounded-2xl border border-slate-200 p-5 sm:p-6'
      }`}
    >
      <div className={`flex shrink-0 items-start justify-between gap-3 ${isFullscreen ? 'min-h-0' : ''}`}>
        <div>
          <h3 className={`font-bold text-slate-900 flex items-center gap-2 ${isFullscreen ? 'text-sm sm:text-lg' : 'text-lg'}`}>
            <span className={isFullscreen ? 'text-lg sm:text-2xl' : 'text-2xl'}>⚡</span> Duel Berhitung Cepat (2 Pemain)
          </h3>
          <p className={`text-sm text-slate-500 mt-1 ${isFullscreen ? 'hidden' : ''}`}>
            Dua pemain di satu layar, adu cepat menjawab soal hitungan. Siapa paling banyak menang, dialah juaranya!
          </p>
        </div>
        {isFullscreen && (
          <button
            type="button"
            onClick={() => {
              void document.exitFullscreen().catch((error: unknown) => {
                console.warn('Could not exit fullscreen for math duel:', error);
              });
            }}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            ✕ Keluar layar penuh
          </button>
        )}
      </div>

      {fullscreenError && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          {fullscreenError}
        </p>
      )}

      {phase === 'setup' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Pemain 1</label>
              <input
                value={names.p1}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, p1: e.target.value }))}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Pemain 2</label>
              <input
                value={names.p2}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, p2: e.target.value }))}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-slate-700">Operasi hitung (pilih satu atau lebih)</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OPERATIONS.map((operation) => {
                const isSelected = selectedOperations.includes(operation.value);
                return (
                  <label
                    key={operation.value}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSetupError('');
                        setSelectedOperations((current) => isSelected
                          ? current.filter((value) => value !== operation.value)
                          : [...current, operation.value]);
                      }}
                      className="h-4 w-4 accent-teal-700"
                    />
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-sm shadow-xs">
                      {operation.value}
                    </span>
                    {operation.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="duel-first-digit-count" className="text-xs font-bold text-slate-700">
                Banyak digit pada angka 1
              </label>
              <select
                id="duel-first-digit-count"
                value={firstDigitCount}
                onChange={(event) => setFirstDigitCount(Number(event.target.value))}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4, 5].map((digits) => (
                  <option key={digits} value={digits}>{digits} digit</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">Bilangan dari {10 ** (firstDigitCount - 1)} sampai {10 ** firstDigitCount - 1}.</p>
            </div>
            <div>
              <label htmlFor="duel-second-digit-count" className="text-xs font-bold text-slate-700">
                Banyak digit pada angka 2
              </label>
              <select
                id="duel-second-digit-count"
                value={secondDigitCount}
                onChange={(event) => setSecondDigitCount(Number(event.target.value))}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5].map((digits) => (
                  <option key={digits} value={digits}>{digits} digit</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">Bilangan dari {10 ** (secondDigitCount - 1)} sampai {10 ** secondDigitCount - 1}.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="duel-question-count" className="text-xs font-bold text-slate-700">
                Banyak soal
              </label>
              <input
                id="duel-question-count"
                type="number"
                min={1}
                max={50}
                step={1}
                value={questionCount || ''}
                onChange={(event) => setQuestionCount(event.target.value === '' ? 0 : Number(event.target.value))}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">Masukkan jumlah soal dari 1 sampai 50.</p>
            </div>
          </div>

          {setupError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {setupError}
            </p>
          )}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            📱 Duduk berhadapan atau berdampingan dengan satu perangkat. Setiap pemain punya kotak jawaban sendiri —
            siapa yang paling cepat dan benar menekan jawabannya, dapat poin! Ada {questionCount || 0} soal.
            Semua soal dan pilihan jawaban menggunakan bilangan asli.
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-105 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            🚀 Mulai Duel!
          </button>
        </div>
      )}

      {(phase === 'countdown' || phase === 'question' || phase === 'reveal') && (
        <div className={`space-y-4 ${isFullscreen ? 'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col sm:space-y-3' : ''}`}>
          <div className={`flex shrink-0 items-center justify-between text-xs font-bold text-slate-500 ${isFullscreen ? 'min-h-0' : ''}`}>
            <span className={isFullscreen ? 'text-sm sm:text-base' : ''}>Babak {round}/{questionCount}</span>
            {phase === 'question' && (
              <span className={`${timeLeft <= 3 ? 'text-rose-600 animate-pulse' : ''} ${isFullscreen ? 'text-lg sm:text-xl' : ''}`}>
                ⏱️ {timeLeft} detik
              </span>
            )}
          </div>

          <div className={`grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-md sm:gap-4 ${
            isFullscreen ? 'sm:p-3' : 'p-3'
          }`}>
            {(['p1', 'p2'] as const).map((side) => {
              const isLeading = scores[side] > scores[side === 'p1' ? 'p2' : 'p1'];
              return (
                <React.Fragment key={side}>
                  <div className={`min-w-0 rounded-xl border p-2 sm:p-3 ${
                    isLeading
                      ? side === 'p1' ? 'border-teal-300 bg-teal-50 shadow-md shadow-teal-900/10' : 'border-indigo-300 bg-indigo-50 shadow-md shadow-indigo-900/10'
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate font-black ${isFullscreen ? 'text-sm sm:text-lg' : 'text-xs'} ${
                        side === 'p1' ? 'text-teal-800' : 'text-indigo-800'
                      }`}>{names[side]}</span>
                      {isLeading && (
                        <span className="hidden shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase text-amber-800 sm:inline">
                          Memimpin
                        </span>
                      )}
                    </div>
                    <div className={`mt-1 font-black tabular-nums leading-none ${
                      isFullscreen ? 'text-3xl sm:text-5xl' : 'text-3xl'
                    } ${isLeading ? 'text-amber-500 drop-shadow-sm' : 'text-slate-800'}`}>
                      {scores[side]}
                      <span className={`ml-1 align-baseline font-bold text-slate-400 ${isFullscreen ? 'text-sm sm:text-lg' : 'text-xs'}`}>
                        / {questionCount}
                      </span>
                    </div>
                    <div className={`mt-2 h-2 overflow-hidden rounded-full bg-slate-200 ${isFullscreen ? 'sm:h-3' : ''}`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                          side === 'p1' ? 'from-teal-500 to-emerald-400' : 'from-indigo-500 to-violet-400'
                        }`}
                        style={{ width: `${Math.min(100, (scores[side] / questionCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {side === 'p1' && (
                    <div className={`rounded-full bg-slate-900 px-2 py-1 text-center font-black italic text-white shadow-lg ${
                      isFullscreen ? 'text-[10px] sm:px-4 sm:py-2 sm:text-xl' : 'text-xs'
                    }`}>
                      VS
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {phase === 'question' && (
            <div className={`${isFullscreen ? 'h-2 sm:h-3' : 'h-2'} w-full shrink-0 overflow-hidden rounded-full bg-slate-100`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 3 ? 'bg-rose-500' : 'bg-teal-500'
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          )}

          <div className={`relative flex shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl ${
            isFullscreen ? 'min-h-[clamp(5rem,20vh,12rem)] p-3 sm:p-5' : 'min-h-[90px] p-4'
          }`}>
            {phase === 'countdown' && (
              <span className={`font-black animate-pulse ${isFullscreen ? 'text-5xl sm:text-7xl' : 'text-4xl'}`}>
                {countdown === 0 ? '⚡ MULAI! ⚡' : countdown}
              </span>
            )}
            {(phase === 'question' || phase === 'reveal') && question && (
              <>
                <span className={`text-center font-black tracking-wide font-mono ${
                  isFullscreen ? 'text-[clamp(2rem,8vh,5rem)] sm:text-[clamp(3rem,10vh,7rem)]' : 'text-3xl sm:text-4xl'
                }`}>{question.text} = ?</span>
                {phase === 'reveal' && (
                  <span className={`mt-3 font-bold text-amber-300 ${isFullscreen ? 'text-xl sm:text-2xl' : 'text-sm'}`}>
                    Jawaban: {question.answer}
                  </span>
                )}
              </>
            )}
          </div>

          {phase === 'reveal' && (
            <div className={`shrink-0 text-center ${isFullscreen ? 'py-0' : 'py-2'}`}>
              {roundWinner === 'draw' ? (
                <span className="text-sm font-black text-slate-500">⏳ Waktu habis! Tidak ada yang dapat poin.</span>
              ) : (
                <span className="text-lg font-black text-emerald-600 animate-bounce inline-block">
                  🎉 {names[roundWinner as PlayerKey]} lebih cepat! +1 Poin
                </span>
              )}
            </div>
          )}

          <div className={`flex min-h-0 flex-1 gap-2 ${isFullscreen ? 'flex-row sm:gap-4' : 'gap-3'}`}>
            {renderPanel('p1')}
            {renderPanel('p2')}
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className={`text-center ${isFullscreen ? 'flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden' : 'space-y-4 py-4'}`}>
          <div className={`animate-bounce ${isFullscreen ? 'text-4xl' : 'text-6xl'}`}>🏆</div>
          {winnerName ? (
            <>
              <h4 className="text-2xl font-black text-slate-900">{winnerName} MENANG!</h4>
              <p className="text-sm text-slate-500">
                Skor akhir: {playerNames.p1} {scores.p1} - {scores.p2} {playerNames.p2}
              </p>
              <div className="text-3xl">🎊🎉✨🎊🎉</div>
            </>
          ) : (
            <>
              <h4 className="text-2xl font-black text-slate-900">SERI!</h4>
              <p className="text-sm text-slate-500">
                Skor akhir: {playerNames.p1} {scores.p1} - {scores.p2} {playerNames.p2}. Sama-sama hebat!
              </p>
            </>
          )}
          <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${isFullscreen ? 'mx-auto w-full max-w-3xl pt-1' : 'gap-3 pt-2'}`}>
            {(['p1', 'p2'] as const).map((side) => (
              <div
                key={side}
                className={`rounded-2xl border ${isFullscreen ? 'p-2 sm:p-3' : 'p-4'} ${
                  side === 'p1' ? 'border-teal-200 bg-teal-50' : 'border-indigo-200 bg-indigo-50'
                }`}
              >
                <p className="truncate text-sm font-bold text-slate-700">{names[side]}</p>
                <p className={`mt-1 font-black text-slate-900 ${isFullscreen ? 'text-2xl sm:text-3xl' : 'text-3xl'}`}>
                  {scorePercent(side)}<span className="text-base">/100</span>
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  Nilai · {scores[side]} dari {questionCount} soal dimenangkan
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={resetAll}
            className={`rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 font-black text-white shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer ${isFullscreen ? 'mx-auto py-2 text-xs sm:py-3 sm:text-sm' : 'py-3 text-sm'}`}
          >
            🔄 Main Lagi
          </button>
        </div>
      )}
    </div>
  );
};
