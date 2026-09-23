import React, { useState } from 'react';
import { soundFx } from '../../utils/audio';

export const NumberLineJump: React.FC = () => {
  const [startPos, setStartPos] = useState<number>(3);
  const [jumpSteps, setJumpSteps] = useState<number>(5);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [rangeMode, setRangeMode] = useState<'positive' | 'integers'>('positive');

  // positive: 0 to 20, integers: -10 to 15
  const minVal = rangeMode === 'positive' ? 0 : -10;
  const maxVal = rangeMode === 'positive' ? 20 : 15;

  const targetPos = direction === 'forward' ? startPos + jumpSteps : startPos - jumpSteps;
  const clampedTarget = Math.max(minVal, Math.min(maxVal, targetPos));

  const handleJump = (newSteps: number, newDir: 'forward' | 'backward') => {
    soundFx.playClick();
    setJumpSteps(newSteps);
    setDirection(newDir);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🐸</span> Garis Bilangan Lompat Katak
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Visualisasikan operasi penjumlahan (maju) dan pengurangan (mundur) pada garis bilangan.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              soundFx.playClick();
              setRangeMode('positive');
              if (startPos < 0) setStartPos(2);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              rangeMode === 'positive' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bilangan Cacah (0 s/d 20)
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setRangeMode('integers');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              rangeMode === 'integers' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bilangan Bulat (-10 s/d +15)
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 mb-8">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Titik Awal Katak: <span className="text-emerald-700 font-mono text-sm">{startPos}</span>
          </label>
          <input
            type="range"
            min={minVal}
            max={maxVal}
            value={startPos}
            onChange={(e) => {
              setStartPos(parseInt(e.target.value));
              soundFx.playClick();
            }}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Jarak Lompatan: <span className="text-indigo-700 font-mono text-sm">{jumpSteps} langkah</span>
          </label>
          <input
            type="range"
            min={1}
            max={12}
            value={jumpSteps}
            onChange={(e) => {
              setJumpSteps(parseInt(e.target.value));
              soundFx.playClick();
            }}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-1">Arah Lompatan:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleJump(jumpSteps, 'forward')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  direction === 'forward' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Maju (+)
              </button>
              <button
                onClick={() => handleJump(jumpSteps, 'backward')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  direction === 'backward' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Mundur (-)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Number Line Canvas */}
      <div className="overflow-x-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="min-w-[700px] py-12 px-8 relative">
          {/* Main Axis Line */}
          <div className="h-1 bg-slate-800 rounded-full w-full relative" />

          {/* Tick marks and numbers */}
          <div className="flex justify-between relative -mt-3">
            {Array.from({ length: maxVal - minVal + 1 }).map((_, i) => {
              const num = minVal + i;
              const isStart = num === startPos;
              const isTarget = num === clampedTarget;
              const isZero = num === 0;

              return (
                <div key={num} className="flex flex-col items-center relative" style={{ width: `${100 / (maxVal - minVal + 1)}%` }}>
                  {/* Tick */}
                  <div
                    className={`w-0.5 ${isZero ? 'h-7 bg-red-500 w-1' : 'h-4 bg-slate-400'} transition-all`}
                  />
                  {/* Label */}
                  <span
                    className={`text-xs mt-2 font-mono ${
                      isZero
                        ? 'font-black text-red-600 text-sm'
                        : isStart
                        ? 'font-bold text-emerald-700'
                        : isTarget
                        ? 'font-bold text-indigo-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {num}
                  </span>

                  {/* Start Frog Avatar */}
                  {isStart && (
                    <div className="absolute -top-12 flex flex-col items-center animate-bounce">
                      <span className="text-2xl" role="img" aria-label="katak">
                        🐸
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full whitespace-nowrap">
                        Mulai ({startPos})
                      </span>
                    </div>
                  )}

                  {/* Target Flag */}
                  {isTarget && !isStart && (
                    <div className="absolute -top-12 flex flex-col items-center">
                      <span className="text-2xl">🎯</span>
                      <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-full whitespace-nowrap">
                        Mendarat ({clampedTarget})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Math Sentence Result */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5 font-medium">Model Kalimat Matematika:</span>
          <div className="text-2xl font-black font-mono tracking-wider flex items-center gap-2">
            <span>{startPos}</span>
            <span className={direction === 'forward' ? 'text-emerald-400' : 'text-amber-400'}>
              {direction === 'forward' ? '+' : '-'}
            </span>
            <span>{jumpSteps}</span>
            <span className="text-slate-400">=</span>
            <span className="text-indigo-400">{targetPos}</span>
          </div>
        </div>
        <div className="text-xs text-slate-300 max-w-sm">
          {direction === 'forward' ? (
            <span>
              Katak bergerak maju ke arah kanan sebanyak <strong>{jumpSteps} langkah</strong> dari posisi <strong>{startPos}</strong>, sehingga mendarat di angka <strong>{targetPos}</strong>.
            </span>
          ) : (
            <span>
              Katak bergerak mundur ke arah kiri sebanyak <strong>{jumpSteps} langkah</strong> dari posisi <strong>{startPos}</strong>, sehingga mendarat di angka <strong>{targetPos}</strong>.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
