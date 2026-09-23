import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../../utils/audio';

/**
 * "Duel Tangram" — a 2-team same-screen tangram assembly race.
 * Each team gets its own board with a dashed silhouette (7 tangram slots).
 * They drag the 7 colored pieces from the tray into the matching slot.
 * The team that completes the picture correctly first wins the round.
 * Designed with dramatic countdowns, reveals and a victory screen, matching
 * the style of the other duel games in Lab Visual.
 */

type Phase = 'setup' | 'countdown' | 'playing' | 'roundResult' | 'finished';
type TeamKey = 't1' | 't2';
type PieceType = 'bigTriangle' | 'medTriangle' | 'smallTriangle' | 'square' | 'parallelogram';

interface SlotDef {
  id: string;
  type: PieceType;
  x: number; // percent, center position within the board
  y: number; // percent
  rotation: number; // degrees
  size: number; // px baseline size
  color: string;
}

interface ShapeDef {
  id: string;
  name: string;
  emoji: string;
  slots: SlotDef[];
}

const ROUND_SECONDS = 90;

// Consistent color per tangram "role" across every picture, so kids learn to
// recognize e.g. "keping merah" regardless of which shape is being built.
const C = {
  red: '#ef4444',
  sky: '#0ea5e9',
  emerald: '#10b981',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  orange: '#f97316',
  teal: '#14b8a6',
};

