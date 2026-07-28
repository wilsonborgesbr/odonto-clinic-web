import { fetchApi } from './api';
import type { Funcionario, FuncionarioListagemDTO, PageResponse } from '../types';

export interface ListarFuncionariosParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
}

const buildQuery = (p: ListarFuncionariosParams): string => {
  const q = new URLSearchParams();
  if (p.pagina != null) q.set('pagina', String(p.pagina));
  if (p.tamanho != null) q.set('tamanho', String(p.tamanho));
  if (p.ordem) q.set('ordem', p.ordem);
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const funcionarioService = {
  listar: (params: ListarFuncionariosParams = {}) =>
    fetchApi<PageResponse<FuncionarioListagemDTO>>(`/api/funcionarios${buildQuery(params)}`),

  buscarPorId: (id: string) => fetchApi<Funcionario>(`/api/funcionarios/${id}`),

  criar: (f: Funcionario) =>
    fetchApi<Funcionario>('/api/funcionarios', { method: 'POST', body: JSON.stringify(f) }),

  atualizar: (id: string, f: Funcionario) =>
    fetchApi<Funcionario>(`/api/funcionarios/${id}`, { method: 'PUT', body: JSON.stringify(f) }),

  inativar: (id: string) =>
    fetchApi<void>(`/api/funcionarios/${id}`, { method: 'DELETE' }),

  reativar: (id: string) =>
    fetchApi<Funcionario>(`/api/funcionarios/${id}/reativar`, { method: 'PATCH' }),
};
