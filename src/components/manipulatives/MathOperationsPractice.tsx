import React, { useMemo, useState } from 'react';
import { soundFx } from '../../utils/audio';

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
type GamePhase = 'setup' | 'playing' | 'finished';
type DigitSlot = { place: string; extra: string };
type DivisionWorkRow = { value: string; endIndex: number; negative?: boolean };

const OPERATIONS: { id: Operation; label: string; symbol: string }[] = [
  { id: 'addition', label: 'Penjumlahan', symbol: '+' },
  { id: 'subtraction', label: 'Pengurangan', symbol: '−' },
  { id: 'multiplication', label: 'Perkalian', symbol: '×' },
  { id: 'division', label: 'Pembagian', symbol: '÷' },
];
const PLACE_NAMES = ['satuan', 'puluhan', 'ratusan', 'ribuan', 'puluh ribuan', 'ratus ribuan', 'jutaan', 'puluh jutaan'];
const ROUND_COUNT = 10;

interface Problem {
  first: number;
  second: number;
  answer: number;
  operation: Operation;
  hidden: number[];
  steps: DigitSlot[];
}

const randomInteger = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomNDigitNumber = (digits: number) =>
  randomInteger(10 ** (digits - 1), 10 ** digits - 1);

function createProblem(operation: Operation, firstDigits: number, secondDigits: number): Problem {
  let first: number;
  let second: number;
  let answer: number;

  if (operation === 'addition') {
    first = randomNDigitNumber(firstDigits);
    second = randomNDigitNumber(secondDigits);
    answer = first + second;
  } else if (operation === 'subtraction') {
    first = randomNDigitNumber(firstDigits);
    second = randomNDigitNumber(secondDigits);
    if (first < second) [first, second] = [second, first];
    answer = first - second;
  } else if (operation === 'multiplication') {
    first = randomNDigitNumber(firstDigits);
    second = randomNDigitNumber(secondDigits);
    answer = first * second;
  } else {
    const minDivisor = secondDigits === 1 ? 2 : 10 ** (secondDigits - 1);
    second = randomInteger(minDivisor, 10 ** secondDigits - 1);
    const minQuotient = Math.max(1, Math.ceil(10 ** (firstDigits - 1) / second));
    const maxQuotient = Math.floor((10 ** firstDigits - 1) / second);
    const quotient = randomInteger(minQuotient, maxQuotient);
    first = second * quotient;
    answer = first / second;
  }

  const steps = createSteps(operation, first, second);
  const answerLength = String(answer).length;
  const hiddenCount = Math.min(answerLength, Math.max(1, Math.ceil(answerLength / 2)));
  const hidden = new Set<number>();
  while (hidden.size < hiddenCount) hidden.add(randomInteger(0, answerLength - 1));

  return { first, second, answer, operation, hidden: [...hidden], steps };
}

