import { fetchApi } from './api';
import type { Convenio } from '../types';

export const convenioService = {
  listar: () => fetchApi<Convenio[]>('/api/convenios'),

  buscarPorId: (id: string) => fetchApi<Convenio>(`/api/convenios/${id}`),

  criar: (c: Convenio) =>
    fetchApi<Convenio>('/api/convenios', { method: 'POST', body: JSON.stringify(c) }),

  atualizar: (id: string, c: Convenio) =>
    fetchApi<Convenio>(`/api/convenios/${id}`, { method: 'PUT', body: JSON.stringify(c) }),

  inativar: (id: string) =>
    fetchApi<void>(`/api/convenios/${id}`, { method: 'DELETE' }),
};
