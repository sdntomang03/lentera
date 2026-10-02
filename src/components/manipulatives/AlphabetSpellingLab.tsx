import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const WRITING_WIDTH = 800;
const WRITING_HEIGHT = 240;

const SPELLING_WORDS = [
  { word: 'BOLA', emoji: '⚽', hint: 'Benda untuk bermain' },
  { word: 'BUKU', emoji: '📚', hint: 'Dibaca untuk mendapat ilmu' },
  { word: 'SAPI', emoji: '🐄', hint: 'Hewan yang menghasilkan susu' },
  { word: 'MATA', emoji: '👀', hint: 'Kita gunakan untuk melihat' },
  { word: 'NASI', emoji: '🍚', hint: 'Makanan pokok' },
  { word: 'KAKI', emoji: '🦶', hint: 'Kita gunakan untuk berjalan' },
  { word: 'RUMAH', emoji: '🏠', hint: 'Tempat kita tinggal' },
  { word: 'TOPI', emoji: '🧢', hint: 'Dipakai di kepala' },
  { word: 'ROTI', emoji: '🍞', hint: 'Makanan dari tepung' },
  { word: 'MEJA', emoji: '🪑', hint: 'Tempat untuk belajar' },
  { word: 'IKAN', emoji: '🐟', hint: 'Hewan yang hidup di air' },
  { word: 'AWAN', emoji: '☁️', hint: 'Terlihat di langit' },
];

type LabMode = 'huruf' | 'eja';
type LetterCase = 'uppercase' | 'lowercase';

