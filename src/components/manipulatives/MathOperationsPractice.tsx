import React, { useMemo, useState } from 'react';
import { soundFx } from '../../utils/audio';

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
type GamePhase = 'setup' | 'playing' | 'finished';
type DigitSlot = { place: string; extra: string };
type DivisionStep = { partial: string; quotientDigit: number; product: number; remainder: number; endIndex: number };
type BorrowAdjustment = { column: number; original: number; adjusted: number; change: string };
type CarryAdjustment = { column: number; value: number };
type MultiplicationPartial = { digits: string };

const OPERATIONS: { id: Operation; label: string; symbol: string }[] = [
  { id: 'addition', label: 'Penjumlahan', symbol: '+' },
  { id: 'subtraction', label: 'Pengurangan', symbol: '−' },
  { id: 'multiplication', label: 'Perkalian', symbol: '×' },
  { id: 'division', label: 'Pembagian', symbol: '÷' },
];
const PLACE_NAMES = ['satuan', 'puluhan', 'ratusan', 'ribuan', 'puluh ribuan', 'ratus ribuan', 'jutaan', 'puluh jutaan'];
const ROUND_COUNT = 10;
const DIGIT_CELL_CLASS = 'h-8 w-8 border border-sky-200 bg-white align-middle';

interface Problem {
  first: number;
  second: number;
  answer: number;
  operation: Operation;
  hidden: number[];
  hiddenPartialCells: string[];
  borrowAdjustments: BorrowAdjustment[];
  carryAdjustments: CarryAdjustment[];
  divisionSteps: DivisionStep[];
  steps: DigitSlot[];
}

const randomInteger = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomNDigitNumber = (digits: number) =>
  randomInteger(10 ** (digits - 1), 10 ** digits - 1);

function createProblem(operation: Operation, firstDigits: number, secondDigits: number, includeCarryOrBorrow: boolean): Problem {
  let first: number;
  let second: number;
  let answer: number;

  if (operation === 'addition') {
    let attempts = 0;
    do {
      first = randomNDigitNumber(firstDigits);
      second = randomNDigitNumber(secondDigits);
      attempts++;
    } while (hasAdditionCarry(first, second) !== includeCarryOrBorrow && attempts < 100);
    if (hasAdditionCarry(first, second) !== includeCarryOrBorrow) {
      first = Number('1'.repeat(firstDigits));
      second = Number((includeCarryOrBorrow ? '9' : '2').repeat(secondDigits));
    }
    answer = first + second;
  } else if (operation === 'subtraction') {
    let attempts = 0;
    do {
      first = randomNDigitNumber(firstDigits);
      second = randomNDigitNumber(secondDigits);
      if (first < second) [first, second] = [second, first];
      attempts++;
    } while (hasSubtractionBorrow(first, second) !== includeCarryOrBorrow && attempts < 100);
    if (hasSubtractionBorrow(first, second) !== includeCarryOrBorrow) {
      if (includeCarryOrBorrow && firstDigits > 1) {
        first = 2 * 10 ** (firstDigits - 1);
        second = secondDigits < firstDigits
          ? Number('1'.repeat(secondDigits))
          : first - 9;
      } else {
        first = Number('8'.repeat(firstDigits));
        second = Number('1'.repeat(secondDigits));
      }
    }
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
  const borrowAdjustments = operation === 'subtraction' ? getBorrowAdjustments(first, second) : [];
  const carryAdjustments = operation === 'addition' ? getAdditionCarries(first, second, Math.max(String(first).length, String(second).length, String(answer).length)) : [];
  const divisionSteps = operation === 'division' ? getDivisionSteps(first, second) : [];
  const answerLength = String(answer).length;
  const hiddenCount = operation === 'division' ? answerLength : Math.min(answerLength, Math.max(1, Math.ceil(answerLength / 2)));
  const hidden = new Set<number>();
  if (operation === 'division') {
    for (let index = 0; index < answerLength; index++) hidden.add(index);
  } else {
    while (hidden.size < hiddenCount) hidden.add(randomInteger(0, answerLength - 1));
  }

  const hiddenPartialCells = operation === 'multiplication'
    ? getMultiplicationPartials(first, second).flatMap(({ digits }, rowIndex) => {
      const columnCount = Math.max(String(first).length, String(second).length, String(answer).length);
      const startColumn = columnCount - digits.length;
      const candidateColumns = Array.from({ length: digits.length }, (_, digitIndex) => startColumn + digitIndex);
      const hideCount = Math.max(1, Math.floor(digits.length / 2));
      const selectedColumns = new Set<number>();
      while (selectedColumns.size < hideCount) {
        selectedColumns.add(candidateColumns[randomInteger(0, candidateColumns.length - 1)]);
      }
      return [...selectedColumns].map((column) => `${rowIndex}-${column}`);
    })
    : [];

  return { first, second, answer, operation, hidden: [...hidden], hiddenPartialCells, borrowAdjustments, carryAdjustments, divisionSteps, steps };
}

function hasAdditionCarry(first: number, second: number): boolean {
  const a = String(first).split('').reverse().map(Number);
  const b = String(second).split('').reverse().map(Number);
  let carry = 0;
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const total = (a[index] ?? 0) + (b[index] ?? 0) + carry;
    carry = Math.floor(total / 10);
    if (carry) return true;
  }
  return false;
}

function hasSubtractionBorrow(first: number, second: number): boolean {
  const a = String(first).split('').reverse().map(Number);
  const b = String(second).split('').reverse().map(Number);
  return a.some((digit, index) => digit < (b[index] ?? 0));
}