const SHAPES: ShapeDef[] = [
  {
    id: 'rumah',
    name: 'Rumah',
    emoji: '🏠',
    slots: [
      { id: 'rumah-roofL', type: 'bigTriangle', x: 38, y: 24, rotation: 0, size: 54, color: C.red },
      { id: 'rumah-roofR', type: 'bigTriangle', x: 62, y: 24, rotation: 270, size: 54, color: C.sky },
      { id: 'rumah-bush', type: 'medTriangle', x: 16, y: 58, rotation: 0, size: 40, color: C.emerald },
      { id: 'rumah-window', type: 'smallTriangle', x: 28, y: 48, rotation: 45, size: 30, color: C.amber },
      { id: 'rumah-chimney', type: 'smallTriangle', x: 74, y: 16, rotation: 180, size: 26, color: C.violet },
      { id: 'rumah-wall', type: 'square', x: 50, y: 50, rotation: 0, size: 56, color: C.orange },
      { id: 'rumah-door', type: 'parallelogram', x: 50, y: 66, rotation: 90, size: 34, color: C.teal },
    ],
  },
  {
    id: 'perahu',
    name: 'Perahu',
    emoji: '⛵',
    slots: [
      { id: 'perahu-sail1', type: 'bigTriangle', x: 44, y: 28, rotation: 0, size: 54, color: C.red },
      { id: 'perahu-sail2', type: 'bigTriangle', x: 58, y: 34, rotation: 180, size: 44, color: C.sky },
      { id: 'perahu-mast', type: 'medTriangle', x: 50, y: 12, rotation: 180, size: 30, color: C.emerald },
      { id: 'perahu-flag1', type: 'smallTriangle', x: 68, y: 20, rotation: 90, size: 24, color: C.amber },
      { id: 'perahu-flag2', type: 'smallTriangle', x: 30, y: 46, rotation: 270, size: 24, color: C.violet },
      { id: 'perahu-porthole', type: 'square', x: 50, y: 46, rotation: 45, size: 26, color: C.orange },
      { id: 'perahu-hull', type: 'parallelogram', x: 50, y: 58, rotation: 0, size: 70, color: C.teal },
    ],
  },
  {
    id: 'roket',
    name: 'Roket',
    emoji: '🚀',
    slots: [
      { id: 'roket-nose', type: 'bigTriangle', x: 50, y: 20, rotation: 180, size: 48, color: C.red },
      { id: 'roket-finL', type: 'bigTriangle', x: 34, y: 60, rotation: 90, size: 40, color: C.sky },
      { id: 'roket-finR', type: 'medTriangle', x: 66, y: 60, rotation: 270, size: 38, color: C.emerald },
      { id: 'roket-window', type: 'smallTriangle', x: 50, y: 36, rotation: 225, size: 24, color: C.violet },
      { id: 'roket-flame1', type: 'smallTriangle', x: 42, y: 76, rotation: 0, size: 26, color: C.amber },
      { id: 'roket-body', type: 'square', x: 50, y: 44, rotation: 0, size: 50, color: C.orange },
      { id: 'roket-flame2', type: 'parallelogram', x: 58, y: 78, rotation: 180, size: 30, color: C.teal },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const PIECE_DIMS: Record<PieceType, { w: number; h: number; points: string }> = {
  bigTriangle: { w: 64, h: 64, points: '0,0 0,64 64,64' },
  medTriangle: { w: 46, h: 46, points: '0,0 0,46 46,46' },
  smallTriangle: { w: 34, h: 34, points: '0,0 0,34 34,34' },
  square: { w: 42, h: 42, points: '0,0 42,0 42,42 0,42' },
  parallelogram: { w: 58, h: 30, points: '10,30 34,0 58,0 34,30' },
};

// Fixed grid slots for the piece tray at the bottom of each board.
const TRAY_SLOTS = [
  { x: 14, y: 80 },
  { x: 32, y: 80 },
  { x: 50, y: 80 },
  { x: 68, y: 80 },
  { x: 86, y: 80 },
  { x: 32, y: 94 },
  { x: 68, y: 94 },
];

function trayPos(index: number) {
  return TRAY_SLOTS[index] ?? { x: 50, y: 90 };
}

interface PieceShapeProps {
  type: PieceType;
  size: number;
  rotation: number;
  x: number;
  y: number;
  color?: string;
  ghost?: boolean;
  elevated?: boolean;
}

const PieceShape: React.FC<PieceShapeProps> = ({ type, size, rotation, x, y, color, ghost, elevated }) => {
  const dims = PIECE_DIMS[type];
  const scale = size / Math.max(dims.w, dims.h);
  const w = dims.w * scale;
  const h = dims.h * scale;
  return (
    <div
      className={`absolute ${elevated ? '' : 'transition-[left,top] duration-150 ease-out'} ${
        ghost ? 'z-0' : elevated ? 'z-30' : 'z-10'
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: w,
        height: h,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) ${elevated ? 'scale(1.12)' : ''}`,
        filter: elevated ? 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))' : undefined,
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${dims.w} ${dims.h}`}>
        <polygon
          points={dims.points}
          fill={ghost ? 'transparent' : color}
          stroke={ghost ? '#94a3b8' : 'rgba(0,0,0,0.25)'}
          strokeWidth={1.5}
          strokeDasharray={ghost ? '4 3' : undefined}
        />
      </svg>
    </div>
  );
};

interface TeamBoardProps {
  shape: ShapeDef;
  teamLabel: string;
  accent: string;
  locked: boolean;
  resetKey: number;
  onComplete: () => void;
}

const TeamBoard: React.FC<TeamBoardProps> = ({ shape, teamLabel, accent, locked, resetKey, onComplete }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const completedRef = useRef(false);

  useEffect(() => {
    setPlaced(new Set());
    setDragId(null);
    completedRef.current = false;
    setOrder(shuffle(shape.slots.map((s) => s.id)));
  }, [resetKey, shape]);

  useEffect(() => {
    if (placed.size === shape.slots.length && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);

  const posFromEvent = (e: { clientX: number; clientY: number }) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (locked || placed.has(id)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    soundFx.playClick();
    setDragId(id);
    setDragPos(posFromEvent(e));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (dragId !== id) return;
    setDragPos(posFromEvent(e));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (dragId !== id) return;
    const slot = shape.slots.find((s) => s.id === id)!;
    const p = posFromEvent(e);
    const dist = Math.hypot(p.x - slot.x, p.y - slot.y);
    if (dist <= 10) {
      soundFx.playCorrect();
      setPlaced((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
    setDragId(null);
  };

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className={`font-black text-sm truncate ${accent}`}>{teamLabel}</span>
        <span className="text-xs font-bold text-slate-500">
          {placed.size}/{shape.slots.length} keping
        </span>
      </div>
      <div
        ref={boardRef}
        className="relative w-full aspect-[4/5] rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-sky-50 to-slate-50 select-none"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-x-0 top-0 h-[64%] border-b border-dashed border-slate-300/70 pointer-events-none" />
        <span className="absolute top-1 left-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide pointer-events-none">
          Papan Susun
        </span>
        <span className="absolute top-[65%] left-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide pointer-events-none">
          Keping
        </span>

        {shape.slots.map((slot) => (
          <PieceShape key={`ghost-${slot.id}`} type={slot.type} size={slot.size} rotation={slot.rotation} x={slot.x} y={slot.y} ghost />
        ))}

        {shape.slots.map((slot, idx) => {
          const isPlaced = placed.has(slot.id);
          const isDragging = dragId === slot.id;
          const orderIdx = order.indexOf(slot.id);
          const pos = isDragging ? dragPos : isPlaced ? { x: slot.x, y: slot.y } : trayPos(orderIdx >= 0 ? orderIdx : idx);
          const interactive = !isPlaced && !locked;
          return (
            <div
              key={slot.id}
              onPointerDown={(e) => handlePointerDown(e, slot.id)}
              onPointerMove={(e) => handlePointerMove(e, slot.id)}
              onPointerUp={(e) => handlePointerUp(e, slot.id)}
              className={`absolute inset-0 ${interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
            >
              <PieceShape type={slot.type} size={slot.size} rotation={slot.rotation} x={pos.x} y={pos.y} color={slot.color} elevated={isDragging} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TangramDuelGame: React.FC = () => {
  const [names, setNames] = useState({ t1: 'Tim Merah', t2: 'Tim Biru' });
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState({ t1: 0, t2: 0 });
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [roundWinner, setRoundWinner] = useState<TeamKey | 'draw' | null>(null);
  const [resetTick, setResetTick] = useState(0);

  const timers = useRef<number[]>([]);
  const roundActiveRef = useRef(false);
  // Authoritative round counter for game-loop control flow, avoiding stale
  // closures inside the chained setTimeout sequence (see MathDuelGame for the
  // same pattern and the bug it fixes).
  const roundRef = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.forEach((id) => window.clearInterval(id));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const startGame = () => {
    soundFx.playClick();
    setScores({ t1: 0, t2: 0 });
    startCountdown(1);
  };

  const startCountdown = (nextRound: number) => {
    clearTimers();
    roundRef.current = nextRound;
    setPhase('countdown');
    setRoundWinner(null);
    setRound(nextRound);
    setResetTick((t) => t + 1);
    let c = 3;
    setCountdown(c);
    const tick = () => {
      c -= 1;
      if (c > 0) {
        setCountdown(c);
        timers.current.push(window.setTimeout(tick, 600));
      } else {
        setCountdown(0);
        timers.current.push(window.setTimeout(() => beginPlaying(), 600));
      }
    };
    timers.current.push(window.setTimeout(tick, 600));
  };

  const beginPlaying = () => {
    clearTimers();
    setPhase('playing');
    setTimeLeft(ROUND_SECONDS);
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

  const handleTeamComplete = (team: TeamKey) => {
    if (phase !== 'playing' || !roundActiveRef.current) return;
    roundActiveRef.current = false;
    revealRound(team);
  };

  const revealRound = (winner: TeamKey | 'draw') => {
    clearTimers();
    roundActiveRef.current = false;
    setPhase('roundResult');
    setRoundWinner(winner);

    if (winner !== 'draw') {
      soundFx.playFanfare();
      setScores((s) => ({ ...s, [winner]: s[winner] + 1 }));
    } else {
      soundFx.playWrong();
    }

    const finishedRound = roundRef.current;
    timers.current.push(
      window.setTimeout(() => {
        if (finishedRound >= SHAPES.length) {
          setPhase('finished');
          soundFx.playFanfare();
        } else {
          startCountdown(finishedRound + 1);
        }
      }, 2200)
    );
  };

  const resetAll = () => {
    clearTimers();
    roundRef.current = 0;
    roundActiveRef.current = false;
    soundFx.playClick();
    setPhase('setup');
    setScores({ t1: 0, t2: 0 });
    setRound(0);
    setRoundWinner(null);
  };

  const currentShape = SHAPES[clamp(round, 1, SHAPES.length) - 1];
  const winnerName = scores.t1 === scores.t2 ? null : scores.t1 > scores.t2 ? names.t1 : names.t2;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="text-2xl">🔺</span> Duel Tangram (2 Tim)
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Dua tim menyusun keping tangram mengikuti garis putus-putus hingga menjadi gambar utuh. Tim tercepat dan
          benar menang babaknya!
        </p>
      </div>

      {phase === 'setup' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Tim 1</label>
              <input
                value={names.t1}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, t1: e.target.value || 'Tim Merah' }))}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Tim 2</label>
              <input
                value={names.t2}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, t2: e.target.value || 'Tim Biru' }))}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            🧩 Setiap tim punya papan sendiri dengan 7 keping tangram di baki bawah. Seret keping ke garis putus-putus
            yang cocok di papan atas hingga membentuk gambar. Ada {SHAPES.length} babak gambar: {SHAPES.map((s) => s.emoji).join(' ')}
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-105 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            🚀 Mulai Duel Tangram!
          </button>
        </div>
      )}

      {(phase === 'countdown' || phase === 'playing' || phase === 'roundResult') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Babak {round}/{SHAPES.length} · {currentShape.emoji} {currentShape.name}
            </span>
            {phase === 'playing' && (
              <span className={timeLeft <= 15 ? 'text-rose-600 animate-pulse' : ''}>⏱️ {timeLeft} detik</span>
            )}
          </div>

          {phase === 'playing' && (
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 15 ? 'bg-rose-500' : 'bg-teal-500'
                }`}
                style={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }}
              />
            </div>
          )}

          {phase === 'countdown' && (
            <div className="flex items-center justify-center min-h-[80px] rounded-2xl bg-slate-900 text-white">
              <span className="text-4xl font-black animate-pulse">{countdown === 0 ? '🧩 SUSUN!' : countdown}</span>
            </div>
          )}

          {phase === 'roundResult' && (
            <div className="text-center py-2">
              {roundWinner === 'draw' ? (
                <span className="text-sm font-black text-slate-500">
                  ⏳ Waktu habis! Belum ada yang selesai, seri babak ini.
                </span>
              ) : (
                <span className="text-lg font-black text-emerald-600 animate-bounce inline-block">
                  🎉 {names[roundWinner as TeamKey]} selesai duluan! +1 Poin
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <TeamBoard
              shape={currentShape}
              teamLabel={`${names.t1} — ${scores.t1} poin`}
              accent="text-rose-600"
              locked={phase !== 'playing'}
              resetKey={resetTick}
              onComplete={() => handleTeamComplete('t1')}
            />
            <TeamBoard
              shape={currentShape}
              teamLabel={`${names.t2} — ${scores.t2} poin`}
              accent="text-indigo-600"
              locked={phase !== 'playing'}
              resetKey={resetTick}
              onComplete={() => handleTeamComplete('t2')}
            />
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="text-center space-y-4 py-4">
          <div className="text-6xl animate-bounce">🏆</div>
          {winnerName ? (
            <>
              <h4 className="text-2xl font-black text-slate-900">{winnerName} JUARA TANGRAM!</h4>
              <p className="text-sm text-slate-500">
                Skor akhir: {names.t1} {scores.t1} - {scores.t2} {names.t2}
              </p>
              <div className="text-3xl">🎊🎉✨🎊🎉</div>
            </>
          ) : (
            <>
              <h4 className="text-2xl font-black text-slate-900">SERI!</h4>
              <p className="text-sm text-slate-500">
                Skor akhir: {names.t1} {scores.t1} - {scores.t2} {names.t2}. Sama-sama hebat!
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
