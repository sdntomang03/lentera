import React, { useState, useEffect, useRef } from 'react';
import { ENDZI_MASCOT_IMAGE, ENDZI_NAME } from '../../assets/mascot';
import { ChatMessage, sendMessageToEndzi } from '../../services/chatService';
import { soundFx } from '../../utils/audio';

interface EndziChatBotProps {
  studentName?: string;
  currentNav: string;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

const STORAGE_CHAT_KEY = 'lentera_endzi_chat_history_v3';
const STORAGE_POSITION_KEY = 'lentera_endzi_fab_position_v1';

interface MascotPosition {
  x: number;
  y: number;
}

export const EndziChatBot: React.FC<EndziChatBotProps> = ({
  studentName = 'Siswa Lentera',
  currentNav,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTeaser, setShowTeaser] = useState<boolean>(true);
  const [teaserText, setTeaserText] = useState<string>('Halo! Mau tanya materi, rumus, atau fakta dunia? Tanya Endzi yuk! 🪶');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Movable / Draggable floating mascot position
  const [position, setPosition] = useState<MascotPosition | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_POSITION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return {
              x: Math.max(12, Math.min(window.innerWidth - 84, parsed.x)),
              y: Math.max(12, Math.min(window.innerHeight - 84, parsed.y)),
            };
          }
        }
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Initialize and keep within viewport bounds on resize
  useEffect(() => {
    const handleResizeOrInit = () => {
      setPosition((prev) => {
        const defaultX = Math.max(12, window.innerWidth - 88);
        const defaultY = Math.max(12, window.innerHeight - 96);
        if (!prev) {
          return { x: defaultX, y: defaultY };
        }
        return {
          x: Math.max(12, Math.min(window.innerWidth - 84, prev.x)),
          y: Math.max(12, Math.min(window.innerHeight - 84, prev.y)),
        };
      });
    };

    handleResizeOrInit();
    window.addEventListener('resize', handleResizeOrInit);
    return () => window.removeEventListener('resize', handleResizeOrInit);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If clicked on quick control buttons or close teaser, ignore drag
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const currentPos = position || {
      x: window.innerWidth - 88,
      y: window.innerHeight - 96,
    };

    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentPos.x,
      posY: currentPos.y,
    };
    hasMovedRef.current = false;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDataRef.current) return;

    const deltaX = e.clientX - dragDataRef.current.startX;
    const deltaY = e.clientY - dragDataRef.current.startY;

    if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
      setShowTeaser(false);
    }

    if (hasMovedRef.current) {
      const maxX = window.innerWidth - 84;
      const maxY = window.innerHeight - 84;
      const newX = Math.max(12, Math.min(maxX, dragDataRef.current.posX + deltaX));
      const newY = Math.max(12, Math.min(maxY, dragDataRef.current.posY + deltaY));
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDataRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const wasMoved = hasMovedRef.current;
    dragDataRef.current = null;
    setIsDragging(false);

    if (wasMoved && position) {
      try {
        localStorage.setItem(STORAGE_POSITION_KEY, JSON.stringify(position));
      } catch {
        // ignore
      }
    } else if (!wasMoved) {
      // Normal click: toggle chat window
      handleToggle();
    }
  };

  // Quick 1-click side switch (Left ⇄ Right) so user can immediately move Endzi away from cards
  const handleQuickSwapSide = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setPosition((prev) => {
      const current = prev || { x: window.innerWidth - 88, y: window.innerHeight - 96 };
      const isRightSide = current.x > window.innerWidth / 2;
      const newX = isRightSide ? 16 : window.innerWidth - 88;
      const newPos = { x: newX, y: current.y };
      try {
        localStorage.setItem(STORAGE_POSITION_KEY, JSON.stringify(newPos));
      } catch {}
      return newPos;
    });
  };

  // Reset to default bottom-right
  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    const defaultPos = {
      x: window.innerWidth - 88,
      y: window.innerHeight - 96,
    };
    setPosition(defaultPos);
    try {
      localStorage.setItem(STORAGE_POSITION_KEY, JSON.stringify(defaultPos));
    } catch {}
  };

  const initialGreeting: ChatMessage = {
    id: 'welcome-msg',
    sender: 'endzi',
    text: `Halo ${studentName}! Aku **Endzi**, maskot Burung Enggang dan Sahabat Belajar cerdasmu di Lentera! ✨

Kamu bisa menanyakan **apa saja** padaku — baik materi sekolah (literasi membaca, matematika & numerasi, sains, sejarah, bahasa), tips belajar, teknologi modern, fakta unik alam semesta, hingga pertanyaan menarik apapun di luar materi Lentera!

⚠️ *Catatan: Endzi adalah AI sahabat belajar yang dapat membuat kesalahan. Harap selalu verifikasi kembali informasi penting atau tanyakan kepada guru.*

Apa hal atau pertanyaan yang ingin kita bahas bersama hari ini? Tuliskan saja pertanyaanmu di bawah ya! 📚💡`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_CHAT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return [initialGreeting];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTeaser(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages]);

  // Save chat history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Contextual teaser updates
  useEffect(() => {
    const teasersByNav: Record<string, string> = {
      literasi: 'Butuh tips menemukan ide pokok teks bacaan? Endzi siap bantu! 📖',
      numerasi: 'Ada rumus atau pecahan yang membingungkan? Hitung bareng Endzi yuk! 🧮',
      akm: 'Mau trik menganalisis soal penalaran AKM? Tanya Endzi yuk! 🎯',
      manipulatif: 'Ingin tahu cara kerja timbangan atau jam sudut? Endzi siap jelaskan! ⚖️',
      tips: 'Mau teka-teki logika atau motivasi belajar hari ini? 🌟',
    };
    if (teasersByNav[currentNav]) {
      setTeaserText(teasersByNav[currentNav]);
      setShowTeaser(true);
    }
  }, [currentNav]);

  const handleToggle = () => {
    soundFx.playClick();
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const previousHistory = [...messages];
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await sendMessageToEndzi({
        message: textToSend,
        studentName,
        currentNav,
        history: previousHistory,
      });

      const endziMsg: ChatMessage = {
        id: `endzi-${Date.now()}`,
        sender: 'endzi',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      soundFx.playCorrect();
      setMessages((prev) => [...prev, endziMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `endzi-${Date.now()}`,
        sender: 'endzi',
        text: 'Maaf, terjadi gangguan sementara pada koneksi. Aku siap menjawab pertanyaanmu lagi, silakan kirim ulang pesanmu ya!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    soundFx.playClick();
    setMessages([
      {
        ...initialGreeting,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Text-to-speech for Endzi's voice in Indonesian
  const handleSpeakMessage = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(id);

    // Clean markdown stars/hashtags for smooth speech
    const cleanText = text.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.05;
    utterance.pitch = 1.1; // Cheerful friendly bird tone

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Quick suggestions based on active context
  const getContextSuggestions = () => {
    switch (currentNav) {
      case 'literasi':
        return [
          'Bagaimana cara cepat menemukan ide pokok?',
          'Apa perbedaan fakta dan opini?',
          'Beri tips membaca cepat dong!',
        ];
      case 'numerasi':
        return [
          'Jelaskan konsep pecahan senilai dengan perumpamaan kue',
          'Cara mudah menghafal perkalian 7 dan 8',
          'Apa strategi menyelesaikan soal cerita matematika?',
        ];
      case 'akm':
        return [
          'Beri tips mengerjakan soal penalaran AKM',
          'Bagaimana cara membaca tabel dan grafik yang rumit?',
          'Apa arti asesmen kompetensi minimum?',
        ];
      case 'manipulatif':
        return [
          'Bagaimana cara kerja neraca timbangan aljabar?',
          'Jelaskan konsep garis bilangan lompat',
          'Bantu aku memahami sudut dan jarum jam',
        ];
      default:
        return [
          'Siapa itu burung Enggang Endzi?',
          'Beri aku satu teka-teki logika!',
          'Semangati aku belajar hari ini!',
        ];
    }
  };

  const isLeftHalf = position
    ? position.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 400)
    : false;
  const isTopHalf = position
    ? position.y < (typeof window !== 'undefined' ? window.innerHeight / 2 : 400)
    : false;

  return (
    <>
      {/* Floating Mascot Button (Draggable & Repositionable Anywhere) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={
          position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
              }
            : undefined
        }
        className={`${
          position ? 'fixed' : 'fixed bottom-5 right-5 sm:bottom-6 sm:right-6'
        } z-50 flex flex-col ${
          isLeftHalf ? 'items-start' : 'items-end'
        } select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Quick Drag & Reposition Control Toolbar */}
        <div
          className={`no-drag absolute ${
            isTopHalf ? '-bottom-6' : '-top-7'
          } left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-slate-700/80 backdrop-blur-xs select-none transition-all ${
            isDragging ? 'opacity-100 ring-2 ring-amber-400 scale-105' : 'opacity-80 hover:opacity-100'
          }`}
          title="Tahan & geser untuk memindahkan posisi Endzi"
        >
          <span className="flex items-center gap-1 text-slate-300">
            <span className="text-[11px]">⠿</span>
            <span className="hidden xs:inline">Geser</span>
          </span>
          <button
            type="button"
            onClick={handleQuickSwapSide}
            className="text-amber-400 hover:text-amber-300 px-1 hover:bg-slate-800 rounded active:scale-95 transition-all cursor-pointer font-extrabold"
            title="Pindah sisi kiri ⇄ kanan layar agar tidak menghalangi konten"
          >
            ⇄
          </button>
          <button
            type="button"
            onClick={handleResetPosition}
            className="text-slate-400 hover:text-slate-200 px-0.5 hover:bg-slate-800 rounded active:scale-95 transition-all cursor-pointer"
            title="Kembalikan ke posisi awal (Kanan Bawah)"
          >
            ↺
          </button>
        </div>

        {/* Floating Speech Teaser Bubble */}
        {!isOpen && showTeaser && !isDragging && (
          <div
            className={`no-drag absolute ${
              isTopHalf ? 'top-full mt-3' : 'bottom-full mb-3'
            } ${
              isLeftHalf ? 'left-0' : 'right-0'
            } w-64 sm:w-72 bg-white border border-teal-200 shadow-xl rounded-2xl p-3 text-xs text-slate-700 animate-in fade-in duration-200 z-10`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer"
              title="Tutup pesan"
            >
              ✕
            </button>
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0">🪶</span>
              <p className="leading-snug pr-2">
                <span className="font-bold text-teal-800">{ENDZI_NAME}: </span>
                {teaserText}
              </p>
            </div>
            {/* Pointer arrow pointing towards mascot */}
            <div
              className={`absolute w-3 h-3 bg-white ${
                isTopHalf
                  ? '-top-1.5 border-l border-t border-teal-200 rotate-45'
                  : '-bottom-1.5 border-r border-b border-teal-200 rotate-45'
              } ${isLeftHalf ? 'left-6' : 'right-6'}`}
            />
          </div>
        )}

        {/* Mascot Toggle Button */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          className={`relative group p-1 rounded-full bg-gradient-to-tr from-teal-600 via-emerald-500 to-amber-400 shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-300 ${
            isDragging
              ? 'scale-110 ring-4 ring-amber-400/80 shadow-teal-900/40'
              : 'hover:scale-105 active:scale-95'
          }`}
          aria-label="Buka Chat Bot Maskot Endzi (Bisa digeser ke mana saja)"
          title="Klik untuk membuka chat, atau tahan dan geser ke mana saja agar tidak menghalangi tampilan"
        >
          {/* Animated glow ring */}
          <div className="absolute inset-0 rounded-full bg-teal-400 opacity-40 group-hover:opacity-75 blur-md animate-pulse transition-opacity pointer-events-none" />

          {/* Inner circle with mascot image */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white bg-teal-900 shadow-inner flex items-center justify-center pointer-events-none">
            <img
              src={ENDZI_MASCOT_IMAGE}
              alt="Maskot Burung Enggang Endzi"
              className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300 pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Active online badge */}
          <span className="absolute bottom-0 right-0 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center pointer-events-none">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </span>

          {/* Mascot Label Tag */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider rounded-full shadow-xs border border-amber-300 whitespace-nowrap pointer-events-none">
            Tanya Endzi
          </div>
        </div>
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          className={`fixed inset-0 sm:inset-auto ${
            isTopHalf ? 'sm:top-20 sm:bottom-auto' : 'sm:bottom-24 sm:top-auto'
          } ${
            isLeftHalf ? 'sm:left-6 sm:right-auto' : 'sm:right-6 sm:left-auto'
          } z-50 w-full sm:w-[420px] h-full sm:h-[620px] max-h-screen sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white px-4 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-amber-300/80 bg-teal-900 shrink-0 shadow-sm">
                <img
                  src={ENDZI_MASCOT_IMAGE}
                  alt="Endzi"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Endzi si Burung Enggang
                  </h3>
                  <span className="text-amber-300 text-xs font-bold">🪶</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] text-teal-100 font-medium">
                    Sahabat Belajar
                  </p>
                </div>
              </div>
            </div>

            {/* Header action controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Hapus riwayat chat"
                className="w-8 h-8 rounded-xl bg-teal-900/40 hover:bg-teal-900/70 text-teal-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                🗑️
              </button>
              <button
                onClick={handleToggle}
                title="Tutup chat"
                className="w-8 h-8 rounded-xl bg-teal-900/40 hover:bg-teal-900/70 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Context Banner */}
          <div className="bg-teal-50 border-b border-teal-100 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-teal-800 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-teal-900">Halo {studentName}!</span>
              <span className="text-teal-400">•</span>
              <span className="text-teal-700 capitalize">Modul: {currentNav}</span>
            </div>
            <span className="text-xs shrink-0">🦅✨</span>
          </div>

          {/* Quick Suggestions Chips Bar */}
          <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-100 overflow-x-auto no-scrollbar shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
              Saran:
            </span>
            {getContextSuggestions().map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                disabled={isLoading}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 shrink-0 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
            {messages.map((msg) => {
              const isEndzi = msg.sender === 'endzi';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    isEndzi ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Endzi Avatar on left */}
                  {isEndzi && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-teal-200 bg-teal-800 shrink-0 mt-0.5 shadow-2xs">
                      <img
                        src={ENDZI_MASCOT_IMAGE}
                        alt="Endzi"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    className={`max-w-[82%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs relative ${
                      isEndzi
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                        : 'bg-teal-700 text-white rounded-tr-sm'
                    }`}
                  >
                    {/* Sender name & timestamp */}
                    <div
                      className={`flex items-center justify-between text-[10px] mb-1 font-semibold ${
                        isEndzi ? 'text-teal-800' : 'text-teal-100'
                      }`}
                    >
                      <span>{isEndzi ? 'Endzi (Burung Enggang)' : studentName}</span>
                      <span className="text-[9px] opacity-75 ml-2">{msg.timestamp}</span>
                    </div>

                    {/* Message text with basic markdown/line breaks */}
                    <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-reading">
                      {msg.text.split('\n').map((line, lIdx) => {
                        // Bold parsing
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={lIdx} className={line === '' ? 'h-2' : 'my-0.5'}>
                            {parts.map((p, pIdx) => {
                              if (p.startsWith('**') && p.endsWith('**')) {
                                return (
                                  <strong key={pIdx} className="font-bold">
                                    {p.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return p;
                            })}
                          </p>
                        );
                      })}
                    </div>

                    {/* Endzi utility bar (Text to speech & copy) */}
                    {isEndzi && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-end gap-2 text-[10px] text-slate-400">
                        {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                          <button
                            onClick={() => handleSpeakMessage(msg.id, msg.text)}
                            className="hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Dengarkan suara Endzi"
                          >
                            <span>{speakingMessageId === msg.id ? '⏹️ Berhenti' : '🔊 Dengarkan'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            navigator.clipboard.writeText(msg.text);
                          }}
                          className="hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Salin teks"
                        >
                          <span>📋 Salin</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing animation when Endzi is thinking */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-teal-200 bg-teal-800 shrink-0 mt-0.5 shadow-2xs">
                  <img
                    src={ENDZI_MASCOT_IMAGE}
                    alt="Endzi"
                    className="w-full h-full object-cover animate-spin-slow"
                  />
                </div>
                <div className="bg-white border border-teal-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-xs text-xs text-slate-600 flex items-center gap-2">
                  <span className="text-base animate-bounce">💡</span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-teal-800 text-[11px]">
                      Endzi sedang berpikir dan menyiapkan jawaban...
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce delay-0" />
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Buttons */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => handleSend('Beri aku satu tips belajar kilat hari ini dong Endzi!')}
              disabled={isLoading}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>💡</span> Tips Kilat
            </button>
            <button
              type="button"
              onClick={() => handleSend('Endzi, buatkan satu teka-teki logika matematika seru untukku!')}
              disabled={isLoading}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>🧩</span> Teka-teki Seru
            </button>
            <button
              type="button"
              onClick={() => handleSend('Ceritakan tentang burung Enggang khas Indonesia dan kenapa bulumu begitu indah!')}
              disabled={isLoading}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>🪶</span> Cerita Endzi
            </button>
            <button
              type="button"
              onClick={() => handleSend('Endzi, jelaskan bagaimana cara kerja lubang hitam (black hole) di antariksa secara sederhana!')}
              disabled={isLoading}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>🌌</span> Sains & Alam
            </button>
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tanya apa saja kepada Endzi..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Kirim</span>
                  <span>🪶</span>
                </>
              )}
            </button>
          </form>

          {/* AI Accuracy Disclaimer */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 text-center shrink-0">
            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug flex items-center justify-center gap-1.5 font-medium">
              <span className="text-amber-500 font-bold shrink-0">⚠️</span>
              <span>Endzi adalah AI sahabat belajar yang dapat membuat kesalahan. Harap selalu verifikasi kembali informasi penting atau tanyakan kepada guru.</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};