function getAdditionCarries(first: number, second: number, columnCount: number): CarryAdjustment[] {
  const a = String(first).split('').reverse().map(Number);
  const b = String(second).split('').reverse().map(Number);
  let carry = 0;
  const carries: CarryAdjustment[] = [];
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const total = (a[index] ?? 0) + (b[index] ?? 0) + carry;
    carry = Math.floor(total / 10);
    if (carry) {
      const column = columnCount - index - 2;
      if (column >= 0) carries.push({ column, value: carry });
    }
  }
  return carries;
}

function getDivisionSteps(dividend: number, divisor: number): DivisionStep[] {
  let remainder = 0;
  const steps: DivisionStep[] = [];

  String(dividend).split('').forEach((digit, index) => {
    const partial = remainder * 10 + Number(digit);
    const quotientDigit = Math.floor(partial / divisor);
    const partialText = index > 0 && remainder === 0 ? `0${digit}` : String(partial);
    const product = quotientDigit * divisor;
    remainder = partial - product;
    steps.push({ partial: partialText, quotientDigit, product, remainder, endIndex: index });
  });
  return steps;
}

function getMultiplicationPartials(first: number, second: number): MultiplicationPartial[] {
  return String(second).split('').reverse().map((digit, shift) => ({
    digits: `${first * Number(digit)}${'0'.repeat(shift)}`,
  }));
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

function getBorrowAdjustments(first: number, second: number): BorrowAdjustment[] {
  const originalDigits = String(first).split('').reverse().map(Number);
  const adjustedDigits = [...originalDigits];
  const subtrahendDigits = String(second).split('').reverse().map(Number);
  const changes = Array<string>(originalDigits.length).fill('');

  for (let index = 0; index < adjustedDigits.length; index++) {
    if (adjustedDigits[index] >= (subtrahendDigits[index] ?? 0)) continue;

    let donorIndex = index + 1;
    while (donorIndex < adjustedDigits.length && adjustedDigits[donorIndex] === 0) donorIndex++;
    if (donorIndex >= adjustedDigits.length) continue;

    adjustedDigits[donorIndex]--;
    changes[donorIndex] = '−1';
    for (let borrowedColumn = donorIndex - 1; borrowedColumn > index; borrowedColumn--) {
      adjustedDigits[borrowedColumn] = 9;
      changes[borrowedColumn] = '+9';
    }
    adjustedDigits[index] += 10;
    changes[index] = '+10';
  }

  return adjustedDigits.flatMap((adjusted, digitIndex) => (
    adjusted !== originalDigits[digitIndex]
      ? [{
        column: digitIndex,
        original: originalDigits[digitIndex],
        adjusted,
        change: changes[digitIndex],
      }]
      : []
  ));
}

function getBorrowAnnotations(first: number, second: number, columnCount: number): string[] {
  const annotations = Array<string>(columnCount).fill('');
  getBorrowAdjustments(first, second).forEach(({ column, original, adjusted, change }) => {
    const alignedColumn = columnCount - String(first).length + column;
    annotations[alignedColumn] = `${change}: ${original} → ${adjusted}`;
  });
  return annotations;
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
    first = repeatedDigit(8, firstDigits);
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
  const divisionSteps = operation === 'division' ? getDivisionSteps(first, second) : [];
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
    const borrowing = getBorrowAnnotations(first, second, columnCount);
    borrowing.forEach((annotation, index) => {
      if (annotation) markers[index] = annotation;
    });
    for (let index = 0; index < firstDigits.length; index++) {
      const a = firstDigits[index] ?? 0;
      const b = secondDigits[index] ?? 0;
      const annotation = borrowing[columnCount - index - 1];
      const adjusted = annotation ? Number(annotation.split(' → ')[1]) : a;
      steps.push(
        `${PLACE_NAMES[index]}: ${annotation ? `setelah proses pinjam, angka ${a} menjadi ${adjusted}. ` : ''}${adjusted} − ${b} = ${adjusted - b}.`,
      );
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
    getDivisionSteps(first, second).forEach((step, index) => {
      steps.push(
        `${PLACE_NAMES[String(first).length - index - 1]}: bagi ${step.partial} dengan ${second}, tulis ${step.quotientDigit} pada hasil. Kurangi ${step.product}${index < String(first).length - 1 ? `, lalu turunkan angka ${String(first)[index + 1]}` : `; sisanya ${step.remainder}`}.`,
      );
    });
  }
  return { first, second, answer, markers, steps, columnCount, partialProducts, divisionSteps };
}

export const MathOperationsPractice: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [operation, setOperation] = useState<Operation>('addition');
  const [firstDigits, setFirstDigits] = useState(3);
  const [secondDigits, setSecondDigits] = useState(2);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [borrowAnswers, setBorrowAnswers] = useState<Record<number, string>>({});
  const [carryAnswers, setCarryAnswers] = useState<Record<number, string>>({});
  const [multiplicationAnswers, setMultiplicationAnswers] = useState<Record<string, string>>({});
  const [divisionAnswers, setDivisionAnswers] = useState<Record<string, string>>({});
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [message, setMessage] = useState('');
  const example = useMemo(() => getExample(operation, firstDigits, secondDigits), [operation, firstDigits, secondDigits]);
  const resultDigits = problem ? String(problem.answer).split('') : [];
  const maxDigits = problem ? Math.max(String(problem.first).length, String(problem.second).length, resultDigits.length) : 0;
  const selectedOperation = OPERATIONS.find((option) => option.id === operation)!;

  const beginRound = (nextRound: number, nextScore = score) => {
    const includeCarryOrBorrow = nextRound % 2 === 0 && (operation !== 'subtraction' || firstDigits > 1);
    const nextProblem = createProblem(operation, firstDigits, secondDigits, includeCarryOrBorrow);
    setProblem(nextProblem);
    setAnswers(Array(String(nextProblem.answer).length).fill(''));
    setBorrowAnswers({});
    setCarryAnswers({});
    setMultiplicationAnswers({});
    setDivisionAnswers({});
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
    if (!problem || (problem.operation !== 'division' && answers.some((answer, index) => problem.hidden.includes(index) && !/^\d$/.test(answer)))) {
      setMessage('Isi semua angka hasil yang kosong dengan satu angka.');
      return;
    }
    if (problem?.borrowAdjustments.some(({ column }) => !/^\d{1,2}$/.test(borrowAnswers[column] ?? ''))) {
      setMessage('Isi juga semua angka baru setelah meminjam.');
      return;
    }
    if (problem?.carryAdjustments.some(({ column }) => !/^\d$/.test(carryAnswers[column] ?? ''))) {
      setMessage('Isi juga angka simpanan di atas kolom berikutnya.');
      return;
    }
    if (problem?.divisionSteps.some((step, index) => {
      const product = String(step.product);
      return !/^\d$/.test(divisionAnswers[`${index}-quotient`] ?? '')
        || product.split('').some((_, digitIndex) => !/^\d$/.test(divisionAnswers[`${index}-product-${digitIndex}`] ?? ''))
        || (index === problem.divisionSteps.length - 1 && !/^\d$/.test(divisionAnswers[`${index}-remainder-0`] ?? ''));
    })) {
      setMessage('Lengkapi hasil bagi, hasil perkalian, dan sisa pada setiap langkah porogapit.');
      return;
    }
    if (problem?.hiddenPartialCells.some((key) => !/^\d$/.test(multiplicationAnswers[key] ?? ''))) {
      setMessage('Isi semua angka hasil perkalian parsial yang kosong.');
      return;
    }
    const divisionQuotient = problem.divisionSteps.map((_, index) => divisionAnswers[`${index}-quotient`] ?? '').join('');
    const multiplicationPartials = problem.operation === 'multiplication'
      ? getMultiplicationPartials(problem.first, problem.second)
      : [];
    const correct = (problem.operation === 'division'
      ? Number(divisionQuotient) === problem.answer
      : problem.hidden.every((index) => Number(answers[index]) === Number(resultDigits[index])))
      && problem.hiddenPartialCells.every((key) => {
        const [rowIndex, column] = key.split('-').map(Number);
        const digits = multiplicationPartials[rowIndex]?.digits ?? '';
        return multiplicationAnswers[key] === digits[column - (maxDigits - digits.length)];
      })
      && problem.borrowAdjustments.every(({ column, adjusted }) => Number(borrowAnswers[column]) === adjusted)
      && problem.carryAdjustments.every(({ column, value }) => Number(carryAnswers[column]) === value)
      && problem.divisionSteps.every((step, index) => (
        divisionAnswers[`${index}-quotient`] === String(step.quotientDigit)
        && String(step.product).split('').every((digit, digitIndex) => divisionAnswers[`${index}-product-${digitIndex}`] === digit)
        && (index !== problem.divisionSteps.length - 1 || String(step.remainder).split('').every((digit, digitIndex) => divisionAnswers[`${index}-remainder-${digitIndex}`] === digit))
      ));
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

  const numberRow = (
    value: number,
    colorClass: string,
    operator = '',
    annotations: string[] = [],
    borrowAdjustments: BorrowAdjustment[] = [],
    carryAdjustments: CarryAdjustment[] = [],
    underlineDigits = false,
  ) => {
    const digits = String(value).split('');
    return (
      <>
        {(annotations.some(Boolean) || borrowAdjustments.length > 0 || carryAdjustments.length > 0) && (
          <tr>
            {Array.from({ length: maxDigits }, (_, column) => {
            const digitIndex = column - (maxDigits - digits.length);
            const annotation = annotations[column];
            const placeIndex = digitIndex >= 0 ? digits.length - digitIndex - 1 : -1;
            const adjustment = borrowAdjustments.find((item) => item.column === placeIndex);
            const carry = carryAdjustments.find((item) => item.column === column);
            return (
              <td
                key={`annotation-${column}`}
                title={adjustment ? `Angka ${adjustment.original} setelah meminjam` : carry ? 'Angka simpanan untuk kolom berikutnya' : annotation ? `Setelah meminjam: ${annotation}` : undefined}
                className={`h-8 w-8 whitespace-nowrap text-center align-bottom text-[8px] font-black ${adjustment || carry || annotation ? 'text-rose-700' : 'text-transparent'}`}
              >
                {carry ? (
                  <input
                    aria-label={`Angka simpanan kolom ${PLACE_NAMES[maxDigits - column - 1] ?? column + 1}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={carryAnswers[carry.column] ?? ''}
                    disabled={feedback === 'correct'}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '').slice(0, 1);
                      setCarryAnswers((current) => ({ ...current, [carry.column]: value }));
                      setMessage('');
                    }}
                    className={`h-5 w-5 border-b text-center text-[10px] outline-none focus:ring-1 focus:ring-rose-400 ${
                      feedback === 'correct'
                        ? 'border-emerald-500 text-emerald-800'
                        : feedback === 'wrong' && Number(carryAnswers[carry.column]) !== carry.value
                          ? 'border-rose-500 text-rose-800'
                          : 'border-rose-400 text-rose-800'
                    }`}
                  />
                ) : digitIndex >= 0 && adjustment ? (
                  <div className="flex items-center justify-center gap-px text-[8px]">
                    <div>{adjustment.original}→</div>
                    <input
                      aria-label={`Angka ${PLACE_NAMES[digits.length - digitIndex - 1]} setelah meminjam`}
                      inputMode="numeric"
                      maxLength={2}
                      value={borrowAnswers[adjustment.column] ?? ''}
                      disabled={feedback === 'correct'}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, '').slice(0, 2);
                        setBorrowAnswers((current) => ({ ...current, [adjustment.column]: value }));
                        setMessage('');
                      }}
                      className={`h-5 w-5 border-b text-center text-[10px] outline-none focus:ring-1 focus:ring-rose-400 ${
                        feedback === 'correct'
                          ? 'border-emerald-500 text-emerald-800'
                          : feedback === 'wrong' && Number(borrowAnswers[adjustment.column]) !== adjustment.adjusted
                            ? 'border-rose-500 text-rose-800'
                            : 'border-rose-400 text-rose-800'
                      }`}
                    />
                  </div>
                ) : digitIndex >= 0 && annotation && (
                  annotation.includes(': ')
                    ? <div><div className="text-[7px] leading-none">{annotation.split(': ')[0]}</div><div className="text-[9px] leading-none">{annotation.split(': ')[1]}</div></div>
                    : annotation
                )}
              </td>
            );
            })}
            <td className="h-8 w-8" />
          </tr>
        )}
        <tr>
          {Array.from({ length: maxDigits }, (_, column) => {
            const digit = digits[column - (maxDigits - digits.length)];
            const digitIndex = column - (maxDigits - digits.length);
            const placeIndex = digitIndex >= 0 ? digits.length - digitIndex - 1 : -1;
            const wasBorrowedFrom = borrowAdjustments.some((item) => item.column === placeIndex);
            return (
              <td
                key={`digit-${column}`}
                className={`${DIGIT_CELL_CLASS} font-mono text-right pr-2 text-2xl font-black sm:text-3xl ${colorClass} ${underlineDigits ? 'border-b-2 border-b-slate-700' : ''} ${wasBorrowedFrom ? 'text-slate-400 line-through decoration-rose-500 decoration-2' : ''}`}
              >
                {digit ?? ''}
              </td>
            );
          })}
          <td className={`${DIGIT_CELL_CLASS} text-center text-teal-800`}>{operator}</td>
        </tr>
      </>
    );
  };

  const renderAnswerCells = (borderTop = false, columnCount = maxDigits) => Array.from({ length: columnCount }, (_, column) => {
    const answerIndex = column - (columnCount - resultDigits.length);
    if (answerIndex < 0) return <td key={`empty-${column}`} className={`${DIGIT_CELL_CLASS} ${borderTop ? 'border-t-2 border-t-slate-700' : ''}`} />;
    const digit = resultDigits[answerIndex];
    return (
    <td key={column} className={`${DIGIT_CELL_CLASS} font-mono text-right pr-2 text-2xl font-black sm:text-3xl ${borderTop ? 'border-t-2 border-t-slate-700' : ''}`}>
      {problem?.hidden.includes(answerIndex) ? (
        <input
          aria-label={`Angka hasil posisi ${PLACE_NAMES[resultDigits.length - answerIndex - 1] || answerIndex + 1}`}
          inputMode="numeric"
          maxLength={1}
          value={answers[answerIndex] ?? ''}
          disabled={feedback === 'correct'}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, '').slice(-1);
            setAnswers((current) => current.map((answer, index) => index === answerIndex ? value : answer));
            setMessage('');
          }}
          className={`h-full w-full pr-2 text-right outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400 ${
            feedback === 'correct'
              ? 'border-b-2 border-emerald-500 text-emerald-800'
              : feedback === 'wrong' && answers[answerIndex] !== String(digit)
                ? 'border-b-2 border-rose-400 text-rose-800'
                : 'border-b-2 border-indigo-400 text-indigo-900'
          }`}
        />
      ) : <div className="pr-2 text-right text-slate-800">{digit}</div>}
    </td>
    );
  });

  const renderExampleRow = (
    value: number,
    prefix = '',
    options: { underline?: boolean; highlightFromRight?: number; borrowAdjustments?: BorrowAdjustment[] } = {},
  ) => {
    const digits = String(value).padStart(example.columnCount, ' ').split('');
    return (
      <>
        {options.borrowAdjustments && (
          <table className="ml-auto table-fixed border-collapse font-mono">
            <tbody><tr>
            {digits.map((digit, index) => {
              const place = example.columnCount - index - 1;
              const adjustment = options.borrowAdjustments?.find((item) => item.column === place);
              return (
                <td key={index} className="h-8 w-8 whitespace-nowrap text-center align-bottom text-[8px] font-bold text-rose-700">
                  {adjustment && <><div>{adjustment.original}→</div><div>{adjustment.adjusted}</div></>}
                  {!adjustment && digit.trim() && <div className="text-transparent">0</div>}
                </td>
              );
            })}
            <td className="h-8 w-8" />
            </tr></tbody>
          </table>
        )}
        <table className="ml-auto table-fixed border-collapse font-mono">
          <tbody><tr>
          {digits.map((digit, index) => {
            const place = example.columnCount - index - 1;
            const wasBorrowedFrom = options.borrowAdjustments?.some((item) => item.column === place);
            return (
              <td
                key={index}
                className={`${DIGIT_CELL_CLASS} pr-2 text-right text-lg font-black text-indigo-950 ${
                  options.underline ? 'border-b-2 border-indigo-800' : ''
                } ${
                  options.highlightFromRight === place ? 'rounded bg-amber-200 text-amber-950' : ''
                } ${wasBorrowedFrom ? 'text-slate-400 line-through decoration-rose-500 decoration-2' : ''}`}
              >
                {digit.trim()}
              </td>
            );
          })}
          <td className={`${DIGIT_CELL_CLASS} text-center text-lg font-bold text-indigo-800`}>{prefix}</td>
          </tr></tbody>
        </table>
      </>
    );
  };

  const renderExampleAnswer = () => (
    <table className="ml-auto table-fixed border-collapse font-mono">
      <tbody><tr>
      {String(example.answer).padStart(example.columnCount, ' ').split('').map((digit, index) => (
        <td key={index} className={`${DIGIT_CELL_CLASS} border-t-2 border-indigo-800 pr-2 text-right text-lg font-black text-teal-800`}>
          {digit.trim()}
        </td>
      ))}
      <td className={`${DIGIT_CELL_CLASS} border-t-2 border-indigo-800`} />
      </tr></tbody>
    </table>
  );

  const renderExampleSubtraction = () => {
    const digits = String(example.first).padStart(example.columnCount, ' ').split('');
    const adjustments = getBorrowAdjustments(example.first, example.second);
    const subtrahend = String(example.second).padStart(example.columnCount, ' ').split('');
    const answer = String(example.answer).padStart(example.columnCount, ' ').split('');

    return (
      <table className="ml-auto table-fixed border-collapse font-mono">
        <tbody>
          {adjustments.length > 0 && (
            <tr>
              <td className="h-8 w-8" />
              {digits.map((digit, index) => {
                const place = example.columnCount - index - 1;
                const adjustment = adjustments.find((item) => item.column === place);
                return (
                  <td key={index} className="h-8 w-8 pr-2 text-right align-bottom text-xs font-bold text-rose-700">
                    {adjustment?.adjusted}
                  </td>
                );
              })}
            </tr>
          )}
          <tr>
            <td className="h-8 w-8" />
            {digits.map((digit, index) => {
              const place = example.columnCount - index - 1;
              const wasAdjusted = adjustments.some((item) => item.column === place);
              return (
                <td
                  key={index}
                  className={`${DIGIT_CELL_CLASS} pr-2 text-right text-lg font-black text-indigo-950 ${wasAdjusted ? 'text-slate-400 line-through decoration-rose-500 decoration-2' : ''}`}
                >
                  {digit.trim()}
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="h-8 w-8 border-b-2 border-indigo-800 text-center text-lg font-bold text-indigo-800">−</td>
            {subtrahend.map((digit, index) => (
              <td key={index} className={`${DIGIT_CELL_CLASS} border-b-2 border-indigo-800 pr-2 text-right text-lg font-black text-indigo-950`}>
                {digit.trim()}
              </td>
            ))}
          </tr>
          <tr>
            <td className="h-8 w-8 border-t-2 border-indigo-800" />
            {answer.map((digit, index) => (
              <td key={index} className={`${DIGIT_CELL_CLASS} border-t-2 border-indigo-800 pr-2 text-right text-lg font-black text-teal-800`}>
                {digit.trim()}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  };

  const renderPlaceHeader = (columnCount: number) => (
    <table className="ml-auto table-fixed border-collapse font-sans text-[9px] font-semibold text-slate-500">
      <tbody><tr>
      {Array.from({ length: columnCount }, (_, column) => {
        const placeIndex = columnCount - column - 1;
        return (
          <td key={column} className="h-5 w-8 text-center">
            {PLACE_NAMES[placeIndex] ?? `10^${placeIndex}`}
          </td>
        );
      })}
      <td className="h-5 w-8" />
      </tr></tbody>
    </table>
  );

  const renderExampleDivisionWork = () => {
    const width = String(example.first).length;
    const dividend = String(example.first);
    const quotientDigits = example.divisionSteps.map((step) => String(step.quotientDigit));
    const renderAlignedDigits = (value: string, endIndex: number, underline = false) => {
      const startIndex = endIndex + 1 - value.length;
      return Array.from({ length: width }, (_, column) => {
        const digit = value[column - startIndex];
        const underlined = underline && column >= startIndex && column <= endIndex;
        return (
          <td
            key={column}
            className={`h-8 w-8 pr-2 text-right text-sm font-bold text-slate-700 ${underlined ? 'border-b-2 border-slate-700' : ''}`}
          >
            {digit ?? ''}
          </td>
        );
      });
    };

    return (
      <table className="mx-auto table-fixed border-collapse font-mono">
        <tbody>
          <tr>
            <td className="h-8 w-8" />
            {quotientDigits.map((digit, index) => (
              <td key={index} className="h-8 w-8 border-b-2 border-indigo-800 pr-2 text-right text-lg font-black text-teal-800">
                {digit}
              </td>
            ))}
          </tr>
          <tr>
            <td className="h-8 w-8 border-r-2 border-indigo-800 text-center text-lg font-black text-indigo-900">
              {example.second}
            </td>
            {Array.from(dividend, (digit, index) => (
              <td key={index} className="h-8 w-8 pr-2 text-right text-lg font-black text-slate-800">
                {digit}
              </td>
            ))}
          </tr>
          {example.divisionSteps.map((step, index) => (
            <React.Fragment key={`long-division-step-${index}`}>
              <tr>
                <td className="h-8 w-8 text-center font-bold text-slate-600">−</td>
                {renderAlignedDigits(String(step.product), step.endIndex, true)}
              </tr>
              {index < example.divisionSteps.length - 1 ? (
                <tr>
                  <td className="h-8 w-8" />
                  {renderAlignedDigits(example.divisionSteps[index + 1].partial, example.divisionSteps[index + 1].endIndex)}
                </tr>
              ) : (
                <tr>
                  <td className="h-8 w-8" />
                  {renderAlignedDigits(String(step.remainder), step.endIndex)}
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

  const renderDivisionWork = () => {
    if (!problem) return null;
    const width = String(problem.first).length;
    const renderStepCells = (
      value: string,
      stepIndex: number,
      field: 'partial' | 'product' | 'remainder',
      underline = false,
    ) => {
      const digits = value.split('');
      const endIndex = problem.divisionSteps[stepIndex].endIndex;
      const startIndex = endIndex + 1 - digits.length;
      return Array.from({ length: width }, (_, column) => {
        const digitIndex = column - startIndex;
        const digit = digits[digitIndex];
        const hasDigit = digitIndex >= 0 && digitIndex < digits.length;
        const key = `${stepIndex}-${field}-${digitIndex}`;
        const cellClass = `h-8 w-8 pr-2 text-right font-mono text-sm font-bold ${underline && hasDigit ? 'border-b-2 border-slate-700' : ''}`;
        if (!hasDigit) return <td key={`${field}-blank-${column}`} className={cellClass} />;
        if (field === 'partial') {
          return <td key={key} className={`${cellClass} text-slate-700`}>{digit}</td>;
        }

        const valueEntered = divisionAnswers[key] ?? '';
        const expected = digit;
        return (
          <td key={key} className={`${cellClass} text-center`}>
            <input
              aria-label={`${field === 'product' ? 'Hasil perkalian' : 'Sisa'} langkah ${stepIndex + 1}, angka ${digitIndex + 1}`}
              inputMode="numeric"
              maxLength={1}
              value={valueEntered}
              disabled={feedback === 'correct'}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\D/g, '').slice(-1);
                setDivisionAnswers((current) => ({ ...current, [key]: nextValue }));
                setMessage('');
              }}
              className={`h-7 w-7 border-b-2 bg-transparent text-center font-mono text-sm font-bold outline-none focus:ring-1 focus:ring-teal-400 ${
                feedback === 'correct'
                  ? 'border-emerald-500 text-emerald-800'
                  : feedback === 'wrong' && valueEntered !== expected
                    ? 'border-rose-400 text-rose-800'
                    : 'border-indigo-400 text-indigo-900'
              }`}
            />
          </td>
        );
      });
    };

    return (
      <table className="mx-auto table-fixed border-collapse font-mono">
        <tbody>
          <tr>
            <td className="h-8 w-8" />
            {problem.divisionSteps.map((step, index) => {
              const key = `${index}-quotient`;
              const value = divisionAnswers[key] ?? '';
              return (
                <td key={key} className="h-8 w-8 border-b-2 border-indigo-800 text-center">
                  <input
                    aria-label={`Hasil bagi nilai tempat ${PLACE_NAMES[problem.divisionSteps.length - index - 1] ?? index + 1}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    disabled={feedback === 'correct'}
                    onChange={(event) => {
                      const nextValue = event.target.value.replace(/\D/g, '').slice(-1);
                      setDivisionAnswers((current) => ({ ...current, [key]: nextValue }));
                      setMessage('');
                    }}
                    className={`h-7 w-7 border-b-2 bg-transparent text-center text-lg font-black outline-none focus:ring-1 focus:ring-teal-400 ${
                      feedback === 'correct'
                        ? 'border-emerald-500 text-emerald-800'
                        : feedback === 'wrong' && value !== String(step.quotientDigit)
                          ? 'border-rose-400 text-rose-800'
                          : 'border-indigo-400 text-indigo-900'
                    }`}
                  />
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="h-9 w-8 border-r-2 border-slate-700 text-center text-xl font-black text-slate-800">{problem.second}</td>
            {String(problem.first).split('').map((digit, index) => (
              <td key={index} className="h-9 w-8 pr-2 text-right text-2xl font-black text-slate-800">{digit}</td>
            ))}
          </tr>
          {problem.divisionSteps.map((step, index) => (
            <React.Fragment key={`division-step-${index}`}>
              <tr>
                <td className="h-8 w-8 text-center font-bold text-slate-600">−</td>
                {renderStepCells(String(step.product), index, 'product', true)}
              </tr>
              {index < problem.divisionSteps.length - 1 ? (
                <tr>
                  <td className="h-8 w-8" />
                  {renderStepCells(problem.divisionSteps[index + 1].partial, index + 1, 'partial')}
                </tr>
              ) : (
                <tr>
                  <td className="h-8 w-8" />
                  {renderStepCells(String(step.remainder), index, 'remainder')}
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

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
            <div className="my-4 flex justify-center overflow-x-auto rounded-xl bg-indigo-50 p-4">
              <div className="font-mono">
                <p className="mb-2 text-center text-lg font-black text-teal-800">
                  {example.first} {selectedOperation.symbol} {example.second} = {example.answer}
                </p>
                <hr className="mb-2 border-indigo-200" />
                <p className="mb-2 text-center font-sans text-xs font-bold text-indigo-900">Penyelesaian</p>
              {operation === 'division' ? (
                <div>
                  {renderExampleDivisionWork()}
                </div>
              ) : (
                <div className="space-y-0">
                  {operation === 'addition' && renderPlaceHeader(example.columnCount)}
                  {operation === 'addition' && (
                    <table className="ml-auto table-fixed border-collapse">
                      <tbody><tr>
                      {example.markers.map((marker, index) => (
                        <td key={`marker-${index}`} title={marker || undefined} className="h-8 w-8 whitespace-nowrap text-center align-bottom text-[9px] font-bold text-rose-700">
                          {marker.includes(': ')
                            ? <><div>{marker.split(': ')[0]}</div><div>{marker.split(': ')[1]}</div></>
                            : marker.replace('simpan ', '')}
                        </td>
                      ))}
                      <td className="h-8 w-8" />
                      </tr></tbody>
                    </table>
                  )}
                  {operation === 'subtraction' ? (
                    renderExampleSubtraction()
                  ) : (
                    <>
                      {renderExampleRow(example.first)}
                      {renderExampleRow(example.second, selectedOperation.symbol, { underline: true })}
                      {operation === 'multiplication' && example.partialProducts.map((partial, index) => (
                        <React.Fragment key={`partial-${index}`}>
                          {renderExampleRow(partial, index > 0 ? '+' : '')}
                        </React.Fragment>
                      ))}
                      {renderExampleAnswer()}
                    </>
                  )}
                </div>
              )}
              </div>
            </div>
            {example.markers.some(Boolean) && (
              <p className="-mt-2 mb-3 text-center text-[10px] font-semibold text-rose-700">
                {operation === 'subtraction'
                  ? 'Merah: −1 berarti meminjam dari kolom; +10 berarti angka itu menerima pinjaman.'
                  : 'Catatan merah di atas angka menunjukkan angka simpanan.'}
              </p>
            )}
            <hr className="my-3 border-indigo-100" />
            <h4 className="mb-2 text-xs font-bold text-indigo-900">Langkah demi langkah</h4>
            {operation === 'multiplication' ? (
              <div className="space-y-3">
                {example.partialProducts.map((partial, index) => {
                  const multiplierDigit = Number(String(example.second).split('').reverse()[index]);
                  const place = PLACE_NAMES[index] ?? `nilai tempat ke-${index + 1}`;
                  const unshiftedProduct = example.first * multiplierDigit;
                  return (
                    <div key={`multiply-step-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-bold text-slate-700">
                        Kalikan bilangan pertama dengan angka {index === 0 ? 'satuan' : place} ({multiplierDigit}):
                      </p>
                      <div className="inline-block">
                        {renderExampleRow(example.first)}
                        {renderExampleRow(example.second, '×', { underline: true, highlightFromRight: index })}
                        {renderExampleRow(partial)}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-teal-800">
                        {example.first} × {multiplierDigit} = {unshiftedProduct}
                        {index > 0 && `, geser ${index} tempat ke kiri menjadi ${partial}.`}
                      </p>
                    </div>
                  );
                })}
                {example.partialProducts.length > 1 && (
                  <div className="rounded-xl bg-indigo-50 p-3">
                    <p className="mb-2 text-xs font-bold text-indigo-900">Jumlahkan hasil perkalian parsial:</p>
                    <div className="inline-block">
                      {example.partialProducts.map((partial, index) => renderExampleRow(partial, index > 0 ? '+' : ''))}
                      {renderExampleAnswer()}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-teal-800">
                      {example.partialProducts.join(' + ')} = {example.answer}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ol className="space-y-2">
                {example.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-black text-indigo-800">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
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
            <p className="mb-4 text-center text-sm font-semibold text-slate-600">
              Isi angka hasil yang kosong, termasuk hasil perkalian parsial, angka simpanan, atau angka baru setelah meminjam.
            </p>
            <div className="mx-auto max-w-sm overflow-x-auto rounded-2xl bg-slate-50 p-4 sm:p-6">
              <p className="mb-3 text-center font-mono text-lg font-black text-indigo-900" aria-label="Soal hitung">
                {problem.first} {selectedOperation.symbol} {problem.second} = ?
              </p>
              {problem.operation === 'division' ? (
                <>
                  {renderDivisionWork()}
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Isi hasil bagi di atas. Kurangi hasil perkalian, lalu turunkan angka berikutnya.
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-sky-50 p-2">
                    {problem.operation === 'addition' && renderPlaceHeader(maxDigits)}
                    <table className="ml-auto table-fixed border-collapse font-mono">
                      <tbody>
                    {problem.operation === 'subtraction' ? (
                      <>
                        {problem.borrowAdjustments.length > 0 && (
                          <tr>
                            <td className="h-8 w-8" />
                            {Array.from({ length: maxDigits }, (_, column) => {
                              const place = maxDigits - column - 1;
                              const adjustment = problem.borrowAdjustments.find((item) => item.column === place);
                              return (
                                <td key={`borrow-${column}`} className="h-8 w-8 pr-2 text-right align-bottom text-[10px] font-bold text-rose-700">
                                  {adjustment && (
                                    <input
                                      aria-label={`Angka ${PLACE_NAMES[place] ?? `nilai tempat ke-${place + 1}`} setelah meminjam`}
                                      inputMode="numeric"
                                      maxLength={2}
                                      value={borrowAnswers[adjustment.column] ?? ''}
                                      disabled={feedback === 'correct'}
                                      onChange={(event) => {
                                        const value = event.target.value.replace(/\D/g, '').slice(0, 2);
                                        setBorrowAnswers((current) => ({ ...current, [adjustment.column]: value }));
                                        setMessage('');
                                      }}
                                      className={`h-5 w-7 border-b bg-transparent text-right outline-none focus:ring-1 focus:ring-rose-400 ${
                                        feedback === 'correct'
                                          ? 'border-emerald-500 text-emerald-800'
                                          : feedback === 'wrong' && Number(borrowAnswers[adjustment.column]) !== adjustment.adjusted
                                            ? 'border-rose-500 text-rose-800'
                                            : 'border-rose-400 text-rose-800'
                                      }`}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        )}
                        <tr>
                          <td className="h-8 w-8" />
                          {String(problem.first).padStart(maxDigits, ' ').split('').map((digit, column) => {
                            const place = maxDigits - column - 1;
                            const wasAdjusted = problem.borrowAdjustments.some((item) => item.column === place);
                            return (
                              <td
                                key={`first-${column}`}
                                className={`${DIGIT_CELL_CLASS} pr-2 text-right font-mono text-2xl font-black text-slate-800 ${wasAdjusted ? 'text-slate-400 line-through decoration-rose-500 decoration-2' : ''}`}
                              >
                                {digit.trim()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className={`${DIGIT_CELL_CLASS} text-center text-teal-800`}>−</td>
                          {String(problem.second).padStart(maxDigits, ' ').split('').map((digit, column) => (
                            <td key={`second-${column}`} className={`${DIGIT_CELL_CLASS} border-b-2 border-b-slate-700 pr-2 text-right font-mono text-2xl font-black text-slate-800`}>
                              {digit.trim()}
                            </td>
                          ))}
                        </tr>
                      </>
                    ) : (
                      <>
                        {numberRow(
                          problem.first,
                          'text-slate-800',
                          '',
                          [],
                          [],
                          problem.operation === 'addition' ? problem.carryAdjustments : [],
                        )}
                        {numberRow(
                          problem.second,
                          'text-slate-800',
                          selectedOperation.symbol,
                          [],
                          [],
                          [],
                          problem.operation === 'multiplication',
                        )}
                      </>
                    )}
                      </tbody>
                    </table>
                    {problem.operation === 'subtraction' && problem.borrowAdjustments.length > 0 && (
                      <p className="mb-1 text-right text-[10px] font-semibold text-rose-700">
                        Isikan angka setelah meminjam di atas. Angka lama dicoret merah.
                      </p>
                    )}
                    {problem.operation === 'addition' && problem.carryAdjustments.length > 0 && (
                      <p className="mb-1 text-right text-[10px] font-semibold text-rose-700">
                        Isikan angka simpanan pada bagian merah di atas kolom berikutnya.
                      </p>
                    )}
                  {problem.operation === 'multiplication' && getMultiplicationPartials(problem.first, problem.second).map(({ digits }, index) => {
                    const multiplierPlace = PLACE_NAMES[index] ?? `nilai tempat ke-${index + 1}`;
                    const multiplierDigit = String(problem.second).split('').reverse()[index];
                    const startColumn = maxDigits - digits.length;
                    return (
                      <div key={`partial-work-${index}`} className="mt-2">
                        <p className="text-right text-[10px] font-semibold text-slate-500">Hasil kali {multiplierPlace} ({multiplierDigit})</p>
                        <table className="ml-auto table-fixed border-collapse">
                          <tbody><tr>
                            {Array.from({ length: maxDigits }, (_, column) => {
                              const digitIndex = column - startColumn;
                              if (digitIndex < 0 || digitIndex >= digits.length) {
                                return <td key={`blank-${column}`} className="h-8 w-8" />;
                              }
                              const key = `${index}-${column}`;
                              const value = multiplicationAnswers[key] ?? '';
                              const isHidden = problem.hiddenPartialCells.includes(key);
                              return (
                                <td key={key} className={`${DIGIT_CELL_CLASS} pr-2 text-right text-lg font-black text-indigo-950`}>
                                  {isHidden ? (
                                    <input
                                      aria-label={`Hasil perkalian ${multiplierPlace}, angka ${digitIndex + 1}`}
                                      inputMode="numeric"
                                      maxLength={1}
                                      value={value}
                                      disabled={feedback === 'correct'}
                                      onChange={(event) => {
                                        const nextValue = event.target.value.replace(/\D/g, '').slice(-1);
                                        setMultiplicationAnswers((current) => ({ ...current, [key]: nextValue }));
                                        setMessage('');
                                      }}
                                      className={`h-full w-full text-right outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400 ${
                                        feedback === 'correct'
                                          ? 'border-b-2 border-emerald-500 text-emerald-800'
                                          : feedback === 'wrong' && value !== digits[digitIndex]
                                            ? 'border-b-2 border-rose-400 text-rose-800'
                                            : 'border-b-2 border-indigo-400 text-indigo-900'
                                      }`}
                                    />
                                  ) : digits[digitIndex]}
                                </td>
                              );
                            })}
                            <td className={`${DIGIT_CELL_CLASS} text-center text-lg font-bold text-indigo-800`}>{index > 0 ? '+' : ''}</td>
                          </tr></tbody>
                        </table>
                      </div>
                    );
                  })}
                  {problem.operation === 'multiplication' ? (
                    <div className="mt-2 flex justify-end">
                      <table className="table-fixed border-collapse font-mono">
                        <tbody><tr>
                        {renderAnswerCells(true)}
                        <td className="h-8 w-8 border-t-2 border-indigo-800" />
                        </tr></tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <table className="table-fixed border-collapse font-mono">
                        <tbody><tr>
                        {problem.operation === 'subtraction' && <td className="h-8 w-8 border-t-2 border-slate-700" />}
                        {renderAnswerCells(true)}
                        {problem.operation !== 'subtraction' && <td className="h-8 w-8 border-t-2 border-slate-700" />}
                        </tr></tbody>
                      </table>
                    </div>
                  )}
                  </div>
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
                <p className="mt-1 text-xs text-slate-500">
                  {problem.operation === 'division'
                    ? 'Bagi dari kiri ke kanan, kurangi, lalu turunkan angka berikutnya.'
                    : problem.operation === 'multiplication'
                      ? 'Kalikan dari satuan, lanjutkan ke puluhan, lalu jumlahkan hasil tiap baris.'
                      : 'Kerjakan kolom demi kolom dari kanan.'}
                </p>
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
