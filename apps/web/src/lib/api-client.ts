const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

/** The standard error body every API endpoint returns (docs/decisions.md). */
export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * Base URL for the API. Override it with `VITE_API_URL` in `.env.local`.
 * The trailing slash is stripped so paths can be written with a leading slash.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL: string = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : DEFAULT_API_URL;

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = Omit<
  RequestInit,
  'body' | 'credentials' | 'method'
> & {
  method?: ApiMethod;
  body?: unknown;
};

/** Thrown for every non-2xx response and for network failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(
    message: string,
    options: { status: number; code: string; details?: unknown },
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

/** Best-effort user-facing message for errors thrown by the API client. */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return error instanceof ApiError ? error.message : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parse the standard `{ error: { code, message, details? } }` shape. */
export function parseApiError(error: unknown): ApiErrorPayload['error'] | null {
  if (!isRecord(error) || !isRecord(error.error)) {
    return null;
  }

  const { code, message, details } = error.error;

  if (typeof code !== 'string' || typeof message !== 'string') {
    return null;
  }

  const parsed: ApiErrorPayload['error'] = { code, message };

  if (details !== undefined) {
    parsed.details = details;
  }

  return parsed;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as unknown;
  }

  const text = await response.text();

  return text === '' ? undefined : text;
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown;

  try {
    body = await readResponseBody(response);
  } catch {
    body = undefined;
  }

  const parsed = parseApiError(body);

  if (parsed) {
    const options: { status: number; code: string; details?: unknown } = {
      status: response.status,
      code: parsed.code,
    };

    if (parsed.details !== undefined) {
      options.details = parsed.details;
    }

    return new ApiError(parsed.message, options);
  }

  return new ApiError(response.statusText || 'Request failed', {
    status: response.status,
    code: 'HTTP_ERROR',
  });
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Typed fetch wrapper. Sends the session cookie on every request, serializes
 * JSON bodies, and turns API error bodies into `ApiError` instances.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers: initialHeaders, ...rest } = options;

  const headers = new Headers(initialHeaders);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const init: RequestInit = {
    ...rest,
    method,
    headers,
    credentials: 'include',
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(body);
    }
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), init);
  } catch (error) {
    // Preserve cancellation so callers (and TanStack Query) can tell it apart.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Unable to reach the DiscoveryLab API.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await readResponseBody(response)) as T;
}

type RequestOptions = Omit<ApiRequestOptions, 'method' | 'body'>;

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const requestOptions: ApiRequestOptions = { ...options, method: 'POST' };

    if (body !== undefined) {
      requestOptions.body = body;
    }

    return apiRequest<T>(path, requestOptions);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const requestOptions: ApiRequestOptions = { ...options, method: 'PATCH' };

    if (body !== undefined) {
      requestOptions.body = body;
    }

    return apiRequest<T>(path, requestOptions);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const requestOptions: ApiRequestOptions = { ...options, method: 'PUT' };

    if (body !== undefined) {
      requestOptions.body = body;
    }

    return apiRequest<T>(path, requestOptions);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'DELETE' });
  },
};