function createSteps(operation: Operation, first: number, second: number): DigitSlot[] {
  const firstDigits = String(first).split('').reverse().map(Number);
  const secondDigits = String(second).split('').reverse().map(Number);
  const steps: DigitSlot[] = [];

  if (operation === 'addition') {
    let carry = 0;
    const length = Math.max(firstDigits.length, secondDigits.length);
    for (let index = 0; index < length; index++) {
      const a = firstDigits[index] ?? 0;
      const b = secondDigits[index] ?? 0;
      const total = a + b + carry;
      const nextCarry = Math.floor(total / 10);
      steps.push({
        place: PLACE_NAMES[index],
        extra: `${a} + ${b}${carry ? ` + simpanan ${carry}` : ''}. Tulis satuannya${nextCarry ? `, simpan ${nextCarry}` : ''}.`,
      });
      carry = nextCarry;
    }
    if (carry) steps.push({ place: PLACE_NAMES[length], extra: 'Turunkan angka simpanan ke tempat berikutnya.' });
  } else if (operation === 'subtraction') {
    let borrow = 0;
    for (let index = 0; index < firstDigits.length; index++) {
      const a = firstDigits[index] ?? 0;
      const b = (secondDigits[index] ?? 0) + borrow;
      const needsBorrow = a < b ? 1 : 0;
      steps.push({
        place: PLACE_NAMES[index],
        extra: needsBorrow
          ? `${a} belum cukup untuk dikurangi ${b}. Pinjam 1 dari tempat berikutnya, lalu kurangi.`
          : `Kurangi ${a} dengan ${b}, lalu tulis hasilnya.`,
      });
      borrow = needsBorrow;
    }
  } else if (operation === 'multiplication') {
    secondDigits.forEach((multiplierDigit, multiplierIndex) => {
      let carry = 0;
      firstDigits.forEach((multiplicandDigit, multiplicandIndex) => {
        const nextCarry = Math.floor((multiplicandDigit * multiplierDigit + carry) / 10);
        const placeIndex = multiplierIndex + multiplicandIndex;
        steps.push({
          place: `${PLACE_NAMES[placeIndex]} · baris ${PLACE_NAMES[multiplierIndex]}`,
          extra: `Kalikan angka ${multiplicandDigit} dengan ${multiplierDigit}${carry ? `, lalu tambahkan simpanan ${carry}` : ''}. Tulis satuannya${nextCarry ? ` dan simpan ${nextCarry}` : ''}.`,
        });
        carry = nextCarry;
      });
      if (carry) {
        steps.push({
          place: `${PLACE_NAMES[multiplierIndex + firstDigits.length]} · baris ${PLACE_NAMES[multiplierIndex]}`,
          extra: 'Tuliskan angka simpanan terakhir pada kolom berikutnya.',
        });
      }
      if (multiplierIndex < secondDigits.length - 1) {
        steps.push({
          place: `baris ${PLACE_NAMES[multiplierIndex]}`,
          extra: `Geser hasil perkalian satu tempat ke kiri untuk nilai tempat ${PLACE_NAMES[multiplierIndex]}.`,
        });
      }
    });
    steps.push({
      place: 'hasil akhir',
      extra: 'Jumlahkan seluruh hasil perkalian bersusun untuk mendapatkan hasil akhir.',
    });
  } else {
    const dividendDigits = String(first).split('').map(Number);
    let remainder = 0;
    dividendDigits.forEach((digit, index) => {
      const partial = remainder * 10 + digit;
      remainder = partial % second;
      steps.push({
        place: PLACE_NAMES[dividendDigits.length - index - 1],
        extra: `Bagi ${partial} dengan ${second}. Tulis hasil pembagian pada tempat ${PLACE_NAMES[dividendDigits.length - index - 1]}, lalu tentukan sisanya untuk langkah berikutnya.`,
      });
    });
  }
  return steps;
}

