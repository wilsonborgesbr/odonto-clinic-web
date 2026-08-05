import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Agendamento, PageResponse } from '../types';

export interface ListarAgendamentosParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
}

export const agendamentoService = {
  listar: async (params: ListarAgendamentosParams = {}) => {
    const { data } = await api.get<PageResponse<Agendamento>>('/api/agendamentos', {
      params: { pagina: params.pagina, tamanho: params.tamanho, ordem: params.ordem },
    });
    return data;
  },
  buscarPorId: async (id: string) =>
    (await api.get<Agendamento>(`/api/agendamentos/${id}`)).data,
  listarPorPaciente: async (pacienteId: string) =>
    (await api.get<Agendamento[]>(`/api/agendamentos/paciente/${pacienteId}`)).data,
  listarPorDentista: async (dentistaId: string) =>
    (await api.get<Agendamento[]>(`/api/agendamentos/dentista/${dentistaId}`)).data,
  criar: async (a: Agendamento) => (await api.post<Agendamento>('/api/agendamentos', a)).data,
  atualizar: async (id: string, a: Agendamento) =>
    (await api.put<Agendamento>(`/api/agendamentos/${id}`, a)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/agendamentos/${id}`);
  },
};

export const agendamentoKeys = {
  all: ['agendamentos'] as const,
  lists: () => [...agendamentoKeys.all, 'list'] as const,
  list: (p: ListarAgendamentosParams) => [...agendamentoKeys.lists(), p] as const,
  detail: (id: string) => [...agendamentoKeys.all, 'detail', id] as const,
  byPaciente: (pid: string) => [...agendamentoKeys.all, 'byPaciente', pid] as const,
  byDentista: (did: string) => [...agendamentoKeys.all, 'byDentista', did] as const,
};

export const useAgendamentos = (params: ListarAgendamentosParams) =>
  useQuery({
    queryKey: agendamentoKeys.list(params),
    queryFn: () => agendamentoService.listar(params),
    placeholderData: (prev) => prev,
  });

export const useAgendamento = (id: string | undefined) =>
  useQuery({
    queryKey: agendamentoKeys.detail(id ?? ''),
    queryFn: () => agendamentoService.buscarPorId(id!),
    enabled: !!id,
  });

export const useAgendamentosPorPaciente = (pacienteId: string | undefined) =>
  useQuery({
    queryKey: agendamentoKeys.byPaciente(pacienteId ?? ''),
    queryFn: () => agendamentoService.listarPorPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useAgendamentosPorDentista = (dentistaId: string | undefined) =>
  useQuery({
    queryKey: agendamentoKeys.byDentista(dentistaId ?? ''),
    queryFn: () => agendamentoService.listarPorDentista(dentistaId!),
    enabled: !!dentistaId,
  });

export const useCriarAgendamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agendamentoService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: agendamentoKeys.all }),
  });
};

export const useAtualizarAgendamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agendamento }: { id: string; agendamento: Agendamento }) =>
      agendamentoService.atualizar(id, agendamento),
    onSuccess: () => qc.invalidateQueries({ queryKey: agendamentoKeys.all }),
  });
};

export const useExcluirAgendamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agendamentoService.excluir,
    onSuccess: () => qc.invalidateQueries({ queryKey: agendamentoKeys.all }),
  });
};
