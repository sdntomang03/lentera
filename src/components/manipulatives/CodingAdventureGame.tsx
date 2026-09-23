import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundFx } from '../../utils/audio';

/**
 * "Petualangan Koding" — a beginner block-based sequencing game.
 * The child arranges a sequence of commands (Maju / Kanan / Kiri) to guide a
 * character through a small maze to reach the school, then presses "Mulai!"
 * to execute the program step by step. Teaches algorithmic/sequential thinking
 * (computational literacy) without any real code syntax.
 */

type Cell = 'P' | '#' | 'S' | 'G';
type Dir = 'N' | 'E' | 'S' | 'W';
type Command = 'maju' | 'kanan' | 'kiri';
type RunStatus = 'idle' | 'running' | 'success' | 'fail';

interface Level {
  name: string;
  grid: Cell[][];
  startFacing: Dir;
  hint: string;
}

const LEVELS: Level[] = [
  {
    name: 'Level 1: Jalan Lurus',
    grid: [
      ['P', 'P', 'P'],
      ['P', 'P', 'P'],
      ['S', 'P', 'G'],
    ],
    startFacing: 'E',
    hint: 'Coba tekan Maju beberapa kali untuk berjalan lurus ke sekolah.',
  },
  {
    name: 'Level 2: Belok Kanan',
    grid: [
      ['P', 'P', 'P', 'G'],
      ['P', '#', '#', 'P'],
      ['P', '#', '#', 'P'],
      ['S', 'P', '#', 'P'],
    ],
    startFacing: 'N',
    hint: 'Jalan ke atas dulu, lalu belok kanan sebelum menuju sekolah.',
  },
  {
    name: 'Level 3: Zig-Zag Seru',
    grid: [
      ['#', '#', 'G', '#', '#'],
      ['#', '#', 'P', '#', '#'],
      ['P', 'P', 'P', '#', '#'],
      ['P', '#', '#', '#', '#'],
      ['S', '#', '#', '#', '#'],
    ],
    startFacing: 'N',
    hint: 'Butuh kombinasi Maju, Kanan, dan Kiri untuk berbelok dua kali.',
  },
];

const DIR_ORDER: Dir[] = ['N', 'E', 'S', 'W'];
const DIR_ARROW: Record<Dir, string> = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️' };
const DIR_DEG: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 };

function turnRight(d: Dir): Dir {
  return DIR_ORDER[(DIR_ORDER.indexOf(d) + 1) % 4];
}
function turnLeft(d: Dir): Dir {
  return DIR_ORDER[(DIR_ORDER.indexOf(d) + 3) % 4];
}
function step(pos: { r: number; c: number }, d: Dir): { r: number; c: number } {
  if (d === 'N') return { r: pos.r - 1, c: pos.c };
  if (d === 'S') return { r: pos.r + 1, c: pos.c };
  if (d === 'E') return { r: pos.r, c: pos.c + 1 };
  return { r: pos.r, c: pos.c - 1 };
}

function findCell(grid: Cell[][], type: Cell): { r: number; c: number } {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === type) return { r, c };
    }
  }
  return { r: 0, c: 0 };
}

const CMD_META: Record<Command, { label: string; icon: string; color: string }> = {
  maju: { label: 'Maju', icon: '⬆️', color: 'from-teal-600 to-emerald-600' },
  kanan: { label: 'Kanan', icon: '↪️', color: 'from-indigo-600 to-blue-600' },
  kiri: { label: 'Kiri', icon: '↩️', color: 'from-amber-600 to-orange-600' },
};