function getExample(operation: Operation, firstDigits: number, secondDigits: number) {
  const repeatedDigit = (digit: number, length: number) => Number(String(digit).repeat(length));
  let first: number;
  let second: number;

  if (operation === 'addition') {
    first = repeatedDigit(7, firstDigits);
    second = repeatedDigit(5, secondDigits);
  } else if (operation === 'subtraction') {
    first = 8 * 10 ** (firstDigits - 1);
    second = repeatedDigit(2, secondDigits);
  } else if (operation === 'multiplication') {
    first = repeatedDigit(2, firstDigits);
    second = repeatedDigit(3, secondDigits);
  } else {
    second = secondDigits === 1 ? 4 : 10 ** (secondDigits - 1);
    const minQuotient = Math.max(1, Math.ceil(10 ** (firstDigits - 1) / second));
    first = second * minQuotient;
  }

  const answer = operation === 'addition'
    ? first + second
    : operation === 'subtraction'
      ? first - second
      : operation === 'multiplication'
        ? first * second
        : first / second;
  const columnCount = Math.max(String(first).length, String(second).length, String(answer).length);
  const markers = Array<string>(columnCount).fill('');
  const steps: string[] = [];
  const partialProducts: number[] = [];
  const divisionWorkRows: DivisionWorkRow[] = [];
  const addMarker = (column: number, marker: string) => {
    if (column >= 0 && column < columnCount) {
      markers[column] = markers[column] ? `${markers[column]}; ${marker}` : marker;
    }
  };

  if (operation === 'addition') {
    const firstDigits = String(first).split('').reverse().map(Number);
    const secondDigits = String(second).split('').reverse().map(Number);
    let carry = 0;
    for (let index = 0; index < Math.max(firstDigits.length, secondDigits.length); index++) {
      const a = firstDigits[index] ?? 0;
      const b = secondDigits[index] ?? 0;
      const total = a + b + carry;
      const nextCarry = Math.floor(total / 10);
      if (nextCarry) addMarker(columnCount - index - 2, `simpan ${nextCarry}`);
      steps.push(
        `${PLACE_NAMES[index]}: ${a} + ${b}${carry ? ` + simpanan ${carry}` : ''} = ${total}. Tulis ${total % 10}${nextCarry ? `, simpan ${nextCarry} di kolom ${PLACE_NAMES[index + 1]}` : ''}.`,
      );
      carry = nextCarry;
    }
    if (carry) steps.push(`Turunkan simpanan ${carry} ke kolom ${PLACE_NAMES[Math.max(firstDigits.length, secondDigits.length)]}.`);
  } else if (operation === 'subtraction') {
    const firstDigits = String(first).split('').reverse().map(Number);
    const secondDigits = String(second).split('').reverse().map(Number);
    let borrow = 0;
    for (let index = 0; index < firstDigits.length; index++) {
      const a = firstDigits[index] ?? 0;
      const b = secondDigits[index] ?? 0;
      const adjusted = a - borrow;
      const needsBorrow = adjusted < b;
      const value = adjusted + (needsBorrow ? 10 : 0);
      if (needsBorrow) {
        addMarker(columnCount - index - 1, '+10 pinjam');
        if (index + 1 < firstDigits.length) addMarker(columnCount - index - 2, '−1');
      }
      steps.push(
        `${PLACE_NAMES[index]}: ${a}${borrow ? ' − 1 pinjaman' : ''}${needsBorrow ? ` belum cukup. Pinjam 1 dari kolom ${PLACE_NAMES[index + 1]}, lalu ${value} − ${b} = ${value - b}.` : ` − ${b} = ${value - b}.`}`,
      );
      borrow = needsBorrow ? 1 : 0;
    }
  } else if (operation === 'multiplication') {
    const firstDigits = String(first).split('').reverse().map(Number);
    const multipliers = String(second).split('').reverse().map(Number);
    multipliers.forEach((multiplier, multiplierIndex) => {
      let carry = 0;
      firstDigits.forEach((digit, index) => {
        const product = digit * multiplier + carry;
        const nextCarry = Math.floor(product / 10);
        if (multiplierIndex === 0 && nextCarry) addMarker(columnCount - index - 2, `simpan ${nextCarry}`);
        steps.push(
          `${PLACE_NAMES[index]}${multipliers.length > 1 ? ` pada baris ${PLACE_NAMES[multiplierIndex]}` : ''}: ${digit} × ${multiplier}${carry ? ` + simpanan ${carry}` : ''} = ${product}. Tulis ${product % 10}${nextCarry ? `, simpan ${nextCarry}` : ''}.`,
        );
        carry = nextCarry;
      });
      partialProducts.push(first * multiplier * 10 ** multiplierIndex);
      if (carry) steps.push(`Tuliskan simpanan ${carry} pada kolom hasil berikutnya.`);
    });
    if (multipliers.length > 1) {
      steps.push('Geser setiap hasil perkalian satu tempat ke kiri untuk setiap nilai tempat pengali, lalu jumlahkan semua baris.');
    }
  } else {
    let remainder = 0;
    String(first).split('').forEach((digit, index) => {
      const partial = remainder * 10 + Number(digit);
      const quotientDigit = Math.floor(partial / second);
      const product = quotientDigit * second;
      const partialText = remainder === 0 && index > 0 && partial < 10 ? `0${digit}` : String(partial);
      divisionWorkRows.push({ value: partialText, endIndex: index });
      divisionWorkRows.push({ value: String(product), endIndex: index, negative: true });
      remainder = partial % second;
      if (index === String(first).length - 1) {
        divisionWorkRows.push({ value: String(remainder), endIndex: index });
      }
      steps.push(
        `${PLACE_NAMES[String(first).length - index - 1]}: bagi ${partial} dengan ${second}, tulis ${quotientDigit} pada hasil. Sisanya ${remainder}; turunkan angka berikutnya.`,
      );
    });
  }
  return { first, second, answer, markers, steps, columnCount, partialProducts, divisionWorkRows };
}

