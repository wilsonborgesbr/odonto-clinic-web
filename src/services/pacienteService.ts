import { fetchApi } from './api';
import type {
  Paciente,
  PacienteListagemDTO,
  PageResponse,
} from '../types';

export interface ListarPacientesParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
  nome?: string;
}

const buildQuery = (params: ListarPacientesParams): string => {
  const q = new URLSearchParams();
  if (params.pagina != null) q.set('pagina', String(params.pagina));
  if (params.tamanho != null) q.set('tamanho', String(params.tamanho));
  if (params.ordem) q.set('ordem', params.ordem);
  if (params.nome && params.nome.trim()) q.set('nome', params.nome.trim());
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const pacienteService = {
  listar: (params: ListarPacientesParams = {}) =>
    fetchApi<PageResponse<PacienteListagemDTO>>(`/api/pacientes${buildQuery(params)}`),

  buscarPorId: (id: string) => fetchApi<Paciente>(`/api/pacientes/${id}`),

  criar: (paciente: Paciente) =>
    fetchApi<Paciente>('/api/pacientes', {
      method: 'POST',
      body: JSON.stringify(paciente),
    }),

  atualizar: (id: string, paciente: Paciente) =>
    fetchApi<Paciente>(`/api/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paciente),
    }),

  inativar: (id: string) =>
    fetchApi<void>(`/api/pacientes/${id}`, { method: 'DELETE' }),

  reativar: (id: string) =>
    fetchApi<Paciente>(`/api/pacientes/${id}/reativar`, { method: 'PATCH' }),
};
