import React, { useState } from 'react';
import { FractionLab } from './FractionLab';
import { NumberLineJump } from './NumberLineJump';
import { BalanceScale } from './BalanceScale';
import { InteractiveClock } from './InteractiveClock';
import { BaseTenBlocks } from './BaseTenBlocks';
import { ReadingPracticeFaseA } from './ReadingPracticeFaseA';
import { WordScrambleGame } from './WordScrambleGame';
import { CodingAdventureGame } from './CodingAdventureGame';
import { MathDuelGame } from './MathDuelGame';
import { TangramDuelGame } from './TangramDuelGame';
import { soundFx } from '../../utils/audio';

interface ManipulativesHubProps {
  onBack?: () => void;
}

export const ManipulativesHub: React.FC<ManipulativesHubProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<
    'fraction' | 'numberline' | 'balance' | 'clock' | 'baseten' | 'reading' | 'wordgame' | 'coding' | 'duel' | 'tangram'
  >('fraction');

  const tools = [
    { id: 'fraction', name: 'Laboratorium Pecahan', icon: '🍕', desc: 'Arsir kue, pembilang, penyebut & senilai' },
    { id: 'numberline', name: 'Garis Bilangan Katak', icon: '🐸', desc: 'Operasi maju & mundur penjumlahan bilangan' },
    { id: 'balance', name: 'Neraca Kesetaraan', icon: '⚖️', desc: 'Keseimbangan aljabar & mencari nilai X' },
    { id: 'clock', name: 'Jam Analog & Durasi', icon: '⏰', desc: 'Membaca jarum jam, 24 jam & waktu baku' },
    { id: 'baseten', name: 'Balok Dienes & Nilai Tempat', icon: '🧱', desc: 'Ribuan, ratusan, puluhan & dekomposisi' },
    { id: 'reading', name: 'Latihan Membaca Fase A', icon: '📖', desc: 'Suku kata, kata & kalimat pendek untuk pemula' },
    { id: 'wordgame', name: 'Game Susun Kata', icon: '🧩', desc: 'Susun huruf acak jadi kata sambil bermain' },
    { id: 'coding', name: 'Petualangan Koding', icon: '🧑‍💻', desc: 'Susun langkah Maju/Kanan/Kiri menuju sekolah' },
    { id: 'duel', name: 'Duel Berhitung Cepat', icon: '⚡', desc: 'Game 2 pemain, adu cepat jawab hitungan' },
    { id: 'tangram', name: 'Duel Tangram', icon: '🔺', desc: 'Game 2 tim, susun keping tangram tercepat' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Selector Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
        {onBack && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onBack();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200 shadow-2xs group"
              title="Kembali"
            >
              <span className="text-teal-700 font-extrabold text-base group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Kembali</span>
            </button>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">10 Alat Visual Interaktif</span>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laboratorium Manipulatif & Visual Digital</h2>
          <p className="text-sm text-slate-500 mt-1">
            Alat bantu visual konkret untuk membangun pemahaman matematika dan kemampuan membaca tanpa hafalan mekanis.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
          {tools.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(t.id as any);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-teal-50 border-teal-600 shadow-xs ring-1 ring-teal-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <div>
                  <div className={`font-bold text-xs ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>
                    {t.name}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Container */}
      <div>
        {activeTab === 'fraction' && <FractionLab />}
        {activeTab === 'numberline' && <NumberLineJump />}
        {activeTab === 'balance' && <BalanceScale />}
        {activeTab === 'clock' && <InteractiveClock />}
        {activeTab === 'baseten' && <BaseTenBlocks />}
        {activeTab === 'reading' && <ReadingPracticeFaseA />}
        {activeTab === 'wordgame' && <WordScrambleGame />}
        {activeTab === 'coding' && <CodingAdventureGame />}
        {activeTab === 'duel' && <MathDuelGame />}
        {activeTab === 'tangram' && <TangramDuelGame />}
      </div>
    </div>
  );
};
