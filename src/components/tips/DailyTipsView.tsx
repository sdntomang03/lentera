import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DailyTip, FALLBACK_TIPS } from '../../data/dailyTipsData';
import { fetchDailyTip } from '../../services/aiTipsService';
import { soundFx } from '../../utils/audio';
import { ENDZI_MASCOT_IMAGE } from '../../assets/mascot';

const SAVED_TIPS_KEY = 'lentera_saved_favorite_tips_v1';

interface DailyTipsViewProps {
  onBack?: () => void;
}

export const DailyTipsView: React.FC<DailyTipsViewProps> = ({ onBack }) => {
  const [currentTip, setCurrentTip] = useState<DailyTip>(FALLBACK_TIPS[0]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'literasi' | 'numerasi' | 'motivasi'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedTips, setSavedTips] = useState<DailyTip[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'collection' | 'ask'>('current');
  const [customTopic, setCustomTopic] = useState<string>('');

  // Load saved favorite tips from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_TIPS_KEY);
      if (stored) {
        setSavedTips(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveFavoritesToStorage = (list: DailyTip[]) => {
    setSavedTips(list);
    try {
      localStorage.setItem(SAVED_TIPS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleToggleFavorite = (tipToToggle: DailyTip) => {
    soundFx.playClick();
    const exists = savedTips.some((t) => t.id === tipToToggle.id || t.quote === tipToToggle.quote);
    if (exists) {
      saveFavoritesToStorage(savedTips.filter((t) => t.id !== tipToToggle.id && t.quote !== tipToToggle.quote));
    } else {
      soundFx.playCorrect();
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      saveFavoritesToStorage([tipToToggle, ...savedTips]);
    }
  };

  const isFavorite = (tipToCheck: DailyTip) =>
    savedTips.some((t) => t.id === tipToCheck.id || t.quote === tipToCheck.quote);

  const loadTip = async (cat: 'all' | 'literasi' | 'numerasi' | 'motivasi') => {
    setIsLoading(true);
    try {
      const newTip = await fetchDailyTip(cat);
      setCurrentTip(newTip);
    } catch {
      // gracefully handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTip(selectedCategory);
  }, [selectedCategory]);

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (tipToCopy: DailyTip) => {
    soundFx.playClick();
    const text = `"${tipToCopy.quote}" — ${tipToCopy.author}\n🎯 ${tipToCopy.actionTip}\n(Media Belajar Lentera Merdeka)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskCustomTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim() || isLoading) return;

    soundFx.playClick();
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: customTopic.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.quote) {
          const generatedTip: DailyTip = {
            id: `custom-tip-${Date.now()}`,
            quote: data.quote,
            author: data.author || 'Guru Lentera AI',
            category: 'motivasi',
            actionTip: data.actionTip || 'Praktikkan trik ini dalam belajar!',
            icon: data.icon || '💡',
            isAiGenerated: true,
          };
          setCurrentTip(generatedTip);
          setActiveTab('current');
          setCustomTopic('');
          soundFx.playCorrect();
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const getTheme = (category: string) => {
    switch (category) {
      case 'literasi':
        return {
          gradient: 'from-teal-600 via-emerald-600 to-teal-800',
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          accent: 'text-teal-700',
          border: 'border-teal-300',
          box: 'bg-teal-50 border-teal-200 text-teal-950',
        };
      case 'numerasi':
        return {
          gradient: 'from-indigo-600 via-purple-600 to-indigo-800',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          accent: 'text-indigo-700',
          border: 'border-indigo-300',
          box: 'bg-indigo-50 border-indigo-200 text-indigo-950',
        };
      default:
        return {
          gradient: 'from-amber-500 via-orange-500 to-yellow-600',
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          accent: 'text-amber-700',
          border: 'border-amber-300',
          box: 'bg-amber-50 border-amber-200 text-amber-950',
        };
    }
  };

  const currentTheme = getTheme(currentTip.category);

  return (
    <div className="space-y-6">
      {/* Hero Header with Endzi the Hornbill */}
      <div className="bg-gradient-to-r from-teal-800 via-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        {onBack && (
          <div className="relative z-10 mb-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onBack();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer border border-white/20 shadow-2xs backdrop-blur-xs group"
              title="Kembali"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Kembali</span>
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-teal-200 border border-white/15">
              <span>🪶</span> Maskot Endzi & Pojok Inspirasi Harian
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tips Belajar Bersama Endzi si Burung Enggang
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Endzi, burung Enggang sahabat belajarmu di Lentera, membawakan trik cepat membaca, rahasia memecahkan soal numerasi, dan kata-kata motivasi untuk membakar semangat belajarmu setiap hari.
            </p>
          </div>

          {/* Mascot Avatar Card */}
          <div className="shrink-0 flex flex-col items-center bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20 shadow-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-300 shadow-inner bg-teal-900">
              <img
                src={ENDZI_MASCOT_IMAGE}
                alt="Maskot Burung Enggang Endzi"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-black text-amber-300 mt-1.5 flex items-center gap-1">
              <span>Endzi</span>
              <span className="text-[10px] bg-amber-500/80 text-white px-1.5 py-0.2 rounded-full">🪶</span>
            </span>
          </div>
        </div>

        {/* Decorative Floating Emojis */}
        <div className="absolute right-28 bottom-2 text-7xl opacity-10 select-none pointer-events-none hidden lg:block">
          💡📖🧮
        </div>
      </div>

      {/* Top View Sub-Navigation */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('current');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'current'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🌟 Tips Hari Ini
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('collection');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'collection'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>❤️</span>
            <span>Tips Favorit</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full font-mono">
              {savedTips.length}
            </span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('ask');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ask'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🤖</span> Tanya Topik Khusus
          </button>
        </div>

        {activeTab === 'current' && (
          <button
            onClick={() => {
              soundFx.playClick();
              loadTip(selectedCategory);
            }}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span className={`inline-block ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
            <span className="hidden sm:inline">{isLoading ? 'Membuat...' : 'Buat Tips Baru'}</span>
          </button>
        )}
      </div>

      {/* Main Tab: Current Daily Tip */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-1">
              Pilih Kategori:
            </span>
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🌈 Semua Kategori
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedCategory('literasi');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'literasi'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              📖 Tips Literasi
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedCategory('numerasi');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'numerasi'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🧮 Trik Numerasi
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedCategory('motivasi');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'motivasi'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🚀 Semangat & Motivasi
            </button>
          </div>

          {/* Big Featured Tip Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
            {/* Gradient Top Strip */}
            <div className={`h-2.5 w-full bg-gradient-to-r ${currentTheme.gradient}`} />

            <div className="p-6 sm:p-8 space-y-6">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <span className="animate-spin text-3xl">🪄</span>
                  <p className="text-sm font-semibold animate-pulse">
                    Guru AI sedang menulis inspirasi terbaik untukmu...
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-100 border border-slate-200">
                        {currentTip.icon}
                      </span>
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${currentTheme.badge}`}>
                          {currentTip.category.toUpperCase()}
                        </span>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">
                          {currentTip.author}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFavorite(currentTip)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                          isFavorite(currentTip)
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title="Simpan ke favorit"
                      >
                        <span>{isFavorite(currentTip) ? '❤️' : '🤍'}</span>
                        <span className="hidden sm:inline">
                          {isFavorite(currentTip) ? 'Tersimpan' : 'Simpan'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleCopy(currentTip)}
                        className="p-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                        title="Salin kutipan"
                      >
                        <span>{copied ? '✅' : '📋'}</span>
                        <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>

                      <button
                        onClick={() =>
                          handleSpeak(
                            `${currentTip.quote}. Dari ${currentTip.author}. ${currentTip.actionTip}`
                          )
                        }
                        className={`p-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                          isSpeaking
                            ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                            : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                        }`}
                        title="Dengarkan teks"
                      >
                        <span>{isSpeaking ? '⏹️' : '🔊'}</span>
                        <span className="hidden sm:inline">{isSpeaking ? 'Berhenti' : 'Suara'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quote Big Display */}
                  <div className="py-2 space-y-3">
                    <span className="text-4xl text-slate-300 font-serif leading-none select-none block">
                      “
                    </span>
                    <blockquote className="text-lg sm:text-2xl font-bold text-slate-800 leading-relaxed italic">
                      {currentTip.quote}
                    </blockquote>
                  </div>

                  {/* Daily Mini Challenge Box */}
                  {currentTip.actionTip && (
                    <div className={`p-5 rounded-2xl border ${currentTheme.box} space-y-1.5`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                          Tantangan Praktis Hari Ini
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-7">
                        {currentTip.actionTip}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Static Tip Suggestions Grid */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-base">
              Koleksi Tips & Trik Populer Lainnya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FALLBACK_TIPS.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    soundFx.playClick();
                    setCurrentTip(item);
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-3 italic">
                      "{item.quote}"
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>{item.author}</span>
                    <span className="text-teal-700 font-bold hover:underline">Buka →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'collection' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Tips Favorit Tersimpan</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kumpulan kutipan dan trik belajar yang telah kamu tandai sebagai favorit.
            </p>
          </div>

          {savedTips.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <span className="text-4xl block">🤍</span>
              <h4 className="font-bold text-slate-800 text-base">Belum Ada Tips Tersimpan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Klik tombol "❤️ Simpan" pada kartu tips hari ini untuk mengumpulkannya di sini agar mudah dibaca kembali saat belajar.
              </p>
              <button
                onClick={() => setActiveTab('current')}
                className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Jelajahi Tips Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedTips.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{fav.icon}</span>
                      <button
                        onClick={() => handleToggleFavorite(fav)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                        title="Hapus dari favorit"
                      >
                        Hapus ✕
                      </button>
                    </div>
                    <blockquote className="text-sm font-semibold text-slate-800 italic leading-relaxed">
                      "{fav.quote}"
                    </blockquote>
                    <p className="text-xs text-slate-500 font-medium">— {fav.author}</p>
                  </div>

                  {fav.actionTip && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>🎯 Tantangan:</strong> {fav.actionTip}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleCopy(fav)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      Salin 📋
                    </button>
                    <button
                      onClick={() => handleSpeak(`${fav.quote}. Dari ${fav.author}`)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold"
                    >
                      Dengarkan 🔊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ask AI Tab */}
      {activeTab === 'ask' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🤖</span> Minta Tips Belajar Spesifik
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Tuliskan kesulitan atau materi yang ingin kamu kuasai (misal: "cara cepat hafal perkalian 7", "tips tidak ngantuk saat membaca", atau "cara mudah memahami pecahan campuran").
            </p>
          </div>

          <form onSubmit={handleAskCustomTip} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Topik Belajar yang Kamu Butuhkan:
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Contoh: Trik memahami paragraf induktif atau cara cepat perkalian 6..."
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Saran Cepat:</span>
              <button
                type="button"
                onClick={() => setCustomTopic('trik perkalian cepat')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Trik Perkalian Cepat
              </button>
              <button
                type="button"
                onClick={() => setCustomTopic('tips fokus membaca teks panjang')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Fokus Membaca Teks Panjang
              </button>
              <button
                type="button"
                onClick={() => setCustomTopic('mengatasi rasa cemas saat ujian')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Ketenangan Ujian
              </button>
            </div>

            <button
              type="submit"
              disabled={!customTopic.trim() || isLoading}
              className="px-5 py-3 bg-gradient-to-r from-teal-700 to-indigo-700 hover:from-teal-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? '🪄' : '✨'}</span>
              <span>{isLoading ? 'Sedang Meracik Tips Khusus...' : 'Buat Tips dengan Gemini AI'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
