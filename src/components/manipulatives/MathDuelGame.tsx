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

const TOTAL_ROUNDS = 8;
const ROUND_SECONDS = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genDistractors(answer: number, count: number): number[] {
  const set = new Set<number>([answer]);
  while (set.size < count + 1) {
    const delta = Math.floor(Math.random() * 9) - 4 || 1;
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) set.add(candidate);
  }
  return Array.from(set);
}

function genQuestion(round: number): Question {
  let a = 0;
  let b = 0;
  let op: '+' | '-' | '×' = '+';

  if (round <= 2) {
    op = '+';
    a = Math.floor(Math.random() * 15) + 1;
    b = Math.floor(Math.random() * 15) + 1;
  } else if (round <= 4) {
    op = '-';
    a = Math.floor(Math.random() * 15) + 10;
    b = Math.floor(Math.random() * a);
  } else if (round <= 6) {
    op = '×';
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
  } else {
    const ops: Array<'+' | '-' | '×'> = ['+', '-', '×'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '+') {
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * a);
    } else {
      a = Math.floor(Math.random() * 10) + 2;
      b = Math.floor(Math.random() * 10) + 2;
    }
  }

  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const distractors = genDistractors(answer, 3);

  return {
    text: `${a} ${op} ${b}`,
    answer,
    choicesP1: shuffle(distractors),
    choicesP2: shuffle(distractors),
  };
}

export const MathDuelGame: React.FC = () => {
  const [names, setNames] = useState({ p1: 'Pemain 1', p2: 'Pemain 2' });
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

  useEffect(() => clearTimers, []);

  const startGame = () => {
    soundFx.playClick();
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
    setQuestion(genQuestion(roundNum));
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
        if (finishedRound >= TOTAL_ROUNDS) {
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
    soundFx.playClick();
    setPhase('setup');
    setScores({ p1: 0, p2: 0 });
    setRound(0);
    setQuestion(null);
    setRoundWinner(null);
    setFlash(null);
  };

  const winnerName = scores.p1 === scores.p2 ? null : scores.p1 > scores.p2 ? names.p1 : names.p2;
  const timerPct = Math.max(0, (timeLeft / ROUND_SECONDS) * 100);

  const renderPanel = (side: PlayerKey) => {
    const name = names[side];
    const choices = side === 'p1' ? question?.choicesP1 : question?.choicesP2;
    const isFlashOk = flash?.side === side && flash.ok;
    const isFlashBad = flash?.side === side && !flash.ok;
    const isRoundWinner = roundWinner === side;
    const palette = side === 'p1' ? 'from-teal-600 to-emerald-600' : 'from-indigo-600 to-violet-600';

    return (
      <div
        className={`flex-1 min-w-0 rounded-2xl border p-4 space-y-3 transition-all ${
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
          <span className="text-lg font-black text-slate-800 font-mono">{scores[side]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(choices ?? []).map((val, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(side, val)}
              disabled={phase !== 'question' || locked[side]}
              className={`py-3 rounded-xl font-black text-lg border transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="text-2xl">⚡</span> Duel Berhitung Cepat (2 Pemain)
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Dua pemain di satu layar, adu cepat menjawab soal hitungan. Siapa paling banyak menang, dialah juaranya!
        </p>
      </div>

      {phase === 'setup' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Pemain 1</label>
              <input
                value={names.p1}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, p1: e.target.value || 'Pemain 1' }))}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Pemain 2</label>
              <input
                value={names.p2}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, p2: e.target.value || 'Pemain 2' }))}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            📱 Duduk berhadapan atau berdampingan dengan satu perangkat. Setiap pemain punya kotak jawaban sendiri —
            siapa yang paling cepat dan benar menekan jawabannya, dapat poin! Ada {TOTAL_ROUNDS} babak.
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
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Babak {round}/{TOTAL_ROUNDS}</span>
            {phase === 'question' && (
              <span className={timeLeft <= 3 ? 'text-rose-600 animate-pulse' : ''}>⏱️ {timeLeft} detik</span>
            )}
          </div>

          {phase === 'question' && (
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 3 ? 'bg-rose-500' : 'bg-teal-500'
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          )}

          <div className="relative flex flex-col items-center justify-center min-h-[90px] rounded-2xl bg-slate-900 text-white p-4">
            {phase === 'countdown' && (
              <span className="text-4xl font-black animate-pulse">
                {countdown === 0 ? '⚡ MULAI! ⚡' : countdown}
              </span>
            )}
            {(phase === 'question' || phase === 'reveal') && question && (
              <>
                <span className="text-3xl sm:text-4xl font-black tracking-wide font-mono">{question.text} = ?</span>
                {phase === 'reveal' && (
                  <span className="mt-2 text-sm font-bold text-amber-300">Jawaban: {question.answer}</span>
                )}
              </>
            )}
          </div>

          {phase === 'reveal' && (
            <div className="text-center py-2">
              {roundWinner === 'draw' ? (
                <span className="text-sm font-black text-slate-500">⏳ Waktu habis! Tidak ada yang dapat poin.</span>
              ) : (
                <span className="text-lg font-black text-emerald-600 animate-bounce inline-block">
                  🎉 {names[roundWinner as PlayerKey]} lebih cepat! +1 Poin
                </span>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {renderPanel('p1')}
            {renderPanel('p2')}
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="text-center space-y-4 py-4">
          <div className="text-6xl animate-bounce">🏆</div>
          {winnerName ? (
            <>
              <h4 className="text-2xl font-black text-slate-900">{winnerName} MENANG!</h4>
              <p className="text-sm text-slate-500">
                Skor akhir: {names.p1} {scores.p1} - {scores.p2} {names.p2}
              </p>
              <div className="text-3xl">🎊🎉✨🎊🎉</div>
            </>
          ) : (
            <>
              <h4 className="text-2xl font-black text-slate-900">SERI!</h4>
              <p className="text-sm text-slate-500">
                Skor akhir: {names.p1} {scores.p1} - {scores.p2} {names.p2}. Sama-sama hebat!
              </p>
            </>
          )}
          <button
            onClick={resetAll}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-105 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            🔄 Main Lagi
          </button>
        </div>
      )}
    </div>
  );
};