export const MathOperationsPractice: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [operation, setOperation] = useState<Operation>('addition');
  const [firstDigits, setFirstDigits] = useState(3);
  const [secondDigits, setSecondDigits] = useState(2);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [message, setMessage] = useState('');
  const example = useMemo(() => getExample(operation, firstDigits, secondDigits), [operation, firstDigits, secondDigits]);
  const resultDigits = problem ? String(problem.answer).split('') : [];
  const maxDigits = problem ? Math.max(String(problem.first).length, String(problem.second).length, resultDigits.length) : 0;
  const selectedOperation = OPERATIONS.find((option) => option.id === operation)!;

  const beginRound = (nextRound: number, nextScore = score) => {
    const nextProblem = createProblem(operation, firstDigits, secondDigits);
    setProblem(nextProblem);
    setAnswers(Array(String(nextProblem.answer).length).fill(''));
    setRound(nextRound);
    setScore(nextScore);
    setFeedback(null);
    setMessage('');
    setPhase(nextRound > ROUND_COUNT ? 'finished' : 'playing');
  };

  const startGame = () => {
    soundFx.playClick();
    setScore(0);
    beginRound(1, 0);
  };

  const checkAnswer = () => {
    if (!problem || answers.some((answer, index) => problem.hidden.includes(index) && !/^\d$/.test(answer))) {
      setMessage('Isi semua kotak kosong dengan satu angka.');
      return;
    }
    const correct = problem.hidden.every((index) => Number(answers[index]) === Number(resultDigits[index]));
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      soundFx.playCorrect();
      setScore((current) => current + 1);
      setMessage('Hebat! Semua angka yang hilang benar.');
    } else {
      soundFx.playWrong();
      setMessage('Belum tepat. Periksa lagi langkah bersusunnya, lalu coba kembali.');
    }
  };

  const showNext = () => {
    soundFx.playClick();
    if (round >= ROUND_COUNT) setPhase('finished');
    else beginRound(round + 1);
  };

  const setSelectedOperation = (nextOperation: Operation) => {
    setOperation(nextOperation);
    if ((nextOperation === 'subtraction' || nextOperation === 'division') && secondDigits > firstDigits) {
      setSecondDigits(firstDigits);
    }
  };

  const numberRow = (value: number, colorClass: string) => {
    const digits = String(value).split('');
    return (
      <div className="flex justify-end">
        <div className={`grid font-mono text-3xl font-black sm:text-4xl ${colorClass}`} style={{ gridTemplateColumns: `repeat(${maxDigits}, minmax(2.25rem, 1fr))` }}>
          {Array.from({ length: maxDigits }, (_, column) => {
            const digit = digits[column - (maxDigits - digits.length)];
            return <span key={column} className="flex h-12 items-center justify-center">{digit ?? ''}</span>;
          })}
        </div>
      </div>
    );
  };

  const renderAnswerCells = () => resultDigits.map((digit, index) => (
    <span key={index} className="flex h-14 items-center justify-center">
      {problem?.hidden.includes(index) ? (
        <input
          aria-label={`Angka hasil posisi ${PLACE_NAMES[resultDigits.length - index - 1] || index + 1}`}
          inputMode="numeric"
          maxLength={1}
          value={answers[index] ?? ''}
          disabled={feedback === 'correct'}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, '').slice(-1);
            setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer));
            setMessage('');
          }}
          className={`h-11 w-10 rounded-lg border-2 text-center text-2xl outline-none focus:ring-2 focus:ring-teal-400 ${
            feedback === 'correct'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : feedback === 'wrong' && answers[index] !== String(digit)
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : 'border-indigo-300 bg-white text-indigo-900'
          }`}
        />
      ) : <span className="text-slate-800">{digit}</span>}
    </span>
  ));

  return (
    <section className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-4 shadow-sm sm:p-7">
      <header className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Laboratorium Numerasi</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Game Hitung Bersusun</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Pilih operasi dan banyak digit. Pelajari contoh, lalu lengkapi angka yang hilang sambil mengikuti langkah bersusun pendek.
        </p>
      </header>

      {phase === 'setup' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">1. Pilih operasi hitung</h3>
              <div className="grid grid-cols-2 gap-2">
                {OPERATIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedOperation(item.id)}
                    aria-pressed={operation === item.id}
                    className={`rounded-xl border-2 px-3 py-3 text-left font-bold transition ${
                      operation === item.id ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                    }`}
                  >
                    <span className="mr-2 text-xl">{item.symbol}</span>{item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">2. Tentukan banyak digit</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: operation === 'division' ? 'Digit bilangan yang dibagi' : 'Digit bilangan pertama', value: firstDigits, change: setFirstDigits },
                  { label: operation === 'division' ? 'Digit bilangan pembagi' : 'Digit bilangan kedua', value: secondDigits, change: setSecondDigits },
                ].map((item) => (
                  <label key={item.label} className="text-xs font-semibold text-slate-600">
                    {item.label}
                    <select
                      value={item.value}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        item.change(value);
                        if (item.label === 'Digit bilangan pertama' || item.label === 'Digit bilangan yang dibagi') {
                          if ((operation === 'subtraction' || operation === 'division') && secondDigits > value) {
                            setSecondDigits(value);
                          }
                        }
                      }}
                      className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {[1, 2, 3, 4].map((digits) => (
                        <option
                          key={digits}
                          value={digits}
                          disabled={
                            item.label === 'Digit bilangan kedua' || item.label === 'Digit bilangan pembagi'
                              ? (operation === 'subtraction' || operation === 'division') && digits > firstDigits
                              : false
                          }
                        >
                          {digits} digit
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {operation === 'division' && (
                <p className="mt-2 text-xs text-slate-500">Soal pembagian dibuat dengan hasil bilangan bulat agar mudah dikerjakan bersusun.</p>
              )}
              <p className="mt-2 text-xs font-semibold text-teal-800">
                Bentuk soal: {firstDigits} digit {selectedOperation.symbol} {secondDigits} digit
              </p>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-xl bg-teal-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99]"
            >
              Mulai Latihan →
            </button>
          </div>

          <aside className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold text-indigo-900">Cara mengerjakan bersusun pendek</h3>
            <p className="mt-1 text-xs text-slate-500">
              Contoh {firstDigits} digit {selectedOperation.symbol} {secondDigits} digit:
            </p>
            <div className="my-4 flex justify-center rounded-xl bg-indigo-50 p-4">
              {operation === 'division' ? (
                <div className="font-mono">
                  <div className="grid" style={{ gridTemplateColumns: `2.5rem 1.25rem repeat(${String(example.first).length}, minmax(1.5rem, 1fr))` }}>
                    <span className="col-span-2" />
                    {String(example.answer).padStart(String(example.first).length, ' ').split('').map((digit, index) => (
                      <span key={`quotient-${index}`} className="flex h-8 items-center justify-center text-xl font-black text-teal-800">{digit.trim()}</span>
                    ))}
                    <span className="col-span-2 flex items-center justify-center text-lg font-black text-indigo-900">{example.second}</span>
                    <div
                      className="grid border-l-2 border-t-2 border-indigo-800 pl-1"
                      style={{ gridColumn: `span ${String(example.first).length}`, gridTemplateColumns: `repeat(${String(example.first).length}, minmax(1.5rem, 1fr))` }}
                    >
                      {String(example.first).split('').map((digit, index) => (
                        <span key={`dividend-${index}`} className="flex h-9 items-center justify-center text-xl font-black text-indigo-950">{digit}</span>
                      ))}
                    </div>
                    {example.divisionWorkRows.map((row, rowIndex) => {
                      const digits = row.value.split('');
                      const startIndex = Math.max(0, row.endIndex + 1 - digits.length);
                      return (
                        <React.Fragment key={`division-work-${rowIndex}`}>
                          <span />
                          <span className="flex h-7 items-center justify-center text-sm font-bold text-slate-600">
                            {row.negative ? '−' : ''}
                          </span>
                          {Array.from({ length: String(example.first).length }, (_, column) => {
                            const digit = digits[column - startIndex];
                            return (
                              <span key={column} className="flex h-7 items-center justify-center text-sm font-bold text-slate-600">
                                {digit ?? ''}
                              </span>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  className="grid font-mono"
                  style={{ gridTemplateColumns: `2rem repeat(${example.columnCount}, minmax(1.5rem, 1fr))` }}
                >
                  <span />
                  {example.markers.map((marker, index) => (
                    <span key={`marker-${index}`} className="flex h-7 items-end justify-center whitespace-nowrap text-[9px] font-bold text-rose-700">
                      {marker}
                    </span>
                  ))}
                  <span />
                  {String(example.first).padStart(example.columnCount, ' ').split('').map((digit, index) => (
                    <span key={`first-${index}`} className="flex h-9 items-center justify-center text-xl font-black text-indigo-950 sm:text-2xl">
                      {digit.trim()}
                    </span>
                  ))}
                  <span className="flex h-9 items-center justify-center text-xl font-black text-teal-800">{selectedOperation.symbol}</span>
                  {String(example.second).padStart(example.columnCount, ' ').split('').map((digit, index) => (
                    <span key={`second-${index}`} className="flex h-9 items-center justify-center text-xl font-black text-indigo-950 sm:text-2xl">
                      {digit.trim()}
                    </span>
                  ))}
                  {operation === 'multiplication' && example.partialProducts.map((partial, index) => (
                    <React.Fragment key={`partial-${index}`}>
                      <span />
                      {String(partial).padStart(example.columnCount, ' ').split('').map((digit, digitIndex) => (
                        <span key={digitIndex} className="flex h-8 items-center justify-center text-lg font-bold text-slate-600">
                          {digit.trim()}
                        </span>
                      ))}
                    </React.Fragment>
                  ))}
                  <span className="border-t-2 border-indigo-800" />
                  <span
                    className="border-t-2 border-indigo-800"
                    style={{ gridColumn: `span ${example.columnCount}` }}
                  />
                  <span />
                  {String(example.answer).padStart(example.columnCount, ' ').split('').map((digit, index) => (
                    <span key={`answer-${index}`} className="flex h-9 items-center justify-center text-xl font-black text-teal-800 sm:text-2xl">
                      {digit.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {example.markers.some(Boolean) && (
              <p className="-mt-2 mb-3 text-center text-[10px] font-semibold text-rose-700">
                Catatan merah di atas angka menunjukkan simpanan atau angka yang dipinjam.
              </p>
            )}
            <ol className="space-y-2">
              {example.steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-black text-indigo-800">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {operation === 'division'
                ? 'Kerjakan pembagian dari angka paling kiri. Turunkan angka berikutnya setelah setiap langkah.'
                : operation === 'subtraction'
                  ? 'Mulai dari kolom paling kanan. Jika angka atas belum cukup, pinjam dari nilai tempat di sebelah kiri.'
                  : 'Mulai dari kolom paling kanan. Perhatikan angka simpanan jika hasil satu kolom mencapai sepuluh.'}
            </p>
          </aside>
        </div>
      )}

      {phase === 'playing' && problem && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-900">
                Soal {round} dari {ROUND_COUNT} · {selectedOperation.label}
              </span>
              <span className="text-sm font-black text-amber-700">⭐ {score} benar</span>
            </div>
            <p className="mb-4 text-center text-sm font-semibold text-slate-600">Isi angka yang hilang pada hasil hitungan.</p>
            <div className="mx-auto max-w-sm rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
              {problem.operation === 'division' ? (
                <div className="mx-auto w-fit font-mono">
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `3rem 1.25rem repeat(${String(problem.first).length}, minmax(2rem, 1fr))` }}
                  >
                    <span className="col-span-2" />
                    {Array.from({ length: String(problem.first).length - resultDigits.length }, (_, index) => (
                      <span key={`quotient-space-${index}`} />
                    ))}
                    {renderAnswerCells().map((cell, index) => React.cloneElement(cell, { key: `division-answer-${index}`, className: 'flex h-14 items-center justify-center' }))}
                    <span className="col-span-2 flex items-center justify-center text-xl font-black text-slate-800">{problem.second}</span>
                    <div
                      className="grid border-l-2 border-t-2 border-slate-700 pl-1"
                      style={{ gridColumn: `span ${String(problem.first).length}`, gridTemplateColumns: `repeat(${String(problem.first).length}, minmax(2rem, 1fr))` }}
                    >
                      {String(problem.first).split('').map((digit, index) => (
                        <span key={`dividend-${index}`} className="flex h-12 items-center justify-center text-2xl font-black text-slate-800">{digit}</span>
                      ))}
                    </div>
                    <span className="col-span-2" />
                    <div className="border-b-2 border-dashed border-slate-300" style={{ gridColumn: `span ${String(problem.first).length}` }} />
                    <span className="col-span-2" />
                    <div className="border-b-2 border-dashed border-slate-300" style={{ gridColumn: `span ${String(problem.first).length}` }} />
                    <span className="col-span-2" />
                    <div className="border-b-2 border-dashed border-slate-300" style={{ gridColumn: `span ${String(problem.first).length}` }} />
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-500">Kerjakan porogapit dari kiri ke kanan, lalu turunkan angka berikutnya.</p>
                </div>
              ) : (
                <>
                  {numberRow(problem.first, 'text-slate-800')}
                  <div className="flex items-center justify-end gap-2 border-b-2 border-slate-700">
                    <span className="w-7 text-center text-2xl font-black text-teal-800">{selectedOperation.symbol}</span>
                    {numberRow(problem.second, 'text-slate-800')}
                  </div>
                  {problem.operation === 'multiplication' && String(problem.second).split('').reverse().map((digit, index) => {
                    const multiplierPlace = PLACE_NAMES[index] ?? `nilai tempat ke-${index + 1}`;
                    const partialLength = Math.min(maxDigits, String(problem.first * Number(digit)).length + index);
                    return (
                      <div key={`partial-work-${index}`} className="mt-2">
                        <p className="text-right text-[10px] font-semibold text-slate-500">Hasil kali {multiplierPlace} ({digit})</p>
                        <div className="flex justify-end">
                          <div className="grid" style={{ gridTemplateColumns: `repeat(${maxDigits}, minmax(2.25rem, 1fr))` }}>
                            {Array.from({ length: maxDigits - partialLength }, (_, blankIndex) => <span key={`blank-${blankIndex}`} />)}
                            {Array.from({ length: partialLength }, (_, digitIndex) => (
                              <span key={digitIndex} className="m-1 h-9 rounded-md border border-dashed border-slate-300 bg-white/70" />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {problem.operation === 'multiplication' ? (
                    <div className="mt-2 flex justify-end border-t-2 border-slate-700">
                      <div className="grid font-mono text-3xl font-black sm:text-4xl" style={{ gridTemplateColumns: `repeat(${maxDigits}, minmax(2.25rem, 1fr))` }}>
                        {renderAnswerCells()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="grid font-mono text-3xl font-black sm:text-4xl" style={{ gridTemplateColumns: `repeat(${maxDigits}, minmax(2.25rem, 1fr))` }}>
                        {renderAnswerCells()}
                      </div>
                    </div>
                  )}
                </>
              )}
              {problem.operation === 'division' && (
                <p className="mt-3 text-center text-xs text-slate-500">Pembagian tepat, tanpa sisa.</p>
              )}
            </div>

            {message && (
              <p role="status" className={`mt-4 rounded-xl px-3 py-2 text-center text-sm font-bold ${
                feedback === 'correct' ? 'bg-emerald-50 text-emerald-800' : feedback === 'wrong' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
              }`}>{message}</p>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {feedback !== 'correct' ? (
                <button type="button" onClick={checkAnswer} className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800">
                  Periksa Jawaban
                </button>
              ) : (
                <button type="button" onClick={showNext} className="rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">
                  {round === ROUND_COUNT ? 'Lihat Hasil' : 'Soal Berikutnya →'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setPhase('setup');
                  setFeedback(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Ganti Latihan
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-amber-100 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-amber-900">Bantuan bersusun pendek</h3>
                <p className="mt-1 text-xs text-slate-500">Kerjakan kolom demi kolom dari kanan.</p>
              </div>
              <span className="text-xl">💡</span>
            </div>
            <ol className="mt-4 space-y-2">
              {problem.steps.map((step, index) => (
                <li key={`${step.place}-${index}`} className="flex gap-3 rounded-xl bg-amber-50/70 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-black text-amber-900">{index + 1}</span>
                  <div>
                    <p className="text-xs font-bold capitalize text-slate-800">{step.place}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{step.extra}</p>
                  </div>
                </li>
              ))}
            </ol>
            {feedback === 'correct' && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-800">
                Hasil lengkap: {problem.answer}
              </div>
            )}
          </aside>
        </div>
      )}

      {phase === 'finished' && (
        <div className="mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="text-5xl">🎉</div>
          <h3 className="mt-3 text-2xl font-black text-slate-900">Latihan Selesai!</h3>
          <p className="mt-2 text-slate-600">Kamu menjawab benar {score} dari {ROUND_COUNT} soal {selectedOperation.label.toLowerCase()}.</p>
          <button type="button" onClick={startGame} className="mt-5 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800">
            Main Lagi
          </button>
          <button type="button" onClick={() => setPhase('setup')} className="ml-2 mt-5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Pilih Latihan Lain
          </button>
        </div>
      )}
    </section>
  );
};
