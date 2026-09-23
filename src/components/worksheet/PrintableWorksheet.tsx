import React, { useState } from 'react';
import { LITERACY_PASSAGES } from '../../data/literacyData';
import { NUMERACY_QUESTIONS } from '../../data/numeracyData';
import { soundFx } from '../../utils/audio';

interface PrintableWorksheetProps {
  onBack?: () => void;
}

export const PrintableWorksheet: React.FC<PrintableWorksheetProps> = ({ onBack }) => {
  const [selectedType, setSelectedType] = useState<'literasi' | 'numerasi'>('literasi');
  const [selectedPassageId, setSelectedPassageId] = useState<string>(LITERACY_PASSAGES[0].id);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(NUMERACY_QUESTIONS[0].id);
  const [schoolName, setSchoolName] = useState<string>('SD NEGERI NUSANTARA CERDAS');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(false);

  const activePassage = LITERACY_PASSAGES.find((p) => p.id === selectedPassageId) || LITERACY_PASSAGES[0];
  const activeQuestion = NUMERACY_QUESTIONS.find((q) => q.id === selectedQuestionId) || NUMERACY_QUESTIONS[0];

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const handleBackClick = () => {
    soundFx.playClick();
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Box (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Navigation / Back Header Row */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200 shadow-2xs group"
            title="Kembali"
          >
            <span className="text-teal-700 font-extrabold text-base group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Kembali</span>
          </button>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Modul LKPD Cetak & Asesmen</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🖨️</span> Penjana Lembar Kerja Peserta Didik (LKPD) Cetak
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Format siap cetak A4 / PDF untuk kegiatan belajar tatap muka di kelas atau asesmen diagnostik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackClick}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>←</span>
              <span>Kembali</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>🖨️</span> Cetak / Simpan PDF (A4)
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Materi Asesmen:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType('literasi')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  selectedType === 'literasi' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Literasi Membaca
              </button>
              <button
                onClick={() => setSelectedType('numerasi')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  selectedType === 'numerasi' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Numerasi Kontekstual
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Judul Modul:</label>
            {selectedType === 'literasi' ? (
              <select
                value={selectedPassageId}
                onChange={(e) => setSelectedPassageId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              >
                {LITERACY_PASSAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.levelLabel})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedQuestionId}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              >
                {NUMERACY_QUESTIONS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.domainLabel})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kop Satuan Pendidikan:</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              placeholder="Nama Sekolah / Madrasah"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="rounded accent-teal-600"
            />
            <span>Sertakan Lembar Kunci Jawaban & Rubrik Penilaian untuk Guru</span>
          </label>
          <span className="text-slate-400">Gunakan tata letak portrait A4 pada opsi printer</span>
        </div>
      </div>

      {/* Printable Sheet Container (Styled like official school paper) */}
      <div className="bg-white rounded-xl p-8 md:p-12 border border-slate-300 shadow-sm max-w-4xl mx-auto font-sans text-black">
        {/* School Header / Kop Surat Sekolah */}
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">
            {schoolName}
          </h2>
          <h3 className="text-sm font-bold uppercase text-slate-800 tracking-wide mt-0.5">
            LEMBAR KERJA PESERTA DIDIK (LKPD) - KURIKULUM MERDEKA
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Program Penguatan Literasi & Numerasi Berbasis Asesmen Kompetensi Minimum (AKM)
          </p>
        </div>

        {/* Student Metadata Box */}
        <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-6 text-xs">
          <div className="space-y-1.5">
            <div><strong>Nama Peserta Didik :</strong> _____________________________</div>
            <div><strong>Kelas / Fase       :</strong> _____________________________</div>
          </div>
          <div className="space-y-1.5">
            <div><strong>Nomor Presensi :</strong> _________</div>
            <div><strong>Hari, Tanggal   :</strong> _____________________________</div>
          </div>
        </div>

        {/* Score & Signature Box in Corner */}
        <div className="flex justify-end mb-6">
          <div className="border border-black grid grid-cols-2 text-center text-xs w-48">
            <div className="p-1 border-r border-b border-black font-bold bg-slate-100">Nilai</div>
            <div className="p-1 border-b border-black font-bold bg-slate-100">Paraf Guru</div>
            <div className="h-10 border-r border-black"></div>
            <div className="h-10"></div>
          </div>
        </div>

        {/* Worksheet Content based on selection */}
        {selectedType === 'literasi' ? (
          <div className="space-y-6 text-sm">
            <div className="text-center font-bold uppercase text-base border-b border-slate-200 pb-2">
              BACAAN: {activePassage.title}
            </div>

            <div className="space-y-3 text-justify leading-relaxed">
              {activePassage.paragraphs.map((p, idx) => (
                <p key={idx} className="indent-6">
                  {p}
                </p>
              ))}
            </div>

            <div className="pt-4 border-t border-black space-y-4">
              <h4 className="font-bold uppercase text-xs">
                INSTRUKSI: Jawablah pertanyaan pemahaman bacaan di bawah ini dengan tepat!
              </h4>

              {activePassage.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2 pt-2">
                  <div className="font-semibold text-xs">
                    {idx + 1}. {q.question}
                  </div>
                  {q.options && (
                    <div className="pl-4 space-y-1 text-xs">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-start gap-2">
                          <span>{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'true-false' && (
                    <div className="pl-4 text-xs">
                      [ &nbsp; ] BENAR &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] SALAH
                    </div>
                  )}
                  {q.type === 'short-answer' && (
                    <div className="h-12 border-b border-dotted border-black mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-sm">
            <div className="text-center font-bold uppercase text-base border-b border-slate-200 pb-2">
              NUMERASI: {activeQuestion.title} ({activeQuestion.domainLabel})
            </div>

            <div className="p-4 border border-slate-300 rounded-lg space-y-2 bg-slate-50/40">
              <span className="font-bold text-xs uppercase block">Stimulus Soal:</span>
              <p className="leading-relaxed text-justify">{activeQuestion.stimulus.text}</p>
            </div>

            <div className="pt-4 border-t border-black space-y-4">
              <h4 className="font-bold uppercase text-xs">
                SOAL PEMECAHAN MASALAH:
              </h4>

              <div className="font-semibold text-xs">
                1. {activeQuestion.question}
              </div>

              {activeQuestion.options && (
                <div className="pl-4 space-y-1 text-xs">
                  {activeQuestion.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-start gap-2">
                      <span>{String.fromCharCode(65 + optIdx)}.</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Working space for calculation */}
              <div className="mt-4 pt-2">
                <span className="font-bold text-xs uppercase text-slate-700 block mb-1">
                  Ruang Coretan & Langkah Perhitungan Siswa:
                </span>
                <div className="h-40 border border-slate-400 rounded-lg p-3 text-xs text-slate-400 italic">
                  Tuliskan cara hitung dan rumus yang digunakan di sini...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optional Teacher's Key Sheet */}
        {includeAnswerKey && (
          <div className="mt-12 pt-8 border-t-2 border-black page-break text-xs space-y-4">
            <div className="text-center font-bold uppercase text-sm">
              LEMBAR KUNCI JAWABAN & RUBRIK ASESMEN (PEGANGAN GURU)
            </div>
            {selectedType === 'literasi' ? (
              <div className="space-y-3">
                {activePassage.questions.map((q, idx) => (
                  <div key={q.id} className="p-2 border border-slate-200 rounded">
                    <strong>No. {idx + 1}:</strong> {Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : String(q.correctAnswers)}
                    <p className="text-slate-600 mt-1 italic">Pedoman Skor: 1 poin untuk jawaban tepat. Pembahasan: {q.explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-slate-200 rounded space-y-2">
                <div><strong>Kunci Jawaban:</strong> {String(activeQuestion.correctAnswer)}</div>
                <div><strong>Langkah Solusi Guru:</strong></div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {activeQuestion.stepByStepSolution.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
