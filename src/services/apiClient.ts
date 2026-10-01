export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

const AUTH_SESSION_KEY = 'lentera_auth_session_v1';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { token?: unknown };
    return typeof session.token === 'string' ? session.token : null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({})) as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const validationMessage = payload.errors
      ? Object.values(payload.errors).flat()[0]
      : undefined;
    throw new ApiError(validationMessage || payload.message || `HTTP ${response.status}`, response.status);
  }

  return payload as T;
}
