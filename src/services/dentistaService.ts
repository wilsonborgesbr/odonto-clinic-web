import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Dentista, DentistaListagemDTO, PageResponse } from '../types';

export interface ListarDentistasParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
}

export const dentistaService = {
  listar: async (params: ListarDentistasParams = {}) => {
    const { data } = await api.get<PageResponse<DentistaListagemDTO>>('/api/dentistas', {
      params: { pagina: params.pagina, tamanho: params.tamanho, ordem: params.ordem },
    });
    return data;
  },
  listarAtivos: async () => {
    const { data } = await api.get<PageResponse<DentistaListagemDTO>>('/api/dentistas', {
      params: { pagina: 0, tamanho: 200, ordem: 'nomeCompleto' },
    });
    return data.content.filter((d) => d.ativo);
  },
  buscarPorId: async (id: string) => (await api.get<Dentista>(`/api/dentistas/${id}`)).data,
  criar: async (d: Dentista) => (await api.post<Dentista>('/api/dentistas', d)).data,
  atualizar: async (id: string, d: Dentista) =>
    (await api.put<Dentista>(`/api/dentistas/${id}`, d)).data,
  inativar: async (id: string) => {
    await api.delete(`/api/dentistas/${id}`);
  },
  reativar: async (id: string) =>
    (await api.patch<Dentista>(`/api/dentistas/${id}/reativar`)).data,
};

export const dentistaKeys = {
  all: ['dentistas'] as const,
  lists: () => [...dentistaKeys.all, 'list'] as const,
  list: (p: ListarDentistasParams) => [...dentistaKeys.lists(), p] as const,
  ativos: () => [...dentistaKeys.all, 'ativos'] as const,
  detail: (id: string) => [...dentistaKeys.all, 'detail', id] as const,
};

export const useDentistas = (params: ListarDentistasParams) =>
  useQuery({
    queryKey: dentistaKeys.list(params),
    queryFn: () => dentistaService.listar(params),
    placeholderData: (prev) => prev,
  });

export const useDentistasAtivos = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: dentistaKeys.ativos(),
    queryFn: dentistaService.listarAtivos,
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
  });

export const useDentista = (id: string | undefined) =>
  useQuery({
    queryKey: dentistaKeys.detail(id ?? ''),
    queryFn: () => dentistaService.buscarPorId(id!),
    enabled: !!id,
  });

export const useCriarDentista = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dentistaService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: dentistaKeys.all }),
  });
};

export const useAtualizarDentista = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dentista }: { id: string; dentista: Dentista }) =>
      dentistaService.atualizar(id, dentista),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: dentistaKeys.all });
      qc.invalidateQueries({ queryKey: dentistaKeys.detail(vars.id) });
    },
  });
};

export const useInativarDentista = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dentistaService.inativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: dentistaKeys.all }),
  });
};

export const useReativarDentista = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dentistaService.reativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: dentistaKeys.all }),
  });
};
