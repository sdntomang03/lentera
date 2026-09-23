import React, { useState } from 'react';
import { soundFx, SpeechReader } from '../../utils/audio';

type StageKey = 'suku-kata' | 'kata' | 'kalimat';

interface SyllableItem {
  word: string;
  syllables: string[];
}

interface WordItem {
  word: string;
  emoji: string;
  options: string[]; // 4 emoji options, one correct
}

interface SentenceItem {
  sentence: string;
  emoji: string;
}

const SUKU_KATA_ITEMS: SyllableItem[] = [
  { word: 'bola', syllables: ['bo', 'la'] },
  { word: 'nasi', syllables: ['na', 'si'] },
  { word: 'buku', syllables: ['bu', 'ku'] },
  { word: 'kaki', syllables: ['ka', 'ki'] },
  { word: 'mata', syllables: ['ma', 'ta'] },
  { word: 'rumah', syllables: ['ru', 'mah'] },
  { word: 'sapi', syllables: ['sa', 'pi'] },
  { word: 'baju', syllables: ['ba', 'ju'] },
];

const KATA_ITEMS: WordItem[] = [
  { word: 'bola', emoji: '⚽', options: ['⚽', '📖', '🐔', '👁️'] },
  { word: 'buku', emoji: '📖', options: ['🏠', '📖', '🦶', '🍚'] },
  { word: 'ayam', emoji: '🐔', options: ['🐔', '⚽', '👩', '🚗'] },
  { word: 'mata', emoji: '👁️', options: ['🦷', '👁️', '📖', '🍚'] },
  { word: 'nasi', emoji: '🍚', options: ['🍚', '⚽', '🏠', '🐟'] },
  { word: 'rumah', emoji: '🏠', options: ['🚗', '🏠', '📖', '🐔'] },
  { word: 'ibu', emoji: '👩', options: ['👦', '👴', '👩', '🐟'] },
  { word: 'mobil', emoji: '🚗', options: ['🚗', '🏠', '⚽', '🍚'] },
];

const KALIMAT_ITEMS: SentenceItem[] = [
  { sentence: 'Ini bola saya.', emoji: '⚽' },
  { sentence: 'Ibu suka membaca buku.', emoji: '📖' },
  { sentence: 'Ayam itu berkokok pagi hari.', emoji: '🐔' },
  { sentence: 'Kaki saya dua.', emoji: '🦶' },
  { sentence: 'Kami makan nasi bersama.', emoji: '🍚' },
  { sentence: 'Rumah saya bersih dan rapi.', emoji: '🏠' },
];

const STAGES: { key: StageKey; label: string; icon: string; desc: string }[] = [
  { key: 'suku-kata', label: 'Suku Kata', icon: '🔤', desc: 'Dengar & rangkai suku kata jadi kata' },
  { key: 'kata', label: 'Kata & Gambar', icon: '🖼️', desc: 'Cocokkan kata dengan gambar yang tepat' },
  { key: 'kalimat', label: 'Kalimat Pendek', icon: '📝', desc: 'Dengar & baca kalimat sederhana' },
];

