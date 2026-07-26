import type { ApiErrorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  payload: ApiErrorResponse | null;

  constructor(message: string, status: number, payload: ApiErrorResponse | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }

  fieldErrors(): Record<string, string> {
    if (this.payload && typeof this.payload.mensagem === 'object' && this.payload.mensagem !== null) {
      return this.payload.mensagem as Record<string, string>;
    }
    return {};
  }

  friendlyMessage(): string {
    if (this.payload && typeof this.payload.mensagem === 'string') {
      return this.payload.mensagem;
    }
    return this.message;
  }
}

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem('@OdontoClinic:token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('@OdontoClinic:token');
      window.location.href = '/login';
    }

    let payload: ApiErrorResponse | null = null;
    try {
      payload = (await response.json()) as ApiErrorResponse;
    } catch {
      payload = null;
    }

    const msg =
      payload && typeof payload.mensagem === 'string'
        ? payload.mensagem
        : `Erro HTTP ${response.status}`;

    throw new ApiError(msg, response.status, payload);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
