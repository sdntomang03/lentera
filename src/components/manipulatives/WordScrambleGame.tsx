import React, { useState } from 'react';
import { soundFx, SpeechReader } from '../../utils/audio';

interface GameWord {
  word: string;
  emoji: string;
  hint: string;
}

const WORD_BANK: GameWord[] = [
  { word: 'BOLA', emoji: '⚽', hint: 'Benda bundar untuk bermain sepak bola' },
  { word: 'BUKU', emoji: '📖', hint: 'Kita membacanya untuk belajar' },
  { word: 'AYAM', emoji: '🐔', hint: 'Hewan yang berkokok di pagi hari' },
  { word: 'MATA', emoji: '👁️', hint: 'Bagian tubuh untuk melihat' },
  { word: 'NASI', emoji: '🍚', hint: 'Makanan pokok orang Indonesia' },
  { word: 'RUMAH', emoji: '🏠', hint: 'Tempat kita tinggal bersama keluarga' },
  { word: 'MOBIL', emoji: '🚗', hint: 'Kendaraan beroda empat' },
  { word: 'IKAN', emoji: '🐟', hint: 'Hewan yang hidup di air' },
  { word: 'BINTANG', emoji: '⭐', hint: 'Benda bercahaya di langit malam' },
  { word: 'GUNUNG', emoji: '⛰️', hint: 'Daratan tinggi yang menjulang' },
  { word: 'SEKOLAH', emoji: '🏫', hint: 'Tempat kita belajar bersama guru' },
  { word: 'BUNGA', emoji: '🌸', hint: 'Tumbuhan cantik dan harum' },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const scrambleWord = (word: string): { letter: string; id: number }[] => {
  let letters = word.split('').map((letter, id) => ({ letter, id }));
  // Ensure the scrambled order actually differs from the original when possible
  let attempts = 0;
  let shuffled = shuffle(letters);
  while (attempts < 5 && shuffled.map((l) => l.letter).join('') === word) {
    shuffled = shuffle(letters);
    attempts++;
  }
  return shuffled;
};

export const WordScrambleGame: React.FC = () => {
  const [order, setOrder] = useState<number[]>(() => shuffle(WORD_BANK.map((_, i) => i)));
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [answerSlots, setAnswerSlots] = useState<{ letter: string; id: number }[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const currentWordIdx = order[roundIndex % order.length];
  const currentWord = WORD_BANK[currentWordIdx];

  const [tiles, setTiles] = useState<{ letter: string; id: number }[]>(() => scrambleWord(WORD_BANK[order[0]].word));

  const resetRoundState = (word: string) => {
    setTiles(scrambleWord(word));
    setAnswerSlots([]);
    setShowHint(false);
    setFeedback(null);
  };

  const nextRound = () => {
    soundFx.playClick();
    const nextIdx = (roundIndex + 1) % order.length;
    setRoundIndex(nextIdx);
    resetRoundState(WORD_BANK[order[nextIdx]].word);
  };

  const handleTileClick = (tile: { letter: string; id: number }) => {
    if (feedback === 'correct') return;
    soundFx.playClick();
    setTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setAnswerSlots((prev) => {
      const next = [...prev, tile];
      // Auto-check when the answer reaches full word length
      if (next.length === currentWord.word.length) {
        const guess = next.map((t) => t.letter).join('');
        if (guess === currentWord.word) {
          setFeedback('correct');
          soundFx.playCorrect();
          setScore((s) => s + Math.max(10, 20 - streak));
          setStreak((s) => s + 1);
        } else {
          setFeedback('wrong');
          soundFx.playWrong();
          setStreak(0);
        }
      }
      return next;
    });
  };

  const handleSlotClick = (slotTile: { letter: string; id: number }) => {
    if (feedback === 'correct') return;
    soundFx.playClick();
    setAnswerSlots((prev) => prev.filter((t) => t.id !== slotTile.id));
    setTiles((prev) => [...prev, slotTile]);
    setFeedback(null);
  };

  const handleReshuffle = () => {
    soundFx.playClick();
    setTiles(scrambleWord(currentWord.word));
    setAnswerSlots([]);
    setFeedback(null);
  };

  const handleRetryWrong = () => {
    soundFx.playClick();
    setTiles(scrambleWord(currentWord.word));
    setAnswerSlots([]);
    setFeedback(null);
  };

  const speakWord = () => {
    SpeechReader.speak(currentWord.word, { rate: 0.85 });
  };

  const emptySlotsCount = currentWord.word.length - answerSlots.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🧩</span> Game Susun Kata
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Susun huruf acak menjadi kata yang benar sambil melatih kemampuan membaca dan mengeja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-black font-mono border border-amber-200">
            <span>⭐</span>
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-900 text-xs font-black font-mono border border-orange-200" title="Beruntun jawaban benar">
            <span>🔥</span>
            <span>{streak}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 py-4">
        <div className="text-6xl">{currentWord.emoji}</div>

        {/* Answer slots */}
        <div className="flex items-center gap-2 flex-wrap justify-center min-h-[3.5rem]">
          {answerSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot)}
              disabled={feedback === 'correct'}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black cursor-pointer transition-all ${
                feedback === 'correct'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : feedback === 'wrong'
                  ? 'bg-rose-50 border-rose-500 text-rose-800'
                  : 'bg-teal-50 border-teal-400 text-teal-900 hover:bg-teal-100'
              }`}
            >
              {slot.letter}
            </button>
          ))}
          {Array.from({ length: Math.max(0, emptySlotsCount) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50"
            />
          ))}
        </div>

        {/* Feedback message */}
        {feedback === 'correct' && (
          <div className="text-sm font-bold text-emerald-700">🎉 Benar! Kata ini adalah "{currentWord.word}"</div>
        )}
        {feedback === 'wrong' && (
          <div className="text-sm font-bold text-rose-700">Belum tepat, coba susun ulang hurufnya!</div>
        )}

        {/* Letter tiles to pick from */}
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-md">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-xl sm:text-2xl font-black text-slate-800 cursor-pointer transition-all shadow-2xs"
            >
              {tile.letter}
            </button>
          ))}
        </div>

        {showHint && feedback !== 'correct' && (
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 max-w-sm text-center">
            💡 Petunjuk: {currentWord.hint}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={speakWord}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
          >
            🔊 Dengarkan
          </button>
          {feedback !== 'correct' && (
            <>
              <button
                onClick={() => setShowHint((v) => !v)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
              >
                💡 {showHint ? 'Sembunyikan' : 'Petunjuk'}
              </button>
              <button
                onClick={feedback === 'wrong' ? handleRetryWrong : handleReshuffle}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
              >
                🔀 Acak Ulang
              </button>
            </>
          )}
          {feedback === 'correct' && (
            <button
              onClick={nextRound}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              Kata Berikutnya →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