export const CodingAdventureGame: React.FC = () => {
  const [charName, setCharName] = useState('Ari');
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const startPos = findCell(level.grid, 'S');
  const goalPos = findCell(level.grid, 'G');

  const [queue, setQueue] = useState<Command[]>([]);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [runPos, setRunPos] = useState(startPos);
  const [runFacing, setRunFacing] = useState<Dir>(level.startFacing);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  // Reset state whenever the level changes
  useEffect(() => {
    clearTimers();
    setQueue([]);
    setStatus('idle');
    setRunPos(findCell(level.grid, 'S'));
    setRunFacing(level.startFacing);
    setActiveStep(-1);
    setCountdown(null);
    setMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  const addCommand = (cmd: Command) => {
    if (status === 'running' || countdown !== null) return;
    soundFx.playClick();
    setQueue((q) => [...q, cmd]);
  };

  const removeLast = () => {
    if (status === 'running' || countdown !== null) return;
    soundFx.playClick();
    setQueue((q) => q.slice(0, -1));
  };

  const resetProgram = useCallback(() => {
    clearTimers();
    setQueue([]);
    setStatus('idle');
    setRunPos(findCell(level.grid, 'S'));
    setRunFacing(level.startFacing);
    setActiveStep(-1);
    setCountdown(null);
    setMessage('');
  }, [level]);

  const runProgram = () => {
    if (queue.length === 0 || status === 'running') return;

    soundFx.playClick();
    setStatus('idle');
    setMessage('');
    setActiveStep(-1);
    setRunPos(findCell(level.grid, 'S'));
    setRunFacing(level.startFacing);

    // Dramatic 3-2-1 countdown before execution starts
    let count = 3;
    setCountdown(count);
    const tick = () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        timers.current.push(window.setTimeout(tick, 550));
      } else {
        setCountdown(0);
        timers.current.push(window.setTimeout(() => {
          setCountdown(null);
          executeQueue();
        }, 550));
      }
    };
    timers.current.push(window.setTimeout(tick, 550));
  };

  const executeQueue = () => {
    setStatus('running');
    let pos = findCell(level.grid, 'S');
    let facing = level.startFacing;

    queue.forEach((cmd, idx) => {
      const delay = (idx + 1) * 650;
      timers.current.push(
        window.setTimeout(() => {
          setActiveStep(idx);

          if (cmd === 'kanan') {
            facing = turnRight(facing);
            setRunFacing(facing);
            soundFx.playClick();
            return;
          }
          if (cmd === 'kiri') {
            facing = turnLeft(facing);
            setRunFacing(facing);
            soundFx.playClick();
            return;
          }

          // maju
          const next = step(pos, facing);
          const rows = level.grid.length;
          const cols = level.grid[0].length;
          const outOfBounds = next.r < 0 || next.r >= rows || next.c < 0 || next.c >= cols;
          const hitsObstacle = !outOfBounds && level.grid[next.r][next.c] === '#';

          if (outOfBounds || hitsObstacle) {
            pos = pos; // stays put
            setStatus('fail');
            setMessage(`${charName} tersesat! Programnya perlu diperbaiki. Coba lagi ya.`);
            soundFx.playWrong();
            clearTimers();
            return;
          }

          pos = next;
          setRunPos(pos);

          const isLastStep = idx === queue.length - 1;
          if (isLastStep) {
            if (pos.r === goalPos.r && pos.c === goalPos.c) {
              setStatus('success');
              setMessage(`Hore! ${charName} sampai di sekolah tepat waktu! 🎉`);
              soundFx.playFanfare();
            } else {
              setStatus('fail');
              setMessage(`Belum sampai sekolah nih. Yuk atur ulang langkahnya!`);
              soundFx.playWrong();
            }
          }
        }, delay)
      );
    });
  };

  const isBusy = status === 'running' || countdown !== null;
  const cellSize = level.grid.length >= 5 ? 'w-11 h-11 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🧑‍💻</span> Petualangan Koding: Si {charName} Mau ke Sekolah
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Susun langkah (Maju, Kanan, Kiri) supaya {charName} tiba di sekolah, lalu tekan <strong>Mulai!</strong> untuk
            menjalankan programnya. Ini melatih <em>berpikir komputasional</em> — dasar dari koding sungguhan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Nama Karakter</label>
          <input
            value={charName}
            maxLength={12}
            onChange={(e) => setCharName(e.target.value.replace(/[^a-zA-Z ]/g, '') || 'Ari')}
            className="w-24 px-2 py-1 text-sm font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Level selector */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl.name}
            onClick={() => {
              soundFx.playClick();
              setLevelIdx(i);
            }}
            disabled={isBusy}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              levelIdx === i
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {lvl.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 italic -mt-2">💡 {level.hint}</p>

      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Maze grid */}
        <div className="flex justify-center">
          <div
            className="grid gap-1 bg-emerald-50 p-2 rounded-2xl border border-emerald-100 relative"
            style={{ gridTemplateColumns: `repeat(${level.grid[0].length}, minmax(0,1fr))` }}
          >
            {level.grid.map((row, r) =>
              row.map((cell, c) => {
                const isChar = runPos.r === r && runPos.c === c;
                const isGoal = cell === 'G';
                const isObstacle = cell === '#';
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${cellSize} rounded-lg flex items-center justify-center text-xl relative border ${
                      isObstacle
                        ? 'bg-slate-300 border-slate-400'
                        : isGoal
                        ? 'bg-amber-100 border-amber-300'
                        : 'bg-white border-emerald-100'
                    }`}
                  >
                    {isObstacle && <span className="text-lg">🪨</span>}
                    {isGoal && !isChar && <span>🏫</span>}
                    {isChar && (
                      <span
                        className={`inline-block transition-transform duration-300 ${
                          status === 'fail' ? 'animate-bounce' : ''
                        }`}
                        style={{ transform: `rotate(${DIR_DEG[runFacing]}deg)` }}
                        title={`Menghadap ${runFacing}`}
                      >
                        🧑‍🎓
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-2xl backdrop-blur-xs">
                <span className="text-5xl font-black text-white animate-pulse drop-shadow-lg">
                  {countdown === 0 ? 'MULAI!' : countdown}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Program builder */}
        <div className="space-y-4 min-w-0">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">Blok Perintah</div>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(CMD_META) as Command[]).map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => addCommand(cmd)}
                  disabled={isBusy}
                  className={`px-4 py-2.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r ${CMD_META[cmd].color} shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  <span>{CMD_META[cmd].icon}</span>
                  <span>{CMD_META[cmd].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-500">Program Kamu ({queue.length} langkah)</div>
              <div className="flex gap-1.5">
                <button
                  onClick={removeLast}
                  disabled={isBusy || queue.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ⌫ Hapus
                </button>
                <button
                  onClick={resetProgram}
                  disabled={isBusy && countdown === null}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔄 Ulang
                </button>
              </div>
            </div>
            <div className="min-h-[52px] flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300">
              {queue.length === 0 && <span className="text-xs text-slate-400 italic px-1">Tekan blok perintah di atas...</span>}
              {queue.map((cmd, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${CMD_META[cmd].color} flex items-center gap-1 ${
                    activeStep === i && status === 'running' ? 'ring-2 ring-offset-1 ring-slate-900 scale-110' : ''
                  } transition-all`}
                >
                  {CMD_META[cmd].icon} {i + 1}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={runProgram}
            disabled={queue.length === 0 || isBusy}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>▶️</span> Mulai!
          </button>

          {message && (
            <div
              className={`p-3 rounded-xl text-sm font-bold text-center ${
                status === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {status === 'success' ? '🎉🏅✨ ' : '😵 '}
              {message}
              {status === 'success' && levelIdx < LEVELS.length - 1 && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setLevelIdx((i) => Math.min(i + 1, LEVELS.length - 1));
                  }}
                  className="ml-2 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                >
                  Level Berikutnya →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
