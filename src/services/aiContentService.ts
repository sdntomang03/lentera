import type {
  EducationLevel,
  LiteracyGenre,
  LiteracyPassage,
  NumeracyContext,
  NumeracyDomain,
  NumeracyQuestion,
} from '../types';

interface GenerateLiteracyContentRequest {
  type: 'literacy';
  level: EducationLevel;
  title: string;
  genre: LiteracyGenre;
}

interface GenerateNumeracyContentRequest {
  type: 'numeracy';
  level: EducationLevel;
  title: string;
  domain: NumeracyDomain;
  context: NumeracyContext;
}

async function generateContent<T>(request: GenerateLiteracyContentRequest | GenerateNumeracyContentRequest): Promise<T> {
  const response = await fetch('/api/deepseek/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const result = await response.json().catch(() => ({})) as { data?: T; message?: string };

  if (!response.ok) {
    throw new Error(result.message || `DeepSeek gagal membuat materi (HTTP ${response.status}).`);
  }
  if (!result.data) {
    throw new Error('Respons DeepSeek tidak berisi materi yang valid.');
  }
  return result.data;
}

export function generateLiteracyPassage(request: Omit<GenerateLiteracyContentRequest, 'type'>): Promise<LiteracyPassage> {
  return generateContent<LiteracyPassage>({ ...request, type: 'literacy' });
}

export function generateNumeracyQuestion(request: Omit<GenerateNumeracyContentRequest, 'type'>): Promise<NumeracyQuestion> {
  return generateContent<NumeracyQuestion>({ ...request, type: 'numeracy' });
}
