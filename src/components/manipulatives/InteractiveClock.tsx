import React, { useState } from 'react';
import { soundFx } from '../../utils/audio';

export const InteractiveClock: React.FC = () => {
  const [hours, setHours] = useState<number>(8);
  const [minutes, setMinutes] = useState<number>(30);
  const [period, setPeriod] = useState<'pagi' | 'siang' | 'sore' | 'malam'>('pagi');

  // Minute step changes
  const addMinutes = (mins: number) => {
    soundFx.playClick();
    let newMins = minutes + mins;
    let newHours = hours;

    while (newMins >= 60) {
      newMins -= 60;
      newHours = (newHours % 12) + 1;
    }
    while (newMins < 0) {
      newMins += 60;
      newHours = newHours === 1 ? 12 : newHours - 1;
    }

    setMinutes(newMins);
    setHours(newHours);
  };

  // Convert 12h to 24h
  const get24HourTime = () => {
    let h24 = hours;
    if (period === 'siang' && hours < 12) h24 += 12;
    if (period === 'sore' && hours < 12) h24 += 12;
    if (period === 'malam' && hours < 12) h24 += 12;
    if (period === 'pagi' && hours === 12) h24 = 0;
    return `${String(h24).padStart(2, '0')}.${String(minutes).padStart(2, '0')} WIB`;
  };

  // Natural Indonesian time phrasing
  const getIndonesianPhrase = () => {
    if (minutes === 0) return `Pukul ${hours} tepat ${period}`;
    if (minutes === 15) return `Pukul ${hours} lewat seperempat ${period}`;
    if (minutes === 30) return `Setengah ${hours === 12 ? 1 : hours + 1} ${period}`;
    if (minutes === 45) return `Pukul ${hours === 12 ? 1 : hours + 1} kurang seperempat ${period}`;
    if (minutes < 30) return `Pukul ${hours} lewat ${minutes} menit ${period}`;
    return `Pukul ${hours === 12 ? 1 : hours + 1} kurang ${60 - minutes} menit ${period}`;
  };

  // Angles for hands
  const minuteAngle = minutes * 6; // 360 / 60 = 6 deg
  const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 360 / 12 = 30 deg + minute progression

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>⏰</span> Jam Analog & Pengukuran Waktu
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Belajar membaca jarum jam analog, konversi waktu 24 jam, dan kalimat waktu baku bahasa Indonesia.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(['pagi', 'siang', 'sore', 'malam'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                soundFx.playClick();
                setPeriod(p);
              }}
              className={`px-3 py-1 text-xs font-semibold capitalize rounded-lg transition-colors ${
                period === p ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 items-center">
        {/* Clock Canvas */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-md">
              {/* Clock Face */}
              <circle cx="120" cy="120" r="110" fill="#ffffff" stroke="#0f172a" strokeWidth="6" />
              <circle cx="120" cy="120" r="102" fill="#f8fafc" />

              {/* 12 Hour Numbers & Ticks */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const xTick1 = 120 + 94 * Math.sin(angle);
                const yTick1 = 120 - 94 * Math.cos(angle);
                const xTick2 = 120 + 102 * Math.sin(angle);
                const yTick2 = 120 - 102 * Math.cos(angle);

                const xNum = 120 + 80 * Math.sin(angle);
                const yNum = 120 - 80 * Math.cos(angle);

                const num = i === 0 ? 12 : i;

                return (
                  <g key={i}>
                    <line
                      x1={xTick1}
                      y1={yTick1}
                      x2={xTick2}
                      y2={yTick2}
                      stroke="#475569"
                      strokeWidth="3"
                    />
                    <text
                      x={xNum}
                      y={yNum + 5}
                      textAnchor="middle"
                      className="text-base font-bold font-mono fill-slate-800"
                    >
                      {num}
                    </text>
                  </g>
                );
              })}

              {/* Hour Hand (Pendek & Tebal) */}
              <line
                x1="120"
                y1="120"
                x2={120 + 55 * Math.sin((hourAngle * Math.PI) / 180)}
                y2={120 - 55 * Math.cos((hourAngle * Math.PI) / 180)}
                stroke="#0f172a"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Minute Hand (Panjang & Ramping) */}
              <line
                x1="120"
                y1="120"
                x2={120 + 82 * Math.sin((minuteAngle * Math.PI) / 180)}
                y2={120 - 82 * Math.cos((minuteAngle * Math.PI) / 180)}
                stroke="#0d9488"
                strokeWidth="4.5"
                strokeLinecap="round"
              />

              {/* Center Pin */}
              <circle cx="120" cy="120" r="7" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" /> Jarum Pendek (Jam)
            </span>
            <span className="flex items-center gap-1.5 text-teal-700 font-medium">
              <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" /> Jarum Panjang (Menit)
            </span>
          </div>
        </div>

        {/* Readout and Time Adjusters */}
        <div className="md:col-span-6 space-y-5">
          <div className="bg-slate-900 text-white p-5 rounded-2xl">
            <div className="text-xs text-teal-400 font-medium tracking-wide">PENGUKURAN WAKTU BAKU</div>
            <div className="text-3xl font-black font-mono mt-1 text-white">
              {get24HourTime()}
            </div>
            <div className="text-sm font-medium text-slate-300 mt-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              🗣️ &quot;{getIndonesianPhrase()}&quot;
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700 block">Atur Jarum Menit Cepat:</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => addMinutes(-15)}
                className="py-1.5 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                -15 mnt
              </button>
              <button
                onClick={() => addMinutes(-5)}
                className="py-1.5 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                -5 mnt
              </button>
              <button
                onClick={() => addMinutes(5)}
                className="py-1.5 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                +5 mnt
              </button>
              <button
                onClick={() => addMinutes(15)}
                className="py-1.5 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                +15 mnt
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Ubah Jam:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setHours(hours === 1 ? 12 : hours - 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="font-mono font-bold text-base w-8 text-center">{hours}</span>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setHours((hours % 12) + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
