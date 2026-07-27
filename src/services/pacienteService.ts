import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Paciente, PacienteListagemDTO, PageResponse } from '../types';

export interface ListarPacientesParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
  nome?: string;
}

export const pacienteService = {
  listar: async (params: ListarPacientesParams = {}) => {
    const { data } = await api.get<PageResponse<PacienteListagemDTO>>('/api/pacientes', {
      params: {
        pagina: params.pagina,
        tamanho: params.tamanho,
        ordem: params.ordem,
        nome: params.nome?.trim() || undefined,
      },
    });
    return data;
  },
  buscarPorId: async (id: string) => {
    const { data } = await api.get<Paciente>(`/api/pacientes/${id}`);
    return data;
  },
  criar: async (p: Paciente) => (await api.post<Paciente>('/api/pacientes', p)).data,
  atualizar: async (id: string, p: Paciente) =>
    (await api.put<Paciente>(`/api/pacientes/${id}`, p)).data,
  inativar: async (id: string) => {
    await api.delete(`/api/pacientes/${id}`);
  },
  reativar: async (id: string) =>
    (await api.patch<Paciente>(`/api/pacientes/${id}/reativar`)).data,
};

export const pacienteKeys = {
  all: ['pacientes'] as const,
  lists: () => [...pacienteKeys.all, 'list'] as const,
  list: (p: ListarPacientesParams) => [...pacienteKeys.lists(), p] as const,
  details: () => [...pacienteKeys.all, 'detail'] as const,
  detail: (id: string) => [...pacienteKeys.details(), id] as const,
};

export const usePacientes = (params: ListarPacientesParams) =>
  useQuery({
    queryKey: pacienteKeys.list(params),
    queryFn: () => pacienteService.listar(params),
    placeholderData: (prev) => prev,
  });

export const usePaciente = (id: string | undefined) =>
  useQuery({
    queryKey: pacienteKeys.detail(id ?? ''),
    queryFn: () => pacienteService.buscarPorId(id!),
    enabled: !!id,
  });

export const useCriarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacienteService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: pacienteKeys.lists() }),
  });
};

export const useAtualizarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paciente }: { id: string; paciente: Paciente }) =>
      pacienteService.atualizar(id, paciente),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: pacienteKeys.lists() });
      qc.invalidateQueries({ queryKey: pacienteKeys.detail(vars.id) });
    },
  });
};

export const useInativarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacienteService.inativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: pacienteKeys.lists() }),
  });
};

export const useReativarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacienteService.reativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: pacienteKeys.lists() }),
  });
};
