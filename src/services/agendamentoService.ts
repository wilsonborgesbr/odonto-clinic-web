import { fetchApi } from './api';
import type { Agendamento, PageResponse } from '../types';

export interface ListarAgendamentosParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
}

const buildQuery = (params: ListarAgendamentosParams): string => {
  const q = new URLSearchParams();
  if (params.pagina != null) q.set('pagina', String(params.pagina));
  if (params.tamanho != null) q.set('tamanho', String(params.tamanho));
  if (params.ordem) q.set('ordem', params.ordem);
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const agendamentoService = {
  listar: (params: ListarAgendamentosParams = {}) =>
    fetchApi<PageResponse<Agendamento>>(`/api/agendamentos${buildQuery(params)}`),

  buscarPorId: (id: string) =>
    fetchApi<Agendamento>(`/api/agendamentos/${id}`),

  criar: (agendamento: Agendamento) =>
    fetchApi<Agendamento>('/api/agendamentos', {
      method: 'POST',
      body: JSON.stringify(agendamento),
    }),

  atualizar: (id: string, agendamento: Agendamento) =>
    fetchApi<Agendamento>(`/api/agendamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agendamento),
    }),

  excluir: (id: string) =>
    fetchApi<void>(`/api/agendamentos/${id}`, { method: 'DELETE' }),

  listarPorDentista: (dentistaId: string) =>
    fetchApi<Agendamento[]>(`/api/agendamentos/dentista/${dentistaId}`),

  listarPorStatus: (status: string) =>
    fetchApi<Agendamento[]>(`/api/agendamentos/status/${status}`),
};