export const AlphabetSpellingLab: React.FC = () => {
  const labRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<LabMode>('huruf');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [letterCase, setLetterCase] = useState<LetterCase>('lowercase');
  const [writingStrokes, setWritingStrokes] = useState<string[]>([]);
  const activeStroke = useRef<string | null>(null);
  const [fullscreenError, setFullscreenError] = useState('');
  const currentWord = SPELLING_WORDS[wordIndex];

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === labRef.current);
    };
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
    };
  }, []);

  const pointInWritingArea = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(205, Math.min(
      WRITING_WIDTH - 12,
      ((event.clientX - bounds.left) / bounds.width) * WRITING_WIDTH,
    ));
    const y = Math.max(8, Math.min(
      WRITING_HEIGHT - 8,
      ((event.clientY - bounds.top) / bounds.height) * WRITING_HEIGHT,
    ));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const startWritingStroke = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (((event.clientX - bounds.left) / bounds.width) * WRITING_WIDTH < 200) return;
    const point = pointInWritingArea(event);
    activeStroke.current = point;
    setWritingStrokes((strokes) => [...strokes, point]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continueWritingStroke = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!activeStroke.current) return;
    const point = pointInWritingArea(event);
    activeStroke.current = `${activeStroke.current} ${point}`;
    setWritingStrokes((strokes) => [...strokes.slice(0, -1), activeStroke.current!]);
  };

  const endWritingStroke = () => {
    activeStroke.current = null;
  };

  const toggleFullscreen = async () => {
    soundFx.playClick();
    setFullscreenError('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (labRef.current?.requestFullscreen) {
        await labRef.current.requestFullscreen();
      } else {
        setFullscreenError('Mode layar penuh tidak tersedia pada perangkat ini.');
      }
    } catch (error) {
      console.warn('Could not toggle fullscreen for alphabet lab:', error);
      setFullscreenError('Tidak dapat mengubah mode layar penuh. Coba lagi.');
    }
  };

  const selectMode = (nextMode: LabMode) => {
    soundFx.playClick();
    setMode(nextMode);
  };

  return (
    <section
      ref={labRef}
      className={`overflow-y-auto rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 shadow-sm sm:p-7 ${
        isFullscreen ? 'h-screen w-screen rounded-none' : ''
      }`}
    >
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Laboratorium Bahasa</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Kenali Huruf & Ayo Mengeja</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Kenali huruf besar dan kecil, latih pelafalan sendiri, lalu berlatih menulis huruf sambung pada buku bergaris.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-800 transition-colors hover:bg-indigo-50"
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              {isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            </button>
          </div>
        </header>

        {fullscreenError && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {fullscreenError}
          </p>
        )}

        <div className="mt-6 inline-flex rounded-2xl bg-indigo-100 p-1">
          <button
            type="button"
            onClick={() => selectMode('huruf')}
            aria-pressed={mode === 'huruf'}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              mode === 'huruf' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-700'
            }`}
          >
            🔤 Mengenal Huruf
          </button>
          <button
            type="button"
            onClick={() => selectMode('eja')}
            aria-pressed={mode === 'eja'}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              mode === 'eja' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-700'
            }`}
          >
            ✨ Latihan Mengeja
          </button>
        </div>

        {mode === 'huruf' ? (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">Pilih huruf, lalu ucapkan sendiri nama hurufnya.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => {
                    setSelectedLetter(letter);
                    setWritingStrokes([]);
                  }}
                  aria-pressed={selectedLetter === letter}
                  aria-label={`Pilih huruf ${letter}`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 text-indigo-950 shadow-sm transition hover:-translate-y-0.5 active:scale-95 ${
                    selectedLetter === letter
                      ? 'border-indigo-600 bg-indigo-100 ring-2 ring-indigo-200'
                      : 'border-indigo-100 bg-white hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  <span className="text-3xl font-black sm:text-4xl">{letter}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Huruf pilihan</span>
              <span className="text-5xl font-black text-indigo-950">{selectedLetter}</span>
              <span className="text-5xl font-black text-sky-800">{selectedLetter.toLowerCase()}</span>
              <span className="sr-only">Ucapkan nama huruf ini sendiri.</span>
            </div>
            <div className="mt-6 rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-indigo-50 p-4 text-center text-indigo-950">
                  <span className="block text-xs font-bold text-indigo-700">HURUF BESAR</span>
                  <span className="mt-1 block text-5xl font-black">{selectedLetter}</span>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4 text-center text-sky-950">
                  <span className="block text-xs font-bold text-sky-700">HURUF KECIL</span>
                  <span className="mt-1 block text-5xl font-black">{selectedLetter.toLowerCase()}</span>
                </div>
                <div className="col-span-2 rounded-2xl bg-amber-50 p-4 text-center text-amber-950 sm:col-span-1">
                  <span className="block text-xs font-bold text-amber-700">HURUF SAMBUNG</span>
                  <span className="mt-1 block text-6xl italic" style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}>
                    {selectedLetter.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Buku latihan huruf sambung</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Pilih contoh kapital atau kecil, lalu tirukan pada garis kosong.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Pilih contoh huruf sambung">
                    {([
                      ['uppercase', 'Kapital'],
                      ['lowercase', 'Kecil'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setLetterCase(value);
                          setWritingStrokes([]);
                        }}
                        aria-pressed={letterCase === value}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          letterCase === value ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setWritingStrokes([])}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Hapus tulisan
                  </button>
                </div>
              </div>
              <svg
                viewBox={`0 0 ${WRITING_WIDTH} ${WRITING_HEIGHT}`}
                role="img"
                aria-label={`Buku bergaris untuk latihan huruf sambung ${letterCase === 'uppercase' ? 'kapital' : 'kecil'} ${selectedLetter}`}
                className="mt-3 w-full touch-none rounded-xl border border-amber-100 bg-[#fffdf5]"
                onPointerDown={startWritingStroke}
                onPointerMove={continueWritingStroke}
                onPointerUp={endWritingStroke}
                onPointerCancel={endWritingStroke}
                onLostPointerCapture={endWritingStroke}
              >
                {[0, 80, 160, 240].map((y) => (
                  <line key={`rule-${y}`} x1="0" y1={y} x2={WRITING_WIDTH} y2={y} stroke="#8bb6da" strokeWidth="2" />
                ))}
                {[40, 120, 200].map((y) => (
                  <line key={`guide-${y}`} x1="0" y1={y} x2={WRITING_WIDTH} y2={y} stroke="#b8cee0" strokeWidth="1.5" strokeDasharray="8 8" />
                ))}
                <line x1="190" y1="0" x2="190" y2={WRITING_HEIGHT} stroke="#efb0a8" strokeWidth="2" />
                <text
                  x="35"
                  y="70"
                  fill="#475569"
                  fontSize="64"
                  fontStyle="italic"
                  fontFamily='"Segoe Script", "Brush Script MT", cursive'
                >
                  {letterCase === 'uppercase' ? selectedLetter : selectedLetter.toLowerCase()}
                </text>
                {writingStrokes.map((stroke, index) => (
                  <polyline
                    key={`stroke-${index}`}
                    points={stroke}
                    fill="none"
                    stroke="#312e81"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Eja kata berikut</p>
                <p className="mt-1 text-sm text-slate-500">{currentWord.hint}</p>
              </div>
              <span className="text-5xl" aria-hidden="true">{currentWord.emoji}</span>
            </div>
            <div className="my-6 flex flex-wrap justify-center gap-2 sm:gap-3">
              {currentWord.word.split('').map((letter, index) => (
                <button
                  key={`${currentWord.word}-${index}`}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  aria-pressed={selectedLetter === letter}
                  aria-label={`Pilih huruf ${letter}`}
                  className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-3xl font-black transition sm:h-16 sm:w-14 sm:text-4xl ${
                    selectedLetter === letter
                      ? 'border-sky-600 bg-sky-100 text-sky-950 ring-2 ring-sky-200'
                      : 'border-sky-200 bg-sky-50 text-sky-950 hover:border-sky-500 hover:bg-sky-100'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
            <p className="mb-5 text-center text-xs font-semibold text-slate-500">
              Huruf pilihan: <span className="text-lg font-black text-indigo-800">{selectedLetter}</span>
              {' '}· Ucapkan sendiri huruf-hurufnya untuk mengeja kata.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  const nextIndex = (wordIndex + 1) % SPELLING_WORDS.length;
                  setWordIndex(nextIndex);
                  setSelectedLetter(SPELLING_WORDS[nextIndex].word[0]);
                }}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Kata berikutnya →
              </button>
            </div>
          </div>
        )}
        <p className="mt-5 text-center text-xs text-slate-400">
          Tidak ada suara otomatis. Klik huruf untuk menyorot dan mengenalinya, lalu ucapkan sendiri.
        </p>
      </div>
    </section>
  );
};