export const ReadingPracticeFaseA: React.FC = () => {
  const [stage, setStage] = useState<StageKey>('suku-kata');
  const [sukuIndex, setSukuIndex] = useState<number>(0);
  const [kataIndex, setKataIndex] = useState<number>(0);
  const [kalimatIndex, setKalimatIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const speak = (text: string) => {
    setIsSpeaking(true);
    SpeechReader.speak(text, {
      rate: 0.85,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const goNextSuku = () => {
    soundFx.playClick();
    setSukuIndex((i) => (i + 1) % SUKU_KATA_ITEMS.length);
  };

  const currentKata = KATA_ITEMS[kataIndex];

  const handlePickOption = (opt: string) => {
    if (selectedOption) return;
    setSelectedOption(opt);
    const correct = opt === currentKata.emoji;
    setIsCorrectFeedback(correct);
    if (correct) {
      soundFx.playCorrect();
      setScore((s) => s + 1);
    } else {
      soundFx.playWrong();
    }
  };

  const goNextKata = () => {
    soundFx.playClick();
    setSelectedOption(null);
    setIsCorrectFeedback(null);
    setKataIndex((i) => (i + 1) % KATA_ITEMS.length);
  };

  const goNextKalimat = () => {
    soundFx.playClick();
    setKalimatIndex((i) => (i + 1) % KALIMAT_ITEMS.length);
  };

  const currentSuku = SUKU_KATA_ITEMS[sukuIndex];
  const currentKalimat = KALIMAT_ITEMS[kalimatIndex];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>📖</span> Latihan Membaca Fase A (Kelas 1-2)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Belajar suku kata, kata sederhana, dan kalimat pendek dengan bantuan suara — cocok untuk pemula.
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-black font-mono border border-amber-200">
          <span>⭐</span>
          <span>{score}</span>
        </div>
      </div>

      {/* Stage Selector */}
      <div className="grid grid-cols-3 gap-2 mt-5">
        {STAGES.map((s) => {
          const isActive = stage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => {
                soundFx.playClick();
                setStage(s.key);
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isActive
                  ? 'bg-teal-50 border-teal-600 shadow-xs ring-1 ring-teal-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xl">{s.icon}</div>
              <div className={`font-bold text-xs mt-1 ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>{s.label}</div>
              <div className="text-[10px] text-slate-500 leading-tight hidden sm:block mt-0.5">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Suku Kata Stage */}
      {stage === 'suku-kata' && (
        <div className="mt-6 flex flex-col items-center gap-5 py-4">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {currentSuku.syllables.map((syl, idx) => (
              <button
                key={idx}
                onClick={() => speak(syl)}
                className="px-5 py-3 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-900 text-2xl sm:text-3xl font-black hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
                title="Dengarkan suku kata ini"
              >
                {syl}
              </button>
            ))}
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wide">{currentSuku.word}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => speak(currentSuku.word)}
              disabled={isSpeaking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              <span>🔊</span> Dengarkan Kata
            </button>
            <button
              onClick={goNextSuku}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              Kata Berikutnya →
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            Klik setiap suku kata untuk mendengar bunyinya, lalu gabungkan menjadi satu kata utuh.
          </p>
        </div>
      )}

      {/* Kata & Gambar Stage */}
      {stage === 'kata' && (
        <div className="mt-6 flex flex-col items-center gap-5 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wide">{currentKata.word}</div>
            <button
              onClick={() => speak(currentKata.word)}
              disabled={isSpeaking}
              className="p-2.5 rounded-xl bg-teal-100 hover:bg-teal-200 disabled:opacity-50 text-teal-800 transition-all cursor-pointer active:scale-95"
              title="Dengarkan kata ini"
            >
              🔊
            </button>
          </div>
          <p className="text-xs text-slate-500 -mt-3">Pilih gambar yang sesuai dengan kata di atas!</p>
          <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
            {currentKata.options.map((opt, idx) => {
              const isPicked = selectedOption === opt;
              const isTheCorrectOne = opt === currentKata.emoji;
              let stateClass = 'bg-white border-slate-200 hover:bg-slate-50';
              if (selectedOption) {
                if (isPicked && isCorrectFeedback) stateClass = 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400';
                else if (isPicked && !isCorrectFeedback) stateClass = 'bg-rose-50 border-rose-500 ring-1 ring-rose-400';
                else if (isTheCorrectOne) stateClass = 'bg-emerald-50 border-emerald-500';
                else stateClass = 'bg-white border-slate-200 opacity-50';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handlePickOption(opt)}
                  disabled={!!selectedOption}
                  className={`aspect-square rounded-2xl border-2 text-4xl flex items-center justify-center transition-all cursor-pointer ${stateClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {selectedOption && (
            <div className="flex flex-col items-center gap-3">
              <div className={`text-sm font-bold ${isCorrectFeedback ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isCorrectFeedback ? '🎉 Benar sekali!' : `Belum tepat, jawabannya ${currentKata.emoji}`}
              </div>
              <button
                onClick={goNextKata}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
              >
                Lanjut →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kalimat Pendek Stage */}
      {stage === 'kalimat' && (
        <div className="mt-6 flex flex-col items-center gap-5 py-4">
          <div className="text-5xl">{currentKalimat.emoji}</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 text-center leading-snug max-w-lg">
            {currentKalimat.sentence}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => speak(currentKalimat.sentence)}
              disabled={isSpeaking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              <span>🔊</span> Dengarkan Kalimat
            </button>
            <button
              onClick={goNextKalimat}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              Kalimat Berikutnya →
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            Coba baca kalimatnya sendiri terlebih dahulu, lalu dengarkan untuk memeriksa bacaanmu!
          </p>
        </div>
      )}
    </div>
  );
};
