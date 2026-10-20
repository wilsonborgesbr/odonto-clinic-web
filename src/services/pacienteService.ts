import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Paciente, PacienteListagemDTO, PacienteResumo, PageResponse } from '../types';
import { cadastroKeys } from './cadastroService';

// Ids por requisição em GET /api/pacientes/resumo. O backend aceita até 200, mas 200 ObjectIds
// na query string (~5 KB+) somados ao JWT podem estourar o limite de 8 KB de header do Tomcat.
const RESUMO_MAX_IDS = 50;

export interface ListarPacientesParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
  nome?: string;
  /** Só cadastros a partir deste dia (YYYY-MM-DD). */
  desde?: string;
  /** Ordenação do Spring, ex.: 'createdAt,desc'. */
  sort?: string;
}

export const pacienteService = {
  listar: async (params: ListarPacientesParams = {}) => {
    const { data } = await api.get<PageResponse<PacienteListagemDTO>>('/api/pacientes', {
      params: {
        pagina: params.pagina,
        tamanho: params.tamanho,
        ordem: params.ordem,
        nome: params.nome?.trim() || undefined,
        desde: params.desde,
        sort: params.sort,
      },
    });
    return data;
  },
  buscarPorId: async (id: string) => {
    const { data } = await api.get<Paciente>(`/api/pacientes/${id}`);
    return data;
  },
  resumo: async (ids: string[]) => {
    const { data } = await api.get<PacienteResumo[]>('/api/pacientes/resumo', {
      params: { ids: ids.join(',') },
    });
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
  nomes: () => [...pacienteKeys.all, 'nomes'] as const,
  nomesBloco: (ids: string[]) => [...pacienteKeys.nomes(), ids] as const,
};

export const usePacientes = (
  params: ListarPacientesParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: pacienteKeys.list(params),
    queryFn: () => pacienteService.listar(params),
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });

const combineNomes = (results: UseQueryResult<PacienteResumo[]>[]) => {
  const nomes = new Map<string, string>();
  results.forEach((r) => r.data?.forEach((p) => nomes.set(p.id, p.nomeCompleto)));
  return {
    nomes,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
};

/**
 * Resolve id → nome de paciente só para os ids informados (GET /api/pacientes/resumo).
 * Os ids são deduplicados e ordenados, então a chave de cache não depende da ordem em que
 * chegam; acima de 50 ids a busca é dividida em blocos (uma requisição por bloco).
 */
export const usePacienteNomes = (
  ids: ReadonlyArray<string | null | undefined>,
  options?: { enabled?: boolean },
) => {
  const idsKey = ids.filter(Boolean).join(',');
  const blocos = useMemo(() => {
    const unicos = [...new Set(idsKey ? idsKey.split(',') : [])].sort();
    const out: string[][] = [];
    for (let i = 0; i < unicos.length; i += RESUMO_MAX_IDS) {
      out.push(unicos.slice(i, i + RESUMO_MAX_IDS));
    }
    return out;
  }, [idsKey]);

  return useQueries({
    queries: blocos.map((bloco) => ({
      queryKey: pacienteKeys.nomesBloco(bloco),
      queryFn: () => pacienteService.resumo(bloco),
      placeholderData: (prev: PacienteResumo[] | undefined) => prev,
      enabled: options?.enabled ?? true,
    })),
    combine: combineNomes,
  });
};

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pacienteKeys.lists() });
      qc.invalidateQueries({ queryKey: cadastroKeys.pendencias() });
    },
  });
};

export const useAtualizarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paciente }: { id: string; paciente: Paciente }) =>
      pacienteService.atualizar(id, paciente),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: cadastroKeys.pendencias() });
      qc.invalidateQueries({ queryKey: pacienteKeys.lists() });
      qc.invalidateQueries({ queryKey: pacienteKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: pacienteKeys.nomes() });
    },
  });
};

export const useInativarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacienteService.inativar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pacienteKeys.lists() });
      qc.invalidateQueries({ queryKey: cadastroKeys.pendencias() });
    },
  });
};

export const useReativarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacienteService.reativar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pacienteKeys.lists() });
      qc.invalidateQueries({ queryKey: cadastroKeys.pendencias() });
    },
  });
};
