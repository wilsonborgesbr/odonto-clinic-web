import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const TOKEN_STORAGE_KEY = 'token';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (localStorage.getItem(TOKEN_STORAGE_KEY)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(new ApiError(error));
  },
);

export class ApiError extends Error {
  status: number;
  payload: ApiErrorResponse | null;

  constructor(error: AxiosError<ApiErrorResponse>) {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data ?? null;

    const message =
      payload && typeof payload.mensagem === 'string'
        ? payload.mensagem
        : error.message || `Erro HTTP ${status}`;

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
    if (this.status === 0) return 'Não foi possível se conectar ao servidor.';
    if (this.status >= 500) return 'O servidor teve um problema. Tente novamente em instantes.';
    return this.message;
  }
}

export const extractErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) return err.friendlyMessage();
  if (err instanceof Error) return err.message;
  return 'Ocorreu um erro inesperado.';
};
