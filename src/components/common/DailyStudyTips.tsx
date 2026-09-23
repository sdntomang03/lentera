import React, { useState, useEffect } from 'react';
import { DailyTip, FALLBACK_TIPS } from '../../data/dailyTipsData';
import { fetchDailyTip } from '../../services/aiTipsService';
import { soundFx } from '../../utils/audio';

export const DailyStudyTips: React.FC = () => {
  const [tip, setTip] = useState<DailyTip>(FALLBACK_TIPS[0]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'literasi' | 'numerasi' | 'motivasi'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const loadTip = async (category: 'all' | 'literasi' | 'numerasi' | 'motivasi') => {
    setIsLoading(true);
    try {
      const newTip = await fetchDailyTip(category);
      setTip(newTip);
    } catch {
      // gracefully handled in service
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTip(selectedCategory);
  }, [selectedCategory]);

  const handleRefresh = () => {
    soundFx.playClick();
    loadTip(selectedCategory);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${tip.quote}. Dari ${tip.author}. ${tip.actionTip}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    soundFx.playClick();
    const text = `"${tip.quote}" — ${tip.author}\n💡 ${tip.actionTip} (Lentera Merdeka)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryTheme = () => {
    switch (tip.category) {
      case 'literasi':
        return {
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          accent: 'text-teal-700',
          gradient: 'from-teal-500/10 via-emerald-500/5 to-transparent',
          border: 'border-teal-200/80',
          highlight: 'bg-teal-50 text-teal-900 border-teal-200',
        };
      case 'numerasi':
        return {
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          accent: 'text-indigo-700',
          gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
          border: 'border-indigo-200/80',
          highlight: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        };
      default:
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          accent: 'text-amber-700',
          gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
          border: 'border-amber-200/80',
          highlight: 'bg-amber-50 text-amber-950 border-amber-200',
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div className="no-print mb-6">
      <div
        className={`relative overflow-hidden rounded-2xl bg-white border ${theme.border} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-300`}
      >
        {/* Subtle decorative gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} pointer-events-none`} />

        {/* Card Header & Controls */}
        <div className="relative z-10 px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xl shrink-0 p-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
              {tip.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Tips Belajar Harian
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-xs">
                  <span>✨</span> Powered by Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Inspirasi motivasi & trik praktis literasi-numerasi untuk belajarmu hari ini
              </p>
            </div>
          </div>

          {/* Action pills & Collapse toggle */}
          <div className="flex items-center gap-1.5">
            {/* Category Filter Chips */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory('all');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory('literasi');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === 'literasi'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📖 Literasi
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory('numerasi');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === 'numerasi'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🧮 Numerasi
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory('motivasi');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === 'motivasi'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚀 Motivasi
              </button>
            </div>

            {/* AI Generate New Tip Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Buat tips baru dengan AI"
              className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={`inline-block ${isLoading ? 'animate-spin' : ''}`}>✨</span>
              <span className="hidden md:inline">{isLoading ? 'Menulis...' : 'Tips Baru'}</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title={isCollapsed ? 'Buka tips' : 'Tutup tips'}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Card Body (Collapsible) */}
        {!isCollapsed && (
          <div className="relative z-10 p-5 space-y-4">
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
                <span className="animate-spin text-2xl">🪄</span>
                <p className="text-xs font-semibold animate-pulse">
                  Guru AI sedang meramu tips belajar terbaik untukmu...
                </p>
              </div>
            ) : (
              <>
                {/* Quote Block */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl text-slate-300 select-none font-serif leading-none mt-0.5">
                      “
                    </span>
                    <blockquote className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed italic">
                      {tip.quote}
                    </blockquote>
                  </div>

                  <div className="flex items-center justify-between pt-1 pl-6">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                      {tip.author}
                    </span>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${theme.badge}`}
                    >
                      {tip.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Practical Action Tip Box */}
                {tip.actionTip && (
                  <div className={`p-3 rounded-xl border ${theme.highlight} flex items-start gap-2.5`}>
                    <span className="text-base shrink-0 mt-0.5">🎯</span>
                    <div className="text-xs leading-relaxed">
                      <span className="font-extrabold block text-slate-900 mb-0.5">
                        Tantangan Mini Hari Ini:
                      </span>
                      <span className="text-slate-700">{tip.actionTip}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Interactive Toolbar */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Read-Aloud / TTS Button */}
                    <button
                      onClick={handleSpeak}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSpeaking
                          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{isSpeaking ? '⏹️' : '🔊'}</span>
                      <span>{isSpeaking ? 'Hentikan Suara' : 'Dengarkan Tips'}</span>
                    </button>

                    {/* Copy Quote Button */}
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{copied ? '✅' : '📋'}</span>
                      <span>{copied ? 'Tersalin!' : 'Salin Kutipan'}</span>
                    </button>
                  </div>

                  {/* Motivational Encouragement */}
                  <span className="text-[11px] text-slate-400 italic hidden md:inline">
                    💡 Satu langkah kecil konsisten setiap hari membawa lompatan prestasi besar!
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
