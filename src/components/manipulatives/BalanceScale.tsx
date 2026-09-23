import React, { useState } from 'react';
import { soundFx } from '../../utils/audio';

export const BalanceScale: React.FC = () => {
  // Mystery value X for left pan
  const [mysteryXValue] = useState<number>(4);
  const [leftMysteryCount, setLeftMysteryCount] = useState<number>(2); // 2 * 4 = 8
  const [leftWeights, setLeftWeights] = useState<number[]>([3]); // 8 + 3 = 11

  // Right pan weights
  const [rightWeights, setRightWeights] = useState<number[]>([5, 5, 1]); // total 11 = balanced!
  const [isMysteryRevealed, setIsMysteryRevealed] = useState<boolean>(false);

  const leftTotal = leftMysteryCount * mysteryXValue + leftWeights.reduce((a, b) => a + b, 0);
  const rightTotal = rightWeights.reduce((a, b) => a + b, 0);

  // Tilt angle between -15 deg and +15 deg
  const diff = rightTotal - leftTotal;
  const tiltAngle = Math.max(-14, Math.min(14, diff * 2.5));

  const isBalanced = leftTotal === rightTotal;

  const addLeftWeight = (val: number) => {
    soundFx.playClick();
    setLeftWeights([...leftWeights, val]);
  };

  const removeLeftWeight = (index: number) => {
    soundFx.playClick();
    setLeftWeights(leftWeights.filter((_, i) => i !== index));
  };

  const addRightWeight = (val: number) => {
    soundFx.playClick();
    setRightWeights([...rightWeights, val]);
  };

  const removeRightWeight = (index: number) => {
    soundFx.playClick();
    setRightWeights(rightWeights.filter((_, i) => i !== index));
  };

  const resetPreset = (puzzleNum: number) => {
    soundFx.playClick();
    setIsMysteryRevealed(false);
    if (puzzleNum === 1) {
      setLeftMysteryCount(1);
      setLeftWeights([5]);
      setRightWeights([12]); // X + 5 = 12 -> X = 7
    } else if (puzzleNum === 2) {
      setLeftMysteryCount(2);
      setLeftWeights([2]);
      setRightWeights([10]); // 2X + 2 = 10 -> X = 4
    } else {
      setLeftMysteryCount(2);
      setLeftWeights([3]);
      setRightWeights([11]); // 2X + 3 = 11 -> X = 4
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>⚖️</span> Neraca Kesetaraan Aljabar & Nilai Tempat
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Pahami makna tanda sama dengan (=) sebagai keseimbangan bobot, bukan sekadar tanda hitung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => resetPreset(1)}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
          >
            Tantangan 1 (X + 5)
          </button>
          <button
            onClick={() => resetPreset(2)}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
          >
            Tantangan 2 (2X + 2)
          </button>
        </div>
      </div>

      {/* Visual Balance Scale SVG */}
      <div className="py-8 flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-slate-100 my-6 relative overflow-hidden">
        {/* Status Indicator */}
        <div className="mb-4">
          {isBalanced ? (
            <div className="px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm flex items-center gap-2 shadow-xs">
              <span>✨</span> NERACA SEIMBANG (Kiri = Kanan)
            </div>
          ) : leftTotal > rightTotal ? (
            <div className="px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full font-bold text-xs flex items-center gap-2">
              <span>⬇️</span> Sisi Kiri Lebih Berat ({leftTotal} kg &gt; {rightTotal} kg)
            </div>
          ) : (
            <div className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-xs flex items-center gap-2">
              <span>⬇️</span> Sisi Kanan Lebih Berat ({rightTotal} kg &gt; {leftTotal} kg)
            </div>
          )}
        </div>

        {/* Dynamic Scale Graphic */}
        <div className="w-full max-w-lg h-60 relative flex flex-col items-center justify-end">
          {/* Fulcrum base (Penyangga) */}
          <div className="w-0 h-0 border-l-[32px] border-l-transparent border-r-[32px] border-r-transparent border-b-[60px] border-b-slate-700 z-10" />
          <div className="w-28 h-3 bg-slate-800 rounded-full -mt-0.5 z-10" />

          {/* Tilting Beam & Pans Container */}
          <div
            className="absolute top-16 w-full flex items-center justify-center transition-transform duration-500 ease-out origin-center"
            style={{ transform: `rotate(${tiltAngle}deg)` }}
          >
            {/* Beam Bar */}
            <div className="w-96 h-3.5 bg-amber-700 rounded-full relative shadow-md flex items-center justify-between px-3">
              {/* Center pivot pin */}
              <div className="w-4 h-4 bg-amber-400 border-2 border-slate-800 rounded-full absolute left-1/2 -translate-x-1/2" />

              {/* Left String & Pan */}
              <div
                className="flex flex-col items-center relative -top-3 transition-transform duration-500"
                style={{ transform: `rotate(${-tiltAngle}deg)` }}
              >
                <div className="w-0.5 h-16 bg-slate-400" />
                <div className="w-36 h-3 bg-slate-700 rounded-full -mt-0.5 shadow-sm" />

                {/* Items in Left Pan */}
                <div className="absolute -top-10 flex flex-wrap items-end justify-center gap-1 w-36 px-1">
                  {Array.from({ length: leftMysteryCount }).map((_, idx) => (
                    <div
                      key={`m-${idx}`}
                      className="w-9 h-10 bg-purple-600 text-white rounded-lg shadow-sm flex flex-col items-center justify-center font-bold text-xs border border-purple-400"
                      title={isMysteryRevealed ? `Kotak X = ${mysteryXValue} kg` : 'Kotak Misteri X'}
                    >
                      <span>📦</span>
                      <span className="text-[10px]">{isMysteryRevealed ? `${mysteryXValue}kg` : 'X'}</span>
                    </div>
                  ))}
                  {leftWeights.map((w, idx) => (
                    <button
                      key={`lw-${idx}`}
                      onClick={() => removeLeftWeight(idx)}
                      className="w-7 h-7 bg-amber-600 text-white rounded-md text-[11px] font-bold shadow-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                      title="Klik untuk menghapus"
                    >
                      {w}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Right String & Pan */}
              <div
                className="flex flex-col items-center relative -top-3 transition-transform duration-500"
                style={{ transform: `rotate(${-tiltAngle}deg)` }}
              >
                <div className="w-0.5 h-16 bg-slate-400" />
                <div className="w-36 h-3 bg-slate-700 rounded-full -mt-0.5 shadow-sm" />

                {/* Items in Right Pan */}
                <div className="absolute -top-10 flex flex-wrap items-end justify-center gap-1 w-36 px-1">
                  {rightWeights.map((w, idx) => (
                    <button
                      key={`rw-${idx}`}
                      onClick={() => removeRightWeight(idx)}
                      className="w-7 h-7 bg-blue-600 text-white rounded-md text-[11px] font-bold shadow-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                      title="Klik untuk menghapus"
                    >
                      {w}k
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Math Equation Formula */}
        <div className="mt-8 text-center">
          <div className="text-xs text-slate-500 font-semibold mb-1">Persamaan Aljabar Neraca:</div>
          <div className="text-xl font-bold font-mono text-slate-800 flex items-center justify-center gap-3">
            <span className="text-purple-700">
              {leftMysteryCount > 0 ? `${leftMysteryCount}X` : ''}
              {leftWeights.length > 0 ? ` + ${leftWeights.reduce((a, b) => a + b, 0)}` : ''}
            </span>
            <span className={isBalanced ? 'text-emerald-600 text-2xl' : 'text-slate-400 text-2xl'}>
              {isBalanced ? '=' : '≠'}
            </span>
            <span className="text-blue-700">{rightTotal} kg</span>
          </div>
        </div>
      </div>

      {/* Control Pan Weights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left Controls */}
        <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-900">Sisi Kiri (Beban X & Angka)</span>
            <span className="text-xs font-mono font-bold text-purple-700">Total: {leftTotal} kg</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Kotak X:</span>
            <button
              onClick={() => {
                soundFx.playClick();
                setLeftMysteryCount(Math.max(0, leftMysteryCount - 1));
              }}
              className="w-7 h-7 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100"
            >
              -
            </button>
            <span className="font-mono font-bold text-sm w-6 text-center">{leftMysteryCount}</span>
            <button
              onClick={() => {
                soundFx.playClick();
                setLeftMysteryCount(leftMysteryCount + 1);
              }}
              className="w-7 h-7 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100"
            >
              +
            </button>
            <button
              onClick={() => setIsMysteryRevealed(!isMysteryRevealed)}
              className="ml-auto text-xs px-2.5 py-1 bg-purple-700 text-white rounded-md font-medium hover:bg-purple-800 transition-colors"
            >
              {isMysteryRevealed ? 'Sembunyikan Nilai X' : 'Bongkar Nilai X'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-xs text-slate-600 font-medium">Tambah Beban:</span>
            {[1, 2, 5].map((val) => (
              <button
                key={val}
                onClick={() => addLeftWeight(val)}
                className="px-2.5 py-1 text-xs font-bold bg-white text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100"
              >
                +{val}kg
              </button>
            ))}
          </div>
        </div>

        {/* Right Controls */}
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-900">Sisi Kanan (Batu Timbangan Penyeimbang)</span>
            <span className="text-xs font-mono font-bold text-blue-700">Total: {rightTotal} kg</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-600 font-medium">Tambah Batu Timbangan:</span>
            {[1, 2, 5, 10].map((val) => (
              <button
                key={val}
                onClick={() => addRightWeight(val)}
                className="px-3 py-1 text-xs font-bold bg-white text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                +{val}kg
              </button>
            ))}
            <button
              onClick={() => {
                soundFx.playClick();
                setRightWeights([]);
              }}
              className="text-xs text-red-600 hover:underline ml-auto font-medium"
            >
              Kosongkan
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            💡 Tips: Untuk mencari nilai 1 Kotak X, buatlah neraca seimbang, lalu kurangkan beban angka yang sama di kedua sisi!
          </p>
        </div>
      </div>
    </div>
  );
};
