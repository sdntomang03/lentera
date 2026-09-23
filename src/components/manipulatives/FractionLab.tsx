import React, { useState } from 'react';
import { soundFx } from '../../utils/audio';

export const FractionLab: React.FC = () => {
  const [mode, setMode] = useState<'explore' | 'compare'>('explore');

  // Explore Mode State
  const [denom1, setDenom1] = useState<number>(4);
  const [num1, setNum1] = useState<number>(3);
  const [shape, setShape] = useState<'circle' | 'bar'>('circle');

  // Compare Mode State
  const [denom2, setDenom2] = useState<number>(8);
  const [num2, setNum2] = useState<number>(6);

  const val1 = denom1 > 0 ? num1 / denom1 : 0;
  const val2 = denom2 > 0 ? num2 / denom2 : 0;

  const handleSliceClick = (index: number) => {
    soundFx.playClick();
    if (index < num1) {
      setNum1(index);
    } else {
      setNum1(index + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🍕</span> Laboratorium Pecahan Interaktif
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Eksplorasi visual pembagian bentuk, perbandingan senilai, dan konversi desimal/persen.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              soundFx.playClick();
              setMode('explore');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'explore' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Eksplorasi 1 Pecahan
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setMode('compare');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'compare' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bandingkan 2 Pecahan
          </button>
        </div>
      </div>

      {mode === 'explore' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2">
                  <span>Pembilang (Bagian yang diarsir / n):</span>
                  <span className="font-mono text-teal-600 text-base">{num1}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={denom1}
                  value={num1}
                  onChange={(e) => setNum1(parseInt(e.target.value))}
                  className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2">
                  <span>Penyebut (Total bagian sama besar / d):</span>
                  <span className="font-mono text-indigo-600 text-base">{denom1}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={denom1}
                  onChange={(e) => {
                    const newDenom = parseInt(e.target.value);
                    setDenom1(newDenom);
                    if (num1 > newDenom) setNum1(newDenom);
                  }}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Bentuk Visualisasi:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShape('circle')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                      shape === 'circle' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Kue Lingkaran
                  </button>
                  <button
                    onClick={() => setShape('bar')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                      shape === 'bar' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Batang Balok
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Conversion Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                <div className="text-xs text-teal-600 font-medium">Pecahan Biasa</div>
                <div className="text-2xl font-bold text-teal-800 mt-1 font-mono">
                  {num1}/{denom1}
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <div className="text-xs text-indigo-600 font-medium">Nilai Desimal</div>
                <div className="text-xl font-bold text-indigo-800 mt-1 font-mono">
                  {val1.toFixed(3).replace(/\.?0+$/, '')}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div className="text-xs text-amber-600 font-medium">Persentase</div>
                <div className="text-xl font-bold text-amber-800 mt-1 font-mono">
                  {(val1 * 100).toFixed(1).replace(/\.0$/, '')}%
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="font-semibold text-slate-800 mb-1">Pecahan Senilai ({num1}/{denom1}):</div>
              <div className="flex flex-wrap gap-2 text-teal-700 font-mono">
                <span>{num1 * 2}/{denom1 * 2}</span>
                <span className="text-slate-300">=</span>
                <span>{num1 * 3}/{denom1 * 3}</span>
                <span className="text-slate-300">=</span>
                <span>{num1 * 4}/{denom1 * 4}</span>
                <span className="text-slate-300">=</span>
                <span>{num1 * 5}/{denom1 * 5}</span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-slate-50/70 rounded-2xl border border-slate-100 min-h-[320px]">
            {shape === 'circle' ? (
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
                  {Array.from({ length: denom1 }).map((_, i) => {
                    const startAngle = (i * 360) / denom1;
                    const endAngle = ((i + 1) * 360) / denom1;
                    const isSelected = i < num1;

                    // Convert polar to cartesian
                    const startRad = ((startAngle - 90) * Math.PI) / 180;
                    const endRad = ((endAngle - 90) * Math.PI) / 180;

                    const x1 = 100 + 85 * Math.cos(startRad);
                    const y1 = 100 + 85 * Math.sin(startRad);
                    const x2 = 100 + 85 * Math.cos(endRad);
                    const y2 = 100 + 85 * Math.sin(endRad);

                    const largeArcFlag = 360 / denom1 > 180 ? 1 : 0;
                    const pathData =
                      denom1 === 1
                        ? 'M 100,15 A 85,85 0 1,0 100,185 A 85,85 0 1,0 100,15 Z'
                        : `M 100,100 L ${x1},${y1} A 85,85 0 ${largeArcFlag},1 ${x2},${y2} Z`;

                    return (
                      <path
                        key={i}
                        d={pathData}
                        fill={isSelected ? '#0d9488' : '#e2e8f0'}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all duration-200 hover:opacity-90"
                        onClick={() => handleSliceClick(i)}
                      />
                    );
                  })}
                  <circle cx="100" cy="100" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-700 font-mono bg-white px-1 rounded-full shadow-xs">
                    {num1}/{denom1}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-3">
                <div className="h-14 w-full bg-slate-200 rounded-xl overflow-hidden flex border-2 border-white shadow-inner">
                  {Array.from({ length: denom1 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSliceClick(i)}
                      className={`flex-1 h-full border-r border-white/60 transition-colors flex items-center justify-center font-mono text-xs font-bold ${
                        i < num1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      }`}
                    >
                      1/{denom1}
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs text-slate-500">
                  Klik tiap petak untuk menambah atau mengurangi arsiran pecahan
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-4 text-center">
              💡 Petunjuk: {num1} dari {denom1} bagian telah dipilih. Klik irisan kue untuk mencoba!
            </p>
          </div>
        </div>
      ) : (
        /* Compare Mode */
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fraction A */}
            <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-teal-900">Pecahan A</span>
                <span className="text-2xl font-black text-teal-700 font-mono">
                  {num1}/{denom1}
                </span>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Pembilang: {num1}</span>
                    <span>Penyebut: {denom1}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={denom1}
                    value={num1}
                    onChange={(e) => setNum1(parseInt(e.target.value))}
                    className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={denom1}
                    onChange={(e) => {
                      const d = parseInt(e.target.value);
                      setDenom1(d);
                      if (num1 > d) setNum1(d);
                    }}
                    className="w-full accent-teal-800 h-2 bg-slate-200 rounded-lg cursor-pointer mt-2"
                  />
                </div>
              </div>
              <div className="h-10 bg-slate-200 rounded-lg overflow-hidden flex border border-slate-300">
                {Array.from({ length: denom1 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full border-r border-white/50 ${
                      i < num1 ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="text-right text-xs text-teal-800 font-mono mt-1">
                = {(val1 * 100).toFixed(1)}%
              </div>
            </div>

            {/* Fraction B */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-indigo-900">Pecahan B</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">
                  {num2}/{denom2}
                </span>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Pembilang: {num2}</span>
                    <span>Penyebut: {denom2}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={denom2}
                    value={num2}
                    onChange={(e) => setNum2(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={denom2}
                    onChange={(e) => {
                      const d = parseInt(e.target.value);
                      setDenom2(d);
                      if (num2 > d) setNum2(d);
                    }}
                    className="w-full accent-indigo-800 h-2 bg-slate-200 rounded-lg cursor-pointer mt-2"
                  />
                </div>
              </div>
              <div className="h-10 bg-slate-200 rounded-lg overflow-hidden flex border border-slate-300">
                {Array.from({ length: denom2 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full border-r border-white/50 ${
                      i < num2 ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="text-right text-xs text-indigo-800 font-mono mt-1">
                = {(val2 * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Comparison Result Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚖️</span>
              <div>
                <div className="text-xs text-slate-400 font-medium">Kesimpulan Perbandingan:</div>
                <div className="text-lg font-bold">
                  {val1 > val2 && `${num1}/${denom1} LEBIH BESAR ( > ) daripada ${num2}/${denom2}`}
                  {val1 < val2 && `${num1}/${denom1} LEBIH KECIL ( < ) daripada ${num2}/${denom2}`}
                  {val1 === val2 && `${num1}/${denom1} SAMA DENGAN ( = ) ${num2}/${denom2} (Pecahan Senilai!)`}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-300 font-mono bg-slate-800 px-3 py-1.5 rounded-lg">
              Selisih: {Math.abs(val1 - val2).toFixed(3)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
