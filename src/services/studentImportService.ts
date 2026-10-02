import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/browser';
import { apiRequest } from './apiClient';

export interface StudentImportRow {
  studentName: string;
  username: string;
  password: string;
  gradeLevel?: string;
}

export interface StudentImportResult {
  row: number;
  username?: string;
  status: 'created' | 'error';
  message?: string;
  studentId?: string;
}

export interface StudentImportResponse {
  imported: number;
  failed: number;
  results: StudentImportResult[];
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeHeader(value: unknown): string {
  return cellText(value).toLocaleLowerCase('id-ID').replace(/[^a-z0-9]/g, '');
}

function parseRows(rows: unknown[][]): StudentImportRow[] {
  if (rows.length < 2) throw new Error('File hanya berisi judul kolom; tambahkan data siswa.');

  const headers = rows[0].map(normalizeHeader);
  const columns = {
    studentName: headers.findIndex((header) => ['namasiswa', 'studentname', 'student'].includes(header)),
    username: headers.findIndex((header) => header === 'username'),
    password: headers.findIndex((header) => ['password', 'katasandi'].includes(header)),
    gradeLevel: headers.findIndex((header) => ['kelasfase', 'kelas', 'jenjangfase', 'gradelevel'].includes(header)),
  };

  const missingColumns = [
    columns.studentName < 0 ? 'Nama Siswa' : null,
    columns.username < 0 ? 'Username' : null,
    columns.password < 0 ? 'Password' : null,
  ].filter((column): column is string => column !== null);
  if (missingColumns.length) {
    throw new Error(`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}.`);
  }

  const students = rows.slice(1)
    .filter((row) => row.some((value) => cellText(value) !== ''))
    .map((row) => ({
      studentName: cellText(row[columns.studentName]),
      username: cellText(row[columns.username]).toLowerCase(),
      password: cellText(row[columns.password]),
      ...(columns.gradeLevel >= 0 ? { gradeLevel: cellText(row[columns.gradeLevel]) } : {}),
    }));

  if (!students.length) throw new Error('Tidak ada baris siswa untuk diimpor.');
  if (students.length > 100) throw new Error('Maksimal 100 siswa dapat diimpor dalam satu kali proses.');
  return students;
}

export async function parseStudentImportFile(file: File): Promise<StudentImportRow[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran file maksimal 5 MB.');

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    const parsed = Papa.parse<unknown[]>(await file.text(), {
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
    });
    if (parsed.errors.length) throw new Error(`CSV tidak dapat dibaca: ${parsed.errors[0].message}`);
    return parseRows(parsed.data);
  }

  if (extension !== 'xlsx') throw new Error('Gunakan file Excel .xlsx atau file .csv dari Excel.');
  const sheet = await readXlsxFile(file);
  if (!sheet.length) throw new Error('File Excel tidak memiliki lembar kerja.');
  return parseRows(sheet[0].data);
}

export function downloadStudentImportTemplate(): void {
  const csv = '\uFEFFNama Siswa,Username,Password,Kelas/Fase\r\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-impor-siswa.csv';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function importStudents(students: StudentImportRow[]): Promise<StudentImportResponse> {
  const response = await apiRequest<{ data: StudentImportResponse }>('/admin/students/import', {
    method: 'POST',
    body: JSON.stringify({ students }),
  });
  return response.data;
}
