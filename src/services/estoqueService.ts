import { fetchApi } from './api';
import type { Estoque } from '../types';

export const estoqueService = {
  listar: () => fetchApi<Estoque[]>('/api/estoque'),

  buscarPorId: (id: string) => fetchApi<Estoque>(`/api/estoque/${id}`),

  listarAbaixoMinimo: () => fetchApi<Estoque[]>('/api/estoque/abaixo-minimo'),

  listarPorCategoria: (cat: string) => fetchApi<Estoque[]>(`/api/estoque/categoria/${cat}`),

  criar: (e: Estoque) =>
    fetchApi<Estoque>('/api/estoque', { method: 'POST', body: JSON.stringify(e) }),

  atualizar: (id: string, e: Estoque) =>
    fetchApi<Estoque>(`/api/estoque/${id}`, { method: 'PUT', body: JSON.stringify(e) }),

  excluir: (id: string) =>
    fetchApi<void>(`/api/estoque/${id}`, { method: 'DELETE' }),
};
