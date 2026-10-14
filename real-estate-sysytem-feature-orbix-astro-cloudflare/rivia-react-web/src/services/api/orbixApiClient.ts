import { auth } from '../firebase';

export type OrbixApiErrorCode =
  | 'validation_error'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server_error'
  | 'network_error'
  | 'timeout'
  | 'unknown_error';

export class OrbixApiError extends Error {
  constructor(
    message: string,
    public readonly code: OrbixApiErrorCode,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'OrbixApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  authRequired?: boolean;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  getToken?: () => Promise<string | null> | string | null;
};

const defaultBaseUrl = 'http://localhost:3000/api/v1';
const defaultTimeoutMs = 10_000;

export function getOrbixApiBaseUrl(): string {
  return String(import.meta.env.VITE_ORBIX_API_URL || defaultBaseUrl).replace(/\/+$/, '');
}

export function isOrbixApiEnabled(): boolean {
  return import.meta.env.VITE_USE_ORBIX_API === 'true';
}

function apiErrorCode(status?: number): OrbixApiErrorCode {
  if (status === 400) return 'validation_error';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status && status >= 500) return 'server_error';
  return 'unknown_error';
}

async function readErrorBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(code: OrbixApiErrorCode): string {
  const messages: Record<OrbixApiErrorCode, string> = {
    validation_error: 'The request data is invalid.',
    unauthenticated: 'Authentication is required.',
    forbidden: 'You do not have permission to perform this action.',
    not_found: 'The requested resource was not found.',
    conflict: 'The request conflicts with an existing record.',
    rate_limited: 'Too many requests. Please try again later.',
    server_error: 'The server could not complete the request.',
    network_error: 'The network request failed.',
    timeout: 'The request timed out.',
    unknown_error: 'The request failed.',
  };
  return messages[code];
}

async function defaultTokenProvider(): Promise<string | null> {
  return auth.currentUser?.getIdToken() ?? null;
}

export async function orbixApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authRequired = options.authRequired ?? true;
  const token = authRequired ? await (options.getToken ?? defaultTokenProvider)() : null;

  if (authRequired && !token) {
    throw new OrbixApiError(errorMessage('unauthenticated'), 'unauthenticated', 401);
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? defaultTimeoutMs);
  const fetchFn = options.fetchFn ?? fetch;

  try {
    const response = await fetchFn(`${getOrbixApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await readErrorBody(response);
      const code = apiErrorCode(response.status);
      throw new OrbixApiError(errorMessage(code), code, response.status, details);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof OrbixApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new OrbixApiError(errorMessage('timeout'), 'timeout');
    }
    throw new OrbixApiError(errorMessage('network_error'), 'network_error');
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
