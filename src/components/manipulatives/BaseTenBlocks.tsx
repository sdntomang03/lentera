import React, { useState } from 'react';
import { soundFx } from '../../utils/audio';

export const BaseTenBlocks: React.FC = () => {
  const [thousands, setThousands] = useState<number>(1);
  const [hundreds, setHundreds] = useState<number>(3);
  const [tens, setTens] = useState<number>(4);
  const [ones, setOnes] = useState<number>(6);

  const totalNumber = thousands * 1000 + hundreds * 100 + tens * 10 + ones;

  const numberWords = (num: number): string => {
    // Indonesian wording for numbers
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (num < 12) return satuan[num];
    if (num < 20) return `${satuan[num - 10]} Belas`;
    if (num < 100) return `${satuan[Math.floor(num / 10)]} Puluh ${satuan[num % 10]}`.trim();
    if (num < 200) return `Seratus ${numberWords(num - 100)}`.trim();
    if (num < 1000) return `${satuan[Math.floor(num / 100)]} Ratus ${numberWords(num % 100)}`.trim();
    if (num < 2000) return `Seribu ${numberWords(num - 1000)}`.trim();
    if (num < 10000) return `${satuan[Math.floor(num / 1000)]} Ribu ${numberWords(num % 1000)}`.trim();
    return num.toLocaleString('id-ID');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🧱</span> Balok Dienes & Nilai Tempat Bilangan
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Pelajari dekomposisi angka ke dalam nilai Ribuan, Ratusan, Puluhan, dan Satuan secara visual.
          </p>
        </div>

        <div className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 text-right">
          <div className="text-xs text-teal-700 font-semibold">Bilangan Terbentuk:</div>
          <div className="text-2xl font-black font-mono text-teal-900">
            {totalNumber.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Terbilang: </span>
        <span className="italic font-medium text-teal-800">&quot;{numberWords(totalNumber)}&quot;</span>
      </div>

      {/* 4 Columns for Place Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Ribuan */}
        <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Ribuan (1.000)</span>
              <span className="text-lg font-black font-mono text-purple-700">{thousands}</span>
            </div>
            {/* Visual representation: Large 3D cubes */}
            <div className="h-28 flex flex-wrap items-center justify-center gap-2 overflow-y-auto p-1 bg-white/60 rounded-lg border border-purple-200">
              {Array.from({ length: thousands }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-purple-600 text-white text-[10px] font-bold rounded shadow flex items-center justify-center border-t-2 border-l-2 border-purple-300"
                  title="1 Kubus Besar = 1.000"
                >
                  1K
                </div>
              ))}
              {thousands === 0 && <span className="text-xs text-slate-400">Kosong</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-200">
            <span className="text-xs font-mono font-bold text-purple-800">{thousands * 1000}</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setThousands(Math.max(0, thousands - 1));
                }}
                className="w-7 h-7 bg-white border border-purple-300 rounded text-xs font-bold hover:bg-purple-100"
              >
                -
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setThousands(Math.min(9, thousands + 1));
                }}
                className="w-7 h-7 bg-white border border-purple-300 rounded text-xs font-bold hover:bg-purple-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Ratusan */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Ratusan (100)</span>
              <span className="text-lg font-black font-mono text-blue-700">{hundreds}</span>
            </div>
            {/* Visual representation: Flat square plates */}
            <div className="h-28 flex flex-wrap items-center justify-center gap-2 overflow-y-auto p-1 bg-white/60 rounded-lg border border-blue-200">
              {Array.from({ length: hundreds }).map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 bg-blue-500 text-white text-[9px] font-bold rounded-sm shadow-xs flex items-center justify-center border border-blue-300"
                  title="1 Lempeng = 100"
                >
                  100
                </div>
              ))}
              {hundreds === 0 && <span className="text-xs text-slate-400">Kosong</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-blue-200">
            <span className="text-xs font-mono font-bold text-blue-800">{hundreds * 100}</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setHundreds(Math.max(0, hundreds - 1));
                }}
                className="w-7 h-7 bg-white border border-blue-300 rounded text-xs font-bold hover:bg-blue-100"
              >
                -
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setHundreds(Math.min(9, hundreds + 1));
                }}
                className="w-7 h-7 bg-white border border-blue-300 rounded text-xs font-bold hover:bg-blue-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Puluhan */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Puluhan (10)</span>
              <span className="text-lg font-black font-mono text-emerald-700">{tens}</span>
            </div>
            {/* Visual representation: Vertical rods */}
            <div className="h-28 flex flex-wrap items-center justify-center gap-1.5 overflow-y-auto p-1 bg-white/60 rounded-lg border border-emerald-200">
              {Array.from({ length: tens }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-16 bg-emerald-600 rounded-sm shadow-xs border border-emerald-400"
                  title="1 Batang = 10"
                />
              ))}
              {tens === 0 && <span className="text-xs text-slate-400">Kosong</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-200">
            <span className="text-xs font-mono font-bold text-emerald-800">{tens * 10}</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setTens(Math.max(0, tens - 1));
                }}
                className="w-7 h-7 bg-white border border-emerald-300 rounded text-xs font-bold hover:bg-emerald-100"
              >
                -
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setTens(Math.min(9, tens + 1));
                }}
                className="w-7 h-7 bg-white border border-emerald-300 rounded text-xs font-bold hover:bg-emerald-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Satuan */}
        <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Satuan (1)</span>
              <span className="text-lg font-black font-mono text-amber-700">{ones}</span>
            </div>
            {/* Visual representation: Small units */}
            <div className="h-28 flex flex-wrap items-center justify-center gap-1.5 overflow-y-auto p-1 bg-white/60 rounded-lg border border-amber-200">
              {Array.from({ length: ones }).map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-3.5 bg-amber-500 rounded-xs shadow-xs border border-amber-300"
                  title="1 Kubus Kecil = 1"
                />
              ))}
              {ones === 0 && <span className="text-xs text-slate-400">Kosong</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-200">
            <span className="text-xs font-mono font-bold text-amber-800">{ones}</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setOnes(Math.max(0, ones - 1));
                }}
                className="w-7 h-7 bg-white border border-amber-300 rounded text-xs font-bold hover:bg-amber-100"
              >
                -
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setOnes(Math.min(9, ones + 1));
                }}
                className="w-7 h-7 bg-white border border-amber-300 rounded text-xs font-bold hover:bg-amber-100"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Form Equation */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="text-xs text-slate-400 font-sans">Bentuk Panjang (Dekomposisi Bilangan):</div>
        <div className="text-base sm:text-lg font-bold">
          <span className="text-purple-300">{thousands * 1000}</span> +{' '}
          <span className="text-blue-300">{hundreds * 100}</span> +{' '}
          <span className="text-emerald-300">{tens * 10}</span> +{' '}
          <span className="text-amber-300">{ones}</span> ={' '}
          <span className="text-white border-b-2 border-teal-400 pb-0.5">{totalNumber}</span>
        </div>
      </div>
    </div>
  );
};
